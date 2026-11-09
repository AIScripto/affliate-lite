/**
 * Postback receiver integration tests (needs the database).
 * Simulates how different networks call the postback link: GET/POST/JSON, aliases,
 * retries, status changes, security token, multi-goal policy, RevShare, concurrency, logging.
 * Creates its own network/offers/publisher and removes them afterwards.
 * DOD Rule 7: positive flows, edge cases, and error recovery.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../src/index';
import { prisma } from '../src/db/prisma';
import { sendPublisherPostback } from '../src/services/postback/publisherPostback';

const TOKEN = 'sec_RECEIVER_TEST';
const RUN = Date.now();

let server: http.Server;
let baseUrl: string;
let adminToken: string;
let publisherId: number;
let strictNetworkId: number;
let openNetworkId: number;
let offerStrict: number; // network blocks a 2nd conversion per click
let offerOpen: number; // network allows several goals per click
let offerToken: number; // requires the security token
let offerRevShare: number; // 30% revenue / 20% payout of the sale

async function newClick(offerId: number): Promise<string> {
  const res = await fetch(`${baseUrl}/click?offer_id=${offerId}&aff_id=${publisherId}&sub_id=rcv&json=1`);
  const body = await res.json();
  assert.ok(body.clickId, JSON.stringify(body));
  return body.clickId;
}

async function postback(query: string, init?: RequestInit) {
  const res = await fetch(`${baseUrl}/postback?${query}`, init);
  return { status: res.status, body: await res.json() };
}

test.before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
      resolve();
    });
  });
  const login = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'zeeshan@gmail.com', password: 'password123' }),
  });
  adminToken = (await login.json()).token;

  const pub = await prisma.user.create({
    data: { name: 'Receiver Test Pub', email: `rcv.${RUN}@example.com`, passwordHash: 'x', role: 'PUBLISHER', status: 'ACTIVE' },
  });
  publisherId = pub.id;
  strictNetworkId = (await prisma.network.create({ data: { name: `RCV Strict ${RUN}`, allowDuplicateConversions: false } })).id;
  openNetworkId = (await prisma.network.create({ data: { name: `RCV Open ${RUN}`, allowDuplicateConversions: true } })).id;

  const mkOffer = async (name: string, networkId: number, extra: object, payout: object) =>
    (
      await prisma.offer.create({
        data: {
          name: `RCV ${name} ${RUN}`,
          networkId,
          visibility: 'PUBLIC',
          status: 'ACTIVE',
          destinationUrl: 'https://advertiser.example/?c={clickid}',
          ...extra,
          payouts: { create: [{ goalValue: '1', currency: 'USD', revenue: 80, payout: 50, ...payout }] },
        },
      })
    ).id;

  offerStrict = await mkOffer('Strict', strictNetworkId, {}, {});
  offerOpen = await mkOffer('Open', openNetworkId, {}, {});
  offerToken = await mkOffer('Token', strictNetworkId, { advertiserSecurityToken: TOKEN }, {});
  offerRevShare = await mkOffer('RevShare', strictNetworkId, {}, { paymentModel: 'REVSHARE', revenue: 30, payout: 20 });
});

test.after(async () => {
  const offerIds = [offerStrict, offerOpen, offerToken, offerRevShare];
  await prisma.postbackLog.deleteMany({ where: { offerId: { in: offerIds } } });
  await prisma.conversion.deleteMany({ where: { offerId: { in: offerIds } } });
  await prisma.click.deleteMany({ where: { offerId: { in: offerIds } } });
  await prisma.offer.deleteMany({ where: { id: { in: offerIds } } });
  await prisma.network.deleteMany({ where: { id: { in: [strictNetworkId, openNetworkId] } } });
  await prisma.user.delete({ where: { id: publisherId } });
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await prisma.$disconnect();
});

test('Request formats: GET, POST form, POST JSON, click_id alias, uppercase ID', async () => {
  const c1 = await newClick(offerStrict);
  assert.equal((await postback(`clickid=${c1}`)).status, 200);

  const c2 = await newClick(offerStrict);
  const form = await postback('', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `clickid=${c2}&goal=1` });
  assert.equal(form.status, 200);

  const c3 = await newClick(offerStrict);
  const json = await postback('', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ clickid: c3 }) });
  assert.equal(json.status, 200);

  const c4 = await newClick(offerStrict);
  const upper = await postback(`click_id=${c4.toUpperCase()}`);
  assert.equal(upper.status, 200);
  assert.equal(upper.body.clickId, c4, 'stored in normal lowercase form');
});

test('Amounts and order ID: offer payout, sum override, action_id stored', async () => {
  const c = await newClick(offerStrict);
  const r = await postback(`clickid=${c}&sum=49.99&action_id=ORD-${RUN}`);
  assert.equal(r.status, 200);
  assert.equal(r.body.revenue, 49.99);
  assert.equal(r.body.payout, 50);
  assert.equal(r.body.externalTxId, `ORD-${RUN}`);
});

test('RevShare: payout is a percentage of the sale amount', async () => {
  const c = await newClick(offerRevShare);
  const r = await postback(`clickid=${c}&sum=200`);
  assert.equal(r.body.revenue, 60);
  assert.equal(r.body.payout, 40);
});

test('Retry: the same postback twice is answered 200 with duplicate:true and changes nothing', async () => {
  const c = await newClick(offerStrict);
  const first = await postback(`clickid=${c}&goal=1`);
  const second = await postback(`clickid=${c}&goal=1`);
  assert.equal(second.status, 200);
  assert.equal(second.body.duplicate, true);
  assert.equal(second.body.conversionId, first.body.conversionId);
  assert.equal(await prisma.conversion.count({ where: { clickId: c } }), 1);
});

test('Status lifecycle: pending -> approved -> chargeback updates one conversion', async () => {
  const c = await newClick(offerStrict);
  const pending = await postback(`clickid=${c}&status=2`);
  assert.equal(pending.body.status, 'UNCHECKED');

  const approved = await postback(`clickid=${c}&status=approved`);
  assert.equal(approved.status, 200);
  assert.equal(approved.body.updated, true);
  assert.equal(approved.body.previousStatus, 'UNCHECKED');
  assert.equal(approved.body.status, 'APPROVED');

  const chargeback = await postback(`clickid=${c}&status=chargeback`);
  assert.equal(chargeback.body.status, 'DECLINED');
  assert.equal(chargeback.body.conversionId, pending.body.conversionId);
  assert.equal(await prisma.conversion.count({ where: { clickId: c } }), 1);
});

test('Status lifecycle: order ID sent later is filled in, never overwritten', async () => {
  const c = await newClick(offerStrict);
  await postback(`clickid=${c}&status=2`);
  const withId = await postback(`clickid=${c}&status=1&action_id=FIRST`);
  assert.equal(withId.body.externalTxId, 'FIRST');
  const changed = await postback(`clickid=${c}&status=3&action_id=SECOND`);
  assert.equal(changed.body.externalTxId, 'FIRST');
});

test('Multi-goal: strict network refuses goal 2; open network records it', async () => {
  const strict = await newClick(offerStrict);
  await postback(`clickid=${strict}&goal=1`);
  const refused = await postback(`clickid=${strict}&goal=2`);
  assert.equal(refused.status, 409);
  assert.match(refused.body.message, /allows only one per click/);

  const open = await newClick(offerOpen);
  const g1 = await postback(`clickid=${open}&goal=1`);
  const g2 = await postback(`clickid=${open}&goal=2`);
  assert.equal(g2.status, 200);
  assert.notEqual(g2.body.conversionId, g1.body.conversionId);
});

test('Security token: secure_token (as the panel builds it), legacy names and header accepted', async () => {
  const ways: Array<[string, RequestInit | undefined]> = [
    [`secure_token=${TOKEN}`, undefined],
    [`token=${TOKEN}`, undefined],
    [`security_token=${TOKEN}`, undefined],
    ['', { headers: { 'x-advertiser-token': TOKEN } }],
  ];
  for (const [qs, init] of ways) {
    const c = await newClick(offerToken);
    const r = await postback(`clickid=${c}${qs ? `&${qs}` : ''}`, init);
    assert.equal(r.status, 200, qs || 'header');
  }
});

test('Security token: missing or wrong token is refused and nothing is recorded', async () => {
  const c = await newClick(offerToken);
  assert.equal((await postback(`clickid=${c}`)).status, 403);
  assert.equal((await postback(`clickid=${c}&secure_token=WRONG`)).status, 403);
  assert.equal((await postback(`clickid=${c}&secure_token=${TOKEN.toLowerCase()}`)).status, 403);
  assert.equal(await prisma.conversion.count({ where: { clickId: c } }), 0);
});

test('Bad input: clear 400/404 answers, nothing recorded', async () => {
  const c = await newClick(offerStrict);
  const cases: Array<[string, number, RegExp]> = [
    ['clickid={clickid}', 400, /Invalid clickid format/],
    ['goal=1', 400, /Missing clickid/],
    [`clickid=${c}&sum=-5`, 400, /positive number/],
    [`clickid=${c}&sum=1e20`, 400, /positive number/],
    [`clickid=${c}&status=maybe`, 400, /Unknown status/],
    ['clickid=00000000-0000-4000-8000-000000000000', 404, /Invalid clickid/],
  ];
  for (const [qs, code, msg] of cases) {
    const r = await postback(qs);
    assert.equal(r.status, code, qs);
    assert.match(r.body.message, msg, qs);
  }
  assert.equal(await prisma.conversion.count({ where: { clickId: c } }), 0);
});

test('Concurrency: 15 identical postbacks at once create exactly one conversion, all answered 200', async () => {
  for (const offerId of [offerStrict, offerToken]) {
    const c = await newClick(offerId);
    const qs = `clickid=${c}&goal=1${offerId === offerToken ? `&secure_token=${TOKEN}` : ''}`;
    const results = await Promise.all(Array.from({ length: 15 }, () => postback(qs)));
    assert.deepEqual(new Set(results.map((r) => r.status)), new Set([200]));
    assert.equal(results.filter((r) => !r.body.duplicate).length, 1);
    assert.equal(await prisma.conversion.count({ where: { clickId: c } }), 1);
  }
});

test('Logging: every postback is logged with outcome; tokens are masked', async () => {
  const c = await newClick(offerToken);
  await postback(`clickid=${c}&secure_token=WRONG`);
  await postback(`clickid=${c}&secure_token=${TOKEN}`);
  await postback(`clickid=${c}&secure_token=${TOKEN}`);

  const res = await fetch(`${baseUrl}/api/v1/postback-logs?clickId=${c}`, { headers: { Authorization: `Bearer ${adminToken}` } });
  assert.equal(res.status, 200);
  const { data } = await res.json();
  const outcomes = data.filter((l: { direction: string }) => l.direction === 'INBOUND').map((l: { outcome: string }) => l.outcome).reverse();
  assert.deepEqual(outcomes, ['REJECTED', 'CREATED', 'DUPLICATE']);
  assert.doesNotMatch(JSON.stringify(data), new RegExp(TOKEN));
});

test('Publisher postback: sent with encoded macros, logged as SENT', async () => {
  let calledUrl = '';
  let redirectMode: RequestRedirect | undefined;
  const fakeFetch = (async (url: string, init?: RequestInit) => {
    calledUrl = url;
    redirectMode = init?.redirect;
    return new Response('OK', { status: 200 });
  }) as unknown as typeof fetch;

  await sendPublisherPostback(
    {
      template: 'https://pub.example/pb?c={clickid}&p={payout}&s={sub_id}&g={goal}',
      macros: { clickid: 'abc', payout: '12.5', sub_id: 'x&y', goal: '1' },
      clickId: `log-test-${RUN}`, conversionId: 1, offerId: offerStrict, publisherId,
    },
    { fetchFn: fakeFetch, lookup: async () => [{ address: '93.184.216.34' }] }
  );

  assert.equal(calledUrl, 'https://pub.example/pb?c=abc&p=12.5&s=x%26y&g=1');
  assert.equal(redirectMode, 'manual', 'redirects must not be followed');
  const log = await prisma.postbackLog.findFirstOrThrow({ where: { clickId: `log-test-${RUN}` } });
  assert.equal(log.direction, 'OUTBOUND');
  assert.equal(log.outcome, 'SENT');
});

test('Publisher postback: internal address is blocked and never called', async () => {
  let called = false;
  const fakeFetch = (async () => {
    called = true;
    return new Response('', { status: 200 });
  }) as unknown as typeof fetch;
  await sendPublisherPostback(
    { template: 'http://169.254.169.254/latest/meta-data', macros: {}, clickId: `ssrf-${RUN}`, conversionId: 1, offerId: offerStrict, publisherId },
    { fetchFn: fakeFetch }
  );
  assert.equal(called, false);
  const log = await prisma.postbackLog.findFirstOrThrow({ where: { clickId: `ssrf-${RUN}` } });
  assert.equal(log.outcome, 'BLOCKED');
});

test('Publisher postback: server error and timeout are logged as FAILED', async () => {
  const lookup = async () => [{ address: '93.184.216.34' }];
  await sendPublisherPostback(
    { template: 'https://pub.example/pb', macros: {}, clickId: `fail-${RUN}`, conversionId: 1, offerId: offerStrict, publisherId },
    { fetchFn: (async () => new Response('', { status: 500 })) as unknown as typeof fetch, lookup }
  );
  await sendPublisherPostback(
    { template: 'https://pub.example/pb', macros: {}, clickId: `timeout-${RUN}`, conversionId: 1, offerId: offerStrict, publisherId },
    { fetchFn: (async () => { throw new Error('The operation was aborted due to timeout'); }) as unknown as typeof fetch, lookup }
  );
  const fail = await prisma.postbackLog.findFirstOrThrow({ where: { clickId: `fail-${RUN}` } });
  const timeout = await prisma.postbackLog.findFirstOrThrow({ where: { clickId: `timeout-${RUN}` } });
  assert.equal(fail.outcome, 'FAILED');
  assert.equal(fail.httpStatus, 500);
  assert.equal(timeout.outcome, 'FAILED');
  assert.match(timeout.message ?? '', /timeout/);
});

test('Postback log endpoint: admin only, filters validated', async () => {
  const pubLogin = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'farhan@gmail.com', password: 'password123' }),
  });
  const pubToken = (await pubLogin.json()).token;
  assert.equal((await fetch(`${baseUrl}/api/v1/postback-logs`, { headers: { Authorization: `Bearer ${pubToken}` } })).status, 403);
  assert.equal((await fetch(`${baseUrl}/api/v1/postback-logs?outcome=NOPE`, { headers: { Authorization: `Bearer ${adminToken}` } })).status, 400);
  assert.equal((await fetch(`${baseUrl}/api/v1/postback-logs?limit=5000`, { headers: { Authorization: `Bearer ${adminToken}` } })).status, 400);
});

test('Pixels: image and iframe snippets from the offer builder record conversions', async () => {
  const c1 = await newClick(offerStrict);
  const img = await fetch(`${baseUrl}/api/v1/postback/pixel.jpg?offer_id=${offerStrict}&clickid=${c1}`);
  assert.equal(img.status, 200);
  assert.equal(img.headers.get('content-type'), 'image/gif');
  assert.equal(img.headers.get('x-postback-status'), '200');
  assert.ok((await img.arrayBuffer()).byteLength > 0);
  assert.equal(await prisma.conversion.count({ where: { clickId: c1 } }), 1);

  const c2 = await newClick(offerStrict);
  const frame = await fetch(`${baseUrl}/postback/pixel.html?clickid=${c2}`);
  assert.equal(frame.status, 200);
  assert.match(frame.headers.get('content-type') ?? '', /text\/html/);
  assert.equal(await prisma.conversion.count({ where: { clickId: c2 } }), 1);
});

test('Pixels: a bad request still returns an image (never a broken image on the advertiser page)', async () => {
  const res = await fetch(`${baseUrl}/api/v1/postback/pixel.jpg?clickid={clickid}`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'image/gif');
  assert.equal(res.headers.get('x-postback-status'), '400');
});

test('Pixels: security token is still required', async () => {
  const c = await newClick(offerToken);
  const denied = await fetch(`${baseUrl}/api/v1/postback/pixel.jpg?clickid=${c}`);
  assert.equal(denied.headers.get('x-postback-status'), '403');
  assert.equal(await prisma.conversion.count({ where: { clickId: c } }), 0);
  const allowed = await fetch(`${baseUrl}/api/v1/postback/pixel.jpg?clickid=${c}&secure_token=${TOKEN}`);
  assert.equal(allowed.headers.get('x-postback-status'), '200');
});

test('Pixels: script pixel (/sdk/pixel.js) records the conversion and returns JavaScript', async () => {
  const c = await newClick(offerStrict);
  const res = await fetch(`${baseUrl}/sdk/pixel.js?clickid=${c}&goal=1`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') ?? '', /javascript/);
  assert.equal(res.headers.get('x-postback-status'), '200');
  assert.equal(await prisma.conversion.count({ where: { clickId: c } }), 1);
});

test('Offers API: postbackUrl uses the address the panel is opened on, not localhost', async () => {
  const res = await fetch(`${baseUrl}/api/v1/offers`, {
    headers: { Authorization: `Bearer ${adminToken}`, 'X-Forwarded-Host': '161.97.110.121:3085' },
  });
  const { offers } = await res.json();
  const url: string = offers[0].postbackUrl;
  assert.ok(url.startsWith('http://161.97.110.121:3085/api/v1/postback?clickid='), url);
});
