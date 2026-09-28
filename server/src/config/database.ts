import dns from 'dns';
import mongoose from 'mongoose';
import { ENV } from './env';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * On some Windows setups Node uses 127.0.0.1 as DNS, which refuses SRV queries
 * needed by mongodb+srv:// (querySrv ECONNREFUSED). Prefer public resolvers.
 */
const ensureDnsForAtlas = () => {
  if (!ENV.MONGODB_URI.startsWith('mongodb+srv://')) return;
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    console.log('[Database] Configured public DNS (8.8.8.8 / 1.1.1.1) for Atlas SRV resolution.');
  } catch (err) {
    console.warn('[Database] Could not override DNS servers:', err);
  }
};

export const connectDB = async (): Promise<void> => {
  ensureDnsForAtlas();
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
