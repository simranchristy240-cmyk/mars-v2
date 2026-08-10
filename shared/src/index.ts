export type UserRole = 'student' | 'admin';

export type AppTheme = 'deep-ocean' | 'soft-cloud' | 'sunset-calm' | 'lunar-drift' | 'silk-paper';

export interface IUser {
  _id: string;
  firebaseUid: string;
  username?: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  activeSessionId?: string;
  preferences: {
    theme: AppTheme;
    language: string;
  };
  referralCode: string;
  referredBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICourse {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  price: number; // in paisa (e.g. 99900 = ₹999)
  currency: string;
  topics: string[]; // Topic IDs
  testSeries: string[]; // Test IDs
  isPublished: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITopic {
  _id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  isFree: boolean;
  lessons: string[]; // Lesson IDs
  practiceQuestions: string[]; // Section IDs (question type)
  createdAt: string;
  updatedAt: string;
}

export interface ILesson {
  _id: string;
  topicId: string;
  courseId: string;
  title: string;
  order: number;
  sections: string[]; // Section IDs
  createdAt: string;
  updatedAt: string;
}

export type SectionType = 'video' | 'text' | 'question';
export type QuestionType = 'single-mcq' | 'multi-mcq' | 'true-false' | 'match' | 'image-based';

export interface IOption {
  id: string;
  text: string;
  image?: string;
  isCorrect: boolean;
}

export interface IMatchPair {
  left: string;
  right: string;
}

export interface ISection {
  _id: string;
  type: SectionType;
  // Video fields
  vimeoVideoId?: string;
  videoStartTime?: number; // seconds
  videoEndTime?: number; // seconds
  // Text fields
  text?: string; // Rich HTML content
  // Question fields
  questionType?: QuestionType;
  questionText?: string;
  questionImage?: string;
  options?: IOption[];
  matchPairs?: IMatchPair[];
  hints?: string[];
  explanation?: string;
  marks?: number;
  negativeMarks?: number;
  order: number;
  parentId: string;
  parentType: 'lesson' | 'practice' | 'test';
  createdAt: string;
  updatedAt: string;
}

export interface ITestSection {
  name: string;
  questions: string[]; // Section IDs
}

export interface ITest {
  _id: string;
  courseId: string;
  title: string;
  description?: string;
  duration: number; // minutes
  startTime: string;
  endTime: string;
  totalMarks: number;
  passingMarks?: number;
  negativeMarkingEnabled: boolean;
  sections: ITestSection[];
  isPublished: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITestAnswer {
  questionId: string;
  selectedOptions: string[];
  matchAnswers?: IMatchPair[];
  timeTaken: number; // seconds
  isMarkedForReview: boolean;
}

export interface ITopicWiseScore {
  topicId: string;
  topicName: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface ITestAttempt {
  _id: string;
  testId: string;
  studentId: string;
  startedAt: string;
  submittedAt?: string;
  isAutoSubmitted: boolean;
  answers: ITestAnswer[];
  score: number;
  totalMarks: number;
  percentage: number;
  rank?: number;
  topicWiseScores: ITopicWiseScore[];
  status: 'in-progress' | 'submitted' | 'auto-submitted';
}

export interface IVideoProgress {
  sectionId: string;
  watchedSeconds: number;
  totalSeconds: number;
  lastPosition: number;
}

export interface IPracticeAttempt {
  questionId: string;
  selectedOptions: string[];
  isCorrect: boolean;
  attemptedAt: string;
}

export interface ILastActivity {
  type: 'lesson' | 'practice' | 'test';
  lessonId?: string;
  sectionId?: string;
  courseId: string;
  timestamp: string;
}

export interface IProgress {
  _id: string;
  studentId: string;
  courseId: string;
  lessonsCompleted: string[];
  sectionsCompleted: string[];
  videoProgress: IVideoProgress[];
  practiceAttempts: IPracticeAttempt[];
  lastActivity?: ILastActivity;
  overallPercentage: number;
  updatedAt: string;
}

export interface IBadge {
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export interface IWeeklyGoal {
  target: number;
  current: number;
  weekStart: string;
}

export interface IGamification {
  _id: string;
  studentId: string;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  badges: IBadge[];
  weeklyGoal: IWeeklyGoal;
  updatedAt: string;
}

export interface IPayment {
  _id: string;
  studentId: string;
  courseId: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  couponId?: string;
  discountAmount?: number;
  status: 'created' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

export interface IEnrollment {
  _id: string;
  studentId: string;
  courseId: string;
  paymentId?: string;
  enrolledAt: string;
  accessType: 'free' | 'paid';
}

export interface ICoupon {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  maxUses: number;
  currentUses: number;
  validFrom: string;
  validUntil: string;
  applicableCourses: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export interface INotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'test-reminder' | 'streak-warning' | 'badge-earned' | 'achievement' | 'system';
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
