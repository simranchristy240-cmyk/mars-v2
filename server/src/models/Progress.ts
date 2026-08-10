import { Schema, model, Document } from 'mongoose';

export interface IProgressDocument extends Document {
  studentId: Schema.Types.ObjectId;
  courseId: Schema.Types.ObjectId;
  lessonsCompleted: Schema.Types.ObjectId[];
  sectionsCompleted: Schema.Types.ObjectId[];
  videoProgress: Array<{
    sectionId: Schema.Types.ObjectId;
    watchedSeconds: number;
    totalSeconds: number;
    lastPosition: number;
  }>;
  practiceAttempts: Array<{
    questionId: Schema.Types.ObjectId;
    selectedOptions: string[];
    isCorrect: boolean;
    attemptedAt: Date;
  }>;
  lastActivity?: {
    type: 'lesson' | 'practice' | 'test';
    lessonId?: Schema.Types.ObjectId;
    sectionId?: Schema.Types.ObjectId;
    courseId: Schema.Types.ObjectId;
    timestamp: Date;
  };
  overallPercentage: number;
  updatedAt: Date;
}

const ProgressSchema = new Schema<IProgressDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    lessonsCompleted: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
    sectionsCompleted: [{ type: Schema.Types.ObjectId, ref: 'Section' }],
    videoProgress: [
      {
        sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
        watchedSeconds: { type: Number, default: 0 },
        totalSeconds: { type: Number, default: 0 },
        lastPosition: { type: Number, default: 0 },
      },
    ],
    practiceAttempts: [
      {
        questionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
        selectedOptions: [{ type: String }],
        isCorrect: { type: Boolean, required: true },
        attemptedAt: { type: Date, default: Date.now },
      },
    ],
    lastActivity: {
      type: { type: String, enum: ['lesson', 'practice', 'test'] },
      lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson' },
      sectionId: { type: Schema.Types.ObjectId, ref: 'Section' },
      courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
      timestamp: { type: Date, default: Date.now },
    },
    overallPercentage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Progress = model<IProgressDocument>('Progress', ProgressSchema);
