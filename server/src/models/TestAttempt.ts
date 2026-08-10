import { Schema, model, Document } from 'mongoose';

export interface ITestAttemptDocument extends Document {
  testId: Schema.Types.ObjectId;
  studentId: Schema.Types.ObjectId;
  startedAt: Date;
  submittedAt?: Date;
  isAutoSubmitted: boolean;
  answers: Array<{
    questionId: Schema.Types.ObjectId;
    selectedOptions: string[];
    matchAnswers?: Array<{ left: string; right: string }>;
    timeTaken: number;
    isMarkedForReview: boolean;
  }>;
  score: number;
  totalMarks: number;
  percentage: number;
  rank?: number;
  topicWiseScores: Array<{
    topicId: Schema.Types.ObjectId;
    topicName: string;
    correct: number;
    total: number;
    percentage: number;
  }>;
  status: 'in-progress' | 'submitted' | 'auto-submitted';
}

const TestAttemptSchema = new Schema<ITestAttemptDocument>(
  {
    testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    isAutoSubmitted: { type: Boolean, default: false },
    answers: [
      {
        questionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
        selectedOptions: [{ type: String }],
        matchAnswers: [{ left: String, right: String }],
        timeTaken: { type: Number, default: 0 },
        isMarkedForReview: { type: Boolean, default: false },
      },
    ],
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    rank: { type: Number },
    topicWiseScores: [
      {
        topicId: { type: Schema.Types.ObjectId, ref: 'Topic' },
        topicName: { type: String },
        correct: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
      },
    ],
    status: {
      type: String,
      enum: ['in-progress', 'submitted', 'auto-submitted'],
      default: 'in-progress',
    },
  },
  { timestamps: true }
);

export const TestAttempt = model<ITestAttemptDocument>('TestAttempt', TestAttemptSchema);
