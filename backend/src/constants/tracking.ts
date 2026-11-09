/** Click IDs are minted with crypto.randomUUID() and stored in a UUID column. */
export const CLICK_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Takes the first value when a query key is repeated (?clickid=a&clickid=b). */
export function firstParam(value: unknown): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined || raw === null) return undefined;
  const str = String(raw).trim();
  return str === '' ? undefined : str;
}

/** Largest value of a Postgres INTEGER id column. */
export const MAX_DB_INT_ID = 2_147_483_647;

/** A positive whole-number database id, or undefined for anything else (text, decimals, too large). */
export function parseDbId(value: unknown): number | undefined {
  const raw = firstParam(value);
  if (!raw || !/^\d+$/.test(raw)) return undefined;
  const id = Number(raw);
  return id >= 1 && id <= MAX_DB_INT_ID ? id : undefined;
}
