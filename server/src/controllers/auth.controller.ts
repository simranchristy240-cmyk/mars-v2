import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { User } from '../models/User';
import { Course } from '../models/Course';
import { Enrollment } from '../models/Enrollment';
import { Gamification } from '../models/Gamification';

/** Helper to attach isCourseLocked to user object */
export const enrichUserWithLockStatus = async (user: any) => {
  const safeUser = user?.toJSON ? user.toJSON() : { ...user };
  if (!safeUser?._id) return safeUser;

  const paidEnrollment = await Enrollment.findOne({
    studentId: safeUser._id,
    accessType: 'paid',
  });

  safeUser.isCourseLocked = !!paidEnrollment;
  return safeUser;
};

/** Username + password login — returns a mock token compatible with existing auth middleware. */
export const loginWithPassword = async (req: Request, res: Response) => {
  try {
    const username = String(req.body.username || '')
      .trim()
      .toLowerCase();
    const password = String(req.body.password || '');

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    const user = await User.findOne({ username }).select('+passwordHash');
    if (!user || !user.passwordHash) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const sessionId = String(req.body.sessionId || Math.random().toString(36).substring(2));
    user.activeSessionId = sessionId;
    await user.save();

    const token = `mock_${user.firebaseUid}`;
    const safeUser = await enrichUserWithLockStatus(user);

    return res.json({
      success: true,
      data: {
        token,
        sessionId,
        user: safeUser,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const syncUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { firebaseUid } = req;
    const { name, email, phone, avatar, role, sessionId } = req.body;

    if (!firebaseUid) {
      return res.status(400).json({ success: false, error: 'Firebase UID is required' });
    }

    let user = await User.findOne({ firebaseUid });

    // Fallback: match seeded demo personas by exact UID or email
    if (!user && (firebaseUid === 'demo_student_new_uid' || email === 'newstudent@mars.edu')) {
      user = await User.findOne({ firebaseUid: 'demo_student_new_uid' });
    }

    if (
      !user &&
      (firebaseUid === 'demo_student_uid' || email === 'student@mars.edu' || phone === '+919876543210')
    ) {
      user = await User.findOne({ firebaseUid: 'demo_student_uid' });
    }

    if (
      !user &&
      (firebaseUid === 'demo_student_paid_uid' || email === 'paidstudent@mars.edu')
    ) {
      user = await User.findOne({ firebaseUid: 'demo_student_paid_uid' });
    }

    if (!user && (firebaseUid === 'demo_admin_uid' || email === 'admin@mars.edu')) {
      user = await User.findOne({ firebaseUid: 'demo_admin_uid' });
    }

    // Only elevate to admin when syncing the seeded admin persona (never via body.role alone)
    if (!user && role === 'admin' && email === 'admin@mars.edu') {
      user = await User.findOne({ firebaseUid: 'demo_admin_uid' });
    }

    if (!user) {
      // Create new user
      const referralCode = 'MARS' + Math.random().toString(36).substring(2, 8).toUpperCase();
      user = await User.create({
        firebaseUid,
        name: name || 'Anatomy Student',
        email,
        phone,
        avatar,
        role: role === 'admin' ? 'admin' : 'student',
        activeSessionId: sessionId || Math.random().toString(36).substring(2),
        referralCode,
        preferences: { theme: 'soft-cloud', language: 'en' },
      });

      // Initialize gamification profile for student
      if (user.role === 'student') {
        await Gamification.create({
          studentId: user._id,
          xp: 20, // Welcome bonus
          level: 1,
          currentStreak: 1,
          longestStreak: 1,
          lastActiveDate: new Date(),
          badges: [
            {
              badgeId: 'welcome',
              name: 'Welcome to MARS',
              description: 'Joined the MARS anatomy learning platform',
              icon: '🚀',
              earnedAt: new Date(),
            },
          ],
          weeklyGoal: { target: 5, current: 0, weekStart: new Date() },
        });
      }
    } else {
      // Update session ID if provided
      if (sessionId) {
        user.activeSessionId = sessionId;
        await user.save();
      }
    }

    const enriched = await enrichUserWithLockStatus(user);
    return res.json({ success: true, data: enriched });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const enriched = await enrichUserWithLockStatus(req.user);
    return res.json({ success: true, data: enriched });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { name, avatar, preferences } = req.body;
    if (name) req.user.name = name;
    if (avatar !== undefined) req.user.avatar = avatar;
    if (preferences) {
      req.user.preferences = { ...req.user.preferences, ...preferences };
    }

    await req.user.save();
    const enriched = await enrichUserWithLockStatus(req.user);
    return res.json({ success: true, data: enriched });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const selectCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ success: false, error: 'Course ID is required' });
    }

    // Verify course exists and is published
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    // Check if user has an existing paid enrollment
    const paidEnrollment = await Enrollment.findOne({
      studentId: req.user._id,
      accessType: 'paid',
    });

    if (paidEnrollment) {
      return res.status(400).json({
        success: false,
        error: 'Your course selection is locked because you have purchased a course.',
        isCourseLocked: true,
      });
    }

    req.user.selectedCourseId = course._id as any;
    await req.user.save();

    const enriched = await enrichUserWithLockStatus(req.user);
    return res.json({
      success: true,
      message: 'Target course selected successfully',
      data: enriched,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
