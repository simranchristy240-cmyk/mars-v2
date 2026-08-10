import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { rateLimit } from 'express-rate-limit';
import { ENV } from './config/env';
import { errorHandler } from './middleware/error.middleware';

import authRoutes from './routes/auth.routes';
import courseRoutes from './routes/course.routes';
import lessonRoutes from './routes/lesson.routes';
import practiceRoutes from './routes/practice.routes';
import progressRoutes from './routes/progress.routes';
import paymentRoutes from './routes/payment.routes';
import gamificationRoutes from './routes/gamification.routes';
import testRoutes from './routes/test.routes';
import reportRoutes from './routes/report.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

// Security & Middleware
app.use(
  cors({
    origin: [
      ENV.CLIENT_ORIGIN,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'MARS v2 API Server running smoothly', timestamp: new Date() });
});

// Production: serve Vite client build (same-origin /api)
const clientDist = path.resolve(__dirname, '../../client/dist');
if (ENV.NODE_ENV === 'production' && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Error handling middleware
app.use(errorHandler);

export default app;
