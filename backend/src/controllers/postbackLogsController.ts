import { Request, Response } from 'express';
import { Prisma, PostbackDirection, PostbackOutcome } from '@prisma/client';
import { prisma } from '../db/prisma';

/**
 * Admin view of received and sent postbacks, newest first.
 * Filters: clickId, offerId, publisherId, direction, outcome, limit (validated by PostbackLogsQuerySchema).
 */
export async function getPostbackLogs(req: Request, res: Response): Promise<void> {
  const q = req.query as unknown as {
    clickId?: string;
    offerId?: number;
    publisherId?: number;
    direction?: PostbackDirection;
    outcome?: PostbackOutcome;
    limit: number;
  };

  const where: Prisma.PostbackLogWhereInput = {
    ...(q.clickId ? { clickId: q.clickId } : {}),
    ...(q.offerId ? { offerId: q.offerId } : {}),
    ...(q.publisherId ? { publisherId: q.publisherId } : {}),
    ...(q.direction ? { direction: q.direction } : {}),
    ...(q.outcome ? { outcome: q.outcome } : {}),
  };

  const [total, logs] = await Promise.all([
    prisma.postbackLog.count({ where }),
    prisma.postbackLog.findMany({ where, orderBy: { id: 'desc' }, take: q.limit }),
  ]);

  res.json({ data: logs, total });
}
