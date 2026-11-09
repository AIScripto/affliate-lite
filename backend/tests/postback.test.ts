/**
 * Postback modules unit tests (parameter parsing, money, token, URL safety, templates, log masking).
 * DOD Rule 7: positive flows, edge cases, and error recovery.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import { parsePostbackParams } from '../src/services/postback/params';
import { computeConversionAmounts, selectPayoutRule, tokensMatch, PayoutRule } from '../src/services/postback/payout';
import { isBlockedAddress, checkPublicUrl } from '../src/services/postback/publisherPostback';
import { sanitizeLoggedParams } from '../src/services/postback/log';
import { fillUrlTemplate } from '../src/utils/urlTemplate';
import { POSTBACK_STATUS_MAP, ORDER_ID_MAX_LENGTH } from '../src/constants/postback';

const CLICK = '465ef6eb-3e24-4134-afbe-03c1a2b3c4d5';

function parseOk(params: Record<string, unknown>, headers = {}) {
  const r = parsePostbackParams(params, headers);
  assert.ok(r.ok, `expected ok, got ${JSON.stringify(r)}`);
  return r.value;
}
function parseErr(params: Record<string, unknown>) {
  const r = parsePostbackParams(params);
  assert.ok(!r.ok, `expected error for ${JSON.stringify(params)}`);
  return r;
}

describe('parsePostbackParams', () => {
  it('positive: defaults are goal 1 and APPROVED', () => {
    const v = parseOk({ clickid: CLICK });
    assert.deepEqual(
      { goal: v.goal, status: v.status, sum: v.sum, orderId: v.orderId, token: v.token },
      { goal: '1', status: 'APPROVED', sum: undefined, orderId: undefined, token: undefined }
    );
  });

  it('positive: every advertised parameter name is read (panel docs)', () => {
    const v = parseOk({ clickid: CLICK, goal: 'sale', sum: '49.99', status: '2', action_id: 'ORD-1', secure_token: 's3c', currency: 'eur' });
    assert.equal(v.goal, 'sale');
    assert.equal(v.sum, 49.99);
    assert.equal(v.status, 'UNCHECKED');
    assert.equal(v.orderId, 'ORD-1');
    assert.equal(v.token, 's3c');
    assert.equal(v.currency, 'EUR');
  });

  it('positive: common network aliases and any letter case', () => {
    const v = parseOk({ CLICK_ID: CLICK, Amount: '10', TX_ID: 'T-9', Token: 'abc' });
    assert.equal(v.clickId, CLICK);
    assert.equal(v.sum, 10);
    assert.equal(v.orderId, 'T-9');
    assert.equal(v.token, 'abc');
    for (const key of ['transaction_id', 'order_id']) {
      assert.equal(parseOk({ clickid: CLICK, [key]: 'X' }).orderId, 'X', key);
    }
  });

  it('positive: token can come from a header', () => {
    assert.equal(parseOk({ clickid: CLICK }, { 'x-advertiser-token': 'hdr' }).token, 'hdr');
    assert.equal(parseOk({ clickid: CLICK }, { 'x-postback-token': 'hdr2' }).token, 'hdr2');
    // Query value wins over header
    assert.equal(parseOk({ clickid: CLICK, secure_token: 'q' }, { 'x-advertiser-token': 'hdr' }).token, 'q');
  });

  it('positive: status numbers and words map as documented', () => {
    const cases: Record<string, string> = {
      '1': 'APPROVED', approved: 'APPROVED', CONFIRMED: 'APPROVED',
      '2': 'UNCHECKED', '5': 'UNCHECKED', pending: 'UNCHECKED', Hold: 'UNCHECKED',
      '3': 'DECLINED', rejected: 'DECLINED', chargeback: 'DECLINED', refund: 'DECLINED', fraud: 'DECLINED',
    };
    for (const [input, expected] of Object.entries(cases)) {
      assert.equal(parseOk({ clickid: CLICK, status: input }).status, expected, input);
    }
    // Every map entry is a real status
    for (const s of Object.values(POSTBACK_STATUS_MAP)) assert.ok(['APPROVED', 'UNCHECKED', 'DECLINED'].includes(s));
  });

  it('edge: repeated keys use the first value; blank values count as missing', () => {
    assert.equal(parseOk({ clickid: [CLICK, 'other'] }).clickId, CLICK);
    assert.equal(parseOk({ clickid: CLICK, goal: '   ' }).goal, '1');
    assert.equal(parseOk({ clickid: CLICK, sum: '' }).sum, undefined);
  });

  it('edge: zero amount is accepted; long order IDs are cut to the column size', () => {
    assert.equal(parseOk({ clickid: CLICK, sum: '0' }).sum, 0);
    assert.equal(parseOk({ clickid: CLICK, action_id: 'x'.repeat(400) }).orderId!.length, ORDER_ID_MAX_LENGTH);
  });

  it('error: missing or malformed click IDs', () => {
    assert.equal(parseErr({}).message, 'Missing clickid parameter');
    for (const bad of ['{clickid}', 'abc', `${CLICK}x`, "1' OR '1'='1"]) {
      assert.equal(parseErr({ clickid: bad }).message, 'Invalid clickid format', bad);
    }
  });

  it('error: bad amounts are refused with a plain message', () => {
    for (const bad of ['abc', '-50', '1e20', 'Infinity', 'NaN', '1,000.50', '12.', '.5']) {
      const r = parseErr({ clickid: CLICK, sum: bad });
      assert.equal(r.httpStatus, 400, bad);
      assert.match(r.message, /sum must be a positive number/, bad);
    }
    assert.match(parseErr({ clickid: CLICK, sum: '99999999999' }).message, /too large/);
  });

  it('error: unknown status and over-long goal', () => {
    assert.match(parseErr({ clickid: CLICK, status: 'maybe' }).message, /Unknown status/);
    assert.match(parseErr({ clickid: CLICK, goal: 'g'.repeat(60) }).message, /goal is too long/);
  });
});

describe('Conversion money', () => {
  const rule = (over: Partial<PayoutRule> = {}): PayoutRule => ({
    goalValue: '1', paymentModel: 'CPA_FIXED', currency: 'USD',
    revenue: new Prisma.Decimal('80.00'), payout: new Prisma.Decimal('50.00'), ...over,
  });

  it('positive: fixed CPA uses the offer amounts', () => {
    assert.deepEqual(computeConversionAmounts(rule()), { revenue: 80, payout: 50, currency: 'USD' });
  });

  it('positive: sum from the network replaces revenue, payout stays fixed', () => {
    assert.deepEqual(computeConversionAmounts(rule(), 49.99), { revenue: 49.99, payout: 50, currency: 'USD' });
  });

  it('positive: RevShare takes percentages of the sale amount', () => {
    const r = computeConversionAmounts(rule({ paymentModel: 'REVSHARE', revenue: 30, payout: 20 }), 200);
    assert.deepEqual(r, { revenue: 60, payout: 40, currency: 'USD' });
  });

  it('edge: RevShare without a sale amount pays nothing; rounding is to cents', () => {
    assert.equal(computeConversionAmounts(rule({ paymentModel: 'REVSHARE', revenue: 30, payout: 20 })).payout, 0);
    assert.equal(computeConversionAmounts(rule({ paymentModel: 'REVSHARE', revenue: 33.33, payout: 10 }), 10.01).revenue, 3.34);
  });

  it('edge: no payout rule never invents money (old code used 150/100)', () => {
    assert.deepEqual(computeConversionAmounts(undefined), { revenue: 0, payout: 0, currency: 'USD' });
  });

  it('selectPayoutRule: matching goal first, else the first rule, else none', () => {
    const lead = rule({ goalValue: '1' });
    const sale = rule({ goalValue: 'sale', payout: 99 });
    assert.equal(selectPayoutRule([lead, sale], 'sale'), sale);
    assert.equal(selectPayoutRule([lead, sale], 'other'), lead);
    assert.equal(selectPayoutRule([], '1'), undefined);
  });
});

describe('tokensMatch', () => {
  it('matches only the exact token', () => {
    assert.equal(tokensMatch('sec_ABC', 'sec_ABC'), true);
    assert.equal(tokensMatch('sec_ABC', 'sec_abc'), false);
    assert.equal(tokensMatch('sec_ABC', 'sec_ABC '), false);
    assert.equal(tokensMatch('sec_ABC', ''), false);
    assert.equal(tokensMatch('sec_ABC', undefined), false);
  });
});

describe('Publisher URL safety (SSRF guard)', () => {
  it('blocks private, loopback, metadata and IPv6-mapped addresses', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254',
      '100.64.0.1', '0.0.0.0', '::1', '::', 'fe80::1', 'fd00::1', '::ffff:127.0.0.1', '::ffff:10.0.0.1']) {
      assert.equal(isBlockedAddress(ip), true, ip);
    }
  });

  it('allows public addresses', () => {
    for (const ip of ['8.8.8.8', '172.32.0.1', '161.97.110.121', '2606:4700::1111']) {
      assert.equal(isBlockedAddress(ip), false, ip);
    }
  });

  it('checkPublicUrl: blocks bad schemes, local names and internal IP literals', async () => {
    const noLookup = async () => { throw new Error('must not be called'); };
    for (const url of ['ftp://x.com/a', 'file:///etc/passwd', 'http://localhost/x', 'http://db.internal/x',
      'http://printer.local/', 'http://127.0.0.1:5432/', 'http://[::1]/', 'http://2130706433/', 'not a url']) {
      const r = await checkPublicUrl(url, noLookup);
      assert.equal(r.ok, false, url);
      assert.equal(!r.ok && r.outcome, 'BLOCKED', url);
    }
  });

  it('checkPublicUrl: a public name that resolves to an internal IP is blocked (DNS trick)', async () => {
    const r = await checkPublicUrl('https://evil.example.com/pb', async () => [{ address: '8.8.8.8' }, { address: '10.0.0.5' }]);
    assert.equal(!r.ok && r.outcome, 'BLOCKED');
  });

  it('checkPublicUrl: unknown host name is FAILED (not a security block)', async () => {
    const r = await checkPublicUrl('https://no-such-host.example/pb', async () => { throw new Error('ENOTFOUND'); });
    assert.equal(!r.ok && r.outcome, 'FAILED');
    assert.match(!r.ok ? r.reason : '', /Could not find the publisher server/);
  });

  it('checkPublicUrl: a public host passes', async () => {
    const r = await checkPublicUrl('https://tracker.example.com/pb?c={clickid}', async () => [{ address: '93.184.216.34' }]);
    assert.equal(r.ok, true);
  });
});

describe('fillUrlTemplate', () => {
  it('replaces macros in any case and URL-encodes values', () => {
    const url = fillUrlTemplate('https://a.com/?c={clickid}&s={SUB_ID}&p={payout}', { clickid: 'abc', sub_id: 'x y&z=1', payout: '12.5' });
    assert.equal(url, 'https://a.com/?c=abc&s=x%20y%26z%3D1&p=12.5');
  });

  it('a sub_id cannot add extra parameters to the advertiser URL', () => {
    const url = new URL(fillUrlTemplate('https://adv.com/?aff={aff_id}&sub={sub_id}', { aff_id: '14', sub_id: 'a&aff_id=999' }));
    assert.equal(url.searchParams.get('aff'), '14');
    assert.equal(url.searchParams.get('sub'), 'a&aff_id=999');
    assert.equal(url.searchParams.get('aff_id'), null);
  });

  it('unknown macros are left untouched', () => {
    assert.equal(fillUrlTemplate('https://a.com/?x={unknown}', { clickid: '1' }), 'https://a.com/?x={unknown}');
  });
});

describe('sanitizeLoggedParams', () => {
  it('masks every token alias in any case, keeps other values', () => {
    const out = sanitizeLoggedParams({ clickid: CLICK, secure_token: 'a', TOKEN: 'b', sec_token: 'c', security_token: 'd', goal: '1' });
    assert.deepEqual(out, { clickid: CLICK, secure_token: '***', TOKEN: '***', sec_token: '***', security_token: '***', goal: '1' });
  });

  it('caps value size and number of keys', () => {
    const many = Object.fromEntries(Array.from({ length: 80 }, (_, i) => [`k${i}`, 'v']));
    assert.equal(Object.keys(sanitizeLoggedParams(many)).length, 50);
    assert.equal(sanitizeLoggedParams({ big: 'x'.repeat(2000) }).big!.length, 500);
  });
});
