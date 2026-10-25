import { Router, Response } from 'express';
import { queryAll, queryOne, run, addAuditLog, resetDatabase } from '../db.js';
import { AuthenticatedRequest, requireAdmin } from '../auth.js';

const router = Router();

// Apply requireAdmin to all endpoints in this router
router.use(requireAdmin);

// Dashboard Overview Statistics
router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userCount = await queryOne<any>('SELECT COUNT(*) as count FROM users');
    const bannedCount = await queryOne<any>('SELECT COUNT(*) as count FROM users WHERE is_banned = 1');
    const postCount = await queryOne<any>('SELECT COUNT(*) as count FROM posts');
    const commentCount = await queryOne<any>('SELECT COUNT(*) as count FROM comments');
    const auditCount = await queryOne<any>('SELECT COUNT(*) as count FROM audit_logs');
    const flaggedAuditCount = await queryOne<any>("SELECT COUNT(*) as count FROM audit_logs WHERE status = 'FLAGGED' OR status = 'DENIED'");

    return res.json({
      totalUsers: userCount?.count || 0,
      bannedUsers: bannedCount?.count || 0,
      totalPosts: postCount?.count || 0,
      totalComments: commentCount?.count || 0,
      totalAuditLogs: auditCount?.count || 0,
      flaggedAuditLogs: flaggedAuditCount?.count || 0,
      securityPosture: 'HIGH (Parameterized SQL & Strict RBAC Enforced)',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Database Error', message: 'Failed to compute admin statistics.' });
  }
});

// User Management: List all users
router.get('/users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await queryAll<any>(`
      SELECT 
        u.id, u.username, u.email, u.role, u.display_name, u.avatar_seed, u.reputation, u.is_banned, u.created_at,
        (SELECT COUNT(*) FROM posts p WHERE p.author_id = u.id) AS post_count,
        (SELECT COUNT(*) FROM comments c WHERE c.author_id = u.id) AS comment_count
      FROM users u
      ORDER BY u.id ASC
    `);

    return res.json({ users });
  } catch (err: any) {
    return res.status(500).json({ error: 'Database Error', message: 'Failed to load user accounts.' });
  }
});

// Toggle User Ban Status
router.post('/users/:id/ban', async (req: AuthenticatedRequest, res: Response) => {
  const targetId = Number(req.params.id);
  const { ban } = req.body;
  const admin = req.user!;
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  try {
    const targetUser = await queryOne<any>('SELECT id, username, role FROM users WHERE id = ?', [targetId]);
    if (!targetUser) {
      return res.status(404).json({ error: 'Not Found', message: 'User does not exist.' });
    }

    if (targetUser.role === 'admin') {
      return res.status(400).json({ error: 'Action Denied', message: 'Administrator accounts cannot be banned.' });
    }

    const newBanStatus = ban ? 1 : 0;
    await run('UPDATE users SET is_banned = ? WHERE id = ?', [newBanStatus, targetId]);

    const actionText = newBanStatus === 1 ? 'USER_BANNED' : 'USER_UNBANNED';
    addAuditLog(admin.username, actionText, clientIp, 'SUCCESS', `Admin changed ban status of user '${targetUser.username}' to ${newBanStatus}`);

    return res.json({
      message: `User '${targetUser.username}' ${newBanStatus === 1 ? 'suspended' : 're-activated'} successfully.`,
      isBanned: newBanStatus === 1,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Database Error', message: 'Failed to update user status.' });
  }
});

// Audit Logs
router.get('/logs', async (req: AuthenticatedRequest, res: Response) => {
  const { limit = 50, filter } = req.query;

  try {
    let sql = `SELECT id, timestamp, actor_username, action, ip_address, status, details FROM audit_logs`;
    const params: any[] = [];

    if (filter && typeof filter === 'string' && filter !== 'ALL') {
      sql += ` WHERE status = ?`;
      params.push(filter);
    }

    sql += ` ORDER BY id DESC LIMIT ?`;
    params.push(Math.min(Number(limit) || 50, 100));

    const logs = await queryAll<any>(sql, params);
    return res.json({ logs });
  } catch (err: any) {
    return res.status(500).json({ error: 'Database Error', message: 'Failed to fetch audit logs.' });
  }
});

// Delete Post (Admin Moderation)
router.delete('/posts/:id', async (req: AuthenticatedRequest, res: Response) => {
  const postId = Number(req.params.id);
  const admin = req.user!;
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  try {
    const post = await queryOne<any>('SELECT id, title, author_id FROM posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({ error: 'Not Found', message: 'Post not found.' });
    }

    await run('DELETE FROM posts WHERE id = ?', [postId]);
    await run('DELETE FROM comments WHERE post_id = ?', [postId]);

    addAuditLog(admin.username, 'ADMIN_POST_DELETED', clientIp, 'SUCCESS', `Admin moderated and deleted post id=${postId}: "${post.title}"`);

    return res.json({ message: 'Post removed by moderator.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Database Error', message: 'Failed to delete post.' });
  }
});

// Database Reset & Reseed
router.post('/reset-database', async (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  try {
    await resetDatabase();
    addAuditLog(admin.username, 'DATABASE_RESET_EXECUTED', clientIp, 'SUCCESS', 'Administrator executed one-click full database reset and reseeded synthetic records.');

    return res.json({
      message: 'SecureLab database and synthetic tables have been completely reset and reseeded.',
    });
  } catch (err: any) {
    console.error('Database reset failed:', err);
    return res.status(500).json({ error: 'Reset Failed', message: 'Could not reset the database.' });
  }
});

export default router;
