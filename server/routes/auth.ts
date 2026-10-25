import { Router, Request, Response } from 'express';
import { queryOne, run, addAuditLog } from '../db.js';
import { hashPassword, comparePassword, createSession, destroySession, rateLimiter, AuthenticatedRequest, requireAuth } from '../auth.js';

const router = Router();

// Apply rate limiting to login endpoint (e.g., 20 attempts per 60 seconds)
const loginLimiter = rateLimiter({ windowMs: 60 * 1000, max: 20, endpointName: 'auth_login' });
const registerLimiter = rateLimiter({ windowMs: 60 * 1000, max: 10, endpointName: 'auth_register' });

// Register new user
router.post('/register', registerLimiter, async (req: Request, res: Response) => {
  const { username, email, password, displayName } = req.body;
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Validation Error', message: 'Username, email, and password are required.' });
  }

  const cleanUsername = String(username).trim().toLowerCase();
  const cleanEmail = String(email).trim().toLowerCase();

  if (cleanUsername.length < 3 || cleanUsername.length > 30) {
    return res.status(400).json({ error: 'Validation Error', message: 'Username must be between 3 and 30 characters.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Validation Error', message: 'Password must be at least 8 characters long.' });
  }

  try {
    // Check existing via parameterized query
    const existing = await queryOne<{ id: number; username: string }>(
      'SELECT id, username FROM users WHERE username = ? OR email = ?',
      [cleanUsername, cleanEmail]
    );

    if (existing) {
      return res.status(409).json({ error: 'Conflict', message: 'A user with that username or email already exists.' });
    }

    const hashedPassword = hashPassword(password);
    const now = new Date().toISOString();
    const cleanDisplayName = displayName ? String(displayName).trim() : cleanUsername;

    const { lastInsertRowid } = await run(
      `INSERT INTO users (username, email, password_hash, role, display_name, avatar_seed, bio, reputation, is_banned, created_at)
       VALUES (?, ?, ?, 'user', ?, ?, 'Active community member.', 100, 0, ?)`,
      [cleanUsername, cleanEmail, hashedPassword, cleanDisplayName, cleanUsername, now]
    );

    const userPayload = {
      id: lastInsertRowid,
      username: cleanUsername,
      email: cleanEmail,
      role: 'user' as const,
      displayName: cleanDisplayName,
      avatarSeed: cleanUsername,
    };

    const token = createSession(userPayload);
    res.cookie('securelab_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 });

    addAuditLog(cleanUsername, 'USER_REGISTERED', clientIp, 'SUCCESS', `User account created: ${cleanUsername}`);

    return res.status(201).json({
      message: 'Account registered successfully.',
      token,
      user: {
        ...userPayload,
        reputation: 100,
        bio: 'Active community member.',
        createdAt: now,
      },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Failed to complete registration.' });
  }
});

// Login
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  const { usernameOrEmail, password } = req.body;
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ error: 'Validation Error', message: 'Username/email and password are required.' });
  }

  const lookup = String(usernameOrEmail).trim().toLowerCase();

  try {
    // Parameterized lookup against SQLite users table
    const user = await queryOne<any>(
      `SELECT id, username, email, password_hash, role, display_name, avatar_seed, bio, reputation, is_banned, created_at
       FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?`,
      [lookup, lookup]
    );

    if (!user) {
      addAuditLog(lookup, 'LOGIN_FAILED', clientIp, 'DENIED', 'Invalid username or password supplied.');
      return res.status(401).json({ error: 'Invalid Credentials', message: 'Invalid username or password.' });
    }

    if (user.is_banned === 1) {
      addAuditLog(user.username, 'LOGIN_BLOCKED_BANNED', clientIp, 'DENIED', 'Banned account attempted authentication.');
      return res.status(403).json({ error: 'Account Suspended', message: 'Your account has been suspended by an administrator.' });
    }

    const isValid = comparePassword(password, user.password_hash);
    if (!isValid) {
      addAuditLog(user.username, 'LOGIN_FAILED', clientIp, 'DENIED', 'Password verification failed.');
      return res.status(401).json({ error: 'Invalid Credentials', message: 'Invalid username or password.' });
    }

    const userPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role as 'admin' | 'user',
      displayName: user.display_name,
      avatarSeed: user.avatar_seed,
    };

    const token = createSession(userPayload);
    res.cookie('securelab_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 });

    addAuditLog(user.username, 'LOGIN_SUCCESS', clientIp, 'SUCCESS', `Successful session generated. Role: ${user.role}`);

    return res.json({
      message: 'Authentication successful.',
      token,
      user: {
        ...userPayload,
        reputation: user.reputation,
        bio: user.bio,
        createdAt: user.created_at,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Authentication service encountered an error.' });
  }
});

// Logout
router.post('/logout', (req: AuthenticatedRequest, res: Response) => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.substring(7)
    : req.cookies?.securelab_token;

  if (token) {
    destroySession(token);
  }

  res.clearCookie('securelab_token');
  if (req.user) {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    addAuditLog(req.user.username, 'LOGOUT', clientIp, 'SUCCESS', 'User session terminated cleanly.');
  }

  return res.json({ message: 'Logged out successfully.' });
});

// Get Current User
router.get('/me', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.json({ user: null });
  }

  try {
    const user = await queryOne<any>(
      `SELECT id, username, email, role, display_name, avatar_seed, bio, reputation, is_banned, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (!user || user.is_banned === 1) {
      return res.json({ user: null });
    }

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        displayName: user.display_name,
        avatarSeed: user.avatar_seed,
        bio: user.bio,
        reputation: user.reputation,
        createdAt: user.created_at,
      },
    });
  } catch (e) {
    return res.status(500).json({ error: 'Database Error', message: 'Failed to fetch session user.' });
  }
});

// Update Profile
router.put('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { displayName, bio } = req.body;
  const user = req.user!;

  try {
    const cleanDisplayName = displayName ? String(displayName).trim().slice(0, 50) : user.displayName;
    const cleanBio = bio !== undefined ? String(bio).trim().slice(0, 300) : '';

    await run(
      'UPDATE users SET display_name = ?, bio = ? WHERE id = ?',
      [cleanDisplayName, cleanBio, user.id]
    );

    user.displayName = cleanDisplayName;

    return res.json({
      message: 'Profile updated successfully.',
      displayName: cleanDisplayName,
      bio: cleanBio,
    });
  } catch (e) {
    return res.status(500).json({ error: 'Database Error', message: 'Failed to update profile.' });
  }
});

// Change Password
router.put('/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user!;
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Validation Error', message: 'New password must be at least 8 characters long.' });
  }

  try {
    const dbUser = await queryOne<any>('SELECT password_hash FROM users WHERE id = ?', [user.id]);
    if (!dbUser || !comparePassword(currentPassword, dbUser.password_hash)) {
      addAuditLog(user.username, 'PASSWORD_CHANGE_FAILED', clientIp, 'DENIED', 'Incorrect current password provided.');
      return res.status(400).json({ error: 'Invalid Password', message: 'Current password does not match.' });
    }

    const newHashed = hashPassword(newPassword);
    await run('UPDATE users SET password_hash = ? WHERE id = ?', [newHashed, user.id]);

    addAuditLog(user.username, 'PASSWORD_CHANGED', clientIp, 'SUCCESS', 'Password updated successfully.');
    return res.json({ message: 'Password updated successfully.' });
  } catch (e) {
    return res.status(500).json({ error: 'Database Error', message: 'Failed to change password.' });
  }
});

export default router;
