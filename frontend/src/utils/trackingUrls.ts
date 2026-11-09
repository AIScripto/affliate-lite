import { TRACKING_PATHS } from '../constants/offers';

/**
 * Base address for links given to networks and advertisers (postback, pixels).
 * Uses VITE_TRACKING_BASE_URL when set at build time; otherwise the address this panel
 * is opened on (its nginx forwards tracking paths to the backend).
 */
export function getTrackingBaseUrl(): string {
  const configured = import.meta.env.VITE_TRACKING_BASE_URL?.trim().replace(/\/+$/, '');
  return configured || window.location.origin;
}

export type TrackingPathKey = keyof typeof TRACKING_PATHS;

/**
 * Builds a tracking link. `query` parts are already in "key=value" form; macro values
 * such as {clickid} are kept as-is so networks can replace them.
 */
export function buildTrackingUrl(path: TrackingPathKey, query: string[] = [], base: string = getTrackingBaseUrl()): string {
  const qs = query.filter(Boolean).join('&');
  return `${base}${TRACKING_PATHS[path]}${qs ? `?${qs}` : ''}`;
}
