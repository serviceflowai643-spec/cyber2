import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { getDb } from './server/db.js';
import { authMiddleware } from './server/auth.js';
import authRouter from './server/routes/auth.js';
import postsRouter from './server/routes/posts.js';
import commentsRouter from './server/routes/comments.js';
import adminRouter from './server/routes/admin.js';
import labRouter from './server/routes/lab.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize SQLite Database and seed data
  await getDb();

  // Basic Middlewares
  app.use(express.json());
  app.use(cookieParser());
  app.use(cors({ origin: true, credentials: true }));

  // Security Headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Attach session user to req if token exists
  app.use(authMiddleware);

  // Mount API Endpoints
  app.use('/api/auth', authRouter);
  app.use('/api/posts', postsRouter);
  app.use('/api/comments', commentsRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/lab', labRouter);

  // Global Safe Error Handler (medium-to-high security posture: no stack traces leaked)
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(err.status || 500).json({
      error: 'Internal Server Error',
      message: 'The server encountered an error processing your request. Event recorded in security log.',
    });
  });

  // Dev mode: Mount Vite middleware for live SPA rendering on port 3000
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SecureLab] Full-Stack server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal startup error in SecureLab server:', err);
  process.exit(1);
});
