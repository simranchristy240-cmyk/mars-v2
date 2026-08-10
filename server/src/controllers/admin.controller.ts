import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { User } from '../models/User';
import { Course } from '../models/Course';
import { Payment } from '../models/Payment';
import { Enrollment } from '../models/Enrollment';
import { TestAttempt } from '../models/TestAttempt';

export const getAdminDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();

    const payments = await Payment.find({ status: 'paid' });
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    const recentPayments = await Payment.find({ status: 'paid' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('studentId', 'name email')
      .populate('courseId', 'title');

    const testAttemptsCount = await TestAttempt.countDocuments({
      status: { $in: ['submitted', 'auto-submitted'] },
    });

    return res.json({
      success: true,
      data: {
        totalStudents,
        totalCourses,
        totalEnrollments,
        totalRevenue: Math.round(totalRevenue / 100), // in INR
        testAttemptsCount,
        recentPayments,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getStudentsList = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const students = await User.find({ role: 'student' }).sort({ createdAt: -1 });
    return res.json({ success: true, data: students });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
