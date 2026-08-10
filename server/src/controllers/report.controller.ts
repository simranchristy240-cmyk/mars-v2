import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { TestAttempt } from '../models/TestAttempt';
import { Progress } from '../models/Progress';

export const getStudentReportsOverview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const attempts = await TestAttempt.find({
      studentId: req.user._id,
      status: { $in: ['submitted', 'auto-submitted'] },
    })
      .sort({ createdAt: -1 })
      .populate('testId', 'title');

    const progressRecords = await Progress.find({ studentId: req.user._id }).populate(
      'courseId',
      'title'
    );

    const testScoresTrend = attempts.map((a: any) => ({
      testTitle: (a.testId as any)?.title || 'Test',
      percentage: a.percentage,
      date: a.submittedAt || a.createdAt,
    }));

    return res.json({
      success: true,
      data: {
        totalTestsTaken: attempts.length,
        averageTestScore:
          attempts.length > 0
            ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
            : 0,
        testScoresTrend,
        courseProgress: progressRecords,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
