import { Schema, model, Document } from 'mongoose';

export interface ICourseDocument extends Document {
  title: string;
  description: string;
  thumbnail: string;
  price: number;
  currency: string;
  topics: Schema.Types.ObjectId[];
  testSeries: Schema.Types.ObjectId[];
  isPublished: boolean;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourseDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    topics: [{ type: Schema.Types.ObjectId, ref: 'Topic' }],
    testSeries: [{ type: Schema.Types.ObjectId, ref: 'Test' }],
    isPublished: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Course = model<ICourseDocument>('Course', CourseSchema);
