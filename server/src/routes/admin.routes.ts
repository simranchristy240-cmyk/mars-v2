import { Router } from 'express';
import { getAdminDashboardStats, getStudentsList } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.get('/dashboard', authenticate, requireRole('admin'), getAdminDashboardStats);
router.get('/students', authenticate, requireRole('admin'), getStudentsList);

export default router;
