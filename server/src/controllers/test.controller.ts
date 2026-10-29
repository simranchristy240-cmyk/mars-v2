import { studentQuestion, isAnswerCorrect, testDeadline, questionValidationError } from '@mars/shared';
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Test } from '../models/Test';
import { TestAttempt } from '../models/TestAttempt';
import { Section } from '../models/Section';
import { Gamification } from '../models/Gamification';
import { Topic } from '../models/Topic';
import { Course } from '../models/Course';

import { canAccessTier, getStudentCourseTier } from '../utils/tierAccess';

const attemptDeadline = (test: any, attempt: any): number => attempt.deadlineAt ? new Date(attempt.deadlineAt).getTime() : testDeadline(test, attempt.startedAt);

async function finishAttempt(attempt: any, test: any, auto = false) {
  const questions: any[] = test.sections.flatMap((section: any) => section.questions || []);
  const marks = questions.reduce((sum, question) => sum + (question.marks || 1), 0);
  let score = 0;
  for (const question of questions) {
    const answer = attempt.answers.find((item: any) => String(item.questionId) === String(question._id));
    if (answer && isAnswerCorrect(question, answer.selectedOptions)) score += question.marks || 1;
    else if (answer?.selectedOptions?.length && test.negativeMarkingEnabled) score -= question.negativeMarks || 0;
  }
  score = Math.max(0, score);
  const percentage = Math.round(score / (marks || 1) * 100);
  const rank = 1 + await TestAttempt.countDocuments({ testId: test._id, score: { $gt: score }, status: { $ne: 'in-progress' } });
  const finished = await TestAttempt.findOneAndUpdate(
    { _id: attempt._id, status: 'in-progress', __v: attempt.__v },
    { $set: { score, totalMarks: marks, percentage, rank, submittedAt: new Date(),
      status: auto ? 'auto-submitted' : 'submitted', isAutoSubmitted: auto }, $inc: { __v: 1 } },
    { new: true }
  );
  if (finished) {
    await Gamification.findOneAndUpdate({ studentId: attempt.studentId }, { $inc: { xp: percentage >= 80 ? 250 : 50 } });
    return finished;
  }
  const latest = await TestAttempt.findById(attempt._id);
  if (latest?.status !== 'in-progress') return latest;
  throw new Error('Answers changed during submission. Please retry.');
}

async function validatePublishedTest(data: any): Promise<string | null> {
  if (!Number.isFinite(Number(data.duration)) || Number(data.duration) <= 0) return 'Enter a positive test duration.';
  if (!Number.isFinite(new Date(data.startTime).getTime()) || !Number.isFinite(new Date(data.endTime).getTime()) || new Date(data.startTime) >= new Date(data.endTime)) return 'Test end time must be after its start time.';
  if (!data.isPublished) return null;
  const ids = (data.sections || []).flatMap((section: any) => section.questions || []);
  const questions = await Section.find({ _id: { $in: ids } });
  if (!ids.length || questions.length !== new Set(ids.map(String)).size) return 'Add valid questions before publishing the test.';
  for (const question of questions) {
    const error = questionValidationError(question);
    if (error) return error;
  }
  return null;
}

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
      accessTier,
      sections,
      isPublished,
    } = req.body;

    const validation = await validatePublishedTest(req.body);
    if (validation) return res.status(400).json({ success: false, error: validation });
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
      accessTier: accessTier || 'free',
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

    const current = await Test.findById(id);
    if (!current) return res.status(404).json({ success: false, error: 'Test not found' });
    const validation = await validatePublishedTest({ ...current.toObject(), ...updates });
    if (validation) return res.status(400).json({ success: false, error: validation });
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

    const studentTier = req.user
      ? await getStudentCourseTier(req.user._id, courseId)
      : 'free';

    // Check attempts for current student
    const testIds = tests.map((t) => t._id);
    const attempts = await TestAttempt.find({
      studentId: req.user?._id,
      testId: { $in: testIds },
    });

    await Promise.all(attempts.map(async (attempt) => {
      const test = tests.find(item => String(item._id) === String(attempt.testId));
      if (test && attempt.status === 'in-progress' && Date.now() >= attemptDeadline(test, attempt)) {
        const populated = await Test.findById(test._id).populate('sections.questions');
        if (populated) {
          const finished = await finishAttempt(attempt, populated, true);
          if (finished) Object.assign(attempt, finished.toObject());
        }
      }
    }));

    const attemptsMap = new Map();
    attempts.forEach((a) => attemptsMap.set(a.testId.toString(), a));

    const result = tests.map((t) => {
      const tObj = t.toObject();
      const attempt = attemptsMap.get(t._id.toString());
      const isLocked = !canAccessTier(studentTier, t.accessTier || 'free');
      return {
        ...tObj,
        isLocked,
        studentTier,
        attemptStatus: attempt ? attempt.status : 'not-started',
        hasAttempted: !!attempt && attempt.status !== 'in-progress',
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

    if (!test || !test.isPublished) return res.status(404).json({ success: false, error: 'Test not found' });

    const studentTier = await getStudentCourseTier(req.user._id, test.courseId);
    if (!canAccessTier(studentTier, test.accessTier || 'free')) {
      return res.status(403).json({
        success: false,
        error: `This test requires the ${(test.accessTier || 'basic').toUpperCase()} tier plan. Please upgrade to access.`,
        isLocked: true,
        requiredTier: test.accessTier,
        studentTier,
      });
    }

    // Enforce schedule window
    const now = new Date();
    const existingAttempt = await TestAttempt.findOne({ testId: test._id, studentId: req.user._id });
    if (!existingAttempt && (now < new Date(test.startTime) || now > new Date(test.endTime))) {
      return res.status(400).json({
        success: false,
        error: 'Test is outside the allowed time window.',
      });
    }

    // Check for existing attempt — ENFORCE SINGLE ATTEMPT POLICY
    let attempt = existingAttempt;
    if (!attempt) {
      attempt = await TestAttempt.findOneAndUpdate(
        { testId: test._id, studentId: req.user._id },
        { $setOnInsert: { startedAt: now, deadlineAt: new Date(testDeadline(test, now)), answers: [], status: 'in-progress' } },
        { upsert: true, new: true }
      );
    }
    if (!attempt) throw new Error('Unable to start test. Please retry.');
    if (attempt.status === 'in-progress' && Date.now() >= attemptDeadline(test, attempt)) {
      attempt = await finishAttempt(attempt, test, true);
    }

    if (!attempt) throw new Error('Attempt not found');
    // Sanitize questions (remove answer keys for students)
    const sanitizedTest = test.toObject();
    sanitizedTest.sections.forEach((sec: any) => {
      sec.questions = sec.questions.map((question: any) => studentQuestion(question));
    });

    return res.json({
      success: true,
      data: {
        test: sanitizedTest,
        attempt,
        deadline: new Date(attemptDeadline(test, attempt)).toISOString(),
        serverNow: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const saveAnswer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { questionId, selectedOptions, isMarkedForReview } = req.body;
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
    if (Date.now() >= attemptDeadline(test, attempt)) {
      await finishAttempt(attempt, test, true);
      return res.status(409).json({ success: false, expired: true, error: 'Time has expired. Your saved answers have been submitted.' });
    }
    const question: any = test.sections.flatMap((section: any) => section.questions).find((q: any) => String(q._id) === questionId);
    if (!question || !Array.isArray(selectedOptions) || selectedOptions.some((option: unknown) => typeof option !== 'string')) {
      return res.status(400).json({ success: false, error: 'Invalid test answer' });
    }
    const answer = { questionId, selectedOptions, isMarkedForReview: !!isMarkedForReview, timeTaken: 0 };
    const filter = { _id: attempt._id, status: 'in-progress', $expr: { $lt: ['$$NOW', new Date(attemptDeadline(test, attempt))] } };
    const updated = await TestAttempt.updateOne({ ...filter, 'answers.questionId': questionId },
      { $set: { 'answers.$': answer }, $inc: { __v: 1 } });
    if (!updated.matchedCount) {
      const inserted = await TestAttempt.updateOne({ ...filter, 'answers.questionId': { $ne: questionId } },
        { $push: { answers: answer }, $inc: { __v: 1 } });
      if (!inserted.matchedCount) return res.status(409).json({ success: false, error: 'Answer was not saved. The attempt ended or changed; retry.' });
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const submitTest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const attempt = await TestAttempt.findOne({ testId: req.params.id, studentId: req.user._id });
    if (!attempt) return res.status(404).json({ success: false, error: 'Attempt not found' });
    if (attempt.status !== 'in-progress') return res.json({ success: true, data: attempt });
    const test = await Test.findById(req.params.id).populate('sections.questions');
    if (!test) return res.status(404).json({ success: false, error: 'Test not found' });
    const auto = Date.now() >= attemptDeadline(test, attempt);
    return res.json({ success: true, data: await finishAttempt(attempt, test, auto) });
  } catch (err: any) {
    return res.status(409).json({ success: false, error: err.message });
  }
};

export const getTestReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    let attempt = await TestAttempt.findOne({
      testId: id,
      studentId: req.user._id,
    });

    if (!attempt) return res.status(404).json({ success: false, error: 'Test report not found' });

    const test = await Test.findById(id).populate('sections.questions');
    if (attempt.status === 'in-progress' && test && Date.now() >= attemptDeadline(test, attempt)) attempt = await finishAttempt(attempt, test, true);
    if (!attempt) return res.status(404).json({ success: false, error: 'Attempt not found' });
    if (attempt.status === 'in-progress') return res.status(409).json({ success: false, error: 'Resume and submit the test to view your report.' });

    const reportAttempt: any = attempt.toObject();
    reportAttempt.answers = (test?.sections || []).flatMap((section: any) => section.questions).filter(Boolean).map((question: any) => {
      const saved = reportAttempt.answers.find((answer: any) => String(answer.questionId?._id || answer.questionId) === String(question._id));
      return { ...(saved || { selectedOptions: [], isMarkedForReview: false, timeTaken: 0 }), questionId: question };
    });
    return res.json({ success: true, data: { attempt: reportAttempt, test } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
