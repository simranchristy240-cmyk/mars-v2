import { Router } from 'express';
import {
  createTopic,
  updateTopic,
  deleteTopic,
  reorderTopics,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  moveLessonToTopic,
  getLesson,
  createSection,
  updateSection,
  deleteSection,
  uploadLessonNotes,
  deleteLessonNotes,
  streamLessonNotes,
} from '../controllers/lesson.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { uploadNotesPdf } from '../middleware/upload.middleware';

const router = Router();

router.post('/topics/reorder', authenticate, requireRole('admin'), reorderTopics);
router.post('/topics', authenticate, requireRole('admin'), createTopic);
router.put('/topics/:id', authenticate, requireRole('admin'), updateTopic);
router.delete('/topics/:id', authenticate, requireRole('admin'), deleteTopic);

router.post('/lessons/reorder', authenticate, requireRole('admin'), reorderLessons);
router.post('/lessons/:id/move', authenticate, requireRole('admin'), moveLessonToTopic);
router.post('/lessons', authenticate, requireRole('admin'), createLesson);
router.put('/lessons/:id', authenticate, requireRole('admin'), updateLesson);
router.delete('/lessons/:id', authenticate, requireRole('admin'), deleteLesson);
router.get('/lessons/:id', authenticate, getLesson);

// Lesson Notes (PDF) routes
router.post(
  '/lessons/:id/notes',
  authenticate,
  requireRole('admin'),
  uploadNotesPdf.single('notes'),
  uploadLessonNotes
);
router.delete('/lessons/:id/notes', authenticate, requireRole('admin'), deleteLessonNotes);
router.get('/lessons/:id/notes', authenticate, streamLessonNotes);

router.post('/sections', authenticate, requireRole('admin'), createSection);
router.put('/sections/:id', authenticate, requireRole('admin'), updateSection);
router.delete('/sections/:id', authenticate, requireRole('admin'), deleteSection);

export default router;
