import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Course } from '../models/Course';
import { Test } from '../models/Test';
import { Enrollment } from '../models/Enrollment';

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
      populate: {
        path: 'lessons',
        options: { sort: { order: 1 } },
        select: 'title order sections isPublished',
      },
    });

    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    let isEnrolled = false;
    if (req.user) {
      const enrollment = await Enrollment.findOne({
        studentId: req.user._id,
        courseId: course._id,
      });
      if (enrollment) isEnrolled = true;
    }

    let courseData: any = course.toObject();

    if (!isAdmin) {
      courseData.topics = (courseData.topics || [])
        .filter((t: any) => t.isPublished !== false)
        .map((t: any) => ({
          ...t,
          lessons: (t.lessons || []).filter((l: any) => l.isPublished !== false),
        }));
    }

    return res.json({
      success: true,
      data: {
        course: courseData,
        isEnrolled,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const createCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { title, description, thumbnail, price, isPublished } = req.body;
    const course = await Course.create({
      title,
      description,
      thumbnail,
      price: price || 0,
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
    const course = await Course.findByIdAndUpdate(id, req.body, { new: true });
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
