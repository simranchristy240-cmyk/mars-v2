import { Router } from 'express';
import {
  getCourseProgress,
  updateVideoProgress,
  completeSection,
  getContinueLearning,
} from '../controllers/progress.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/continue', authenticate, getContinueLearning);
router.get('/:courseId', authenticate, getCourseProgress);
router.put('/video', authenticate, updateVideoProgress);
router.put('/section', authenticate, completeSection);

export default router;
