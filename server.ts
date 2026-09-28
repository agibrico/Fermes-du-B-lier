/**
 * Full-Stack Server for Fermes du Bélier SaaS
 * Express API + Vite middleware (dev) / static files (prod)
 * PostgreSQL backend with multi-tenant isolation
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { getDb } from './src/server/db';
import { runMigrations } from './src/server/migrations';
import healthRouter from './src/server/routes/health';
import authRouter from './src/server/routes/authRoutes';
import organizationRouter from './src/server/routes/organizationRoutes';
import farmRouter from './src/server/routes/farmRoutes';
import batchRouter from './src/server/routes/batchRoutes';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();

  // Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Initialize Database & Run Migrations
  try {
    const db = await getDb();
    await runMigrations(db);
    console.log('[Server] Database initialized and migrations ready.');
  } catch (dbErr) {
    console.error('[Server] Critical: Failed to initialize database:', dbErr);
    process.exit(1);
  }

  // API Routes
  app.use('/api', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/organizations', organizationRouter);
  app.use('/api/organizations/:orgId/farms', farmRouter);
  app.use('/api/organizations/:orgId/batches', batchRouter);

  // Frontend Serving
  if (!isProduction) {
    console.log('[Server] Mounting Vite dev server middleware...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0' },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    console.log('[Server] Serving static production build from dist...');
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Fermes du Bélier SaaS running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
