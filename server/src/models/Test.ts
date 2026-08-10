import { Schema, model, Document } from 'mongoose';

export interface ITestDocument extends Document {
  courseId: Schema.Types.ObjectId;
  title: string;
  description?: string;
  duration: number;
  startTime: Date;
  endTime: Date;
  totalMarks: number;
  passingMarks?: number;
  negativeMarkingEnabled: boolean;
  sections: Array<{
    name: string;
    questions: Schema.Types.ObjectId[];
  }>;
  isPublished: boolean;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TestSchema = new Schema<ITestDocument>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    duration: { type: Number, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    totalMarks: { type: Number, required: true, default: 0 },
    passingMarks: { type: Number },
    negativeMarkingEnabled: { type: Boolean, default: false },
    sections: [
      {
        name: { type: String, required: true },
        questions: [{ type: Schema.Types.ObjectId, ref: 'Section' }],
      },
    ],
    isPublished: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Test = model<ITestDocument>('Test', TestSchema);
