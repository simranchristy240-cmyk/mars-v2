import { Request, Response, NextFunction } from 'express';
import { verifyFirebaseToken } from '../config/firebase-admin';
import { User, IUserDocument } from '../models/User';

export interface AuthenticatedRequest extends Request {
  user?: IUserDocument;
  firebaseUid?: string;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No authorization token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = await verifyFirebaseToken(token);
    req.firebaseUid = decoded.uid;

    const user = await User.findOne({ firebaseUid: decoded.uid });

    if (user) {
      const clientSessionId = req.headers['x-session-id'] as string;
      if (user.activeSessionId && clientSessionId && user.activeSessionId !== clientSessionId) {
        return res.status(401).json({
          success: false,
          error: 'Session expired. Account accessed from another device.',
          code: 'SESSION_TERMINATED',
        });
      }
      req.user = user;
    }

    next();
  } catch (error: any) {
    return res.status(401).json({ success: false, error: error.message || 'Invalid token' });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      const decoded = await verifyFirebaseToken(token);
      req.firebaseUid = decoded.uid;

      const user = await User.findOne({ firebaseUid: decoded.uid });
      if (user) req.user = user;
    }
  } catch {
    // Ignore errors for optional auth
  }
  next();
};
