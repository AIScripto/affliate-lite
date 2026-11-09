import { Request, Response, NextFunction } from 'express';

export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

/** Global error handler: full details go to the server log, clients get a plain message without internals. */
export function errorHandler(err: Error & { type?: string }, req: Request, res: Response, _next: NextFunction): void {
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Bad Request', message: 'Request body is not valid JSON' });
    return;
  }
  console.error(`[Server Error] ${req.method} ${req.originalUrl}:`, err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Internal Server Error', message: GENERIC_ERROR_MESSAGE });
}
