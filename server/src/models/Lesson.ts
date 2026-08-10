import { Schema, model, Document } from 'mongoose';

export interface ILessonDocument extends Document {
  topicId: Schema.Types.ObjectId;
  courseId: Schema.Types.ObjectId;
  title: string;
  order: number;
  isPublished: boolean;
  sections: Schema.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new Schema<ILessonDocument>(
  {
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true, trim: true },
    order: { type: Number, required: true },
    isPublished: { type: Boolean, default: true },
    sections: [{ type: Schema.Types.ObjectId, ref: 'Section' }],
  },
  { timestamps: true }
);

export const Lesson = model<ILessonDocument>('Lesson', LessonSchema);
