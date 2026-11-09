import { Request } from 'express';

/**
 * Public address of this tracker, used in links shown to networks.
 * BASE_URL wins when set; otherwise it is taken from the request as the visitor sees it
 * (nginx passes host:port in X-Forwarded-Host).
 */
export function getPublicBaseUrl(req: Request): string {
  const configured = process.env.BASE_URL?.trim().replace(/\/+$/, '');
  if (configured) return configured;
  const host = req.get('x-forwarded-host')?.split(',')[0]?.trim() || req.get('host');
  return `${req.protocol}://${host}`;
}
