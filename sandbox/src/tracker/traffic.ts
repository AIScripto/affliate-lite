import { config, TRACKER_PATHS, SANDBOX_PATHS, SUB_ID_PREFIX } from '../config';
import { request, asRecord } from './http';
import { PROFILES, ProfileId, PostbackInput } from './profiles';
import { store, maskSecrets } from '../store';

export interface ClickResult {
  clickId: string;
  /** Where the tracker sent the visitor (the fake advertiser page). */
  redirectUrl: string;
  subId: string;
}

/**
 * Opens the tracking link like a visitor would and follows the tracker's redirect
 * to the fake advertiser page, reading the click ID from it.
 */
export async function makeClick(offerId: number, publisherId: number, label: string, trackerUrl: string = config.trackerUrl): Promise<ClickResult> {
  const subId = `${SUB_ID_PREFIX}-${label}`.slice(0, 60);
  const url = `${trackerUrl}${TRACKER_PATHS.click}?offer_id=${offerId}&aff_id=${publisherId}&sub_id=${encodeURIComponent(subId)}`;
  const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(10_000) });
  const location = res.headers.get('location') ?? '';
  if (res.status !== 302 || !location) {
    throw new Error(`Tracking link did not redirect (HTTP ${res.status})`);
  }
  const target = new URL(location);
  if (!target.pathname.endsWith(SANDBOX_PATHS.landing)) {
    throw new Error(`Tracking link redirected somewhere else: ${location}`);
  }
  const clickId = target.searchParams.get('clickid') ?? '';
  if (!clickId || clickId.includes('{')) {
    throw new Error(`Redirect has no click ID: ${location}`);
  }
  return { clickId: clickId.toLowerCase(), redirectUrl: location, subId };
}

export interface PostbackResult {
  /** The tracker's real answer (for pixels taken from the X-Postback-Status header). */
  status: number;
  body: Record<string, unknown>;
  method: string;
  url: string;
  profile: ProfileId;
}

/** Sends one postback the way the chosen network style does, and records it. */
export async function sendPostback(profileId: ProfileId, input: PostbackInput, trackerUrl: string = config.trackerUrl): Promise<PostbackResult> {
  const profile = PROFILES[profileId];
  const { url, init } = profile.build(trackerUrl, input);
  const res = await request(url, init);
  const status = profile.resultFromHeader ? Number(res.headers.get('x-postback-status') ?? 0) : res.status;
  const result: PostbackResult = {
    status,
    body: asRecord(res.body),
    method: init.method ?? 'GET',
    url: maskSecrets(url),
    profile: profileId,
  };
  store.add('postback-sent', input.clickId.includes('{') ? null : input.clickId, `${result.method} ${profile.label} → ${status}`, {
    url: result.url,
    status,
    response: result.body,
  });
  return result;
}
