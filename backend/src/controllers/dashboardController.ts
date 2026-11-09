import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { fetchTimeline, fetchDailyTotals } from '../services/timeline';
import { DASHBOARD_HISTORY_DAYS, DASHBOARD_TOP_LIST_SIZE } from '../constants/reports';

export async function getDashboardSummary(req: Request, res: Response): Promise<void> {
  const isPublisher = req.user?.role === 'PUBLISHER';
  const publisherId = isPublisher ? req.user?.id : undefined;
  const currency = (req.query.currency as string) || 'USD';

  // Base filter for publisher role isolation
  const clickWhere: Record<string, unknown> = {};
  const conversionWhere: Record<string, unknown> = {};

  if (publisherId) {
    clickWhere.publisherId = publisherId;
    conversionWhere.publisherId = publisherId;
  }

  // Calculate start of today for today counts
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Aggregate total clicks and today clicks
  const [
    totalClicks,
    todayClicks,
    totalConversions,
    todayConversions,
    approvedConversions,
    uncheckedConversions,
    conversionSums,
    timelineResult,
  ] = await Promise.all([
    prisma.click.count({ where: clickWhere }),
    prisma.click.count({
      where: {
        ...clickWhere,
        createdAt: { gte: startOfToday },
      },
    }),
    prisma.conversion.count({ where: conversionWhere }),
    prisma.conversion.count({
      where: {
        ...conversionWhere,
        createdAt: { gte: startOfToday },
      },
    }),
    prisma.conversion.count({
      where: {
        ...conversionWhere,
        status: 'APPROVED',
      },
    }),
    prisma.conversion.count({
      where: {
        ...conversionWhere,
        status: 'UNCHECKED',
      },
    }),
    prisma.conversion.aggregate({
      where: conversionWhere,
      _sum: {
        payout: true,
        revenue: true,
      },
    }),
    fetchTimeline({ publisherId }),
  ]);

  const totalPayout = Number(conversionSums._sum.payout || 0);
  const totalRevenue = Number(conversionSums._sum.revenue || 0);
  const netMargin = Number((totalRevenue - totalPayout).toFixed(2));
  const marginPercent = totalRevenue > 0 ? Number(((netMargin / totalRevenue) * 100).toFixed(1)) : 0;
  const overallCr = totalClicks > 0 ? Number(((totalConversions / totalClicks) * 100).toFixed(2)) : 0;

  // EPC Formula: Payout / Clicks
  const epc = totalClicks > 0 ? Number((totalPayout / totalClicks).toFixed(2)) : 0.0;

  const { timeline, trends } = timelineResult;

  // Calculate yesterday's boundary for authentic day-over-day trends
  const yesterdayStart = new Date(startOfToday);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const [yesterdayClicks, yesterdayConversions] = await Promise.all([
    prisma.click.count({
      where: {
        ...clickWhere,
        createdAt: { gte: yesterdayStart, lt: startOfToday },
      },
    }),
    prisma.conversion.count({
      where: {
        ...conversionWhere,
        createdAt: { gte: yesterdayStart, lt: startOfToday },
      },
    }),
  ]);

  const clickTrend = yesterdayClicks > 0
    ? Math.round(((todayClicks - yesterdayClicks) / yesterdayClicks) * 100)
    : todayClicks > 0 ? 100 : 0;

  const convTrend = yesterdayConversions > 0
    ? Math.round(((todayConversions - yesterdayConversions) / yesterdayConversions) * 100)
    : todayConversions > 0 ? 100 : 0;

  // Traffic for last 30 days (grouped by day inside Postgres)
  const daily = await fetchDailyTotals({ publisherId }, DASHBOARD_HISTORY_DAYS);
  const trafficLast30Days = daily.map((d) => ({
    date: d.date,
    clicks: d.clicks,
    conversions: d.conversions,
    totalProfit: Number((d.revenue - d.payout).toFixed(2)),
    totalIncome: d.revenue,
    payout: d.payout,
  }));

  // Top Offers and Top Publishers: sorted by conversions DESC, clicks DESC per [01:04].
  // Counted with groupBy so no click rows are loaded into memory.
  const [offers, offerClicks, offerConvs, publishers, pubClicks, pubConvs] = await Promise.all([
    prisma.offer.findMany({ select: { id: true, name: true } }),
    prisma.click.groupBy({ by: ['offerId'], where: clickWhere, _count: { _all: true } }),
    prisma.conversion.groupBy({ by: ['offerId'], where: conversionWhere, _count: { _all: true } }),
    prisma.user.findMany({
      where: { role: 'PUBLISHER', ...(publisherId ? { id: publisherId } : {}) },
      select: { id: true, name: true },
    }),
    prisma.click.groupBy({ by: ['publisherId'], where: clickWhere, _count: { _all: true } }),
    prisma.conversion.groupBy({ by: ['publisherId'], where: conversionWhere, _count: { _all: true } }),
  ]);

  const countMap = <K extends string>(rows: Array<Record<K, number> & { _count: { _all: number } }>, key: K) =>
    new Map(rows.map((r) => [r[key], r._count._all]));
  const byConversionsThenClicks = (a: { conversions: number; clicks: number }, b: { conversions: number; clicks: number }) =>
    b.conversions - a.conversions || b.clicks - a.clicks;

  const offerClickMap = countMap(offerClicks, 'offerId');
  const offerConvMap = countMap(offerConvs, 'offerId');
  const topOffers = offers
    .map((o) => ({
      id: o.id,
      name: o.name,
      clicks: offerClickMap.get(o.id) || 0,
      conversions: offerConvMap.get(o.id) || 0,
    }))
    .sort(byConversionsThenClicks)
    .slice(0, DASHBOARD_TOP_LIST_SIZE);

  const pubClickMap = countMap(pubClicks, 'publisherId');
  const pubConvMap = countMap(pubConvs, 'publisherId');
  const topPublishers = publishers
    .map((p) => ({
      id: p.id,
      name: p.name,
      clicks: pubClickMap.get(p.id) || 0,
      conversions: pubConvMap.get(p.id) || 0,
    }))
    .sort(byConversionsThenClicks)
    .slice(0, DASHBOARD_TOP_LIST_SIZE);

  res.json({
    kpis: {
      clicks: { total: totalClicks, today: todayClicks, trendPercent: clickTrend },
      conversions: {
        total: totalConversions,
        today: todayConversions,
        approved: approvedConversions,
        unchecked: uncheckedConversions,
        trendPercent: convTrend,
      },
      payout: { total: totalPayout, currency },
      revenue: { total: totalRevenue, currency },
      netMargin: { total: netMargin, percent: marginPercent },
      epc: { total: epc, currency },
      overallCr,
      earningsByCurrency: { amount: totalPayout, currency },
    },
    timeline,
    trends,
    trafficLast30Days,
    topOffers,
    topPublishers,
  });
}
