import { NextFunction, Request, Response } from 'express';
import { db } from '../services/inMemoryStore';
import { Role, User } from '../types/domain';

export interface AuthedRequest extends Request {
  user?: User;
}

export function authRequired(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Token is required' } });
  const userId = db.tokens.get(token);
  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
  req.user = user;
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient role' } });
    }
    next();
  };
}
