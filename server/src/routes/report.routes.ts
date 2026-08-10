import { Router } from 'express';
import { getStudentReportsOverview } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/overview', authenticate, getStudentReportsOverview);

export default router;
