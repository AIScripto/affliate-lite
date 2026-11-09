/**
 * Reports & hardening unit tests (no database needed).
 * DOD Rule 7: positive flows, edge cases, and error recovery.
 * Covers: timeline building, timeline range, publisher data filter,
 * report query validation, click ID validation, and async error routing.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import { buildTimeline, resolveTimelineRange } from '../src/services/timeline';
import { cleanPublisherData } from '../src/middleware/auth';
import { isHiddenFromPublisher } from '../src/constants/security';
import { ReportsQuerySchema } from '../src/schemas';
import { CLICK_ID_PATTERN, firstParam } from '../src/constants/tracking';
import { TIMELINE_BUCKET_COUNT, TIMELINE_MIN_SPAN_HOURS } from '../src/constants/reports';
import { asyncHandler } from '../src/utils/asyncRouter';

const HOUR = 3600 * 1000;
const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe('buildTimeline', () => {
  it('positive: sums click and conversion rows into the right buckets', () => {
    const start = day('2026-11-09');
    const end = new Date(start.getTime() + 24 * HOUR);
    const { timeline } = buildTimeline(start, end, [
      { bucket: 1, clicks: 10 },
      { bucket: 1, conversions: 2, payout: 20, revenue: 30 },
      { bucket: 6, clicks: 5 },
    ], 'UTC');

    assert.equal(timeline.length, TIMELINE_BUCKET_COUNT);
    assert.deepEqual(timeline[0], { label: '00:00', clicks: 10, conversions: 2, payout: 20, revenue: 30 });
    assert.equal(timeline[5]!.clicks, 5);
    assert.equal(timeline[5]!.label, '20:00');
  });

  it('positive: trends are running totals that end at the grand total', () => {
    const { trends } = buildTimeline(day('2026-11-01'), day('2026-11-07'), [
      { bucket: 1, clicks: 1 },
      { bucket: 3, clicks: 2 },
      { bucket: 6, clicks: 3, conversions: 1, payout: 0.1, revenue: 0.2 },
      { bucket: 6, conversions: 1, payout: 0.2, revenue: 0.1 },
    ], 'UTC');

    assert.deepEqual(trends.clicks, [1, 1, 3, 3, 3, 6]);
    assert.equal(trends.conversions.at(-1), 2);
    // Floating point: 0.1 + 0.2 must be rounded to 0.3, not 0.30000000000000004
    assert.equal(trends.payout.at(-1), 0.3);
    assert.equal(trends.revenue.at(-1), 0.3);
  });

  it('edge: out-of-range bucket numbers are clamped, never dropped', () => {
    // width_bucket returns 0 below range and COUNT+1 above it
    const { timeline } = buildTimeline(day('2026-11-01'), day('2026-11-02'), [
      { bucket: 0, clicks: 1 },
      { bucket: TIMELINE_BUCKET_COUNT + 1, clicks: 2 },
    ], 'UTC');
    assert.equal(timeline[0]!.clicks, 1);
    assert.equal(timeline[TIMELINE_BUCKET_COUNT - 1]!.clicks, 2);
  });

  it('edge: empty data gives zero buckets with labels', () => {
    const { timeline, trends } = buildTimeline(day('2026-11-01'), day('2026-11-02'), [], 'UTC');
    assert.equal(timeline.length, TIMELINE_BUCKET_COUNT);
    assert.ok(timeline.every((b) => b.clicks === 0 && b.label.length > 0));
    assert.deepEqual(trends.clicks, new Array(TIMELINE_BUCKET_COUNT).fill(0));
  });

  it('edge: start equal to end does not divide by zero', () => {
    const t = day('2026-11-01');
    const { timeline } = buildTimeline(t, t, [{ bucket: 1, clicks: 4 }], 'UTC');
    assert.equal(timeline[0]!.clicks, 4);
  });

  it('labels: time for one day, date+time for two days, date for a week', () => {
    const one = buildTimeline(day('2026-11-09'), day('2026-11-10'), [], 'UTC').timeline.map((b) => b.label);
    const two = buildTimeline(day('2026-11-08'), day('2026-11-10'), [], 'UTC').timeline.map((b) => b.label);
    const six = buildTimeline(day('2026-11-04'), day('2026-11-10'), [], 'UTC').timeline.map((b) => b.label);

    assert.deepEqual(one, ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00']);
    assert.equal(two[0], '08/11 00:00');
    assert.equal(two[3], '09/11 00:00');
    assert.deepEqual(six, ['04/11', '05/11', '06/11', '07/11', '08/11', '09/11']);
    // No duplicate labels in any style
    for (const labels of [one, two, six]) assert.equal(new Set(labels).size, labels.length);
  });

  it('labels: follow the configured timezone', () => {
    const { timeline } = buildTimeline(day('2026-11-09'), day('2026-11-10'), [], 'Asia/Karachi');
    assert.equal(timeline[0]!.label, '05:00'); // UTC+5
  });
});

describe('resolveTimelineRange', () => {
  const now = new Date('2026-11-09T12:00:00.000Z');

  it('positive: uses the chosen dates, with the end date counted as a whole day', () => {
    const endOfDay = new Date('2026-11-09T23:59:59.999Z');
    const { start, end } = resolveTimelineRange({ dateFrom: day('2026-11-09'), dateTo: endOfDay }, null, null, now);
    assert.equal(start.toISOString(), '2026-11-09T00:00:00.000Z');
    assert.equal(end.toISOString(), '2026-11-10T00:00:00.000Z');
  });

  it('positive: without dates, uses the first and last record', () => {
    const min = new Date('2026-10-01T00:00:00Z');
    const max = new Date('2026-11-01T00:00:00Z');
    const { start, end } = resolveTimelineRange({}, min, max, now);
    assert.equal(start, min);
    assert.equal(end, max);
  });

  it('edge: a span of a few minutes is widened to the minimum span', () => {
    const max = new Date('2026-11-09T05:03:30Z');
    const min = new Date('2026-11-09T05:03:00Z');
    const { start, end } = resolveTimelineRange({}, min, max, now);
    assert.equal(end.getTime() - start.getTime(), TIMELINE_MIN_SPAN_HOURS * HOUR);
  });

  it('edge: no data and no dates falls back to a window ending now', () => {
    const { end } = resolveTimelineRange({}, null, null, now);
    assert.equal(end, now);
  });
});

describe('cleanPublisherData (publisher response filter)', () => {
  it('positive: removes revenue, margin, and secrets at every depth', () => {
    const out = cleanPublisherData({
      summary: { totalPayout: 10, totalRevenue: 20, netMargin: 10, marginPercent: 50, averageEpc: 1 },
      rows: [{ payout: 5, gross: 9, revenue: 9, netAmount: 5 }],
      offer: { advertiserSecurityToken: 'secret', network: { name: 'N', contactDetails: 'x' } },
      trends: { clicks: [1], revenue: [2], payout: [3] },
      kpis: { netMargin: { total: 1 }, earningsByCurrency: { amount: 5 } },
      trafficLast30Days: [{ totalProfit: 1, totalIncome: 2, payout: 3 }],
      user: { email: 'other@x.com', passwordHash: 'h' },
    }) as Record<string, any>;

    assert.deepEqual(out.summary, { totalPayout: 10, averageEpc: 1 });
    assert.deepEqual(out.rows, [{ payout: 5, netAmount: 5 }]);
    assert.deepEqual(out.offer, { network: { name: 'N' } });
    assert.deepEqual(out.trends, { clicks: [1], payout: [3] });
    assert.deepEqual(out.kpis, { earningsByCurrency: { amount: 5 } });
    assert.deepEqual(out.trafficLast30Days, [{ payout: 3 }]);
    assert.deepEqual(out.user, {});
  });

  it('edge: Date and Decimal values survive (previously became {})', () => {
    const created = new Date('2026-11-09T05:03:24.401Z');
    const out = cleanPublisherData({ createdAt: created, payout: new Prisma.Decimal('12.50') }) as Record<string, unknown>;
    assert.equal(out.createdAt, '2026-11-09T05:03:24.401Z');
    assert.equal(out.payout, '12.5');
  });

  it('edge: null, primitives, and empty arrays pass through', () => {
    assert.equal(cleanPublisherData(null), null);
    assert.equal(cleanPublisherData(5), 5);
    assert.deepEqual(cleanPublisherData({ list: [] }), { list: [] });
  });

  it('rule: payout fields stay visible, new revenue-like names are hidden by default', () => {
    for (const key of ['payout', 'totalPayout', 'epc', 'averageEpc', 'clicks', 'cr']) {
      assert.equal(isHiddenFromPublisher(key), false, key);
    }
    for (const key of ['grossAmount', 'revenueShare', 'profitPct', 'netIncome', 'marginUsd']) {
      assert.equal(isHiddenFromPublisher(key), true, key);
    }
  });
});

describe('ReportsQuerySchema', () => {
  it('positive: valid filters are parsed and numbers converted', () => {
    const q = ReportsQuerySchema.parse({ dateFrom: '2026-11-01', networkId: '3', status: 'approved', minAmount: '0' });
    assert.equal(q.networkId, 3);
    assert.equal(q.status, 'APPROVED');
    assert.equal(q.minAmount, 0);
  });

  it('positive: empty values and unknown keys are allowed', () => {
    const q = ReportsQuerySchema.parse({ networkId: '', page: '2' }) as Record<string, unknown>;
    assert.equal(q.networkId, undefined);
    assert.equal(q.page, '2');
  });

  it('error: bad values are rejected with plain messages', () => {
    const cases: Array<[Record<string, string>, RegExp]> = [
      [{ status: 'FOO' }, /valid status/],
      [{ networkId: 'abc' }, /must be a number/],
      [{ offerId: '-1' }, /positive whole number/],
      [{ publisherId: '1.5' }, /whole number|integer/i],
      [{ dateFrom: 'garbage' }, /valid date/],
      [{ minAmount: '-5' }, /cannot be negative/],
      [{ search: 'x'.repeat(500) }, /too long/],
    ];
    for (const [input, message] of cases) {
      const r = ReportsQuerySchema.safeParse(input);
      assert.equal(r.success, false, JSON.stringify(input));
      assert.match(r.error!.errors[0]!.message, message);
    }
  });
});

describe('Postback click ID validation', () => {
  it('positive: accepts real UUIDs in any case', () => {
    assert.ok(CLICK_ID_PATTERN.test('465ef6eb-3e24-4134-afbe-03c1a2b3c4d5'));
    assert.ok(CLICK_ID_PATTERN.test('465EF6EB-3E24-4134-AFBE-03C1A2B3C4D5'));
  });

  it('error: rejects macros, empty, partial, and injected values', () => {
    for (const bad of ['{clickid}', '{click_id}', '', 'abc', '465ef6eb-3e24-4134-afbe', "1' OR '1'='1", '465ef6eb-3e24-4134-afbe-03c1a2b3c4d5x']) {
      assert.equal(CLICK_ID_PATTERN.test(bad), false, bad);
    }
  });

  it('edge: firstParam handles repeated keys, blanks, and numbers', () => {
    assert.equal(firstParam(['a', 'b']), 'a');
    assert.equal(firstParam('  x  '), 'x');
    assert.equal(firstParam('   '), undefined);
    assert.equal(firstParam(undefined), undefined);
    assert.equal(firstParam(42), '42');
  });
});

describe('asyncHandler', () => {
  it('error recovery: a rejected handler is passed to next() instead of crashing', async () => {
    const failure = new Error('db down');
    const received = await new Promise<unknown>((resolve) => {
      asyncHandler(async () => {
        throw failure;
      })({} as never, {} as never, resolve);
    });
    assert.equal(received, failure);
  });

  it('error recovery: a synchronous throw is also passed to next()', async () => {
    const received = await new Promise<unknown>((resolve) => {
      asyncHandler(() => {
        throw new Error('sync');
      })({} as never, {} as never, resolve);
    });
    assert.match(String(received), /sync/);
  });
});
