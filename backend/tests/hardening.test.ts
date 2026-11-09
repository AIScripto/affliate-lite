/**
 * Integration tests for the Nov 2026 hardening fixes (needs the seeded database).
 * DOD Rule 7: positive flows, edge cases, and error recovery.
 * 1. Bad input returns 4xx and the server keeps running.
 * 2. Publishers never receive revenue, margin, or secrets.
 * 3. Publishers only reach offers they are allowed to see.
 * 4. Graph totals match KPI totals.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../src/index';
import { prisma } from '../src/db/prisma';

let server: http.Server;
let baseUrl: string;
let adminToken: string;
let publisherToken: string;

async function login(email: string): Promise<string> {
  const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' }),
  });
  return (await res.json()).token;
}

const get = (path: string, token?: string) =>
  fetch(`${baseUrl}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

async function assertServerAlive() {
  const res = await get('/health');
  assert.equal(res.status, 200, 'server must still be running');
}

const HIDDEN_KEY_REGEX = /"[a-zA-Z]*(revenue|margin|profit|income|gross)[a-zA-Z]*"|"(advertiserSecurityToken|passwordHash|contactDetails|email)"/i;

test.before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
      resolve();
    });
  });
  adminToken = await login('zeeshan@gmail.com');
  publisherToken = await login('farhan@gmail.com');
});

test.after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await prisma.$disconnect();
});

test('Crash safety: bad report filters return 400 and the server stays up', async () => {
  const badQueries = [
    '/api/v1/reports/conversions?status=FOO',
    '/api/v1/reports/conversions?networkId=abc',
    '/api/v1/reports/traffic?offerId=-3',
    '/api/v1/reports/overview?dateFrom=garbage',
    '/api/v1/reports/conversions?minAmount=-5',
  ];
  for (const path of badQueries) {
    for (const token of [adminToken, publisherToken]) {
      const res = await get(path, token);
      assert.equal(res.status, 400, path);
      const body = await res.json();
      assert.equal(body.error, 'Validation failed');
    }
  }
  await assertServerAlive();
});

test('Crash safety: valid filters still work (lowercase status, zero amount)', async () => {
  const res = await get('/api/v1/reports/conversions?status=approved&minAmount=0', adminToken);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.data.every((r: { status: string }) => r.status === 'APPROVED'));
});

test('Crash safety: postback with non-UUID clickid returns 400, server stays up', async () => {
  for (const clickid of ['%7Bclickid%7D', 'abc', '1%27%20OR%20%271%27%3D%271']) {
    const res = await get(`/postback?clickid=${clickid}&goal=1`);
    assert.equal(res.status, 400, clickid);
    assert.match((await res.json()).message, /Invalid clickid format/);
  }
  // Repeated key: first value is used
  const repeated = await get('/postback?clickid=abc&clickid=def');
  assert.equal(repeated.status, 400);
  await assertServerAlive();
});

test('Crash safety: unknown UUID clickid returns 404; malformed JSON body returns 400', async () => {
  const unknown = await get('/postback?click_id=00000000-0000-0000-0000-000000000000');
  assert.equal(unknown.status, 404);

  const badJson = await fetch(`${baseUrl}/postback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{bad',
  });
  assert.equal(badJson.status, 400);
  await assertServerAlive();
});

test('Crash safety: unexpected database error returns generic 500 without internals', async () => {
  const offer = await prisma.offer.findFirst({ where: { status: 'ACTIVE' } });
  assert.ok(offer);
  // sub_id column is VARCHAR(255): 300 chars makes the insert fail inside Prisma
  const res = await get(`/click?offer_id=${offer.id}&json=1&sub_id=${'x'.repeat(300)}`);
  assert.equal(res.status, 500);
  const text = await res.text();
  assert.doesNotMatch(text, /prisma|invocation|column/i, 'no internal error details in response');
  await assertServerAlive();
});

test('Publisher filter: no revenue, margin, or secrets in any publisher response', async () => {
  const endpoints = [
    '/api/v1/reports/overview',
    '/api/v1/reports/networks',
    '/api/v1/reports/offers',
    '/api/v1/reports/publishers',
    '/api/v1/reports/conversions',
    '/api/v1/reports/traffic',
    '/api/v1/dashboard/summary',
    '/api/v1/offers',
  ];
  for (const path of endpoints) {
    const res = await get(path, publisherToken);
    assert.equal(res.status, 200, path);
    const text = await res.text();
    assert.doesNotMatch(text, HIDDEN_KEY_REGEX, `${path} leaks a hidden field`);
  }
});

test('Publisher filter: admin still receives revenue and margin', async () => {
  const body = await (await get('/api/v1/reports/overview', adminToken)).json();
  assert.equal(typeof body.summary.totalRevenue, 'number');
  assert.equal(typeof body.summary.netMargin, 'number');
});

test('Publisher filter: dates reach publishers as ISO strings, not {}', async () => {
  const body = await (await get('/api/v1/reports/conversions', publisherToken)).json();
  for (const row of body.data) {
    assert.equal(typeof row.date, 'string');
  }
});

test('Offer access: publisher cannot open a private unassigned offer or see its token', async () => {
  const publisher = await prisma.user.findUniqueOrThrow({ where: { email: 'farhan@gmail.com' } });
  const network = await prisma.network.findFirstOrThrow();
  const privateOffer = await prisma.offer.create({
    data: {
      name: `Hardening Private ${Date.now()}`,
      networkId: network.id,
      visibility: 'PRIVATE',
      status: 'ACTIVE',
      destinationUrl: 'https://example.com/?c={clickid}',
      advertiserSecurityToken: 'HARDENING_SECRET',
    },
  });

  try {
    // Not assigned: hidden from the publisher
    const denied = await get(`/api/v1/offers/${privateOffer.id}`, publisherToken);
    assert.equal(denied.status, 404);

    // Assigned: visible, but without the token or the list of other publishers
    await prisma.offerPublisher.create({
      data: { offerId: privateOffer.id, publisherId: publisher.id, isEnabled: true },
    });
    const allowed = await get(`/api/v1/offers/${privateOffer.id}`, publisherToken);
    assert.equal(allowed.status, 200);
    const text = await allowed.text();
    assert.doesNotMatch(text, /HARDENING_SECRET|advertiserSecurityToken/);
    assert.equal(JSON.parse(text).offer.publishers, undefined);

    // Admin still sees the token
    const adminView = await (await get(`/api/v1/offers/${privateOffer.id}`, adminToken)).json();
    assert.equal(adminView.offer.advertiserSecurityToken, 'HARDENING_SECRET');
  } finally {
    await prisma.offer.delete({ where: { id: privateOffer.id } });
  }
});

test('Graphs: timeline and 30-day totals match KPI totals for admin and publisher', async () => {
  for (const token of [adminToken, publisherToken]) {
    const dash = await (await get('/api/v1/dashboard/summary', token)).json();
    const sum = (rows: Array<Record<string, number>>, key: string) => rows.reduce((s, r) => s + (r[key] || 0), 0);

    assert.equal(sum(dash.timeline, 'clicks'), dash.kpis.clicks.total);
    assert.equal(sum(dash.timeline, 'conversions'), dash.kpis.conversions.total);
    assert.equal(dash.trends.clicks.at(-1), dash.kpis.clicks.total);
    assert.ok(sum(dash.trafficLast30Days, 'clicks') <= dash.kpis.clicks.total);
    assert.equal(dash.trafficLast30Days.length, 30);

    const overview = await (await get('/api/v1/reports/overview', token)).json();
    assert.equal(sum(overview.timeline, 'clicks'), overview.summary.totalClicks);
    assert.equal(sum(overview.timeline, 'conversions'), overview.summary.totalConversions);
  }
});

test('Graphs: one-day filter gives 4-hour labels and matching totals', async () => {
  const today = new Date().toISOString().slice(0, 10);
  const body = await (await get(`/api/v1/reports/overview?dateFrom=${today}&dateTo=${today}`, adminToken)).json();
  assert.equal(body.timeline.length, 6);
  assert.equal(new Set(body.timeline.map((b: { label: string }) => b.label)).size, 6, 'labels must be distinct');
  const tlClicks = body.timeline.reduce((s: number, b: { clicks: number }) => s + b.clicks, 0);
  assert.equal(tlClicks, body.summary.totalClicks);
});

test('Graphs: date range with no data returns zero buckets, not an error', async () => {
  const res = await get('/api/v1/reports/overview?dateFrom=2001-01-01&dateTo=2001-01-02', adminToken);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.summary.totalClicks, 0);
  assert.equal(body.timeline.length, 6);
});
