import { ConversionStatus } from '@prisma/client';
import { CLICK_ID_PATTERN, firstParam } from '../../constants/tracking';
import {
  POSTBACK_PARAM_ALIASES,
  POSTBACK_TOKEN_HEADERS,
  POSTBACK_STATUS_MAP,
  POSTBACK_DEFAULT_STATUS,
  POSTBACK_DEFAULT_GOAL,
  MAX_MONEY_AMOUNT,
  ORDER_ID_MAX_LENGTH,
  GOAL_MAX_LENGTH,
} from '../../constants/postback';

export interface ParsedPostback {
  clickId: string;
  goal: string;
  status: ConversionStatus;
  /** Amount sent by the network, if any. */
  sum?: number;
  orderId?: string;
  token?: string;
  currency?: string;
}

export type ParseResult =
  | { ok: true; value: ParsedPostback }
  | { ok: false; httpStatus: number; message: string; clickId?: string };

type ParamSource = Record<string, unknown>;

/** Parameter names are matched without case: networks send clickid, ClickID, CLICKID. */
function lowerCaseKeys(src: ParamSource): ParamSource {
  const out: ParamSource = {};
  for (const [key, value] of Object.entries(src)) {
    const k = key.toLowerCase();
    if (!(k in out)) out[k] = value;
  }
  return out;
}

function pick(src: ParamSource, names: readonly string[]): string | undefined {
  for (const name of names) {
    const value = firstParam(src[name]);
    if (value !== undefined) return value;
  }
  return undefined;
}

const AMOUNT_PATTERN = /^\d+(\.\d+)?$/;

/**
 * Reads and checks every postback parameter in one place.
 * Returns a plain-English error for anything a network might send wrong.
 */
export function parsePostbackParams(
  rawParams: ParamSource,
  headers: Record<string, string | string[] | undefined> = {}
): ParseResult {
  const src = lowerCaseKeys(rawParams);
  const A = POSTBACK_PARAM_ALIASES;

  const clickId = pick(src, A.clickId);
  if (!clickId) {
    return { ok: false, httpStatus: 400, message: 'Missing clickid parameter' };
  }
  // Networks often send the macro text itself (e.g. "{clickid}") when it is not set up yet
  if (!CLICK_ID_PATTERN.test(clickId)) {
    return { ok: false, httpStatus: 400, message: 'Invalid clickid format', clickId: clickId.slice(0, 100) };
  }

  const goal = pick(src, A.goal) ?? POSTBACK_DEFAULT_GOAL;
  if (goal.length > GOAL_MAX_LENGTH) {
    return { ok: false, httpStatus: 400, message: `goal is too long (max ${GOAL_MAX_LENGTH} characters)`, clickId };
  }

  const rawStatus = pick(src, A.status);
  let status = POSTBACK_DEFAULT_STATUS;
  if (rawStatus !== undefined) {
    const mapped = POSTBACK_STATUS_MAP[rawStatus.toLowerCase()];
    if (!mapped) {
      return {
        ok: false,
        httpStatus: 400,
        message: 'Unknown status. Use 1 (approved), 2 (pending), 3 (declined) or 5 (hold)',
        clickId,
      };
    }
    status = mapped;
  }

  const rawSum = pick(src, A.sum);
  let sum: number | undefined;
  if (rawSum !== undefined) {
    if (!AMOUNT_PATTERN.test(rawSum)) {
      return { ok: false, httpStatus: 400, message: 'sum must be a positive number like 49.99', clickId };
    }
    sum = Number(rawSum);
    if (sum > MAX_MONEY_AMOUNT) {
      return { ok: false, httpStatus: 400, message: 'sum is too large', clickId };
    }
  }

  const orderId = pick(src, A.orderId)?.slice(0, ORDER_ID_MAX_LENGTH);

  let token = pick(src, A.token);
  if (token === undefined) {
    for (const header of POSTBACK_TOKEN_HEADERS) {
      token = firstParam(headers[header]);
      if (token !== undefined) break;
    }
  }

  const currency = pick(src, A.currency)?.toUpperCase();

  return { ok: true, value: { clickId, goal, status, sum, orderId, token, currency } };
}
