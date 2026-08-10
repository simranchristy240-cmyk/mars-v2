import { Router } from 'express';
import { createOrder, verifyPayment, validateCoupon } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/create-order', authenticate, createOrder);
router.post('/verify', authenticate, verifyPayment);
router.post('/apply-coupon', authenticate, validateCoupon);

export default router;
