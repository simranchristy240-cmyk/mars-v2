import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Test } from '../models/Test';
import { TestAttempt } from '../models/TestAttempt';
import { Section } from '../models/Section';
import { Gamification } from '../models/Gamification';
import { Topic } from '../models/Topic';
import { Course } from '../models/Course';

export const createTest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const {
      courseId,
      title,
      description,
      duration,
      startTime,
      endTime,
      totalMarks,
      passingMarks,
      negativeMarkingEnabled,
      sections,
      isPublished,
    } = req.body;

    const test = await Test.create({
      courseId,
      title,
      description,
      duration,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      totalMarks: totalMarks || 0,
      passingMarks,
      negativeMarkingEnabled: negativeMarkingEnabled || false,
      sections: sections || [],
      isPublished: isPublished || false,
      createdBy: req.user._id,
    });

    await Course.findByIdAndUpdate(courseId, { $push: { testSeries: test._id } });

    return res.status(201).json({ success: true, data: test });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const updateTest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    if (updates.startTime) updates.startTime = new Date(updates.startTime);
    if (updates.endTime) updates.endTime = new Date(updates.endTime);

    const test = await Test.findByIdAndUpdate(id, updates, { new: true }).populate({
      path: 'sections.questions',
    });
    if (!test) return res.status(404).json({ success: false, error: 'Test not found' });
    return res.json({ success: true, data: test });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteTest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const test = await Test.findById(id);
    if (!test) return res.status(404).json({ success: false, error: 'Test not found' });

    const questionIds = (test.sections || []).flatMap((s) => s.questions || []);
    // Only delete sections owned by this test
    await Section.deleteMany({
      _id: { $in: questionIds },
      parentType: 'test',
    });

    await Course.findByIdAndUpdate(test.courseId, { $pull: { testSeries: test._id } });
    await Test.findByIdAndDelete(id);

    return res.json({ success: true, message: 'Test deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getCourseTests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    const tests = await Test.find({ courseId, isPublished: true }).sort({ startTime: 1 });

    // Check attempts for current student
    const testIds = tests.map((t) => t._id);
    const attempts = await TestAttempt.find({
      studentId: req.user?._id,
      testId: { $in: testIds },
    });

    const attemptsMap = new Map();
    attempts.forEach((a) => attemptsMap.set(a.testId.toString(), a));

    const result = tests.map((t) => {
      const tObj = t.toObject();
      const attempt = attemptsMap.get(t._id.toString());
      return {
        ...tObj,
        attemptStatus: attempt ? attempt.status : 'not-started',
        hasAttempted: !!attempt,
        attemptId: attempt ? attempt._id : undefined,
      };
    });

    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const startTest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const test = await Test.findById(id).populate({
      path: 'sections.questions',
      select: 'questionType questionText questionImage options matchPairs marks negativeMarks order parentId',
    });

    if (!test) return res.status(404).json({ success: false, error: 'Test not found' });

    // Enforce schedule window
    const now = new Date();
    if (now < new Date(test.startTime) || now > new Date(test.endTime)) {
      return res.status(400).json({
        success: false,
        error: 'Test is outside the allowed time window.',
      });
    }

    // Check for existing attempt — ENFORCE SINGLE ATTEMPT POLICY
    let attempt = await TestAttempt.findOne({ testId: test._id, studentId: req.user._id });
    if (attempt && attempt.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        error: 'You have already submitted this test. Retakes are not allowed.',
        attemptId: attempt._id,
      });
    }

    if (!attempt) {
      attempt = await TestAttempt.create({
        testId: test._id,
        studentId: req.user._id,
        startedAt: now,
        answers: [],
        status: 'in-progress',
      });
    }

    // Sanitize questions (remove answer keys for students)
    const sanitizedTest = test.toObject();
    sanitizedTest.sections.forEach((sec: any) => {
      sec.questions = sec.questions.map((q: any) => {
        if (q.options) {
          q.options = q.options.map((opt: any) => ({
            id: opt.id,
            text: opt.text,
            image: opt.image,
          }));
        }
        return q;
      });
    });

    return res.json({
      success: true,
      data: {
        test: sanitizedTest,
        attempt,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const saveAnswer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { questionId, selectedOptions, matchAnswers, timeTaken, isMarkedForReview } = req.body;
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const attempt = await TestAttempt.findOne({
      testId: id,
      studentId: req.user._id,
      status: 'in-progress',
    });

    if (!attempt) {
      return res.status(404).json({ success: false, error: 'Active test attempt not found' });
    }

    const answerIdx = attempt.answers.findIndex((a) => a.questionId.toString() === questionId);
    if (answerIdx >= 0) {
      attempt.answers[answerIdx].selectedOptions = selectedOptions || [];
      attempt.answers[answerIdx].matchAnswers = matchAnswers;
      attempt.answers[answerIdx].timeTaken = (attempt.answers[answerIdx].timeTaken || 0) + (timeTaken || 0);
      attempt.answers[answerIdx].isMarkedForReview = !!isMarkedForReview;
    } else {
      attempt.answers.push({
        questionId,
        selectedOptions: selectedOptions || [],
        matchAnswers,
        timeTaken: timeTaken || 0,
        isMarkedForReview: !!isMarkedForReview,
      });
    }

    await attempt.save();
    return res.json({ success: true, data: attempt });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const submitTest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isAutoSubmitted } = req.body;
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const attempt = await TestAttempt.findOne({
      testId: id,
      studentId: req.user._id,
      status: 'in-progress',
    });

    if (!attempt) {
      return res.status(404).json({ success: false, error: 'Active test attempt not found' });
    }

    const test = await Test.findById(id).populate('sections.questions');
    if (!test) return res.status(404).json({ success: false, error: 'Test not found' });

    // Calculate score
    let totalScore = 0;
    let totalMarksPossible = 0;

    const allQuestions: any[] = [];
    test.sections.forEach((sec) => {
      sec.questions.forEach((q) => allQuestions.push(q));
    });

    const questionMap = new Map();
    allQuestions.forEach((q) => questionMap.set(q._id.toString(), q));

    attempt.answers.forEach((ans) => {
      const question = questionMap.get(ans.questionId.toString());
      if (question) {
        const marks = question.marks || 1;
        const neg = test.negativeMarkingEnabled ? question.negativeMarks || 0 : 0;
        totalMarksPossible += marks;

        const correctOptions = (question.options || [])
          .filter((opt: any) => opt.isCorrect)
          .map((opt: any) => opt.id);

        const isCorrect =
          correctOptions.length === ans.selectedOptions.length &&
          correctOptions.every((optId: string) => ans.selectedOptions.includes(optId));

        if (isCorrect) {
          totalScore += marks;
        } else if (ans.selectedOptions.length > 0) {
          totalScore -= neg;
        }
      }
    });

    attempt.score = Math.max(0, totalScore);
    attempt.totalMarks = test.totalMarks || totalMarksPossible || 1;
    attempt.percentage = Math.round((attempt.score / attempt.totalMarks) * 100);
    attempt.submittedAt = new Date();
    attempt.status = isAutoSubmitted ? 'auto-submitted' : 'submitted';
    attempt.isAutoSubmitted = !!isAutoSubmitted;

    // Calculate rank
    const higherAttempts = await TestAttempt.countDocuments({
      testId: test._id,
      score: { $gt: attempt.score },
      status: { $in: ['submitted', 'auto-submitted'] },
    });
    attempt.rank = higherAttempts + 1;

    await attempt.save();

    // Award XP for test completion
    const bonusXp = attempt.percentage >= 80 ? 250 : 50;
    await Gamification.findOneAndUpdate(
      { studentId: req.user._id },
      { $inc: { xp: bonusXp } }
    );

    return res.json({ success: true, data: attempt });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getTestReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const attempt = await TestAttempt.findOne({
      testId: id,
      studentId: req.user._id,
    }).populate({
      path: 'answers.questionId',
    });

    if (!attempt) return res.status(404).json({ success: false, error: 'Test report not found' });

    const test = await Test.findById(id);

    return res.json({
      success: true,
      data: {
        attempt,
        test,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
