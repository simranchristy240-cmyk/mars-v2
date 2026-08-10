import { Router } from 'express';
import { getPracticeQuestions, submitPracticeAnswer } from '../controllers/practice.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/topic/:topicId', authenticate, getPracticeQuestions);
router.post('/submit', authenticate, submitPracticeAnswer);

export default router;
