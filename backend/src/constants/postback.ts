import { ConversionStatus } from '@prisma/client';

/**
 * Incoming postback parameter names. The first name in each list is the one the
 * panel advertises (see frontend PostbackParametersTable); the rest are aliases
 * that common networks send.
 */
export const POSTBACK_PARAM_ALIASES = {
  clickId: ['clickid', 'click_id'],
  goal: ['goal', 'goal_id', 'event'],
  sum: ['sum', 'amount', 'revenue'],
  status: ['status'],
  orderId: ['action_id', 'tx_id', 'transaction_id', 'order_id'],
  token: ['secure_token', 'token', 'sec_token', 'security_token'],
  currency: ['currency'],
} as const;

/** Headers that may carry the advertiser security token instead of a query parameter. */
export const POSTBACK_TOKEN_HEADERS = ['x-advertiser-token', 'x-postback-token'] as const;

/** Parameters never stored in the postback log (secrets). */
export const POSTBACK_SECRET_PARAMS: ReadonlySet<string> = new Set(POSTBACK_PARAM_ALIASES.token);

export const POSTBACK_DEFAULT_GOAL = '1';

/** Status sent by the network -> our status. Numbers follow the panel docs: 1 approved, 2 pending, 3 declined, 5 hold. */
export const POSTBACK_STATUS_MAP: Readonly<Record<string, ConversionStatus>> = {
  '1': 'APPROVED',
  approved: 'APPROVED',
  approve: 'APPROVED',
  confirmed: 'APPROVED',
  success: 'APPROVED',
  paid: 'APPROVED',
  '2': 'UNCHECKED',
  '5': 'UNCHECKED',
  pending: 'UNCHECKED',
  hold: 'UNCHECKED',
  unchecked: 'UNCHECKED',
  processing: 'UNCHECKED',
  '3': 'DECLINED',
  declined: 'DECLINED',
  decline: 'DECLINED',
  rejected: 'DECLINED',
  reject: 'DECLINED',
  cancelled: 'DECLINED',
  canceled: 'DECLINED',
  refund: 'DECLINED',
  refunded: 'DECLINED',
  chargeback: 'DECLINED',
  fraud: 'DECLINED',
};

/** Status used when the network does not send one. */
export const POSTBACK_DEFAULT_STATUS: ConversionStatus = 'APPROVED';

/** Largest amount that fits the Decimal(12,2) money columns. */
export const MAX_MONEY_AMOUNT = 9_999_999_999.99;

/** Database column limits. */
export const ORDER_ID_MAX_LENGTH = 255;
export const GOAL_MAX_LENGTH = 50;
export const SUB_ID_MAX_LENGTH = 255;

/** Outbound publisher postback settings. */
export const PUBLISHER_POSTBACK_TIMEOUT_MS = 3000;

/** Postback log retention for the admin log endpoint. */
export const POSTBACK_LOG_PAGE_SIZE = 100;
