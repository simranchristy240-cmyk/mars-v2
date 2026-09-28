import { Router } from 'express';
import { loginWithPassword, syncUser, getProfile, updateProfile, selectCourse } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', loginWithPassword);
router.post('/sync', authenticate, syncUser);
router.get('/me', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/select-course', authenticate, selectCourse);

export default router;
