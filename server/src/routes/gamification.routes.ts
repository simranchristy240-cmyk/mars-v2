import { Router } from 'express';
import { getGamificationStats, getLeaderboard } from '../controllers/gamification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/stats', authenticate, getGamificationStats);
router.get('/leaderboard', authenticate, getLeaderboard);

export default router;
