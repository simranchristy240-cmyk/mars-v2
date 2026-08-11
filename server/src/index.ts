import app from './app';
import { connectDB } from './config/database';
import { ENV } from './config/env';

const startServer = async () => {
  let PORT = parseInt(ENV.PORT, 10) || 5053;

  // Bind HTTP first so Render health checks can pass while Mongo retries.
  const server = app
    .listen(PORT, () => {
      console.log(`[MARS Server] Server listening on http://localhost:${PORT}`);
      console.log(`[MARS Server] Environment: ${ENV.NODE_ENV}`);
    })
    .on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        PORT += 1;
        console.warn(`[MARS Server] Port ${PORT - 1} busy, retrying on port ${PORT}...`);
        server.listen(PORT);
      } else {
        console.error('[MARS Server] Server error:', err);
      }
    });

  // Do not block listen on Mongo — reconnect in background.
  void connectDB();
};

startServer();
