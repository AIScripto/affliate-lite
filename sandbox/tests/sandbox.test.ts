/**
 * Sandbox unit tests (no tracker needed).
 * DOD Rule 7: positive flows, edge cases, and error recovery.
 * The end-to-end scenarios themselves are run with `npm run test:all` against a tracker.
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { isPrivateAddress, landingTemplate, publisherPostbackTemplate } from '../src/config';
import { EventStore, maskSecrets } from '../src/store';
import { PROFILES } from '../src/tracker/profiles';
import { SCENARIOS } from '../src/scenarios/catalog';
import { createApp } from '../src/server';
import { TrackerAdmin } from '../src/tracker/admin';

const T = 'http://tracker.test';
const CLICK = '465ef6eb-3e24-4134-afbe-03c1a2b3c4d5';

describe('isPrivateAddress', () => {
  it('local and private addresses are private', () => {
    for (const u of ['http://localhost:9999', 'http://127.0.0.1:9999', 'http://10.0.0.5', 'http://172.20.1.1', 'http://192.168.1.10', 'http://box.local', 'not a url']) {
      assert.equal(isPrivateAddress(u), true, u);
    }
  });
  it('public addresses and names are not', () => {
    for (const u of ['http://161.97.110.121:9999', 'https://sandbox.example.com', 'http://172.32.0.1']) {
      assert.equal(isPrivateAddress(u), false, u);
    }
  });
});

describe('Templates the sandbox saves in the tracker', () => {
  it('offer destination carries the click ID macro', () => {
    assert.match(landingTemplate(), /\/network\/landing\?clickid=\{clickid\}/);
  });
  it('publisher postback asks for every macro the tracker fills', () => {
    for (const macro of ['clickid', 'payout', 'goal', 'status', 'sub_id', 'conversion_id']) {
      assert.match(publisherPostbackTemplate(), new RegExp(`\\{${macro}\\}`), macro);
    }
  });
});

describe('Postback profiles', () => {
  const input = { clickId: CLICK, goal: '1', status: '2', sum: '9.5', orderId: 'O-1', token: 'sec' };

  it('standard link uses the names the panel advertises', () => {
    const { url, init } = PROFILES.get.build(T, input);
    const q = new URL(url).searchParams;
    assert.equal(init.method, 'GET');
    assert.deepEqual(
      [q.get('clickid'), q.get('goal'), q.get('status'), q.get('sum'), q.get('action_id'), q.get('secure_token')],
      [CLICK, '1', '2', '9.5', 'O-1', 'sec']
    );
  });

  it('alias and upper-case profiles use other names', () => {
    const alias = new URL(PROFILES['alias-names'].build(T, input).url).searchParams;
    assert.equal(alias.get('click_id'), CLICK);
    assert.equal(alias.get('amount'), '9.5');
    assert.equal(alias.get('transaction_id'), 'O-1');
    const upper = new URL(PROFILES['upper-case'].build(T, input).url).searchParams;
    assert.equal(upper.get('CLICKID'), CLICK);
    assert.equal(upper.get('SECURE_TOKEN'), 'sec');
  });

  it('POST profiles send a body, not a query', () => {
    const form = PROFILES['post-form'].build(T, input);
    assert.equal(form.init.method, 'POST');
    assert.equal(new URL(form.url).search, '');
    assert.match(String(form.init.body), /clickid=/);
    const json = PROFILES['post-json'].build(T, input);
    assert.equal(JSON.parse(String(json.init.body)).clickid, CLICK);
  });

  it('header-token keeps the token out of the link', () => {
    const { url, init } = PROFILES['header-token'].build(T, input);
    assert.equal(new URL(url).searchParams.get('secure_token'), null);
    assert.equal((init.headers as Record<string, string>)['X-Advertiser-Token'], 'sec');
  });

  it('pixels hit the pixel paths and read the result from a header', () => {
    assert.match(PROFILES['pixel-image'].build(T, input).url, /\/api\/v1\/postback\/pixel\.jpg\?/);
    assert.match(PROFILES['pixel-script'].build(T, input).url, /\/sdk\/pixel\.js\?/);
    assert.equal(PROFILES['pixel-image'].resultFromHeader, true);
    assert.equal(PROFILES.get.resultFromHeader, false);
  });

  it('values that are not given are not sent', () => {
    const q = new URL(PROFILES.get.build(T, { clickId: CLICK }).url).searchParams;
    assert.deepEqual([...q.keys()], ['clickid']);
  });
});

describe('EventStore', () => {
  it('keeps only the newest events and lists newest first', () => {
    const s = new EventStore(3);
    for (let i = 1; i <= 5; i++) s.add('postback-sent', CLICK, `e${i}`);
    assert.deepEqual(s.list().map((e) => e.summary), ['e5', 'e4', 'e3']);
  });

  it('matches click IDs without case and counts by type', () => {
    const s = new EventStore();
    s.add('publisher-received', CLICK.toUpperCase(), 'x');
    s.add('postback-sent', CLICK, 'y');
    assert.equal(s.count('publisher-received', CLICK), 1);
    assert.equal(s.list(10, CLICK.toUpperCase()).length, 2);
  });

  it('masks tokens in stored links', () => {
    const masked = maskSecrets(`${T}/api/v1/postback?clickid=1&secure_token=abc&token=def`);
    assert.doesNotMatch(masked, /abc|def/);
    assert.equal(maskSecrets('not a url'), 'not a url');
  });
});

describe('Scenario catalog', () => {
  it('ids are unique and every scenario has steps', () => {
    assert.equal(new Set(SCENARIOS.map((s) => s.id)).size, SCENARIOS.length);
    for (const s of SCENARIOS) {
      assert.ok(s.steps.length > 0, s.id);
      assert.ok(s.publisherPostbacks >= 0, s.id);
    }
  });

  it('covers the agreed areas', () => {
    const ids = SCENARIOS.map((s) => s.id);
    for (const id of ['basic', 'retry', 'lifecycle', 'token', 'bad-input', 'burst', 'pixel-image', 'second-goal-open']) {
      assert.ok(ids.includes(id), id);
    }
  });
});

describe('Sandbox server', () => {
  let server: http.Server;
  let base: string;
  const events = new EventStore();
  const auth = { Authorization: `Basic ${Buffer.from('any:pw').toString('base64')}` };

  before(async () => {
    const app = createApp({ admin: new TrackerAdmin('http://127.0.0.1:1', 'a', 'b'), events, password: 'pw' });
    await new Promise<void>((r) => {
      server = app.listen(0, () => r());
    });
    const addr = server.address();
    base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
  });
  after(() => server.close());

  it('health and publisher receiver are public', async () => {
    assert.equal((await fetch(`${base}/health`)).status, 200);
    const res = await fetch(`${base}/publisher/postback?clickid=${CLICK}&payout=6&status=APPROVED&goal=1`);
    assert.equal(await res.text(), 'OK');
    const [event] = events.list(1, CLICK);
    assert.equal(event?.type, 'publisher-received');
    assert.equal((event?.data.query as Record<string, string>).payout, '6');
  });

  it('publisher receiver also accepts POST', async () => {
    await fetch(`${base}/publisher/postback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clickid: 'post-test', payout: '6' }) });
    assert.equal(events.count('publisher-received', 'post-test'), 1);
  });

  it('screen and API need the password', async () => {
    assert.equal((await fetch(`${base}/`)).status, 401);
    assert.equal((await fetch(`${base}/api/status`, { headers: { Authorization: `Basic ${Buffer.from('x:wrong').toString('base64')}` } })).status, 401);
    assert.equal((await fetch(`${base}/`, { headers: auth })).status, 200);
  });

  it('status lists the scenarios and the postback links', async () => {
    const s = await (await fetch(`${base}/api/status`, { headers: auth })).json();
    assert.equal(s.scenarios.length, SCENARIOS.length);
    assert.match(s.postbackUrls.basic, /\/api\/v1\/postback\?clickid=\{clickid\}$/);
  });

  it('unknown test is a 404; tracker errors come back as a readable message', async () => {
    const unknown = await fetch(`${base}/api/run`, { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'nope' }) });
    assert.equal(unknown.status, 404);
    const setup = await fetch(`${base}/api/setup`, { method: 'POST', headers: auth });
    assert.equal(setup.status, 500);
    assert.ok((await setup.json()).message);
  });

  it('landing page escapes the click ID', async () => {
    const html = await (await fetch(`${base}/network/landing?clickid=%3Cscript%3Ex%3C/script%3E`, { headers: auth })).text();
    assert.doesNotMatch(html, /<script>x<\/script>/);
  });

  it('without a configured password everything except the receiver stays locked', async () => {
    const app = createApp({ admin: new TrackerAdmin('http://127.0.0.1:1', 'a', 'b'), events: new EventStore(), password: '' });
    const s = await new Promise<http.Server>((r) => {
      const srv = app.listen(0, () => r(srv));
    });
    const addr = s.address();
    const b = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;
    assert.equal((await fetch(`${b}/`, { headers: auth })).status, 503);
    assert.equal((await fetch(`${b}/publisher/postback?clickid=x`)).status, 200);
    s.close();
  });
});
