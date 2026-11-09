import { TIMING } from '../config';

export interface HttpResult {
  status: number;
  headers: Headers;
  /** Parsed JSON when the answer is JSON, otherwise the raw text. */
  body: unknown;
}

/** fetch with a timeout; never throws for HTTP error codes, only for network failures. */
export async function request(url: string, init: RequestInit = {}): Promise<HttpResult> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMING.requestTimeoutMs) });
  const text = await res.text();
  let body: unknown = text;
  if ((res.headers.get('content-type') ?? '').includes('application/json')) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { status: res.status, headers: res.headers, body };
}

export function asRecord(body: unknown): Record<string, unknown> {
  return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
}
