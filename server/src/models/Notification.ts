import { Schema, model, Document } from 'mongoose';

export interface INotificationDocument extends Document {
  userId: Schema.Types.ObjectId;
  title: string;
  message: string;
  type: 'test-reminder' | 'streak-warning' | 'badge-earned' | 'achievement' | 'system';
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['test-reminder', 'streak-warning', 'badge-earned', 'achievement', 'system'],
      default: 'system',
    },
    isRead: { type: Boolean, default: false },
    data: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Notification = model<INotificationDocument>('Notification', NotificationSchema);
