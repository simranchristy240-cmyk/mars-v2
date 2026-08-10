import { Router } from 'express';
import {
  getCourses,
  getAdminCourses,
  getAdminCourseDetail,
  getCourseDetail,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../controllers/course.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.get('/', optionalAuth, getCourses);
router.get('/admin', authenticate, requireRole('admin'), getAdminCourses);
router.get('/admin/:id', authenticate, requireRole('admin'), getAdminCourseDetail);
router.get('/:id', optionalAuth, getCourseDetail);
router.post('/', authenticate, requireRole('admin'), createCourse);
router.put('/:id', authenticate, requireRole('admin'), updateCourse);
router.delete('/:id', authenticate, requireRole('admin'), deleteCourse);

export default router;
