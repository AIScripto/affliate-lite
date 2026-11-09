import { TRACKER_PATHS } from '../config';

/** What a network knows about a conversion when it calls the tracker. */
export interface PostbackInput {
  clickId: string;
  goal?: string;
  status?: string;
  sum?: string;
  orderId?: string;
  token?: string;
}

export interface BuiltRequest {
  url: string;
  init: RequestInit;
}

export interface PostbackProfile {
  id: ProfileId;
  label: string;
  description: string;
  /** Pixels always answer 200 with an image; the real result is in the X-Postback-Status header. */
  resultFromHeader: boolean;
  build(trackerUrl: string, input: PostbackInput): BuiltRequest;
}

export type ProfileId =
  | 'get'
  | 'post-form'
  | 'post-json'
  | 'alias-names'
  | 'upper-case'
  | 'header-token'
  | 'pixel-image'
  | 'pixel-script';

type NameMap = Record<keyof PostbackInput, string>;

/** Parameter names the panel advertises. */
const STANDARD: NameMap = { clickId: 'clickid', goal: 'goal', status: 'status', sum: 'sum', orderId: 'action_id', token: 'secure_token' };
/** Other names networks commonly use for the same values. */
const ALIASES: NameMap = { clickId: 'click_id', goal: 'goal_id', status: 'status', sum: 'amount', orderId: 'transaction_id', token: 'token' };
const UPPER: NameMap = Object.fromEntries(Object.entries(STANDARD).map(([k, v]) => [k, v.toUpperCase()])) as NameMap;

function toParams(input: PostbackInput, names: NameMap, skip: Array<keyof PostbackInput> = []): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(names) as Array<keyof PostbackInput>) {
    const value = input[key];
    if (value !== undefined && !skip.includes(key)) out[names[key]] = value;
  }
  return out;
}

const query = (params: Record<string, string>) => new URLSearchParams(params).toString();

function getProfile(id: ProfileId, label: string, description: string, path: string, names: NameMap, resultFromHeader = false): PostbackProfile {
  return {
    id,
    label,
    description,
    resultFromHeader,
    build: (base, input) => ({ url: `${base}${path}?${query(toParams(input, names))}`, init: { method: 'GET' } }),
  };
}

export const PROFILES: Record<ProfileId, PostbackProfile> = {
  get: getProfile('get', 'Standard link', 'Standard parameter names in the link (what the panel gives out)', TRACKER_PATHS.postback, STANDARD),
  'post-form': {
    id: 'post-form',
    label: 'POST form',
    description: 'Values sent as a form body',
    resultFromHeader: false,
    build: (base, input) => ({
      url: `${base}${TRACKER_PATHS.postback}`,
      init: { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: query(toParams(input, STANDARD)) },
    }),
  },
  'post-json': {
    id: 'post-json',
    label: 'POST JSON',
    description: 'Values sent as a JSON body',
    resultFromHeader: false,
    build: (base, input) => ({
      url: `${base}${TRACKER_PATHS.postback}`,
      init: { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toParams(input, STANDARD)) },
    }),
  },
  'alias-names': getProfile('alias-names', 'Other names', 'click_id, amount, transaction_id, token instead of the standard names', TRACKER_PATHS.postback, ALIASES),
  'upper-case': getProfile('upper-case', 'Upper case', 'CLICKID, GOAL, SUM … in capital letters', TRACKER_PATHS.postback, UPPER),
  'header-token': {
    id: 'header-token',
    label: 'Token in header',
    description: 'Security token sent in the X-Advertiser-Token header, not in the link',
    resultFromHeader: false,
    build: (base, input) => ({
      url: `${base}${TRACKER_PATHS.postback}?${query(toParams(input, STANDARD, ['token']))}`,
      init: { method: 'GET', headers: input.token ? { 'X-Advertiser-Token': input.token } : ({} as Record<string, string>) },
    }),
  },
  'pixel-image': getProfile('pixel-image', 'Image pixel', 'Browser <img> pixel on the advertiser thank-you page', TRACKER_PATHS.pixelImage, STANDARD, true),
  'pixel-script': getProfile('pixel-script', 'Script pixel', 'Browser <script> pixel on the advertiser thank-you page', TRACKER_PATHS.pixelScript, STANDARD, true),
};
