import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { Role } from '../models';

export const JWT_SECRET = process.env.JWT_SECRET || 'foodsave-dev-secret';

export interface AuthRequest extends Request {
  userId?: string;
  role?: Role;
}

export function signToken(userId: string, role: Role) {
  return jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: '30d' });
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'Bạn cần đăng nhập' });
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as unknown as { sub: string; role: Role };
    req.userId = payload.sub;
    req.role = payload.role;
    next();
  } catch {
    res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn' });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.role || !roles.includes(req.role)) return res.status(403).json({ message: 'Không có quyền truy cập' });
    next();
  };
}

/** Wraps async route handlers so thrown errors reach the error middleware. */
export const ah =
  (fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
