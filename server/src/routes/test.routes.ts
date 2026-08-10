import { Router } from 'express';
import {
  createTest,
  updateTest,
  deleteTest,
  getCourseTests,
  startTest,
  saveAnswer,
  submitTest,
  getTestReport,
} from '../controllers/test.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.post('/', authenticate, requireRole('admin'), createTest);
router.put('/:id', authenticate, requireRole('admin'), updateTest);
router.delete('/:id', authenticate, requireRole('admin'), deleteTest);
router.get('/course/:courseId', authenticate, getCourseTests);
router.post('/:id/start', authenticate, startTest);
router.put('/:id/answer', authenticate, saveAnswer);
router.post('/:id/submit', authenticate, submitTest);
router.get('/:id/report', authenticate, getTestReport);

export default router;
