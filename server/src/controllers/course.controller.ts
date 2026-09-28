import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Course } from '../models/Course';
import { Test } from '../models/Test';
import { Enrollment } from '../models/Enrollment';
import { canAccessTier, getStudentCourseTier } from '../utils/tierAccess';

export const getCourses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const courses = await Course.find({ isPublished: true }).populate({
      path: 'topics',
      select: 'title description isFree order isPublished',
      match: { isPublished: { $ne: false } },
    });

    let enrolledIds = new Set<string>();
    if (req.user) {
      const enrollments = await Enrollment.find({ studentId: req.user._id }).select('courseId');
      enrolledIds = new Set(enrollments.map((e) => e.courseId.toString()));
    }

    const data = courses.map((course) => {
      const obj = course.toObject() as any;
      obj.isEnrolled = enrolledIds.has(course._id.toString());
      return obj;
    });

    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getAdminCourses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const courses = await Course.find().populate({
      path: 'topics',
      select: 'title description isFree order isPublished',
    });
    return res.json({ success: true, data: courses });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getAdminCourseDetail = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id)
      .populate({
        path: 'topics',
        options: { sort: { order: 1 } },
        populate: [
          {
            path: 'lessons',
            options: { sort: { order: 1 } },
            populate: {
              path: 'sections',
              options: { sort: { order: 1 } },
            },
          },
          {
            path: 'practiceQuestions',
            options: { sort: { order: 1 } },
          },
          {
            path: 'practiceSets.questions',
          },
        ],
      })
      .populate({
        path: 'testSeries',
        populate: {
          path: 'sections.questions',
        },
      });

    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    // Also include tests by courseId that may not be in testSeries
    const tests = await Test.find({ courseId: id })
      .sort({ createdAt: 1 })
      .populate({ path: 'sections.questions' });

    const courseObj = course.toObject() as any;
    courseObj.tests = tests;

    return res.json({ success: true, data: { course: courseObj } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getCourseDetail = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.role === 'admin';

    const course = await Course.findById(id).populate({
      path: 'topics',
      options: { sort: { order: 1 } },
      populate: [
        {
          path: 'lessons',
          options: { sort: { order: 1 } },
          select: 'title order sections accessTier isPublished',
        },
        {
          path: 'practiceQuestions',
          options: { sort: { order: 1 } },
          select: 'type title questionType marks accessTier isPublished order',
        },
        {
          path: 'practiceSets.questions',
          select: 'type title questionType marks accessTier isPublished order',
        },
      ],
    }).populate({
      path: 'testSeries',
      select: 'title description duration totalMarks accessTier isPublished',
    });

    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    const studentTier = req.user
      ? await getStudentCourseTier(req.user._id, course._id)
      : 'free';

    const paidEnrollment = req.user
      ? await Enrollment.findOne({ studentId: req.user._id, accessType: 'paid' })
      : null;

    const isCourseLocked = !!paidEnrollment;
    const isEnrolled = studentTier !== 'free';

    let courseData: any = course.toObject();

    // Attach tests
    const tests = await Test.find({ courseId: id, ...(isAdmin ? {} : { isPublished: true }) })
      .select('title description duration totalMarks accessTier isPublished')
      .sort({ createdAt: 1 });

    courseData.tests = tests.map((t: any) => {
      const tObj = t.toObject ? t.toObject() : t;
      tObj.isLocked = !isAdmin && !canAccessTier(studentTier, tObj.accessTier || 'free');
      return tObj;
    });

    const formatTopics = (rawTopics: any[]) => {
      return (rawTopics || [])
        .filter((t: any) => isAdmin || t.isPublished !== false)
        .map((t: any) => {
          const lessons = (t.lessons || [])
            .filter((l: any) => isAdmin || l.isPublished !== false)
            .map((l: any) => ({
              ...l,
              isLocked: !isAdmin && !canAccessTier(studentTier, l.accessTier || 'free'),
            }));

          const practiceQuestions = (t.practiceQuestions || [])
            .filter((p: any) => isAdmin || p.isPublished !== false)
            .map((p: any) => ({
              ...p,
              isLocked: !isAdmin && !canAccessTier(studentTier, p.accessTier || 'free'),
            }));

          // Process explicit practiceSets
          const rawSets = (t.practiceSets || [])
            .filter((ps: any) => isAdmin || ps.isPublished !== false)
            .map((ps: any) => {
              const psObj = ps.toObject ? ps.toObject() : { ...ps };
              const setQuestions = (psObj.questions || [])
                .filter((q: any) => isAdmin || q.isPublished !== false)
                .map((q: any) => ({
                  ...q,
                  isLocked: !isAdmin && !canAccessTier(studentTier, q.accessTier || psObj.accessTier || 'free'),
                }));
              return {
                ...psObj,
                isLocked: !isAdmin && !canAccessTier(studentTier, psObj.accessTier || (t.isFree ? 'free' : 'basic')),
                questions: setQuestions,
              };
            });

          // If no practiceSets defined, but legacy practiceQuestions exist, wrap into a default practiceSet
          if (rawSets.length === 0 && practiceQuestions.length > 0) {
            rawSets.push({
              _id: 'default',
              title: 'Practice Question Bank',
              description: 'Topic interactive question bank',
              accessTier: t.isFree ? 'free' : 'basic',
              isLocked: practiceQuestions.some((q: any) => q.isLocked),
              order: 1,
              questions: practiceQuestions,
            });
          }

          return {
            ...t,
            lessons,
            practiceQuestions,
            practiceSets: rawSets,
          };
        });
    };

    courseData.topics = formatTopics(courseData.topics);

    return res.json({
      success: true,
      data: {
        course: courseData,
        isEnrolled,
        studentTier,
        isCourseLocked,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getMyCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    let courseId = req.user.selectedCourseId;

    // If not selected, check if enrolled in any course
    if (!courseId) {
      const enrollment = await Enrollment.findOne({ studentId: req.user._id });
      if (enrollment) {
        courseId = enrollment.courseId as any;
        req.user.selectedCourseId = courseId;
        await req.user.save();
      }
    }

    if (!courseId) {
      return res.json({ success: true, data: null });
    }

    // Reuse getCourseDetail logic
    req.params.id = courseId.toString();
    return getCourseDetail(req, res);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const createCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { title, description, thumbnail, price, pricing, isPublished } = req.body;
    const defaultPricing = pricing || {
      basic: { price: price || 49900 },
      plus: { price: price ? price * 2 : 99900 },
      premium: { price: price ? price * 3 : 149900 },
    };
    const basePrice = defaultPricing.basic?.price ?? (price || 49900);

    const course = await Course.create({
      title,
      description,
      thumbnail,
      price: basePrice,
      pricing: defaultPricing,
      isPublished: isPublished || false,
      createdBy: req.user._id,
    });

    return res.status(201).json({ success: true, data: course });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const updateCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.pricing?.basic?.price) {
      updateData.price = updateData.pricing.basic.price;
    }

    const course = await Course.findByIdAndUpdate(id, updateData, { new: true });
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });
    return res.json({ success: true, data: course });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await Course.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Course deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
