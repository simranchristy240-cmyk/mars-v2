import { Schema, model, Document } from 'mongoose';

export interface IPracticeSetSubdocument {
  _id: Schema.Types.ObjectId;
  title: string;
  description?: string;
  accessTier: 'free' | 'basic' | 'plus' | 'premium';
  isPublished: boolean;
  order: number;
  questions: Schema.Types.ObjectId[];
}

export interface ITopicDocument extends Document {
  courseId: Schema.Types.ObjectId;
  title: string;
  description: string;
  order: number;
  isFree: boolean;
  isPublished: boolean;
  lessons: Schema.Types.ObjectId[];
  practiceQuestions: Schema.Types.ObjectId[];
  practiceSets: IPracticeSetSubdocument[];
  createdAt: Date;
  updatedAt: Date;
}

const TopicSchema = new Schema<ITopicDocument>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    order: { type: Number, required: true },
    isFree: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    lessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
    practiceQuestions: [{ type: Schema.Types.ObjectId, ref: 'Section' }],
    practiceSets: [
      {
        title: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        accessTier: {
          type: String,
          enum: ['free', 'basic', 'plus', 'premium'],
          default: 'free',
        },
        isPublished: { type: Boolean, default: true },
        order: { type: Number, default: 1 },
        questions: [{ type: Schema.Types.ObjectId, ref: 'Section' }],
      },
    ],
  },
  { timestamps: true }
);

export const Topic = model<ITopicDocument>('Topic', TopicSchema);
