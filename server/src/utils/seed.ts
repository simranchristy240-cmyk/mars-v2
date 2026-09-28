import dns from 'dns';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ENV } from '../config/env';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore if cannot set servers
}
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
const DEMO_PASSWORD = 'mars123';

const seedDatabase = async () => {
  console.log('[Seed] Connecting to MongoDB...');
  await mongoose.connect(ENV.MONGODB_URI);

  console.log('[Seed] Clearing existing demo data...');
  await User.deleteMany({});
  await Course.deleteMany({});
  await Topic.deleteMany({});
  await Lesson.deleteMany({});
  await Section.deleteMany({});
  await Test.deleteMany({});
  await TestAttempt.deleteMany({});
  await Progress.deleteMany({});
  await Gamification.deleteMany({});
  await Enrollment.deleteMany({});

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  console.log('[Seed] Creating demo admin and student personas...');
  const admin = await User.create({
    firebaseUid: 'demo_admin_uid',
    username: 'admin',
    passwordHash,
    name: 'Dr. Anatomy Admin',
    email: 'admin@mars.edu',
    role: 'admin',
    referralCode: 'MARSADMIN',
    preferences: { theme: 'soft-cloud', language: 'en' },
  });

  // 1. MBBS Track Course
  console.log('[Seed] Creating MBBS course...');
  const mbbsCourse = await Course.create({
    title: 'MBBS - Medical Anatomy & Clinical Sciences',
    description: 'Comprehensive curriculum tailored for MBBS students covering gross anatomy, osteology, embryology, and neuroanatomy.',
    thumbnail: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
    price: 49900,
    currency: 'INR',
    pricing: {
      basic: { price: 49900 },   // ₹499
      plus: { price: 99900 },    // ₹999
      premium: { price: 149900 }, // ₹1,499
    },
    isPublished: true,
    createdBy: admin._id,
  });

  // 2. BDS Track Course
  console.log('[Seed] Creating BDS course...');
  const bdsCourse = await Course.create({
    title: 'BDS - Dental & Head-Neck Anatomy',
    description: 'Focused curriculum for Dental students covering head & neck anatomy, cranial nerves, TMJ, and maxillofacial structures.',
    thumbnail: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80',
    price: 44900,
    currency: 'INR',
    pricing: {
      basic: { price: 44900 },
      plus: { price: 89900 },
      premium: { price: 139900 },
    },
    isPublished: true,
    createdBy: admin._id,
  });

  // 3. Ayush Track Course
  console.log('[Seed] Creating Ayush course...');
  const ayushCourse = await Course.create({
    title: 'Ayush - Ayurvedic & Holistic Anatomy Track',
    description: 'Integrated Sharira Rachana curriculum harmonizing classical Ayurvedic concepts with modern human anatomy.',
    thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
    price: 39900,
    currency: 'INR',
    pricing: {
      basic: { price: 39900 },
      plus: { price: 79900 },
      premium: { price: 119900 },
    },
    isPublished: true,
    createdBy: admin._id,
  });

  // 4. General Track Course
  console.log('[Seed] Creating General course...');
  const generalCourse = await Course.create({
    title: 'General - Applied Human Anatomy & Allied Health',
    description: 'Foundational human anatomy for physiotherapy, nursing, pharmacy, and general biomedical sciences.',
    thumbnail: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=800&q=80',
    price: 34900,
    currency: 'INR',
    pricing: {
      basic: { price: 34900 },
      plus: { price: 69900 },
      premium: { price: 99900 },
    },
    isPublished: true,
    createdBy: admin._id,
  });

  // ================= MBBS CURRICULUM =================
  // TOPIC 1: OSTEOLOGY
  const mbbsTopic1 = await Topic.create({
    courseId: mbbsCourse._id,
    title: 'Osteology of the Upper Limb',
    description: 'Structure, landmarks, and muscle attachments of Scapula, Humerus, Radius, and Ulna.',
    order: 1,
    isFree: true,
    isPublished: true,
  });

  // Lesson 1.1: Scapula Anatomy (FREE tier)
  const mbbsLesson1_1 = await Lesson.create({
    topicId: mbbsTopic1._id,
    courseId: mbbsCourse._id,
    title: 'Scapula & Shoulder Girdle Anatomy (Free Sample)',
    order: 1,
    accessTier: 'free',
    isPublished: true,
  });

  const sec1_1 = await Section.create({
    type: 'video',
    title: 'Scapula Overview',
    vimeoVideoId: '76979871',
    videoStartTime: 0,
    videoEndTime: 180,
    order: 1,
    accessTier: 'free',
    isPublished: true,
    parentId: mbbsLesson1_1._id,
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
    accessTier: 'free',
    isPublished: true,
    parentId: mbbsLesson1_1._id,
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
    accessTier: 'free',
    isPublished: true,
    parentId: mbbsLesson1_1._id,
    parentType: 'lesson',
  });

  mbbsLesson1_1.sections = [sec1_1._id, sec1_2._id, sec1_3._id] as any[];
  await mbbsLesson1_1.save();

  // Lesson 1.2: Humerus & Arm Osteology (BASIC tier)
  const mbbsLesson1_2 = await Lesson.create({
    topicId: mbbsTopic1._id,
    courseId: mbbsCourse._id,
    title: 'Humerus Landmarks & Fractures (Basic Tier)',
    order: 2,
    accessTier: 'basic',
    isPublished: true,
  });

  const sec1_4 = await Section.create({
    type: 'video',
    title: 'Humerus Fractures',
    vimeoVideoId: '76979871',
    videoStartTime: 180,
    videoEndTime: 360,
    order: 1,
    accessTier: 'basic',
    isPublished: true,
    parentId: mbbsLesson1_2._id,
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
    accessTier: 'basic',
    isPublished: true,
    parentId: mbbsLesson1_2._id,
    parentType: 'lesson',
  });

  mbbsLesson1_2.sections = [sec1_4._id, sec1_5._id] as any[];
  await mbbsLesson1_2.save();

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
    accessTier: 'free',
    isPublished: true,
    parentId: mbbsTopic1._id,
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
    accessTier: 'free',
    isPublished: true,
    parentId: mbbsTopic1._id,
    parentType: 'practice',
  });

  const practiceQ3 = await Section.create({
    type: 'question',
    title: 'Mid-Shaft Humerus Fracture & Nerve Vulnerability',
    questionType: 'single-mcq',
    questionText: 'A mid-shaft spiral fracture of the humerus is most likely to injure which nerve, leading to wrist drop?',
    options: [
      { id: 'a', text: 'Radial Nerve in the spiral groove', isCorrect: true },
      { id: 'b', text: 'Median Nerve at the supracondylar ridge', isCorrect: false },
      { id: 'c', text: 'Ulnar Nerve behind the medial epicondyle', isCorrect: false },
      { id: 'd', text: 'Musculocutaneous Nerve piercing coracobrachialis', isCorrect: false },
    ],
    explanation: 'The radial nerve wraps around the posterior surface of the humerus in the radial (spiral) groove and is commonly injured in mid-shaft fractures, causing loss of wrist and finger extension (wrist drop).',
    order: 3,
    accessTier: 'basic',
    isPublished: true,
    parentId: mbbsTopic1._id,
    parentType: 'practice',
  });

  const practiceQ4 = await Section.create({
    type: 'question',
    title: 'Carpal Tunnel Syndrome & Thenar Wasting',
    questionType: 'single-mcq',
    questionText: 'Compression of which nerve beneath the flexor retinaculum results in carpal tunnel syndrome with thenar eminence wasting?',
    options: [
      { id: 'a', text: 'Median Nerve', isCorrect: true },
      { id: 'b', text: 'Ulnar Nerve', isCorrect: false },
      { id: 'c', text: 'Radial Nerve', isCorrect: false },
      { id: 'd', text: 'Anterior Interosseous Nerve', isCorrect: false },
    ],
    explanation: 'The median nerve passes deep to the flexor retinaculum in the carpal tunnel. Chronic compression leads to nocturnal paresthesia in the lateral 3.5 digits and atrophy of the thenar muscles.',
    order: 4,
    accessTier: 'basic',
    isPublished: true,
    parentId: mbbsTopic1._id,
    parentType: 'practice',
  });

  mbbsTopic1.lessons = [mbbsLesson1_1._id, mbbsLesson1_2._id] as any[];
  mbbsTopic1.practiceQuestions = [practiceQ1._id, practiceQ2._id, practiceQ3._id, practiceQ4._id] as any[];
  mbbsTopic1.practiceSets = [
    {
      title: 'Practice Set 1: Osteology & Joint Mechanics',
      description: 'Bony landmarks, glenohumeral stability, and tendinous insertions',
      accessTier: 'free',
      isPublished: true,
      order: 1,
      questions: [practiceQ1._id, practiceQ2._id],
    },
    {
      title: 'Practice Set 2: Peripheral Nerve Lesions & Motor Deficits',
      description: 'Fracture complications, wrist drop, and entrapment neuropathies',
      accessTier: 'basic',
      isPublished: true,
      order: 2,
      questions: [practiceQ3._id, practiceQ4._id],
    },
    {
      title: 'Practice Set 3: High-Yield Comprehensive Drill',
      description: 'All-inclusive MCQ revision covering osteology, ligaments, and nerves',
      accessTier: 'plus',
      isPublished: true,
      order: 3,
      questions: [practiceQ1._id, practiceQ2._id, practiceQ3._id, practiceQ4._id],
    },
  ] as any[];
  await mbbsTopic1.save();

  // TOPIC 2: BRACHIAL PLEXUS & CLINICAL
  const mbbsTopic2 = await Topic.create({
    courseId: mbbsCourse._id,
    title: 'Brachial Plexus & Peripheral Nerves',
    description: 'Roots, trunks, divisions, cords, and terminal branches of the brachial plexus.',
    order: 2,
    isFree: false,
    isPublished: true,
  });

  // Lesson 2.1: Brachial Plexus Architecture (PLUS tier)
  const mbbsLesson2_1 = await Lesson.create({
    topicId: mbbsTopic2._id,
    courseId: mbbsCourse._id,
    title: 'Brachial Plexus Architecture C5-T1 (Plus Tier)',
    order: 1,
    accessTier: 'plus',
    isPublished: true,
  });

  const sec2_1 = await Section.create({
    type: 'video',
    title: 'Brachial Plexus Architecture',
    vimeoVideoId: '76979871',
    videoStartTime: 0,
    videoEndTime: 240,
    order: 1,
    accessTier: 'plus',
    isPublished: true,
    parentId: mbbsLesson2_1._id,
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
    accessTier: 'plus',
    isPublished: true,
    parentId: mbbsLesson2_1._id,
    parentType: 'lesson',
  });

  mbbsLesson2_1.sections = [sec2_1._id, sec2_2._id] as any[];
  await mbbsLesson2_1.save();

  // Lesson 2.2: Advanced Surgical Approaches (PREMIUM tier)
  const mbbsLesson2_2 = await Lesson.create({
    topicId: mbbsTopic2._id,
    courseId: mbbsCourse._id,
    title: 'Advanced Surgical Plexus Decompression (Premium Tier)',
    order: 2,
    accessTier: 'premium',
    isPublished: true,
  });

  const sec2_3 = await Section.create({
    type: 'text',
    title: 'Thoracic Outlet & Supraclavicular Approaches',
    text: `
      <h3>Thoracic Outlet Syndrome & Surgical Exposures</h3>
      <p>High-yield surgical dissection notes for transaxillary and supraclavicular brachial plexus exploration.</p>
    `,
    order: 1,
    accessTier: 'premium',
    isPublished: true,
    parentId: mbbsLesson2_2._id,
    parentType: 'lesson',
  });

  mbbsLesson2_2.sections = [sec2_3._id] as any[];
  await mbbsLesson2_2.save();

  mbbsTopic2.lessons = [mbbsLesson2_1._id, mbbsLesson2_2._id] as any[];
  await mbbsTopic2.save();

  // MBBS TESTS
  const mbbsTest1 = await Test.create({
    courseId: mbbsCourse._id,
    title: 'MBBS Diagnostic Self-Assessment (Free)',
    description: 'Quick diagnostic assessment testing upper extremity osteology and joint anatomy.',
    duration: 15,
    startTime: new Date(Date.now() - 86400000 * 2),
    endTime: new Date(Date.now() + 86400000 * 30),
    totalMarks: 5,
    passingMarks: 3,
    negativeMarkingEnabled: false,
    accessTier: 'free',
    sections: [
      {
        name: 'Section A: Osteology Basics',
        questions: [sec1_3._id] as any[],
      },
    ],
    isPublished: true,
    createdBy: admin._id,
  });

  const mbbsTest2 = await Test.create({
    courseId: mbbsCourse._id,
    title: 'MBBS Mid-Term Examination (Plus & Premium)',
    description: 'High-yield exam testing deep nerve branches, fracture patterns, and plexus pathology.',
    duration: 30,
    startTime: new Date(Date.now() - 86400000 * 2),
    endTime: new Date(Date.now() + 86400000 * 30),
    totalMarks: 10,
    passingMarks: 6,
    negativeMarkingEnabled: true,
    accessTier: 'plus',
    sections: [
      {
        name: 'Section A: Clinical Cases & Anatomy',
        questions: [sec1_3._id, sec2_2._id] as any[],
      },
    ],
    isPublished: true,
    createdBy: admin._id,
  });

  mbbsCourse.topics = [mbbsTopic1._id, mbbsTopic2._id] as any[];
  mbbsCourse.testSeries = [mbbsTest1._id, mbbsTest2._id] as any[];
  await mbbsCourse.save();

  // ================= BDS CURRICULUM =================
  const bdsTopic1 = await Topic.create({
    courseId: bdsCourse._id,
    title: 'Cranial Nerves & Maxillofacial Anatomy',
    description: 'Trigeminal nerve divisions, facial nerve, and pterygopalatine fossa.',
    order: 1,
    isFree: true,
    isPublished: true,
  });

  const bdsLesson1 = await Lesson.create({
    topicId: bdsTopic1._id,
    courseId: bdsCourse._id,
    title: 'Trigeminal Nerve (V1, V2, V3) Clinical Anatomy (Free)',
    order: 1,
    accessTier: 'free',
    isPublished: true,
  });

  const bdsSec1 = await Section.create({
    type: 'text',
    title: 'Trigeminal Branches in Dentistry',
    text: `<h3>Dental Local Anaesthesia & Cranial Nerve V</h3><p>Detailed pathways of Inferior Alveolar, Lingual, and Buccal nerves.</p>`,
    order: 1,
    accessTier: 'free',
    isPublished: true,
    parentId: bdsLesson1._id,
    parentType: 'lesson',
  });

  bdsLesson1.sections = [bdsSec1._id] as any[];
  await bdsLesson1.save();
  bdsTopic1.lessons = [bdsLesson1._id] as any[];
  await bdsTopic1.save();
  bdsCourse.topics = [bdsTopic1._id] as any[];
  await bdsCourse.save();

  // ================= AYUSH CURRICULUM =================
  const ayushTopic1 = await Topic.create({
    courseId: ayushCourse._id,
    title: 'Sharira Rachana & Marma Anatomy',
    description: 'Classical Ayurvedic anatomical structures correlated with modern visceral and vascular landmarks.',
    order: 1,
    isFree: true,
    isPublished: true,
  });

  const ayushLesson1 = await Lesson.create({
    topicId: ayushTopic1._id,
    courseId: ayushCourse._id,
    title: 'Foundations of Sharira Rachana (Free)',
    order: 1,
    accessTier: 'free',
    isPublished: true,
  });

  const ayushSec1 = await Section.create({
    type: 'text',
    title: 'Principles of Rachana Sharira',
    text: `<h3>Sharira Rachana Overview</h3><p>Study of Srotas, Marmas, and Dosha-Dhatu-Mala structural framework.</p>`,
    order: 1,
    accessTier: 'free',
    isPublished: true,
    parentId: ayushLesson1._id,
    parentType: 'lesson',
  });

  ayushLesson1.sections = [ayushSec1._id] as any[];
  await ayushLesson1.save();
  ayushTopic1.lessons = [ayushLesson1._id] as any[];
  await ayushTopic1.save();
  ayushCourse.topics = [ayushTopic1._id] as any[];
  await ayushCourse.save();

  // ================= GENERAL CURRICULUM =================
  const generalTopic1 = await Topic.create({
    courseId: generalCourse._id,
    title: 'Foundations of Human Biological Architecture',
    description: 'Overview of musculoskeletal and systemic anatomy.',
    order: 1,
    isFree: true,
    isPublished: true,
  });

  const generalLesson1 = await Lesson.create({
    topicId: generalTopic1._id,
    courseId: generalCourse._id,
    title: 'Introduction to Body Systems (Free)',
    order: 1,
    accessTier: 'free',
    isPublished: true,
  });

  const genSec1 = await Section.create({
    type: 'text',
    title: 'Body Planes and Anatomical Direction',
    text: `<h3>Anatomical Positions & Terminology</h3><p>Sagittal, coronal, axial planes and positional terms.</p>`,
    order: 1,
    accessTier: 'free',
    isPublished: true,
    parentId: generalLesson1._id,
    parentType: 'lesson',
  });

  generalLesson1.sections = [genSec1._id] as any[];
  await generalLesson1.save();
  generalTopic1.lessons = [generalLesson1._id] as any[];
  await generalTopic1.save();
  generalCourse.topics = [generalTopic1._id] as any[];
  await generalCourse.save();

  // ================= DEMO STUDENT PERSONAS =================
  // Persona 1: New Student (NO selected course yet — triggers Onboarding modal!)
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

  // Persona 2: Active Student (Selected MBBS, but NO paid purchase yet — can change track!)
  const student = await User.create({
    firebaseUid: 'demo_student_uid',
    username: 'student',
    passwordHash,
    name: 'Serik Anatomy Student',
    email: 'student@mars.edu',
    phone: '+919876543210',
    role: 'student',
    selectedCourseId: mbbsCourse._id,
    referralCode: 'STUDENT1',
    preferences: { theme: 'soft-cloud', language: 'en' },
  });

  // Persona 3: Paid Student (Enrolled in MBBS with BASIC tier — locked track & can upgrade to Plus/Premium!)
  const paidStudent = await User.create({
    firebaseUid: 'demo_student_paid_uid',
    username: 'paidstudent',
    passwordHash,
    name: 'Priya Enrolled Doctor',
    email: 'paidstudent@mars.edu',
    phone: '+919876543211',
    role: 'student',
    selectedCourseId: mbbsCourse._id,
    referralCode: 'PAIDSTUDENT',
    preferences: { theme: 'soft-cloud', language: 'en' },
  });

  await Enrollment.create({
    studentId: paidStudent._id,
    courseId: mbbsCourse._id,
    accessType: 'paid',
    tier: 'basic',
    enrolledAt: new Date(Date.now() - 86400000 * 3),
  });

  // Test Attempt for student
  await TestAttempt.create({
    testId: mbbsTest1._id,
    studentId: student._id,
    startedAt: new Date(Date.now() - 86400000 * 1),
    submittedAt: new Date(Date.now() - 86400000 * 1 + 600000),
    isAutoSubmitted: false,
    answers: [
      {
        questionId: sec1_3._id,
        selectedOptions: ['a'],
        timeTaken: 45,
        isMarkedForReview: false,
      },
    ],
    score: 5,
    totalMarks: 5,
    percentage: 100,
    rank: 1,
    topicWiseScores: [
      {
        topicId: mbbsTopic1._id,
        topicName: mbbsTopic1.title,
        correct: 1,
        total: 1,
        percentage: 100,
      },
    ],
    status: 'submitted',
  });

  // Progress for student
  await Progress.create({
    studentId: student._id,
    courseId: mbbsCourse._id,
    lessonsCompleted: [mbbsLesson1_1._id],
    sectionsCompleted: [sec1_1._id, sec1_2._id, sec1_3._id],
    videoProgress: [
      {
        sectionId: sec1_1._id,
        watchedSeconds: 180,
        totalSeconds: 180,
        lastPosition: 180,
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
      lessonId: mbbsLesson1_1._id,
      sectionId: sec1_1._id,
      courseId: mbbsCourse._id,
      timestamp: new Date(),
    },
    overallPercentage: 35,
  });

  // Gamification for student
  await Gamification.create({
    studentId: student._id,
    xp: 250,
    level: 2,
    currentStreak: 4,
    longestStreak: 4,
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
    ],
    weeklyGoal: { target: 5, current: 2, weekStart: new Date() },
  });

  console.log('[Seed] Demo personas ready (password for all: mars123):');
  console.log('  - New Student:       username=newstudent   (NO course selected -> triggers Goal Modal)');
  console.log('  - Active Student:    username=student      (Selected MBBS, Free tier -> Can change track)');
  console.log('  - Paid Student:      username=paidstudent  (Enrolled in MBBS Basic -> Locked track, Can upgrade)');
  console.log('  - Admin:             username=admin        (Full course & tier management)');
  console.log('[Seed] Database successfully populated!');
  process.exit(0);
};

seedDatabase().catch((err) => {
  console.error('[Seed Error]', err);
  process.exit(1);
});
