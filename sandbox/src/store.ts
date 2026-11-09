import { EVENT_LIMIT } from './config';

export type EventType =
  | 'landing' // a visitor reached the fake advertiser page
  | 'postback-sent' // the fake network called the tracker
  | 'publisher-received'; // the tracker called the fake publisher

export interface SandboxEvent {
  id: number;
  at: string;
  type: EventType;
  clickId: string | null;
  summary: string;
  data: Record<string, unknown>;
}

/** Secret query values are masked before an event is stored or shown. */
const SECRET_KEYS = ['secure_token', 'token', 'sec_token', 'security_token'];

export function maskSecrets(url: string): string {
  try {
    const u = new URL(url);
    for (const key of SECRET_KEYS) {
      if (u.searchParams.has(key)) u.searchParams.set(key, '***');
    }
    return u.toString();
  } catch {
    return url;
  }
}

/** In-memory event log (newest last). Restarting the sandbox clears it; test records live in the tracker. */
export class EventStore {
  private events: SandboxEvent[] = [];
  private nextId = 1;

  constructor(private readonly limit: number = EVENT_LIMIT) {}

  add(type: EventType, clickId: string | null, summary: string, data: Record<string, unknown> = {}): SandboxEvent {
    const event: SandboxEvent = {
      id: this.nextId++,
      at: new Date().toISOString(),
      type,
      clickId: clickId ? clickId.toLowerCase() : null,
      summary,
      data,
    };
    this.events.push(event);
    if (this.events.length > this.limit) this.events.splice(0, this.events.length - this.limit);
    return event;
  }

  /** Newest first. */
  list(limit = 100, clickId?: string): SandboxEvent[] {
    const rows = clickId ? this.events.filter((e) => e.clickId === clickId.toLowerCase()) : this.events;
    return rows.slice(-limit).reverse();
  }

  count(type: EventType, clickId: string): number {
    const id = clickId.toLowerCase();
    return this.events.filter((e) => e.type === type && e.clickId === id).length;
  }

  clear(): void {
    this.events = [];
  }
}

export const store = new EventStore();
