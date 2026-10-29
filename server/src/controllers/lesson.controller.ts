import { studentQuestion, questionValidationError } from '@mars/shared';
import path from 'path';
import fs from 'fs';
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Topic } from '../models/Topic';
import { Lesson } from '../models/Lesson';
import { Section } from '../models/Section';
import { Course } from '../models/Course';
import { Enrollment } from '../models/Enrollment';
import { Test } from '../models/Test';
import { canAccessTier, getStudentCourseTier } from '../utils/tierAccess';
import { NOTES_UPLOAD_DIR } from '../middleware/upload.middleware';

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

export const reorderTopics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { topicIds, courseId } = req.body;
    if (!Array.isArray(topicIds)) {
      return res.status(400).json({ success: false, error: 'topicIds array is required' });
    }
    await Promise.all(
      topicIds.map((id: string, index: number) =>
        Topic.findByIdAndUpdate(id, { order: index + 1 })
      )
    );
    if (courseId) {
      await Course.findByIdAndUpdate(courseId, { topics: topicIds });
    }
    return res.json({ success: true, message: 'Topics reordered successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const createLesson = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { topicId, courseId, title, order, accessTier, isPublished } = req.body;
    const lesson = await Lesson.create({
      topicId,
      courseId,
      title,
      order: order || 1,
      accessTier: accessTier || 'free',
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

    if (lesson.notesFile?.filename) {
      const oldPath = path.join(NOTES_UPLOAD_DIR, lesson.notesFile.filename);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {
          /* ignore */
        }
      }
    }

    await Section.deleteMany({ _id: { $in: lesson.sections || [] } });
    await Topic.findByIdAndUpdate(lesson.topicId, { $pull: { lessons: lesson._id } });
    await Lesson.findByIdAndDelete(id);

    return res.json({ success: true, message: 'Lesson deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const reorderLessons = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { topicId, lessonIds } = req.body;
    if (!Array.isArray(lessonIds)) {
      return res.status(400).json({ success: false, error: 'lessonIds array is required' });
    }
    await Promise.all(
      lessonIds.map((id: string, index: number) =>
        Lesson.findByIdAndUpdate(id, { order: index + 1 })
      )
    );
    if (topicId) {
      await Topic.findByIdAndUpdate(topicId, { lessons: lessonIds });
    }
    return res.json({ success: true, message: 'Lessons reordered successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const moveLessonToTopic = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { targetTopicId, newOrder } = req.body;
    if (!targetTopicId) {
      return res.status(400).json({ success: false, error: 'targetTopicId is required' });
    }
    const lesson = await Lesson.findById(id);
    if (!lesson) return res.status(404).json({ success: false, error: 'Lesson not found' });
    const oldTopicId = lesson.topicId;

    if (String(oldTopicId) !== String(targetTopicId)) {
      await Topic.findByIdAndUpdate(oldTopicId, { $pull: { lessons: lesson._id } });
      await Topic.findByIdAndUpdate(targetTopicId, { $push: { lessons: lesson._id } });
    }

    const order = typeof newOrder === 'number' ? newOrder : 999;
    lesson.topicId = targetTopicId as any;
    lesson.order = order;
    await lesson.save();

    return res.json({ success: true, message: 'Lesson moved successfully', data: lesson });
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

      const studentTier = await getStudentCourseTier(req.user?._id, lesson.courseId);
      const requiredTier = lesson.accessTier || (topic.isFree ? 'free' : 'basic');

      if (!canAccessTier(studentTier, requiredTier)) {
        return res.status(403).json({
          success: false,
          error: `This lesson is available on the ${requiredTier.toUpperCase()} plan. Upgrade your plan to access this content.`,
          isLocked: true,
          requiredTier,
          studentTier,
        });
      }

      const lessonObj = lesson.toObject() as any;
      lessonObj.sections = (lessonObj.sections || []).filter(
        (s: any) => s.isPublished !== false && canAccessTier(studentTier, s.accessTier || 'free')
      );
      lessonObj.sections = lessonObj.sections.map((section: any) => section.type === 'question' ? studentQuestion(section) : section);
      lessonObj.studentTier = studentTier;
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
      accessTier: req.body.accessTier || 'free',
      isPublished: req.body.isPublished !== undefined ? req.body.isPublished : true,
    };
    if (sectionData.type === 'question' && sectionData.isPublished) {
      const error = questionValidationError(sectionData);
      if (error) return res.status(400).json({ success: false, error });
    }
    if (sectionData.parentType === 'practice' && sectionData.practiceSetId) {
      const topic = await Topic.findOne({ _id: sectionData.parentId, 'practiceSets._id': sectionData.practiceSetId });
      if (!topic) return res.status(404).json({ success: false, error: 'Practice set not found' });
    }
    const section = await Section.create(sectionData);

    if (sectionData.parentType === 'lesson') {
      await Lesson.findByIdAndUpdate(sectionData.parentId, {
        $push: { sections: section._id },
      });
    } else if (sectionData.parentType === 'practice' && sectionData.practiceSetId) {
      await Topic.updateOne({ _id: sectionData.parentId, 'practiceSets._id': sectionData.practiceSetId }, { $push: { 'practiceSets.$.questions': section._id } });
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
    const existing = await Section.findById(id);
    if (!existing) return res.status(404).json({ success: false, error: 'Section not found' });
    const next = { ...existing.toObject(), ...req.body };
    if (next.type === 'question' && next.isPublished) {
      const error = questionValidationError(next);
      if (error) return res.status(400).json({ success: false, error });
    }
    const section = await Section.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
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

    // Unlink only from the selected test; preserve every other use of the question.
    if (fromTest) {
      if (!req.query.testId) return res.status(400).json({ success: false, error: 'Specify the test to remove this question from.' });
      await Test.updateOne(
        { _id: req.query.testId, 'sections.questions': section._id },
        { $pull: { 'sections.$[].questions': section._id } }
      );
      if (section.parentType === 'test' && !await Test.exists({ 'sections.questions': section._id })) await Section.findByIdAndDelete(id);
      return res.json({ success: true, message: 'Section unlinked from test' });
    }

    if (section.parentType === 'lesson') {
      await Lesson.findByIdAndUpdate(section.parentId, { $pull: { sections: section._id } });
    } else if (section.parentType === 'practice') {
      await Topic.findByIdAndUpdate(section.parentId, {
        $pull: { practiceQuestions: section._id, 'practiceSets.$[].questions': section._id },
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

export const uploadLessonNotes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No PDF file uploaded' });
    }

    const lesson = await Lesson.findById(id);
    if (!lesson) {
      if (fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch (e) {
          /* ignore */
        }
      }
      return res.status(404).json({ success: false, error: 'Lesson not found' });
    }

    // Clean up previous notes file if exists
    if (lesson.notesFile?.filename) {
      const oldPath = path.join(NOTES_UPLOAD_DIR, lesson.notesFile.filename);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {
          /* ignore */
        }
      }
    }

    lesson.notesFile = {
      filename: file.filename,
      originalName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date(),
    };

    await lesson.save();

    return res.json({
      success: true,
      message: 'Lesson notes uploaded successfully',
      data: lesson,
    });
  } catch (err: any) {
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        /* ignore */
      }
    }
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteLessonNotes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findById(id);
    if (!lesson) return res.status(404).json({ success: false, error: 'Lesson not found' });

    if (lesson.notesFile?.filename) {
      const filePath = path.join(NOTES_UPLOAD_DIR, lesson.notesFile.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          /* ignore */
        }
      }
      lesson.notesFile = undefined;
      await lesson.save();
    }

    return res.json({ success: true, message: 'Lesson notes deleted successfully', data: lesson });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const streamLessonNotes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findById(id);
    if (!lesson) return res.status(404).json({ success: false, error: 'Lesson not found' });

    if (!lesson.notesFile?.filename) {
      return res.status(404).json({ success: false, error: 'No notes uploaded for this lesson' });
    }

    const filePath = path.join(NOTES_UPLOAD_DIR, lesson.notesFile.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Notes file not found on disk' });
    }

    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin) {
      const topic = await Topic.findById(lesson.topicId);
      if (!topic || !topic.isPublished || !lesson.isPublished) {
        return res.status(404).json({ success: false, error: 'Lesson not found' });
      }

      const studentTier = await getStudentCourseTier(req.user?._id, lesson.courseId);
      const requiredTier = lesson.accessTier || (topic.isFree ? 'free' : 'basic');
      if (!canAccessTier(studentTier, requiredTier)) {
        return res.status(403).json({
          success: false,
          error: `Notes are restricted to ${requiredTier.toUpperCase()} plan students.`,
        });
      }
    }

    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Length': stat.size,
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store, max-age=0',
    });

    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
