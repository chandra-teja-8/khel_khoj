import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { prisma } from '../db/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_key_khelkhoj_dev_2026';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  profileId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: Role };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { profile: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found or token invalid.' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      profileId: user.profile?.id
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const requireRole = (role: Role) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: `Access denied. Requires ${role} role.` });
    }
    next();
  };
};
