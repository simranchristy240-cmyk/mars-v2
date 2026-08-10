import { Schema, model, Document } from 'mongoose';

export interface ISectionDocument extends Document {
  type: 'video' | 'text' | 'question';
  title?: string;
  vimeoVideoId?: string;
  videoStartTime?: number;
  videoEndTime?: number;
  text?: string;
  questionType?: 'single-mcq' | 'multi-mcq' | 'true-false' | 'match' | 'image-based';
  questionText?: string;
  questionImage?: string;
  options?: Array<{
    id: string;
    text: string;
    image?: string;
    isCorrect: boolean;
  }>;
  matchPairs?: Array<{ left: string; right: string }>;
  hints?: string[];
  explanation?: string;
  marks?: number;
  negativeMarks?: number;
  order: number;
  isPublished: boolean;
  parentId: Schema.Types.ObjectId;
  parentType: 'lesson' | 'practice' | 'test';
  createdAt: Date;
  updatedAt: Date;
}

const SectionSchema = new Schema<ISectionDocument>(
  {
    type: { type: String, enum: ['video', 'text', 'question'], required: true },
    title: { type: String, default: '' },
    vimeoVideoId: { type: String },
    videoStartTime: { type: Number, default: 0 },
    videoEndTime: { type: Number },
    text: { type: String },
    questionType: {
      type: String,
      enum: ['single-mcq', 'multi-mcq', 'true-false', 'match', 'image-based'],
    },
    questionText: { type: String },
    questionImage: { type: String },
    options: [
      {
        id: { type: String, required: true },
        text: { type: String, required: true },
        image: { type: String },
        isCorrect: { type: Boolean, required: true },
      },
    ],
    matchPairs: [
      {
        left: { type: String, required: true },
        right: { type: String, required: true },
      },
    ],
    hints: [{ type: String }],
    explanation: { type: String },
    marks: { type: Number, default: 1 },
    negativeMarks: { type: Number, default: 0 },
    order: { type: Number, required: true },
    isPublished: { type: Boolean, default: true },
    parentId: { type: Schema.Types.ObjectId, required: true },
    parentType: {
      type: String,
      enum: ['lesson', 'practice', 'test'],
      required: true,
    },
  },
  { timestamps: true }
);

export const Section = model<ISectionDocument>('Section', SectionSchema);
