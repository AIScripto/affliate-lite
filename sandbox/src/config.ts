/**
 * All sandbox settings in one place. Values come from environment variables;
 * see .env.example for what each one means.
 */
const trim = (v: string | undefined) => (v ?? '').trim().replace(/\/+$/, '');

const port = Number(process.env.PORT ?? 9999);

export const config = {
  port,
  trackerUrl: trim(process.env.TRACKER_URL) || 'http://localhost:3085',
  publicUrl: trim(process.env.SANDBOX_PUBLIC_URL) || `http://localhost:${port}`,
  password: (process.env.SANDBOX_PASSWORD ?? '').trim(),
  adminEmail: (process.env.TRACKER_ADMIN_EMAIL ?? '').trim(),
  adminPassword: process.env.TRACKER_ADMIN_PASSWORD ?? '',
  offerToken: (process.env.SANDBOX_OFFER_TOKEN ?? '').trim() || 'sbx_secret_token',
} as const;

/** Timing limits. */
export const TIMING = {
  requestTimeoutMs: 10_000,
  /** How long to wait for the tracker's publisher postback to arrive. */
  publisherWaitMs: 6_000,
  publisherPollMs: 250,
} as const;

/** Most recent events kept in memory for the screen. */
export const EVENT_LIMIT = 500;

/** Names of the test records the sandbox creates in the tracker. Kept distinct so they are easy to spot in reports. */
export const SANDBOX_RECORDS = {
  strictNetwork: 'Sandbox Network (one conversion per click)',
  openNetwork: 'Sandbox Network (many goals per click)',
  publisherName: 'Sandbox Publisher',
  publisherEmail: 'sandbox.publisher@sandbox.test',
  offers: {
    strict: 'Sandbox Offer',
    open: 'Sandbox Offer (multi-goal)',
    token: 'Sandbox Offer (token)',
  },
} as const;

export type OfferKind = keyof typeof SANDBOX_RECORDS.offers;

/** Amounts set on every sandbox offer, so expected results are known in advance. */
export const SANDBOX_PAYOUT = { revenue: 10, payout: 6, currency: 'USD' } as const;

/** Prefix of every sandbox click's sub ID, so sandbox clicks are easy to filter. */
export const SUB_ID_PREFIX = 'sbx';

/** Tracker paths the sandbox calls (same links a real network would use). */
export const TRACKER_PATHS = {
  click: '/click',
  postback: '/api/v1/postback',
  pixelImage: '/api/v1/postback/pixel.jpg',
  pixelScript: '/sdk/pixel.js',
  login: '/api/v1/auth/login',
  networks: '/api/v1/networks',
  publishers: '/api/v1/publishers',
  offers: '/api/v1/offers',
  postbackLogs: '/api/v1/postback-logs',
} as const;

/** Sandbox's own public paths. */
export const SANDBOX_PATHS = {
  landing: '/network/landing',
  publisherPostback: '/publisher/postback',
} as const;

/** Offer destination: the tracker redirects visitors here with the click ID filled in. */
export function landingTemplate(): string {
  return `${config.publicUrl}${SANDBOX_PATHS.landing}?clickid={clickid}&offer_id={offer_id}&sub_id={sub_id}`;
}

/** Publisher postback URL saved on the Sandbox Publisher: the tracker calls it for approved conversions. */
export function publisherPostbackTemplate(): string {
  return (
    `${config.publicUrl}${SANDBOX_PATHS.publisherPostback}` +
    '?clickid={clickid}&payout={payout}&currency={currency}&goal={goal}&status={status}&sub_id={sub_id}&offer_id={offer_id}&conversion_id={conversion_id}'
  );
}

/**
 * True when the tracker cannot reach this sandbox (localhost or a private network address).
 * The tracker refuses to send publisher postbacks to such addresses on purpose,
 * so publisher checks are skipped instead of failing.
 */
export function isPrivateAddress(url: string): boolean {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return true;
  }
  if (host === 'localhost' || host.endsWith('.local') || host === '::1' || host === '[::1]') return true;
  const m = host.match(/^(\d+)\.(\d+)\.\d+\.\d+$/);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  return a === 127 || a === 10 || a === 0 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);
}
