import { Router, Request, Response } from 'express';
import { queryAll, queryOne, run, addAuditLog } from '../db.js';
import { AuthenticatedRequest, requireAuth, rateLimiter } from '../auth.js';

const router = Router();

// Rate limiter for search endpoint
const searchLimiter = rateLimiter({ windowMs: 60 * 1000, max: 40, endpointName: 'posts_search' });

// List posts with parameterized search and filtering
router.get('/', searchLimiter, async (req: Request, res: Response) => {
  const { search, category, tag, sort } = req.query;

  try {
    let sql = `
      SELECT 
        p.id, p.title, p.category, p.tags, p.content, p.views, p.likes_count, p.created_at, p.updated_at,
        u.id AS author_id, u.username AS author_username, u.display_name AS author_display_name, u.avatar_seed AS author_avatar_seed,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comments_count
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE u.is_banned = 0
    `;

    const params: any[] = [];

    // Parameterized search filter: safely binds search string as a literal pattern
    if (search && typeof search === 'string' && search.trim() !== '') {
      sql += ` AND (p.title LIKE ? OR p.content LIKE ? OR p.tags LIKE ?)`;
      const pattern = `%${search.trim()}%`;
      params.push(pattern, pattern, pattern);
    }

    if (category && typeof category === 'string' && category !== 'All') {
      sql += ` AND p.category = ?`;
      params.push(category.trim());
    }

    if (tag && typeof tag === 'string' && tag.trim() !== '') {
      sql += ` AND p.tags LIKE ?`;
      params.push(`%${tag.trim()}%`);
    }

    // Safe sorting options
    if (sort === 'popular') {
      sql += ` ORDER BY p.likes_count DESC, p.created_at DESC`;
    } else if (sort === 'views') {
      sql += ` ORDER BY p.views DESC, p.created_at DESC`;
    } else {
      sql += ` ORDER BY p.created_at DESC`;
    }

    const posts = await queryAll<any>(sql, params);

    return res.json({
      posts: posts.map(p => ({
        ...p,
        tags: p.tags ? p.tags.split(',').map((t: string) => t.trim()) : [],
        // Clean excerpt preview
        excerpt: p.content.slice(0, 180) + (p.content.length > 180 ? '...' : ''),
      })),
      total: posts.length,
      isParameterized: true, // Educational marker showing that this production route is 100% parameterized
    });
  } catch (err: any) {
    console.error('Error fetching posts:', err);
    return res.status(500).json({ error: 'Database Error', message: 'Failed to retrieve posts.' });
  }
});

// Get single post with comments
router.get('/:id', async (req: Request, res: Response) => {
  const postId = Number(req.params.id);
  if (isNaN(postId)) {
    return res.status(400).json({ error: 'Invalid ID', message: 'Post ID must be a valid number.' });
  }

  try {
    // 1. Fetch post
    const post = await queryOne<any>(
      `SELECT 
        p.id, p.title, p.category, p.tags, p.content, p.views, p.likes_count, p.created_at, p.updated_at,
        u.id AS author_id, u.username AS author_username, u.display_name AS author_display_name, u.avatar_seed AS author_avatar_seed, u.bio AS author_bio
       FROM posts p
       JOIN users u ON p.author_id = u.id
       WHERE p.id = ?`,
      [postId]
    );

    if (!post) {
      return res.status(404).json({ error: 'Not Found', message: 'The requested discussion post was not found.' });
    }

    // 2. Increment view count safely
    await run('UPDATE posts SET views = views + 1 WHERE id = ?', [postId]);

    // 3. Fetch comments
    const comments = await queryAll<any>(
      `SELECT 
        c.id, c.post_id, c.content, c.created_at, c.updated_at,
        u.id AS author_id, u.username AS author_username, u.display_name AS author_display_name, u.avatar_seed AS author_avatar_seed, u.role AS author_role
       FROM comments c
       JOIN users u ON c.author_id = u.id
       WHERE c.post_id = ?
       ORDER BY c.created_at ASC`,
      [postId]
    );

    return res.json({
      post: {
        ...post,
        views: post.views + 1,
        tags: post.tags ? post.tags.split(',').map((t: string) => t.trim()) : [],
      },
      comments,
    });
  } catch (err: any) {
    console.error('Error fetching post detail:', err);
    return res.status(500).json({ error: 'Database Error', message: 'Failed to load post details.' });
  }
});

// Create new discussion post
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { title, category, tags, content } = req.body;
  const user = req.user!;
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  if (!title || !category || !content) {
    return res.status(400).json({ error: 'Validation Error', message: 'Title, category, and content are required.' });
  }

  const cleanTitle = String(title).trim().slice(0, 150);
  const cleanCategory = String(category).trim().slice(0, 50);
  const cleanTags = tags && Array.isArray(tags) ? tags.map(t => String(t).trim().toLowerCase()).join(',') : (typeof tags === 'string' ? tags : 'general');
  const cleanContent = String(content).trim();

  if (cleanTitle.length < 5) {
    return res.status(400).json({ error: 'Validation Error', message: 'Title must be at least 5 characters long.' });
  }

  if (cleanContent.length < 20) {
    return res.status(400).json({ error: 'Validation Error', message: 'Post content must be at least 20 characters long.' });
  }

  try {
    const now = new Date().toISOString();
    const { lastInsertRowid } = await run(
      `INSERT INTO posts (author_id, title, category, tags, content, views, likes_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)`,
      [user.id, cleanTitle, cleanCategory, cleanTags, cleanContent, now, now]
    );

    addAuditLog(user.username, 'POST_CREATED', clientIp, 'SUCCESS', `Created post id=${lastInsertRowid}: "${cleanTitle.slice(0, 40)}"`);

    return res.status(201).json({
      message: 'Discussion post published successfully.',
      postId: lastInsertRowid,
    });
  } catch (err: any) {
    console.error('Error creating post:', err);
    return res.status(500).json({ error: 'Database Error', message: 'Failed to create discussion post.' });
  }
});

// Like a post
router.post('/:id/like', async (req: Request, res: Response) => {
  const postId = Number(req.params.id);
  if (isNaN(postId)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    await run('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?', [postId]);
    const updated = await queryOne<any>('SELECT likes_count FROM posts WHERE id = ?', [postId]);
    return res.json({ likesCount: updated ? updated.likes_count : 0 });
  } catch (e) {
    return res.status(500).json({ error: 'Database Error' });
  }
});

// Delete post (author or admin)
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const postId = Number(req.params.id);
  const user = req.user!;
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  try {
    const post = await queryOne<any>('SELECT id, author_id, title FROM posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({ error: 'Not Found', message: 'Post does not exist.' });
    }

    if (post.author_id !== user.id && user.role !== 'admin') {
      addAuditLog(user.username, 'POST_DELETE_UNAUTHORIZED', clientIp, 'DENIED', `Attempted deletion of post id=${postId} without ownership or admin role.`);
      return res.status(403).json({ error: 'Forbidden', message: 'You do not have permission to delete this post.' });
    }

    await run('DELETE FROM posts WHERE id = ?', [postId]);
    await run('DELETE FROM comments WHERE post_id = ?', [postId]);

    addAuditLog(user.username, 'POST_DELETED', clientIp, 'SUCCESS', `Deleted post id=${postId} ("${post.title}")`);

    return res.json({ message: 'Post and associated comments deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Database Error', message: 'Failed to delete post.' });
  }
});

export default router;
