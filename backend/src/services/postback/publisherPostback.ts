import dns from 'node:dns/promises';
import net from 'node:net';
import { PUBLISHER_POSTBACK_TIMEOUT_MS } from '../../constants/postback';
import { logPostback } from './log';
import { fillUrlTemplate } from '../../utils/urlTemplate';

/** Private, loopback, link-local and cloud-metadata ranges a publisher URL must never reach (SSRF guard). */
const BLOCKED = new net.BlockList();
for (const [subnet, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
  ['172.16.0.0', 12], ['192.168.0.0', 16], ['224.0.0.0', 4], ['240.0.0.0', 4],
] as const) BLOCKED.addSubnet(subnet, prefix, 'ipv4');
for (const [subnet, prefix] of [['::', 128], ['::1', 128], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8]] as const) {
  BLOCKED.addSubnet(subnet, prefix, 'ipv6');
}
const BLOCKED_HOST_SUFFIXES = ['localhost', '.localhost', '.local', '.internal'];

export function isBlockedAddress(address: string): boolean {
  const mapped = address.toLowerCase().match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return BLOCKED.check(mapped[1]!, 'ipv4');
  const family = net.isIP(address);
  if (family === 4) return BLOCKED.check(address, 'ipv4');
  if (family === 6) return BLOCKED.check(address, 'ipv6');
  return true; // not an IP at all: refuse
}

type LookupFn = (host: string) => Promise<Array<{ address: string }>>;
const defaultLookup: LookupFn = (host) => dns.lookup(host, { all: true });

export type UrlCheck =
  | { ok: true }
  | { ok: false; outcome: 'BLOCKED' | 'FAILED'; reason: string };

/**
 * Checks a publisher postback URL before calling it.
 * BLOCKED = unsafe target (private/internal address, bad scheme). FAILED = host name could not be found.
 */
export async function checkPublicUrl(urlStr: string, lookup: LookupFn = defaultLookup): Promise<UrlCheck> {
  const blocked = (reason: string): UrlCheck => ({ ok: false, outcome: 'BLOCKED', reason });
  let url: URL;
  try {
    url = new URL(urlStr);
  } catch {
    return blocked('Postback URL is not a valid web address');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return blocked('Postback URL must start with http:// or https://');

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (BLOCKED_HOST_SUFFIXES.some((s) => host === s.replace(/^\./, '') || host.endsWith(s))) {
    return blocked('Postback URL points to a local or internal server');
  }
  if (net.isIP(host)) {
    return isBlockedAddress(host) ? blocked('Postback URL points to a private or internal address') : { ok: true };
  }

  let addresses: Array<{ address: string }>;
  try {
    addresses = await lookup(host);
  } catch {
    return { ok: false, outcome: 'FAILED', reason: `Could not find the publisher server "${host}" (DNS lookup failed)` };
  }
  if (addresses.length === 0) {
    return { ok: false, outcome: 'FAILED', reason: `Could not find the publisher server "${host}"` };
  }
  if (addresses.some((a) => isBlockedAddress(a.address))) {
    return blocked(`Publisher server "${host}" resolves to a private or internal address`);
  }
  return { ok: true };
}

export interface PublisherPostbackInput {
  template: string;
  macros: Record<string, string>;
  clickId: string;
  conversionId: number;
  offerId: number;
  publisherId: number;
}

interface Deps {
  fetchFn?: typeof fetch;
  lookup?: LookupFn;
}

/**
 * Sends the conversion to the publisher's own tracker and logs the result.
 * Redirects are not followed (a redirect could point at an internal address).
 */
export async function sendPublisherPostback(input: PublisherPostbackInput, deps: Deps = {}): Promise<void> {
  const { fetchFn = fetch, lookup = defaultLookup } = deps;
  const url = fillUrlTemplate(input.template.trim(), input.macros);
  const base = {
    direction: 'OUTBOUND' as const,
    method: 'GET',
    params: { url },
    clickId: input.clickId,
    conversionId: input.conversionId,
    offerId: input.offerId,
    publisherId: input.publisherId,
  };

  const check = await checkPublicUrl(url, lookup);
  if (!check.ok) {
    await logPostback({ ...base, outcome: check.outcome, httpStatus: 0, message: check.reason });
    return;
  }

  try {
    const res = await fetchFn(url, {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(PUBLISHER_POSTBACK_TIMEOUT_MS),
    });
    const ok = res.status >= 200 && res.status < 400;
    await logPostback({
      ...base,
      outcome: ok ? 'SENT' : 'FAILED',
      httpStatus: res.status,
      message: ok ? undefined : `Publisher server answered ${res.status}`,
    });
  } catch (err) {
    await logPostback({
      ...base,
      outcome: 'FAILED',
      httpStatus: 0,
      message: err instanceof Error ? err.message : 'Request failed',
    });
  }
}
