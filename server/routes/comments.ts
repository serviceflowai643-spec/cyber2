import { Router, Response } from 'express';
import { queryOne, run, addAuditLog } from '../db.js';
import { AuthenticatedRequest, requireAuth } from '../auth.js';

const router = Router();

// Create new comment
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { postId, content } = req.body;
  const user = req.user!;
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  if (!postId || !content) {
    return res.status(400).json({ error: 'Validation Error', message: 'Post ID and comment content are required.' });
  }

  const cleanContent = String(content).trim();
  if (cleanContent.length < 2 || cleanContent.length > 2000) {
    return res.status(400).json({ error: 'Validation Error', message: 'Comment must be between 2 and 2000 characters.' });
  }

  try {
    const post = await queryOne<any>('SELECT id FROM posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({ error: 'Not Found', message: 'The parent post does not exist.' });
    }

    const now = new Date().toISOString();
    // Parameterized INSERT: safely persists content regardless of whether it includes single quotes, semicolons, comments etc.
    const { lastInsertRowid } = await run(
      `INSERT INTO comments (post_id, author_id, content, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [postId, user.id, cleanContent, now, now]
    );

    addAuditLog(user.username, 'COMMENT_CREATED', clientIp, 'SUCCESS', `Comment id=${lastInsertRowid} added to post id=${postId}`);

    return res.status(201).json({
      message: 'Comment posted successfully.',
      comment: {
        id: lastInsertRowid,
        post_id: postId,
        content: cleanContent,
        created_at: now,
        updated_at: now,
        author_id: user.id,
        author_username: user.username,
        author_display_name: user.displayName,
        author_avatar_seed: user.avatarSeed,
        author_role: user.role,
      },
    });
  } catch (err: any) {
    console.error('Error posting comment:', err);
    return res.status(500).json({ error: 'Database Error', message: 'Failed to post comment.' });
  }
});

// Edit comment (author only, or admin)
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const commentId = Number(req.params.id);
  const { content } = req.body;
  const user = req.user!;
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  if (!content) {
    return res.status(400).json({ error: 'Validation Error', message: 'Comment content cannot be empty.' });
  }

  const cleanContent = String(content).trim();

  try {
    const existing = await queryOne<any>('SELECT id, author_id, post_id FROM comments WHERE id = ?', [commentId]);
    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: 'Comment not found.' });
    }

    if (existing.author_id !== user.id && user.role !== 'admin') {
      addAuditLog(user.username, 'COMMENT_EDIT_DENIED', clientIp, 'DENIED', `Attempted unauthorized edit of comment id=${commentId}`);
      return res.status(403).json({ error: 'Forbidden', message: 'You can only edit your own comments.' });
    }

    const now = new Date().toISOString();
    await run('UPDATE comments SET content = ?, updated_at = ? WHERE id = ?', [cleanContent, now, commentId]);

    addAuditLog(user.username, 'COMMENT_EDITED', clientIp, 'SUCCESS', `Comment id=${commentId} updated.`);

    return res.json({
      message: 'Comment updated successfully.',
      id: commentId,
      content: cleanContent,
      updated_at: now,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Database Error', message: 'Failed to update comment.' });
  }
});

// Delete comment (author or admin)
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const commentId = Number(req.params.id);
  const user = req.user!;
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  try {
    const existing = await queryOne<any>('SELECT id, author_id, post_id FROM comments WHERE id = ?', [commentId]);
    if (!existing) {
      return res.status(404).json({ error: 'Not Found', message: 'Comment not found.' });
    }

    if (existing.author_id !== user.id && user.role !== 'admin') {
      addAuditLog(user.username, 'COMMENT_DELETE_DENIED', clientIp, 'DENIED', `Attempted unauthorized delete of comment id=${commentId}`);
      return res.status(403).json({ error: 'Forbidden', message: 'You can only delete your own comments.' });
    }

    await run('DELETE FROM comments WHERE id = ?', [commentId]);

    addAuditLog(user.username, 'COMMENT_DELETED', clientIp, 'SUCCESS', `Comment id=${commentId} removed.`);

    return res.json({ message: 'Comment deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Database Error', message: 'Failed to delete comment.' });
  }
});

export default router;
