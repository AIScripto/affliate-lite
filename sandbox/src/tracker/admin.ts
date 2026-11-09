import crypto from 'node:crypto';
import {
  config,
  SANDBOX_RECORDS,
  SANDBOX_PAYOUT,
  TRACKER_PATHS,
  OfferKind,
  landingTemplate,
  publisherPostbackTemplate,
} from '../config';
import { request, asRecord, HttpResult } from './http';

export interface Fixtures {
  publisherId: number;
  offers: Record<OfferKind, number>;
}

/** Admin session against the tracker API, plus creation and cleanup of the sandbox test records. */
export class TrackerAdmin {
  private token: string | null = null;
  private fixtures: Fixtures | null = null;

  constructor(
    private readonly baseUrl: string = config.trackerUrl,
    private readonly email: string = config.adminEmail,
    private readonly password: string = config.adminPassword
  ) {}

  get cachedFixtures(): Fixtures | null {
    return this.fixtures;
  }

  private async login(): Promise<string> {
    if (!this.email || !this.password) {
      throw new Error('TRACKER_ADMIN_EMAIL and TRACKER_ADMIN_PASSWORD are not set');
    }
    const res = await request(`${this.baseUrl}${TRACKER_PATHS.login}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: this.email, password: this.password }),
    });
    const token = asRecord(res.body).token;
    if (res.status !== 200 || typeof token !== 'string') {
      throw new Error(`Tracker admin login failed (HTTP ${res.status})`);
    }
    this.token = token;
    return token;
  }

  /** Authenticated call; logs in again once if the session expired. */
  async call(path: string, init: RequestInit = {}): Promise<HttpResult> {
    const send = async (token: string) =>
      request(`${this.baseUrl}${path}`, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}), Authorization: `Bearer ${token}` },
      });
    let res = await send(this.token ?? (await this.login()));
    if (res.status === 401) res = await send(await this.login());
    return res;
  }

  private async expectOk(res: HttpResult, what: string): Promise<Record<string, unknown>> {
    if (res.status < 200 || res.status >= 300) {
      const message = asRecord(res.body).message ?? JSON.stringify(res.body).slice(0, 200);
      throw new Error(`${what} failed (HTTP ${res.status}): ${message}`);
    }
    return asRecord(res.body);
  }

  private async findOrCreateNetwork(name: string, allowDuplicateConversions: boolean): Promise<number> {
    const list = await this.expectOk(await this.call(TRACKER_PATHS.networks), 'List networks');
    const found = (list.networks as Array<{ id: number; name: string }> | undefined)?.find((n) => n.name === name);
    if (found) return found.id;
    const created = await this.expectOk(
      await this.call(TRACKER_PATHS.networks, {
        method: 'POST',
        body: JSON.stringify({ name, allowDuplicateConversions, contactDetails: 'Test-only network created by the sandbox' }),
      }),
      `Create network "${name}"`
    );
    return Number(created.id);
  }

  private async findOrCreatePublisher(): Promise<number> {
    const list = await this.expectOk(
      await this.call(`${TRACKER_PATHS.publishers}?search=${encodeURIComponent(SANDBOX_RECORDS.publisherEmail)}&limit=100`),
      'Find sandbox publisher'
    );
    const rows = (list.data ?? list.publishers) as Array<{ id: number; email: string; postbackUrl: string | null }> | undefined;
    const found = rows?.find((p) => p.email === SANDBOX_RECORDS.publisherEmail);
    const postbackUrl = publisherPostbackTemplate();
    if (found) {
      if (found.postbackUrl !== postbackUrl) {
        await this.expectOk(
          await this.call(`${TRACKER_PATHS.publishers}/${found.id}`, { method: 'PUT', body: JSON.stringify({ postbackUrl }) }),
          'Update sandbox publisher postback URL'
        );
      }
      return found.id;
    }
    const created = await this.expectOk(
      await this.call(TRACKER_PATHS.publishers, {
        method: 'POST',
        body: JSON.stringify({
          name: SANDBOX_RECORDS.publisherName,
          email: SANDBOX_RECORDS.publisherEmail,
          // Nobody logs in as this publisher; a random password keeps the account closed
          password: crypto.randomBytes(18).toString('base64url'),
          postbackUrl,
        }),
      }),
      'Create sandbox publisher'
    );
    return Number(created.id);
  }

  private offerBody(name: string, networkId: number, publisherId: number, token: string) {
    return {
      general: { name, networkId, visibility: 'PUBLIC', status: 'ACTIVE', description: 'Test-only offer created by the sandbox' },
      tracking: { destinationUrl: landingTemplate(), advertiserSecurityToken: token, enforceIpUniqueness: false, blockDuplicateIps: false },
      targeting: {},
      affiliates: { enabledPublisherIds: [publisherId] },
      revenuePayouts: { ...SANDBOX_PAYOUT, title: 'Default', goalValue: '1', paymentModel: 'CPA_FIXED' },
    };
  }

  private async findOrCreateOffer(kind: OfferKind, networkId: number, publisherId: number): Promise<number> {
    const name = SANDBOX_RECORDS.offers[kind];
    const token = kind === 'token' ? config.offerToken : '';
    const list = await this.expectOk(await this.call(TRACKER_PATHS.offers), 'List offers');
    const found = (list.offers as Array<{ id: number; name: string; destinationUrl: string }> | undefined)?.find(
      (o) => o.name === name
    );
    const body = JSON.stringify(this.offerBody(name, networkId, publisherId, token));
    if (found) {
      // Keep the offer pointing at this sandbox's current address and token
      await this.expectOk(await this.call(`${TRACKER_PATHS.offers}/${found.id}`, { method: 'PUT', body }), `Update offer "${name}"`);
      return found.id;
    }
    const created = await this.expectOk(await this.call(TRACKER_PATHS.offers, { method: 'POST', body }), `Create offer "${name}"`);
    return Number(created.id);
  }

  /** Creates (or refreshes) the sandbox network, publisher and offers in the tracker. Safe to run many times. */
  async ensureFixtures(): Promise<Fixtures> {
    const strictNetwork = await this.findOrCreateNetwork(SANDBOX_RECORDS.strictNetwork, false);
    const openNetwork = await this.findOrCreateNetwork(SANDBOX_RECORDS.openNetwork, true);
    const publisherId = await this.findOrCreatePublisher();
    const offers: Record<OfferKind, number> = {
      strict: await this.findOrCreateOffer('strict', strictNetwork, publisherId),
      open: await this.findOrCreateOffer('open', openNetwork, publisherId),
      token: await this.findOrCreateOffer('token', strictNetwork, publisherId),
    };
    this.fixtures = { publisherId, offers };
    return this.fixtures;
  }

  /**
   * Deletes the sandbox offers (their clicks and conversions go with them), so test data
   * disappears from reports. The next setup creates fresh offers. Postback log rows are kept as history.
   */
  async cleanup(): Promise<{ deletedOffers: string[] }> {
    const list = await this.expectOk(await this.call(TRACKER_PATHS.offers), 'List offers');
    const names = Object.values(SANDBOX_RECORDS.offers) as string[];
    const targets = ((list.offers as Array<{ id: number; name: string }> | undefined) ?? []).filter((o) => names.includes(o.name));
    for (const offer of targets) {
      await this.expectOk(await this.call(`${TRACKER_PATHS.offers}/${offer.id}`, { method: 'DELETE' }), `Delete offer "${offer.name}"`);
    }
    this.fixtures = null;
    return { deletedOffers: targets.map((o) => o.name) };
  }

  /** The tracker's own log of postbacks for one click (admin endpoint). */
  async postbackLogs(clickId: string): Promise<Array<Record<string, unknown>>> {
    const res = await this.call(`${TRACKER_PATHS.postbackLogs}?clickId=${encodeURIComponent(clickId)}`);
    return res.status === 200 ? ((asRecord(res.body).data as Array<Record<string, unknown>>) ?? []) : [];
  }
}

export const trackerAdmin = new TrackerAdmin();
