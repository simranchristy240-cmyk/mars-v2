import { Schema, model, Document } from 'mongoose';

export interface IUserDocument extends Document {
  firebaseUid: string;
  username?: string;
  passwordHash?: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: 'student' | 'admin';
  activeSessionId?: string;
  preferences: {
    theme: 'deep-ocean' | 'soft-cloud' | 'sunset-calm' | 'lunar-drift' | 'silk-paper';
    language: string;
  };
  referralCode: string;
  referredBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    username: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
    passwordHash: { type: String, select: false },
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    avatar: { type: String, default: '' },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    activeSessionId: { type: String },
    preferences: {
      theme: {
        type: String,
        enum: ['deep-ocean', 'soft-cloud', 'sunset-calm', 'lunar-drift', 'silk-paper'],
        default: 'deep-ocean',
      },
      language: { type: String, default: 'en' },
    },
    referralCode: { type: String, unique: true, required: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

UserSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.passwordHash;
    return ret;
  },
});

export const User = model<IUserDocument>('User', UserSchema);
