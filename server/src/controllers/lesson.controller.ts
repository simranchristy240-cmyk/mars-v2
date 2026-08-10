import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Topic } from '../models/Topic';
import { Lesson } from '../models/Lesson';
import { Section } from '../models/Section';
import { Course } from '../models/Course';
import { Enrollment } from '../models/Enrollment';
import { Test } from '../models/Test';

export const createTopic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId, title, description, order, isFree, isPublished } = req.body;
    const topic = await Topic.create({
      courseId,
      title,
      description,
      order: order || 1,
      isFree: isFree || false,
      isPublished: isPublished !== undefined ? isPublished : true,
    });

    await Course.findByIdAndUpdate(courseId, { $push: { topics: topic._id } });

    return res.status(201).json({ success: true, data: topic });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const updateTopic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const topic = await Topic.findByIdAndUpdate(id, req.body, { new: true });
    if (!topic) return res.status(404).json({ success: false, error: 'Topic not found' });
    return res.json({ success: true, data: topic });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteTopic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const topic = await Topic.findById(id);
    if (!topic) return res.status(404).json({ success: false, error: 'Topic not found' });

    const lessons = await Lesson.find({ topicId: id });
    const lessonIds = lessons.map((l) => l._id);
    const lessonSectionIds = lessons.flatMap((l) => l.sections || []);

    await Section.deleteMany({ _id: { $in: [...lessonSectionIds, ...(topic.practiceQuestions || [])] } });
    await Lesson.deleteMany({ _id: { $in: lessonIds } });
    await Course.findByIdAndUpdate(topic.courseId, { $pull: { topics: topic._id } });
    await Topic.findByIdAndDelete(id);

    return res.json({ success: true, message: 'Topic deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const createLesson = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { topicId, courseId, title, order, isPublished } = req.body;
    const lesson = await Lesson.create({
      topicId,
      courseId,
      title,
      order: order || 1,
      isPublished: isPublished !== undefined ? isPublished : true,
    });

    await Topic.findByIdAndUpdate(topicId, { $push: { lessons: lesson._id } });

    return res.status(201).json({ success: true, data: lesson });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const updateLesson = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findByIdAndUpdate(id, req.body, { new: true });
    if (!lesson) return res.status(404).json({ success: false, error: 'Lesson not found' });
    return res.json({ success: true, data: lesson });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteLesson = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findById(id);
    if (!lesson) return res.status(404).json({ success: false, error: 'Lesson not found' });

    await Section.deleteMany({ _id: { $in: lesson.sections || [] } });
    await Topic.findByIdAndUpdate(lesson.topicId, { $pull: { lessons: lesson._id } });
    await Lesson.findByIdAndDelete(id);

    return res.json({ success: true, message: 'Lesson deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getLesson = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findById(id).populate({
      path: 'sections',
      options: { sort: { order: 1 } },
    });

    if (!lesson) {
      return res.status(404).json({ success: false, error: 'Lesson not found' });
    }

    const topic = await Topic.findById(lesson.topicId);
    if (!topic) return res.status(404).json({ success: false, error: 'Topic not found' });

    const isAdmin = req.user?.role === 'admin';

    if (!isAdmin) {
      if (!topic.isPublished || !lesson.isPublished) {
        return res.status(404).json({ success: false, error: 'Lesson not found' });
      }

      if (!topic.isFree) {
        const enrollment = await Enrollment.findOne({
          studentId: req.user?._id,
          courseId: lesson.courseId,
        });

        if (!enrollment) {
          return res.status(403).json({
            success: false,
            error: 'Topic locked. Purchase full course to access.',
            isLocked: true,
          });
        }
      }

      const lessonObj = lesson.toObject() as any;
      lessonObj.sections = (lessonObj.sections || []).filter(
        (s: any) => s.isPublished !== false
      );
      return res.json({ success: true, data: lessonObj });
    }

    return res.json({ success: true, data: lesson });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const createSection = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sectionData = {
      ...req.body,
      isPublished: req.body.isPublished !== undefined ? req.body.isPublished : true,
    };
    const section = await Section.create(sectionData);

    if (sectionData.parentType === 'lesson') {
      await Lesson.findByIdAndUpdate(sectionData.parentId, {
        $push: { sections: section._id },
      });
    } else if (sectionData.parentType === 'practice') {
      await Topic.findByIdAndUpdate(sectionData.parentId, {
        $push: { practiceQuestions: section._id },
      });
    } else if (sectionData.parentType === 'test') {
      const test = await Test.findById(sectionData.parentId);
      if (test) {
        if (!test.sections.length) {
          test.sections.push({ name: 'Section A', questions: [section._id] as any });
        } else {
          test.sections[0].questions.push(section._id as any);
        }
        await test.save();
      }
    }

    return res.status(201).json({ success: true, data: section });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const updateSection = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const section = await Section.findByIdAndUpdate(id, req.body, { new: true });
    if (!section) return res.status(404).json({ success: false, error: 'Section not found' });
    return res.json({ success: true, data: section });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteSection = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const fromTest = req.query.fromTest === 'true';
    const section = await Section.findById(id);
    if (!section) return res.status(404).json({ success: false, error: 'Section not found' });

    // Removing a shared (lesson/practice) question from a test: unlink only
    if (fromTest && section.parentType !== 'test') {
      await Test.updateMany(
        { 'sections.questions': section._id },
        { $pull: { 'sections.$[].questions': section._id } }
      );
      return res.json({ success: true, message: 'Section unlinked from test' });
    }

    if (section.parentType === 'lesson') {
      await Lesson.findByIdAndUpdate(section.parentId, { $pull: { sections: section._id } });
    } else if (section.parentType === 'practice') {
      await Topic.findByIdAndUpdate(section.parentId, {
        $pull: { practiceQuestions: section._id },
      });
    }

    // Unlink from any tests that reference this section
    await Test.updateMany(
      { 'sections.questions': section._id },
      { $pull: { 'sections.$[].questions': section._id } }
    );

    await Section.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Section deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
