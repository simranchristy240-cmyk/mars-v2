import { Schema, model, Document } from 'mongoose';

export interface ICouponDocument extends Document {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  maxUses: number;
  currentUses: number;
  validFrom: Date;
  validUntil: Date;
  applicableCourses: Schema.Types.ObjectId[];
  isActive: boolean;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
}

const CouponSchema = new Schema<ICouponDocument>(
  {
    code: { type: String, required: true, uppercase: true, trim: true, unique: true },
    type: { type: String, enum: ['percentage', 'fixed'], required: true },
    value: { type: Number, required: true },
    maxUses: { type: Number, default: 100 },
    currentUses: { type: Number, default: 0 },
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date, required: true },
    applicableCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Coupon = model<ICouponDocument>('Coupon', CouponSchema);
