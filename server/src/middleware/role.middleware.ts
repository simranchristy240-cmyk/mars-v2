import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

export const requireRole = (role: 'admin' | 'student') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ success: false, error: 'Forbidden: Insufficient privileges' });
    }

    next();
  };
};
