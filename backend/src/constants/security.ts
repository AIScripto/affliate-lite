/**
 * Fields a PUBLISHER must never receive in any API response.
 * Removed at every depth of the response body by stripPublisherFinancials.
 */

/** Exact field names: secrets and other parties' private data. */
export const PUBLISHER_HIDDEN_FIELDS: ReadonlySet<string> = new Set([
  'advertiserSecurityToken', // postback auth secret: would let a publisher fake conversions
  'passwordHash',
  'contactDetails', // advertiser network contact info
  'email', // other users' emails (a publisher's own email comes from /auth/me, which is not filtered)
]);

/**
 * Any field whose name contains one of these words is advertiser money or platform margin.
 * A pattern (not a fixed list) so new report fields like "gross" or "netMargin" are hidden by default.
 */
export const PUBLISHER_HIDDEN_FIELD_PATTERN = /revenue|margin|profit|income|gross/i;

export function isHiddenFromPublisher(fieldName: string): boolean {
  return PUBLISHER_HIDDEN_FIELDS.has(fieldName) || PUBLISHER_HIDDEN_FIELD_PATTERN.test(fieldName);
}
