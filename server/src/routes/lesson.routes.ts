import { Router } from 'express';
import {
  createTopic,
  updateTopic,
  deleteTopic,
  createLesson,
  updateLesson,
  deleteLesson,
  getLesson,
  createSection,
  updateSection,
  deleteSection,
} from '../controllers/lesson.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.post('/topics', authenticate, requireRole('admin'), createTopic);
router.put('/topics/:id', authenticate, requireRole('admin'), updateTopic);
router.delete('/topics/:id', authenticate, requireRole('admin'), deleteTopic);
router.post('/lessons', authenticate, requireRole('admin'), createLesson);
router.put('/lessons/:id', authenticate, requireRole('admin'), updateLesson);
router.delete('/lessons/:id', authenticate, requireRole('admin'), deleteLesson);
router.get('/lessons/:id', authenticate, getLesson);
router.post('/sections', authenticate, requireRole('admin'), createSection);
router.put('/sections/:id', authenticate, requireRole('admin'), updateSection);
router.delete('/sections/:id', authenticate, requireRole('admin'), deleteSection);

export default router;
