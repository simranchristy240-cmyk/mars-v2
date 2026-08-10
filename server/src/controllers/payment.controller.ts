import { Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Course } from '../models/Course';
import { Payment } from '../models/Payment';
import { Enrollment } from '../models/Enrollment';
import { Coupon } from '../models/Coupon';
import { ENV } from '../config/env';

const razorpay = new Razorpay({
  key_id: ENV.RAZORPAY_KEY_ID,
  key_secret: ENV.RAZORPAY_KEY_SECRET,
});

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId, couponCode } = req.body;
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

    let finalAmount = course.price;
    let couponObj = null;
    let discountAmount = 0;

    if (couponCode) {
      couponObj = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        validUntil: { $gte: new Date() },
      });

      if (couponObj && couponObj.currentUses < couponObj.maxUses) {
        if (couponObj.type === 'percentage') {
          discountAmount = Math.round((course.price * couponObj.value) / 100);
        } else {
          discountAmount = couponObj.value;
        }
        finalAmount = Math.max(0, course.price - discountAmount);
      }
    }

    // If final amount is 0 (100% discount / free course), enroll directly
    if (finalAmount === 0) {
      const enrollment = await Enrollment.create({
        studentId: req.user._id,
        courseId: course._id,
        accessType: 'paid',
      });

      if (couponObj) {
        couponObj.currentUses += 1;
        await couponObj.save();
      }

      return res.json({
        success: true,
        data: { isFree: true, enrollment },
      });
    }

    // Create Razorpay order (or mock order if test key)
    let razorpayOrderId = 'order_mock_' + Math.random().toString(36).substring(2, 12);
    try {
      if (ENV.RAZORPAY_KEY_ID && !ENV.RAZORPAY_KEY_ID.startsWith('rzp_test_mock')) {
        const orderOptions = {
          amount: finalAmount, // Amount in paisa
          currency: course.currency || 'INR',
          receipt: `rcpt_${Date.now()}`,
        };
        const order = await razorpay.orders.create(orderOptions);
        razorpayOrderId = order.id;
      }
    } catch (rzpErr) {
      console.warn('[Razorpay] Using fallback order ID due to API notice:', rzpErr);
    }

    const payment = await Payment.create({
      studentId: req.user._id,
      courseId: course._id,
      amount: finalAmount,
      currency: course.currency || 'INR',
      razorpayOrderId,
      couponId: couponObj?._id,
      discountAmount,
      status: 'created',
    });

    return res.json({
      success: true,
      data: {
        orderId: razorpayOrderId,
        amount: finalAmount,
        currency: course.currency || 'INR',
        keyId: ENV.RAZORPAY_KEY_ID,
        paymentId: payment._id,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const verifyPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } = req.body;
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ success: false, error: 'Payment record not found' });

    let isValid = true;
    if (ENV.RAZORPAY_KEY_SECRET && !ENV.RAZORPAY_KEY_ID.startsWith('rzp_test_mock')) {
      const body = razorpayOrderId + '|' + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', ENV.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');
      isValid = expectedSignature === razorpaySignature;
    }

    if (!isValid) {
      payment.status = 'failed';
      await payment.save();
      return res.status(400).json({ success: false, error: 'Payment signature verification failed' });
    }

    payment.razorpayPaymentId = razorpayPaymentId || 'pay_mock_' + Date.now();
    payment.razorpaySignature = razorpaySignature || 'sig_mock_' + Date.now();
    payment.status = 'paid';
    await payment.save();

    // Create enrollment
    const enrollment = await Enrollment.findOneAndUpdate(
      { studentId: req.user._id, courseId: payment.courseId },
      { paymentId: payment._id, accessType: 'paid', enrolledAt: new Date() },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: 'Payment verified and course enrolled!',
      data: enrollment,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const validateCoupon = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, courseId } = req.body;
    const coupon = await Coupon.findOne({
      code: (code || '').toUpperCase(),
      isActive: true,
      validUntil: { $gte: new Date() },
    });

    if (!coupon) {
      return res.status(404).json({ success: false, error: 'Invalid or expired coupon code' });
    }

    if (coupon.currentUses >= coupon.maxUses) {
      return res.status(400).json({ success: false, error: 'Coupon usage limit reached' });
    }

    if (
      coupon.applicableCourses.length > 0 &&
      !coupon.applicableCourses.includes(courseId)
    ) {
      return res.status(400).json({ success: false, error: 'Coupon not applicable for this course' });
    }

    return res.json({ success: true, data: coupon });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
