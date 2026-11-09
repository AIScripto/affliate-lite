import crypto from 'node:crypto';
import { Request, Response, NextFunction } from 'express';

const REALM = 'Affiliate Sandbox';

function sameSecret(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/**
 * Browser password prompt (HTTP Basic). Any user name; the password is SANDBOX_PASSWORD.
 * Without a configured password the screen stays closed: the sandbox can create
 * conversions in the tracker, so it must never run open.
 */
export function requirePassword(password: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!password) {
      res.status(503).type('text/plain').send('Sandbox is locked: set SANDBOX_PASSWORD and restart.');
      return;
    }
    const header = req.headers.authorization ?? '';
    const [scheme, encoded] = header.split(' ');
    if (scheme === 'Basic' && encoded) {
      const decoded = Buffer.from(encoded, 'base64').toString('utf8');
      const given = decoded.slice(decoded.indexOf(':') + 1);
      if (sameSecret(given, password)) {
        next();
        return;
      }
    }
    res.set('WWW-Authenticate', `Basic realm="${REALM}", charset="UTF-8"`).status(401).type('text/plain').send('Password required');
  };
}
