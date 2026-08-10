import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Gamification } from '../models/Gamification';
import { User } from '../models/User';

export const getGamificationStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    let stats = await Gamification.findOne({ studentId: req.user._id });
    if (!stats) {
      stats = await Gamification.create({
        studentId: req.user._id,
        xp: 0,
        level: 1,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: new Date(),
        badges: [],
        weeklyGoal: { target: 5, current: 0, weekStart: new Date() },
      });
    }

    // Check & update daily streak logic
    const now = new Date();
    const lastActive = new Date(stats.lastActiveDate);
    const diffHours = Math.abs(now.getTime() - lastActive.getTime()) / 36e5;

    if (diffHours >= 24 && diffHours < 48) {
      // Day increment
      stats.currentStreak += 1;
      if (stats.currentStreak > stats.longestStreak) {
        stats.longestStreak = stats.currentStreak;
      }
      stats.lastActiveDate = now;
      await stats.save();
    } else if (diffHours >= 48) {
      // Streak broken
      stats.currentStreak = 1;
      stats.lastActiveDate = now;
      await stats.save();
    }

    return res.json({ success: true, data: stats });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getLeaderboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const leaderboard = await Gamification.find()
      .sort({ xp: -1 })
      .limit(20)
      .populate({
        path: 'studentId',
        select: 'name avatar role',
      });

    const formatted = leaderboard.map((item, index) => ({
      rank: index + 1,
      studentId: item.studentId,
      xp: item.xp,
      level: item.level,
      streak: item.currentStreak,
      badgesCount: item.badges.length,
    }));

    return res.json({ success: true, data: formatted });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
