import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { queryOne, addAuditLog } from './db.js';

export interface UserSession {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  displayName: string;
  avatarSeed: string;
  expiresAt: number;
}

// In-memory session store (token -> session)
const sessions = new Map<string, UserSession>();

// In-memory rate limiter store (key -> timestamps[])
const rateLimitBuckets = new Map<string, number[]>();

export function hashPassword(plainText: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plainText, salt);
}

export function comparePassword(plainText: string, hash: string): boolean {
  return bcrypt.compareSync(plainText, hash);
}

export function createSession(user: { id: number; username: string; email: string; role: 'admin' | 'user'; displayName: string; avatarSeed: string }): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  sessions.set(token, {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    avatarSeed: user.avatarSeed,
    expiresAt,
  });
  return token;
}

export function destroySession(token: string): void {
  sessions.delete(token);
}

export function getSession(token: string): UserSession | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return session;
}

// Express Request extension
export interface AuthenticatedRequest extends Request {
  user?: UserSession;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token = '';

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.securelab_token) {
    token = req.cookies.securelab_token;
  }

  if (token) {
    const session = getSession(token);
    if (session) {
      req.user = session;
    }
  }

  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication Required',
      message: 'You must be logged in to access this resource.',
    });
  }
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication Required',
      message: 'Administrator session required.',
    });
  }
  if (req.user.role !== 'admin') {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    addAuditLog(req.user.username, 'UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT', clientIp, 'DENIED', `User attempted to access restricted admin path: ${req.originalUrl}`);
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access restricted to administrators only. Unauthorized attempt logged in audit trail.',
    });
  }
  next();
}

// Sliding window rate limiter middleware
export function rateLimiter(options: { windowMs: number; max: number; endpointName: string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const key = `${options.endpointName}:${clientIp}`;
    const now = Date.now();
    const timestamps = rateLimitBuckets.get(key) || [];

    // Filter out timestamps older than windowMs
    const validTimestamps = timestamps.filter(t => now - t < options.windowMs);

    if (validTimestamps.length >= options.max) {
      addAuditLog('system', 'RATE_LIMIT_TRIGGERED', clientIp, 'FLAGGED', `Rate limit exceeded for endpoint ${options.endpointName}. Count: ${validTimestamps.length}`);
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded for ${options.endpointName}. Please wait before retrying.`,
        retryAfterMs: options.windowMs - (now - validTimestamps[0]),
      });
    }

    validTimestamps.push(now);
    rateLimitBuckets.set(key, validTimestamps);
    next();
  };
}
