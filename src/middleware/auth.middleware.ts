import { Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.utils';
import { Request as ExpressRequest } from 'express';

// Extend Express Request type
export interface Request extends ExpressRequest {
  user?: TokenPayload;
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      status: 'fail',
      message: 'Access denied. No token provided.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err: any) {
    res.status(401).json({
      status: 'fail',
      message: 'Invalid or expired access token.',
      error: err?.message,
    });
  }
};

export const requireRole = (role: 'customer' | 'admin') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        status: 'fail',
        message: 'Unauthorized.',
      });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({
        status: 'fail',
        message: 'Access forbidden. Insufficient permissions.',
      });
      return;
    }

    next();
  };
};

export const optionalVerifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
  } catch (err) {
    // Ignore validation errors in optional verification context
  }
  next();
};
