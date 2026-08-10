import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Progress } from '../models/Progress';
import { Gamification } from '../models/Gamification';

export const getCourseProgress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId } = req.params;
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    let progress = await Progress.findOne({
      studentId: req.user._id,
      courseId,
    });

    if (!progress) {
      progress = await Progress.create({
        studentId: req.user._id,
        courseId,
        lessonsCompleted: [],
        sectionsCompleted: [],
        videoProgress: [],
        practiceAttempts: [],
        overallPercentage: 0,
      });
    }

    return res.json({ success: true, data: progress });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const updateVideoProgress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId, sectionId, watchedSeconds, totalSeconds, lastPosition } = req.body;
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    let progress = await Progress.findOne({
      studentId: req.user._id,
      courseId,
    });

    if (!progress) {
      progress = new Progress({
        studentId: req.user._id,
        courseId,
        lessonsCompleted: [],
        sectionsCompleted: [],
        videoProgress: [],
      });
    }

    const videoIdx = progress.videoProgress.findIndex(
      (v) => v.sectionId.toString() === sectionId
    );

    if (videoIdx >= 0) {
      progress.videoProgress[videoIdx].watchedSeconds = Math.max(
        progress.videoProgress[videoIdx].watchedSeconds,
        watchedSeconds
      );
      progress.videoProgress[videoIdx].lastPosition = lastPosition;
      progress.videoProgress[videoIdx].totalSeconds = totalSeconds;
    } else {
      progress.videoProgress.push({
        sectionId,
        watchedSeconds,
        totalSeconds,
        lastPosition,
      });
    }

    progress.lastActivity = {
      type: 'lesson',
      sectionId,
      courseId,
      timestamp: new Date(),
    };

    await progress.save();
    return res.json({ success: true, data: progress });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const completeSection = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId, lessonId, sectionId } = req.body;
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    let progress = await Progress.findOne({
      studentId: req.user._id,
      courseId,
    });

    if (!progress) {
      progress = new Progress({ studentId: req.user._id, courseId });
    }

    if (!progress.sectionsCompleted.includes(sectionId)) {
      progress.sectionsCompleted.push(sectionId);
    }

    if (lessonId && !progress.lessonsCompleted.includes(lessonId)) {
      progress.lessonsCompleted.push(lessonId);

      // Award XP for completing lesson
      await Gamification.findOneAndUpdate(
        { studentId: req.user._id },
        { $inc: { xp: 50 } }
      );
    }

    progress.lastActivity = {
      type: 'lesson',
      lessonId,
      sectionId,
      courseId,
      timestamp: new Date(),
    };

    await progress.save();
    return res.json({ success: true, data: progress });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getContinueLearning = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const recentProgress = await Progress.find({ studentId: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(3)
      .populate({
        path: 'courseId',
        select: 'title thumbnail price topics',
      })
      .populate({
        path: 'lastActivity.lessonId',
        select: 'title',
      });

    return res.json({ success: true, data: recentProgress });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
