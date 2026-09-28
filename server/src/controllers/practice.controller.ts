import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Section } from '../models/Section';
import { Topic } from '../models/Topic';
import { Progress } from '../models/Progress';
import { Gamification } from '../models/Gamification';
import { canAccessTier, getStudentCourseTier } from '../utils/tierAccess';

export const getPracticeQuestions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { topicId, setId } = req.params;
    const querySetId = setId || (req.query.setId as string);

    const topic = await Topic.findById(topicId)
      .populate({
        path: 'practiceQuestions',
        options: { sort: { order: 1 } },
      })
      .populate({
        path: 'practiceSets.questions',
      });

    if (!topic) return res.status(404).json({ success: false, error: 'Topic not found' });

    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin && topic.isPublished === false) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }

    const studentTier = req.user
      ? await getStudentCourseTier(req.user._id, topic.courseId)
      : 'free';

    let practiceQuestions: any[] = [];
    let practiceSetMeta: any = null;

    // Check if a specific practice set was requested
    if (querySetId && querySetId !== 'default' && topic.practiceSets?.length) {
      const targetSet = topic.practiceSets.find((ps: any) => ps._id.toString() === querySetId);
      if (targetSet) {
        if (!isAdmin && targetSet.isPublished === false) {
          return res.status(404).json({ success: false, error: 'Practice set not found' });
        }
        practiceQuestions = [...((targetSet.questions || []) as any[])].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        practiceSetMeta = {
          _id: targetSet._id,
          title: targetSet.title,
          description: targetSet.description,
          accessTier: targetSet.accessTier || (topic.isFree ? 'free' : 'basic'),
        };
      }
    }

    // Fallback: If not specified or not found, check practiceSets or legacy practiceQuestions
    if (practiceQuestions.length === 0) {
      if (querySetId && querySetId !== 'default' && topic.practiceSets?.length) {
        return res.status(404).json({ success: false, error: 'Practice set not found' });
      }

      if (topic.practiceSets && topic.practiceSets.length > 0) {
        const firstSet = topic.practiceSets.find((s: any) => isAdmin || s.isPublished !== false) || topic.practiceSets[0];
        practiceQuestions = (firstSet.questions || []) as any[];
        practiceSetMeta = {
          _id: firstSet._id,
          title: firstSet.title,
          description: firstSet.description,
          accessTier: firstSet.accessTier || (topic.isFree ? 'free' : 'basic'),
        };
      } else if (topic.practiceQuestions && topic.practiceQuestions.length > 0) {
        practiceQuestions = topic.practiceQuestions as any[];
        practiceSetMeta = {
          _id: 'default',
          title: 'Practice Question Bank',
          description: topic.description || 'Topic interactive question bank',
          accessTier: topic.isFree ? 'free' : 'basic',
        };
      }
    }

    // Check tier permission for this practice set
    const requiredTier = practiceSetMeta?.accessTier || (topic.isFree ? 'free' : 'basic');
    if (!isAdmin && !canAccessTier(studentTier, requiredTier)) {
      return res.status(403).json({
        success: false,
        error: `This practice set requires the ${requiredTier.toUpperCase()} tier plan. Please upgrade to access.`,
        isLocked: true,
        requiredTier,
      });
    }

    if (!isAdmin) {
      practiceQuestions = practiceQuestions.filter((q: any) => q.isPublished !== false);
    }

    // Filter out correct answers if student and mark tier locks
    const questions = practiceQuestions.map((q: any) => {
      const qObj = q.toObject ? q.toObject() : { ...q };
      qObj.isLocked = !isAdmin && !canAccessTier(studentTier, qObj.accessTier || requiredTier || 'free');
      if (!isAdmin && qObj.options) {
        qObj.options = qObj.options.map((opt: any) => ({
          id: opt.id,
          text: opt.text,
          image: opt.image,
        }));
      }
      return qObj;
    });

    return res.json({
      success: true,
      data: questions,
      practiceSet: practiceSetMeta,
      studentTier,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const submitPracticeAnswer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { questionId, selectedOptions, courseId } = req.body;
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const question = await Section.findById(questionId);
    if (!question || question.type !== 'question') {
      return res.status(404).json({ success: false, error: 'Question section not found' });
    }

    if (courseId) {
      const studentTier = await getStudentCourseTier(req.user._id, courseId);
      if (!canAccessTier(studentTier, question.accessTier || 'free')) {
        return res.status(403).json({
          success: false,
          error: `This practice question requires the ${(question.accessTier || 'basic').toUpperCase()} tier plan. Please upgrade to access.`,
          isLocked: true,
          requiredTier: question.accessTier,
        });
      }
    }

    // Determine correctness
    const correctOptions = (question.options || [])
      .filter((opt) => opt.isCorrect)
      .map((opt) => opt.id);

    const isCorrect =
      correctOptions.length === selectedOptions.length &&
      correctOptions.every((optId) => selectedOptions.includes(optId));

    // Update progress
    if (courseId) {
      let progress = await Progress.findOne({ studentId: req.user._id, courseId });
      if (!progress) {
        progress = new Progress({ studentId: req.user._id, courseId });
      }
      progress.practiceAttempts.push({
        questionId,
        selectedOptions,
        isCorrect,
        attemptedAt: new Date(),
      });
      await progress.save();
    }

    // Award XP if correct
    if (isCorrect) {
      await Gamification.findOneAndUpdate(
        { studentId: req.user._id },
        { $inc: { xp: 10 } }
      );
    }

    return res.json({
      success: true,
      data: {
        isCorrect,
        explanation: question.explanation,
        hints: question.hints,
        correctOptions,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
