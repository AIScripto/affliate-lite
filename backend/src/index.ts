import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes';
import prisma from './db/prisma';
import { handleClickRedirect, handlePostback } from './controllers/trackingController';
import { asyncHandler } from './utils/asyncRouter';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3086;

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:3085', 'http://161.97.110.121:3085'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, origin);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'affiliate-tracking-backend', timestamp: new Date().toISOString() });
});

app.get('/health/database', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ status: 'error', database: 'disconnected', message: err?.message || 'Database error' });
  }
});

// Root & API Tracking Click Redirect Engines ([04:40]–[05:00])
app.get('/click', asyncHandler(handleClickRedirect));
app.get('/api/v1/click', asyncHandler(handleClickRedirect));

// Global S2S Postback Receiver ([03:48], [06:24]–[06:58])
app.get('/postback', asyncHandler(handlePostback));
app.post('/postback', asyncHandler(handlePostback));
app.get('/api/v1/postback', asyncHandler(handlePostback));
app.post('/api/v1/postback', asyncHandler(handlePostback));

// Mount Unified API Router
app.use('/api/v1', apiRouter);

// Global 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found', message: 'API route not found' });
});

// Global Error Handler: log full details on the server, never send internal error text to clients
app.use((err: Error & { type?: string }, req: Request, res: Response, _next: NextFunction) => {
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Bad Request', message: 'Request body is not valid JSON' });
    return;
  }
  console.error(`[Server Error] ${req.method} ${req.originalUrl}:`, err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Internal Server Error', message: 'Something went wrong. Please try again.' });
});

// Last-resort safety net: log and keep serving instead of stopping the process
process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});

// Start Server if not imported by test runner
if (process.env.NODE_ENV !== 'test' && !process.env.TEST && !process.argv.some((a) => a.includes('test'))) {
  app.listen(PORT, () => {
    console.log(`[Affiliate Backend] Unified CPA Platform Server running on port ${PORT}`);
  });
}

export default app;
export { app };
