import { Enrollment } from '../models/Enrollment';

export type AccessTier = 'free' | 'basic' | 'plus' | 'premium';

export const TIER_RANKS: Record<AccessTier, number> = {
  free: 0,
  basic: 1,
  plus: 2,
  premium: 3,
};

/**
 * Checks if a user's tier meets or exceeds the required tier.
 */
export const canAccessTier = (
  userTier: AccessTier = 'free',
  requiredTier: AccessTier = 'free'
): boolean => {
  const userRank = TIER_RANKS[userTier] ?? 0;
  const requiredRank = TIER_RANKS[requiredTier] ?? 0;
  return userRank >= requiredRank;
};

/**
 * Retrieves the effective tier for a student in a specific course.
 */
export const getStudentCourseTier = async (
  studentId: any,
  courseId: any
): Promise<AccessTier> => {
  if (!studentId || !courseId) return 'free';

  const enrollment = await Enrollment.findOne({
    studentId,
    courseId,
  });

  if (!enrollment) return 'free';
  if (enrollment.accessType === 'paid' || enrollment.tier) {
    return (enrollment.tier as AccessTier) || 'basic';
  }

  return 'free';
};
