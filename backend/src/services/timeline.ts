import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma';
import {
  TIMELINE_BUCKET_COUNT,
  TIMELINE_TIME_LABEL_MAX_HOURS,
  TIMELINE_EMPTY_RANGE_HOURS,
  TIMELINE_MIN_SPAN_HOURS,
  REPORTS_TIMEZONE,
} from '../constants/reports';

const HOUR_MS = 3600 * 1000;

export interface TimelineFilters {
  publisherId?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface TimelineBucket {
  label: string;
  clicks: number;
  conversions: number;
  payout: number;
  revenue: number;
}

export interface TimelineResult {
  timeline: TimelineBucket[];
  trends: { clicks: number[]; conversions: number[]; revenue: number[]; payout: number[] };
}

/** Per-bucket totals from the database. `bucket` is 1-based, as returned by Postgres width_bucket. */
export interface BucketRow {
  bucket: number;
  clicks?: number;
  conversions?: number;
  payout?: number;
  revenue?: number;
}

const round2 = (n: number) => Number(n.toFixed(2));

type LabelStyle = 'time' | 'dateTime' | 'date';

const LABEL_FORMATS: Record<LabelStyle, Intl.DateTimeFormatOptions> = {
  time: { hour: '2-digit', minute: '2-digit', hour12: false },
  dateTime: { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false },
  date: { day: '2-digit', month: '2-digit' },
};

/** Short spans show time, medium spans (buckets under a day) show date + time, long spans show date. */
function pickLabelStyle(spanMs: number, stepMs: number): LabelStyle {
  if (spanMs <= TIMELINE_TIME_LABEL_MAX_HOURS * HOUR_MS) return 'time';
  if (stepMs < 24 * HOUR_MS) return 'dateTime';
  return 'date';
}

function formatLabel(time: Date, style: LabelStyle, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', { ...LABEL_FORMATS[style], timeZone }).format(time).replace(',', '');
}

/**
 * Pure function: turns per-bucket database totals into graph points and running totals.
 * The range [start, end] is split into TIMELINE_BUCKET_COUNT equal parts.
 */
export function buildTimeline(
  start: Date,
  end: Date,
  rows: BucketRow[],
  timeZone: string = REPORTS_TIMEZONE
): TimelineResult {
  const spanMs = Math.max(end.getTime() - start.getTime(), 1);
  const stepMs = spanMs / TIMELINE_BUCKET_COUNT;
  const labelStyle = pickLabelStyle(spanMs, stepMs);

  const timeline: TimelineBucket[] = Array.from({ length: TIMELINE_BUCKET_COUNT }, (_, i) => ({
    label: formatLabel(new Date(start.getTime() + i * stepMs), labelStyle, timeZone),
    clicks: 0,
    conversions: 0,
    payout: 0,
    revenue: 0,
  }));

  for (const row of rows) {
    // Clamp so a value exactly on the range end lands in the last bucket
    const idx = Math.min(Math.max(Number(row.bucket) - 1, 0), TIMELINE_BUCKET_COUNT - 1);
    const b = timeline[idx]!;
    b.clicks += Number(row.clicks || 0);
    b.conversions += Number(row.conversions || 0);
    b.payout = round2(b.payout + Number(row.payout || 0));
    b.revenue = round2(b.revenue + Number(row.revenue || 0));
  }

  const trends: TimelineResult['trends'] = { clicks: [], conversions: [], revenue: [], payout: [] };
  let runClicks = 0;
  let runConvs = 0;
  let runRev = 0;
  let runPayout = 0;
  for (const b of timeline) {
    runClicks += b.clicks;
    runConvs += b.conversions;
    runRev += b.revenue;
    runPayout += b.payout;
    trends.clicks.push(runClicks);
    trends.conversions.push(runConvs);
    trends.revenue.push(round2(runRev));
    trends.payout.push(round2(runPayout));
  }

  return { timeline, trends };
}

/**
 * Graph range: the user's chosen dates when given, otherwise the first and last record.
 * Very short spans are widened backwards so the buckets get distinct labels.
 */
export function resolveTimelineRange(
  filters: Pick<TimelineFilters, 'dateFrom' | 'dateTo'>,
  dataMin: Date | null,
  dataMax: Date | null,
  now: Date = new Date()
): { start: Date; end: Date } {
  // dateTo is the last millisecond of the chosen day; +1 ms makes the range a whole number of hours
  const end = filters.dateTo ? new Date(filters.dateTo.getTime() + 1) : dataMax ?? now;
  let start = filters.dateFrom ?? dataMin ?? new Date(end.getTime() - TIMELINE_EMPTY_RANGE_HOURS * HOUR_MS);
  const minSpanMs = TIMELINE_MIN_SPAN_HOURS * HOUR_MS;
  if (end.getTime() - start.getTime() < minSpanMs) {
    start = new Date(end.getTime() - minSpanMs);
  }
  return { start, end };
}

function filterSql(f: TimelineFilters): Prisma.Sql {
  const parts: Prisma.Sql[] = [Prisma.sql`TRUE`];
  if (f.publisherId) parts.push(Prisma.sql`publisher_id = ${f.publisherId}`);
  if (f.dateFrom) parts.push(Prisma.sql`created_at >= ${f.dateFrom}`);
  if (f.dateTo) parts.push(Prisma.sql`created_at <= ${f.dateTo}`);
  return Prisma.join(parts, ' AND ');
}

/**
 * Builds the trend graph with grouping done inside Postgres.
 * Memory use stays the same no matter how many clicks exist
 * (the old version loaded every click row and failed above ~150k clicks).
 */
export async function fetchTimeline(filters: TimelineFilters): Promise<TimelineResult> {
  const where = filterSql(filters);

  const [range] = await prisma.$queryRaw<Array<{ min_at: Date | null; max_at: Date | null }>>`
    SELECT
      LEAST((SELECT MIN(created_at) FROM clicks WHERE ${where}),
            (SELECT MIN(created_at) FROM conversions WHERE ${where})) AS min_at,
      GREATEST((SELECT MAX(created_at) FROM clicks WHERE ${where}),
               (SELECT MAX(created_at) FROM conversions WHERE ${where})) AS max_at`;

  const hasData = Boolean(range?.min_at && range?.max_at);
  if (!hasData && !filters.dateFrom && !filters.dateTo) {
    const end = new Date();
    const start = new Date(end.getTime() - TIMELINE_EMPTY_RANGE_HOURS * HOUR_MS);
    return buildTimeline(start, end, []);
  }

  const { start, end } = resolveTimelineRange(filters, range?.min_at ?? null, range?.max_at ?? null);
  if (!hasData) return buildTimeline(start, end, []);

  const startSec = start.getTime() / 1000;
  // Upper bound is exclusive in width_bucket, so add a small margin to keep the newest row in range
  const endSec = Math.max(end.getTime() / 1000, startSec) + 1;
  const bucketExpr = Prisma.sql`width_bucket(EXTRACT(EPOCH FROM created_at)::float8, ${startSec}::float8, ${endSec}::float8, ${TIMELINE_BUCKET_COUNT}::int)`;

  const [clickRows, convRows] = await Promise.all([
    prisma.$queryRaw<BucketRow[]>`
      SELECT ${bucketExpr} AS bucket, COUNT(*)::int AS clicks
      FROM clicks WHERE ${where} GROUP BY bucket`,
    prisma.$queryRaw<BucketRow[]>`
      SELECT ${bucketExpr} AS bucket, COUNT(*)::int AS conversions,
             COALESCE(SUM(payout), 0)::float8 AS payout, COALESCE(SUM(revenue), 0)::float8 AS revenue
      FROM conversions WHERE ${where} GROUP BY bucket`,
  ]);

  return buildTimeline(start, end, [...clickRows, ...convRows]);
}

export interface DailyTotals {
  date: string; // YYYY-MM-DD (UTC)
  clicks: number;
  conversions: number;
  payout: number;
  revenue: number;
}

/**
 * Totals per calendar day (UTC) for the last `days` days, oldest first.
 * Days with no traffic are included with zeros so graphs have no gaps.
 */
export async function fetchDailyTotals(filters: TimelineFilters, days: number): Promise<DailyTotals[]> {
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);
  const since = new Date(todayUtc.getTime() - (days - 1) * 24 * HOUR_MS);
  const where = filterSql({ ...filters, dateFrom: since });
  const dayExpr = Prisma.sql`to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')`;

  const [clickRows, convRows] = await Promise.all([
    prisma.$queryRaw<Array<{ day: string; clicks: number }>>`
      SELECT ${dayExpr} AS day, COUNT(*)::int AS clicks FROM clicks WHERE ${where} GROUP BY day`,
    prisma.$queryRaw<Array<{ day: string; conversions: number; payout: number; revenue: number }>>`
      SELECT ${dayExpr} AS day, COUNT(*)::int AS conversions,
             COALESCE(SUM(payout), 0)::float8 AS payout, COALESCE(SUM(revenue), 0)::float8 AS revenue
      FROM conversions WHERE ${where} GROUP BY day`,
  ]);

  const byDay = new Map<string, DailyTotals>();
  for (let i = 0; i < days; i++) {
    const date = new Date(since.getTime() + i * 24 * HOUR_MS).toISOString().slice(0, 10);
    byDay.set(date, { date, clicks: 0, conversions: 0, payout: 0, revenue: 0 });
  }
  for (const r of clickRows) {
    const d = byDay.get(r.day);
    if (d) d.clicks = Number(r.clicks);
  }
  for (const r of convRows) {
    const d = byDay.get(r.day);
    if (d) {
      d.conversions = Number(r.conversions);
      d.payout = round2(Number(r.payout));
      d.revenue = round2(Number(r.revenue));
    }
  }
  return Array.from(byDay.values());
}
