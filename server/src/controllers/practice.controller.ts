import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Section } from '../models/Section';
import { Topic } from '../models/Topic';
import { Progress } from '../models/Progress';
import { Gamification } from '../models/Gamification';

export const getPracticeQuestions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { topicId } = req.params;
    const topic = await Topic.findById(topicId).populate({
      path: 'practiceQuestions',
      options: { sort: { order: 1 } },
    });

    if (!topic) return res.status(404).json({ success: false, error: 'Topic not found' });

    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin && topic.isPublished === false) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }

    let practiceQuestions = topic.practiceQuestions as any[];
    if (!isAdmin) {
      practiceQuestions = practiceQuestions.filter((q: any) => q.isPublished !== false);
    }

    // Filter out correct answers if student
    const questions = practiceQuestions.map((q: any) => {
      const qObj = q.toObject ? q.toObject() : { ...q };
      if (!isAdmin && qObj.options) {
        qObj.options = qObj.options.map((opt: any) => ({
          id: opt.id,
          text: opt.text,
          image: opt.image,
        }));
      }
      return qObj;
    });

    return res.json({ success: true, data: questions });
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
