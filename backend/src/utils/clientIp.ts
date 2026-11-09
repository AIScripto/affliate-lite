import { Request } from 'express';

/** Number of reverse proxies in front of the backend (nginx in the frontend container = 1). */
export const TRUST_PROXY_HOPS = Number(process.env.TRUST_PROXY_HOPS ?? 1);

const FALLBACK_IP = '0.0.0.0';

/**
 * Visitor IP as seen by the closest trusted proxy (needs app.set('trust proxy', TRUST_PROXY_HOPS)).
 * The first X-Forwarded-For entry is not used: the visitor can write anything there.
 */
export function getClientIp(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress || FALLBACK_IP;
  return ip.replace(/^::ffff:/, '');
}
