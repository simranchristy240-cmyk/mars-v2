import { Schema, model, Document } from 'mongoose';

export interface IEnrollmentDocument extends Document {
  studentId: Schema.Types.ObjectId;
  courseId: Schema.Types.ObjectId;
  paymentId?: Schema.Types.ObjectId;
  enrolledAt: Date;
  accessType: 'free' | 'paid';
}

const EnrollmentSchema = new Schema<IEnrollmentDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    enrolledAt: { type: Date, default: Date.now },
    accessType: { type: String, enum: ['free', 'paid'], default: 'paid' },
  },
  { timestamps: true }
);

EnrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

export const Enrollment = model<IEnrollmentDocument>('Enrollment', EnrollmentSchema);
