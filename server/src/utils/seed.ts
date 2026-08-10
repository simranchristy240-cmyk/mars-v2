import bcrypt from 'bcryptjs';
import { connectDB } from '../config/database';
import { User } from '../models/User';
import { Course } from '../models/Course';
import { Topic } from '../models/Topic';
import { Lesson } from '../models/Lesson';
import { Section } from '../models/Section';
import { Test } from '../models/Test';
import { TestAttempt } from '../models/TestAttempt';
import { Progress } from '../models/Progress';
import { Gamification } from '../models/Gamification';
import { Enrollment } from '../models/Enrollment';

/** Shared demo password for all seeded personas (username differs). */
export const DEMO_PASSWORD = 'mars123';

const seedDatabase = async () => {
  await connectDB();
  console.log('[Seed] Clearing existing demo data...');

  await User.deleteMany({ firebaseUid: /^demo_/ });
  await User.deleteMany({ username: { $in: ['admin', 'student', 'newstudent'] } });
  await Course.deleteMany({ title: /Anatomy/i });
  await Topic.deleteMany({});
  await Lesson.deleteMany({});
  await Section.deleteMany({});
  await Test.deleteMany({});
  await TestAttempt.deleteMany({});
  await Progress.deleteMany({});
  await Gamification.deleteMany({});
  await Enrollment.deleteMany({});

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  console.log('[Seed] Creating demo admin and student users...');
  const admin = await User.create({
    firebaseUid: 'demo_admin_uid',
    username: 'admin',
    passwordHash,
    name: 'Dr. Anatomy Admin',
    email: 'admin@mars.edu',
    role: 'admin',
    referralCode: 'MARSADMIN',
    preferences: { theme: 'deep-ocean', language: 'en' },
  });

  // New student — just signed up, no enrollments / progress
  const newStudent = await User.create({
    firebaseUid: 'demo_student_new_uid',
    username: 'newstudent',
    passwordHash,
    name: 'Asha New Student',
    email: 'newstudent@mars.edu',
    role: 'student',
    referralCode: 'STUDENT0',
    preferences: { theme: 'silk-paper', language: 'en' },
  });

  await Gamification.create({
    studentId: newStudent._id,
    xp: 20,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
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

  // Enrolled student — 1 course + progress + XP
  const student = await User.create({
    firebaseUid: 'demo_student_uid',
    username: 'student',
    passwordHash,
    name: 'Serik Anatomy Student',
    email: 'student@mars.edu',
    phone: '+919876543210',
    role: 'student',
    referralCode: 'STUDENT1',
    preferences: { theme: 'deep-ocean', language: 'en' },
  });

  console.log('[Seed] Creating demo Anatomy Course...');
  const course = await Course.create({
    title: 'Human Upper Limb & Osteology Anatomy',
    description: 'Comprehensive medical anatomy course covering bones, joints, innervation, and clinical anatomy of the upper extremity.',
    thumbnail: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=800&q=80',
    price: 99900, // ₹999
    currency: 'INR',
    isPublished: true,
    createdBy: admin._id,
  });

  // Enroll student into the course
  await Enrollment.create({
    studentId: student._id,
    courseId: course._id,
    accessType: 'paid',
    enrolledAt: new Date(Date.now() - 86400000 * 5),
  });

  // TOPIC 1: OSTEOLOGY (Free Topic)
  const topic1 = await Topic.create({
    courseId: course._id,
    title: 'Osteology of the Upper Limb',
    description: 'Structure, landmarks, and muscle attachments of Scapula, Humerus, Radius, and Ulna.',
    order: 1,
    isFree: true,
    isPublished: true,
  });

  // Lesson 1.1: Scapula Anatomy
  const lesson1_1 = await Lesson.create({
    topicId: topic1._id,
    courseId: course._id,
    title: 'Scapula & Shoulder Girdle Anatomy',
    order: 1,
    isPublished: true,
  });

  const sec1_1 = await Section.create({
    type: 'video',
    title: 'Scapula Overview',
    vimeoVideoId: '76979871',
    videoStartTime: 0,
    videoEndTime: 180,
    order: 1,
    isPublished: true,
    parentId: lesson1_1._id,
    parentType: 'lesson',
  });

  const sec1_2 = await Section.create({
    type: 'text',
    title: 'Scapular Landmarks Notes',
    text: `
      <h3>Key Clinical Notes: Scapular Landmarks</h3>
      <p>The <strong>Scapula</strong> is a large triangular flat bone situated in the posterolateral thoracic wall overlying 2nd to 7th ribs.</p>
      <ul>
        <li><strong>Spine of Scapula:</strong> Divides dorsal surface into supraspinous & infraspinous fossae.</li>
        <li><strong>Acromion Process:</strong> Articulates with lateral clavicle to form acromioclavicular joint.</li>
        <li><strong>Glenoid Cavity:</strong> Shallow articular socket for humeral head articulation.</li>
      </ul>
    `,
    order: 2,
    isPublished: true,
    parentId: lesson1_1._id,
    parentType: 'lesson',
  });

  const sec1_3 = await Section.create({
    type: 'question',
    title: 'Surgical Neck Nerve Injury',
    questionType: 'single-mcq',
    questionText: 'Which nerve is most commonly at risk in fractures of the surgical neck of the humerus?',
    options: [
      { id: 'a', text: 'Axillary Nerve', isCorrect: true },
      { id: 'b', text: 'Radial Nerve', isCorrect: false },
      { id: 'c', text: 'Median Nerve', isCorrect: false },
      { id: 'd', text: 'Ulnar Nerve', isCorrect: false },
    ],
    hints: ['Think of structures winding around the surgical neck.'],
    explanation: 'The axillary nerve and posterior circumflex humeral vessels wind closely around the surgical neck of the humerus.',
    marks: 1,
    order: 3,
    isPublished: true,
    parentId: lesson1_1._id,
    parentType: 'lesson',
  });

  lesson1_1.sections = [sec1_1._id, sec1_2._id, sec1_3._id] as any[];
  await lesson1_1.save();

  // Lesson 1.2: Humerus & Arm Osteology
  const lesson1_2 = await Lesson.create({
    topicId: topic1._id,
    courseId: course._id,
    title: 'Humerus Landmarks & Fractures',
    order: 2,
    isPublished: true,
  });

  const sec1_4 = await Section.create({
    type: 'video',
    title: 'Humerus Fractures',
    vimeoVideoId: '76979871',
    videoStartTime: 180,
    videoEndTime: 360,
    order: 1,
    isPublished: true,
    parentId: lesson1_2._id,
    parentType: 'lesson',
  });

  const sec1_5 = await Section.create({
    type: 'text',
    title: 'Humerus Nerve Relations',
    text: `
      <h3>Humerus Fractures & Nerve Relationships</h3>
      <p>Nerves in direct contact with the humerus:</p>
      <ul>
        <li><strong>Surgical Neck:</strong> Axillary Nerve</li>
        <li><strong>Spiral Groove (Mid-shaft):</strong> Radial Nerve (causes wrist drop)</li>
        <li><strong>Medial Epicondyle:</strong> Ulnar Nerve (claw hand deformity)</li>
      </ul>
    `,
    order: 2,
    isPublished: true,
    parentId: lesson1_2._id,
    parentType: 'lesson',
  });

  lesson1_2.sections = [sec1_4._id, sec1_5._id] as any[];
  await lesson1_2.save();

  topic1.lessons = [lesson1_1._id, lesson1_2._id] as any[];

  // Practice questions for Topic 1
  const practiceQ1 = await Section.create({
    type: 'question',
    title: 'Glenoid Labrum Function',
    questionType: 'single-mcq',
    questionText: 'The glenoid labrum functions primarily to:',
    options: [
      { id: 'a', text: 'Deepen the glenoid fossa for joint stability', isCorrect: true },
      { id: 'b', text: 'Synthesize synovial fluid', isCorrect: false },
      { id: 'c', text: 'Attach the biceps short head', isCorrect: false },
      { id: 'd', text: 'Prevent clavicular displacement', isCorrect: false },
    ],
    hints: ['It is a fibrocartilaginous ring around the glenoid.'],
    explanation: 'The glenoid labrum is a fibrocartilaginous ring that deepens the shallow glenoid cavity to increase humeroscapular contact.',
    order: 1,
    isPublished: true,
    parentId: topic1._id,
    parentType: 'practice',
  });

  const practiceQ2 = await Section.create({
    type: 'question',
    title: 'Radial Tuberosity Insertion',
    questionType: 'single-mcq',
    questionText: 'Which muscle inserts into the radial tuberosity?',
    options: [
      { id: 'a', text: 'Biceps Brachii', isCorrect: true },
      { id: 'b', text: 'Brachialis', isCorrect: false },
      { id: 'c', text: 'Coracobrachialis', isCorrect: false },
      { id: 'd', text: 'Triceps Brachii', isCorrect: false },
    ],
    explanation: 'The tendon of insertion of the biceps brachii inserts into the posterior rough portion of the radial tuberosity.',
    order: 2,
    isPublished: true,
    parentId: topic1._id,
    parentType: 'practice',
  });

  topic1.practiceQuestions = [practiceQ1._id, practiceQ2._id] as any[];
  await topic1.save();

  // TOPIC 2: BRACHIAL PLEXUS
  const topic2 = await Topic.create({
    courseId: course._id,
    title: 'Brachial Plexus & Innervation',
    description: 'Roots, trunks, divisions, cords, and terminal branches of the brachial plexus.',
    order: 2,
    isFree: false,
    isPublished: true,
  });

  const lesson2_1 = await Lesson.create({
    topicId: topic2._id,
    courseId: course._id,
    title: 'Brachial Plexus Architecture (C5-T1)',
    order: 1,
    isPublished: true,
  });

  const sec2_1 = await Section.create({
    type: 'video',
    title: 'Brachial Plexus Architecture',
    vimeoVideoId: '76979871',
    videoStartTime: 0,
    videoEndTime: 240,
    order: 1,
    isPublished: true,
    parentId: lesson2_1._id,
    parentType: 'lesson',
  });

  const sec2_2 = await Section.create({
    type: 'question',
    title: 'Erb-Duchenne Paralysis',
    questionType: 'single-mcq',
    questionText: 'Erb-Duchenne paralysis (Waiter\'s tip hand) results from injury to which roots?',
    options: [
      { id: 'a', text: 'C5 and C6 roots (Upper Trunk)', isCorrect: true },
      { id: 'b', text: 'C8 and T1 roots (Lower Trunk)', isCorrect: false },
      { id: 'c', text: 'C7 root (Middle Trunk)', isCorrect: false },
      { id: 'd', text: 'T1 and T2 roots', isCorrect: false },
    ],
    hints: ['Upper trunk injury during birth trauma.'],
    explanation: 'Erb palsy is caused by excessive lateral traction on the head during delivery, damaging C5 and C6 nerve roots.',
    marks: 1,
    order: 2,
    isPublished: true,
    parentId: lesson2_1._id,
    parentType: 'lesson',
  });

  lesson2_1.sections = [sec2_1._id, sec2_2._id] as any[];
  await lesson2_1.save();
  topic2.lessons = [lesson2_1._id] as any[];
  await topic2.save();

  course.topics = [topic1._id, topic2._id] as any[];

  // TEST SERIES
  const test1 = await Test.create({
    courseId: course._id,
    title: 'Upper Limb Anatomy Mid-Term Exam',
    description: 'Timed assessment covering osteology, brachial plexus, and muscle nerve supply.',
    duration: 30,
    startTime: new Date(Date.now() - 86400000 * 2), // Started 2 days ago
    endTime: new Date(Date.now() + 86400000 * 7), // Valid for 7 days
    totalMarks: 10,
    passingMarks: 6,
    negativeMarkingEnabled: true,
    sections: [
      {
        name: 'Section A: Osteology & Innervation',
        questions: [sec1_3._id, sec2_2._id] as any[],
      },
    ],
    isPublished: true,
    createdBy: admin._id,
  });

  course.testSeries = [test1._id] as any[];
  await course.save();

  // SEED TEST ATTEMPT RECORD FOR STUDENT (Completed with score 10/10)
  const attempt = await TestAttempt.create({
    testId: test1._id,
    studentId: student._id,
    startedAt: new Date(Date.now() - 86400000 * 1),
    submittedAt: new Date(Date.now() - 86400000 * 1 + 1200000), // 20 mins duration
    isAutoSubmitted: false,
    answers: [
      {
        questionId: sec1_3._id,
        selectedOptions: ['a'],
        timeTaken: 45,
        isMarkedForReview: false,
      },
      {
        questionId: sec2_2._id,
        selectedOptions: ['a'],
        timeTaken: 60,
        isMarkedForReview: false,
      },
    ],
    score: 10,
    totalMarks: 10,
    percentage: 100,
    rank: 1,
    topicWiseScores: [
      {
        topicId: topic1._id,
        topicName: topic1.title,
        correct: 1,
        total: 1,
        percentage: 100,
      },
      {
        topicId: topic2._id,
        topicName: topic2.title,
        correct: 1,
        total: 1,
        percentage: 100,
      },
    ],
    status: 'submitted',
  });

  // SEED STUDENT PROGRESS RECORD (For Dashboard "Continue Learning" & Progress stats)
  await Progress.create({
    studentId: student._id,
    courseId: course._id,
    lessonsCompleted: [lesson1_1._id],
    sectionsCompleted: [sec1_1._id, sec1_2._id, sec1_3._id],
    videoProgress: [
      {
        sectionId: sec1_1._id,
        watchedSeconds: 180,
        totalSeconds: 180,
        lastPosition: 180,
      },
      {
        sectionId: sec1_4._id,
        watchedSeconds: 90,
        totalSeconds: 180,
        lastPosition: 90,
      },
    ],
    practiceAttempts: [
      {
        questionId: practiceQ1._id,
        selectedOptions: ['a'],
        isCorrect: true,
        attemptedAt: new Date(),
      },
    ],
    lastActivity: {
      type: 'lesson',
      lessonId: lesson1_2._id,
      sectionId: sec1_4._id,
      courseId: course._id,
      timestamp: new Date(),
    },
    overallPercentage: 65,
  });

  // SEED GAMIFICATION PROFILE FOR STUDENT
  await Gamification.create({
    studentId: student._id,
    xp: 450,
    level: 2,
    currentStreak: 5,
    longestStreak: 5,
    lastActiveDate: new Date(),
    badges: [
      {
        badgeId: 'welcome',
        name: 'Welcome to MARS',
        description: 'Joined the MARS anatomy learning platform',
        icon: '🚀',
        earnedAt: new Date(Date.now() - 86400000 * 5),
      },
      {
        badgeId: 'first_lesson',
        name: 'First Flame',
        description: 'Completed your first anatomy video lesson',
        icon: '🔥',
        earnedAt: new Date(Date.now() - 86400000 * 4),
      },
      {
        badgeId: 'streak_5',
        name: '5-Day Streak Star',
        description: 'Learned continuously for 5 days in a row',
        icon: '⚡',
        earnedAt: new Date(Date.now() - 86400000 * 1),
      },
      {
        badgeId: 'test_topper',
        name: 'Test Master',
        description: 'Scored 100% on a course test series exam',
        icon: '🏆',
        earnedAt: new Date(Date.now() - 86400000 * 1),
      },
    ],
    weeklyGoal: {
      target: 5,
      current: 3,
      weekStart: new Date(),
    },
  });

  console.log('[Seed] Demo personas ready (password for all: mars123):');
  console.log('  - New Student:      username=newstudent  (0 courses)');
  console.log('  - Enrolled Student: username=student     (1 course)');
  console.log('  - Admin:            username=admin');
  console.log('[Seed] Database successfully populated!');
  process.exit(0);
};

seedDatabase().catch((err) => {
  console.error('[Seed Error]', err);
  process.exit(1);
});
