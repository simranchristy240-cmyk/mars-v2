import mongoose from 'mongoose';
import { ENV } from './env';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const connectDB = async (): Promise<void> => {
  let attempt = 0;

  // Keep retrying so Render stays up while Atlas IP allowlists propagate.
  while (true) {
    attempt += 1;
    try {
      const conn = await mongoose.connect(ENV.MONGODB_URI);
      console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(
        `[Database] Connection attempt ${attempt} failed:`,
        error instanceof Error ? error.message : error
      );
      await sleep(Math.min(30000, 3000 * attempt));
    }
  }
};
