import { PostbackDirection, PostbackOutcome, Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { POSTBACK_SECRET_PARAMS } from '../../constants/postback';

const MAX_LOGGED_KEYS = 50;
const MAX_LOGGED_VALUE_LENGTH = 500;
const MAX_MESSAGE_LENGTH = 500;
const MASK = '***';

export interface PostbackLogEntry {
  direction: PostbackDirection;
  outcome: PostbackOutcome;
  httpStatus: number;
  message?: string;
  clickId?: string;
  conversionId?: number;
  offerId?: number;
  publisherId?: number;
  method: string;
  params: Record<string, unknown>;
  ipAddress?: string;
}

/** Copies params for storage: secrets masked, sizes capped. */
export function sanitizeLoggedParams(params: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params).slice(0, MAX_LOGGED_KEYS)) {
    if (value === undefined) continue;
    out[key] = POSTBACK_SECRET_PARAMS.has(key.toLowerCase())
      ? MASK
      : (typeof value === 'string' ? value : JSON.stringify(value)).slice(0, MAX_LOGGED_VALUE_LENGTH);
  }
  return out;
}

/** Writes one log row. Never throws: a logging problem must not lose a conversion. */
export async function logPostback(entry: PostbackLogEntry): Promise<void> {
  try {
    await prisma.postbackLog.create({
      data: {
        ...entry,
        message: entry.message?.slice(0, MAX_MESSAGE_LENGTH),
        clickId: entry.clickId?.slice(0, 100),
        ipAddress: entry.ipAddress?.slice(0, 45),
        params: sanitizeLoggedParams(entry.params) as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    console.error('[Postback Log] Failed to write log row:', err);
  }
}
