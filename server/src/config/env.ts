import dotenv from 'dotenv';
import path from 'path';

// Load monorepo root .env when running from server/dist
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || '5053',
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/mars_v2',
  JWT_SECRET: process.env.JWT_SECRET || 'mars_jwt_super_secret_key_2026',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockKeyId12345',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'mockKeySecret1234567890',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'mars-learning-app',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5174',
};
