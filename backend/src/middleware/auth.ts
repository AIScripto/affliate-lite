import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_affiliate_jwt_token_2026';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  status: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      // In development, default to active admin session for seamless local UI browsing
      req.user = {
        id: 1,
        email: 'zeeshan@gmail.com',
        name: 'adren v',
        role: 'ADMIN',
        status: 'ACTIVE',
      };
      return next();
    }
    res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid authentication token' });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Unauthorized', message: 'Missing token' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
        req.user = decoded;
      } catch {
        // Ignore invalid token in optional auth
      }
    }
  }
  next();
}

export function requireRole(allowedRole: UserRole) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
      return;
    }

    if (req.user.role !== allowedRole && req.user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden', message: 'Access denied for your role' });
      return;
    }

    next();
  };
}

/**
 * Strips revenue, totalProfit, and totalIncome fields from responses when user is PUBLISHER
 * Per specs/backend/04-Backend-DoD-Skill.md Section 2.
 */
function cleanPublisherData(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map(cleanPublisherData);
  }
  if (data !== null && typeof data === 'object') {
    const copy: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (key === 'revenue' || key === 'totalProfit' || key === 'totalIncome') {
        continue;
      }
      copy[key] = cleanPublisherData(value);
    }
    return copy;
  }
  return data;
}

export function stripPublisherFinancials(req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res);

  res.json = function (body: unknown): Response {
    if (req.user?.role === 'PUBLISHER') {
      const sanitized = cleanPublisherData(body);
      return originalJson(sanitized);
    }
    return originalJson(body);
  };

  next();
}
