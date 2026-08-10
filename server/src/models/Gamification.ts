import { Schema, model, Document } from 'mongoose';

export interface IGamificationDocument extends Document {
  studentId: Schema.Types.ObjectId;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date;
  badges: Array<{
    badgeId: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: Date;
  }>;
  weeklyGoal: {
    target: number;
    current: number;
    weekStart: Date;
  };
  updatedAt: Date;
}

const GamificationSchema = new Schema<IGamificationDocument>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: Date.now },
    badges: [
      {
        badgeId: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String },
        icon: { type: String, required: true },
        earnedAt: { type: Date, default: Date.now },
      },
    ],
    weeklyGoal: {
      target: { type: Number, default: 5 },
      current: { type: Number, default: 0 },
      weekStart: { type: Date, default: Date.now },
    },
  },
  { timestamps: true }
);

export const Gamification = model<IGamificationDocument>('Gamification', GamificationSchema);
