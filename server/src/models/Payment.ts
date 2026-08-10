import { Schema, model, Document } from 'mongoose';

export interface IPaymentDocument extends Document {
  studentId: Schema.Types.ObjectId;
  courseId: Schema.Types.ObjectId;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  couponId?: Schema.Types.ObjectId;
  discountAmount?: number;
  status: 'created' | 'paid' | 'failed' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPaymentDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    discountAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
    },
  },
  { timestamps: true }
);

export const Payment = model<IPaymentDocument>('Payment', PaymentSchema);
