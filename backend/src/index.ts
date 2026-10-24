import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes';
import { handleClickRedirect, handlePostback } from './controllers/trackingController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'affiliate-tracking-backend', timestamp: new Date().toISOString() });
});

// Root & API Tracking Click Redirect Engines ([04:40]–[05:00])
app.get('/click', handleClickRedirect);
app.get('/api/v1/click', handleClickRedirect);

// Global S2S Postback Receiver ([03:48], [06:24]–[06:58])
app.get('/postback', handlePostback);
app.post('/postback', handlePostback);
app.get('/api/v1/postback', handlePostback);
app.post('/api/v1/postback', handlePostback);

// Mount Unified API Router
app.use('/api/v1', apiRouter);

// Global 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found', message: 'API route not found' });
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message || 'Something went wrong' });
});

// Start Server if not imported by test runner
if (process.env.NODE_ENV !== 'test' && !process.env.TEST && !process.argv.some((a) => a.includes('test'))) {
  app.listen(PORT, () => {
    console.log(`[Affiliate Backend] Unified CPA Platform Server running on port ${PORT}`);
  });
}

export default app;
export { app };
