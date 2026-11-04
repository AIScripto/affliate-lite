import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { computeRealTimeline } from './reportsController';

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
    allClicks,
    allConversions,
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
    prisma.click.findMany({
      where: clickWhere,
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.conversion.findMany({
      where: conversionWhere,
      select: { createdAt: true, status: true, payout: true, revenue: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const totalPayout = Number(conversionSums._sum.payout || 0);
  const totalRevenue = Number(conversionSums._sum.revenue || 0);
  const netMargin = Number((totalRevenue - totalPayout).toFixed(2));
  const marginPercent = totalRevenue > 0 ? Number(((netMargin / totalRevenue) * 100).toFixed(1)) : 0;
  const overallCr = totalClicks > 0 ? Number(((totalConversions / totalClicks) * 100).toFixed(2)) : 0;

  // EPC Formula: Payout / Clicks
  const epc = totalClicks > 0 ? Number((totalPayout / totalClicks).toFixed(2)) : 0.0;

  const { timeline, trends } = computeRealTimeline(allClicks, allConversions);

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

  // Traffic for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [clicksHistory, conversionsHistory] = await Promise.all([
    prisma.click.findMany({
      where: {
        ...clickWhere,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
    }),
    prisma.conversion.findMany({
      where: {
        ...conversionWhere,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true, payout: true, revenue: true },
    }),
  ]);

  // Group by date (YYYY-MM-DD)
  const dayMap = new Map<string, { clicks: number; conversions: number; profit: number; income: number; payout: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0] ?? '';
    dayMap.set(dateStr, { clicks: 0, conversions: 0, profit: 0, income: 0, payout: 0 });
  }

  clicksHistory.forEach((c) => {
    const dateStr = c.createdAt.toISOString().split('T')[0];
    if (dateStr && dayMap.has(dateStr)) {
      const entry = dayMap.get(dateStr)!;
      entry.clicks += 1;
    }
  });

  conversionsHistory.forEach((c) => {
    const dateStr = c.createdAt.toISOString().split('T')[0];
    if (dateStr && dayMap.has(dateStr)) {
      const entry = dayMap.get(dateStr)!;
      entry.conversions += 1;
      const rev = Number(c.revenue);
      const pay = Number(c.payout);
      entry.income += rev;
      entry.payout += pay;
      entry.profit += rev - pay;
    }
  });

  const trafficLast30Days = Array.from(dayMap.entries()).map(([date, data]) => ({
    date,
    clicks: data.clicks,
    conversions: data.conversions,
    totalProfit: Number(data.profit.toFixed(2)),
    totalIncome: Number(data.income.toFixed(2)),
    payout: Number(data.payout.toFixed(2)),
  }));

  // Top Offers: sorted by conversions DESC, clicks DESC per [01:04]
  const offers = await prisma.offer.findMany({
    select: {
      id: true,
      name: true,
      clicks: {
        where: clickWhere,
        select: { id: true },
      },
      conversions: {
        where: conversionWhere,
        select: { id: true },
      },
    },
  });

  const topOffers = offers
    .map((o) => ({
      id: o.id,
      name: o.name,
      clicks: o.clicks.length,
      conversions: o.conversions.length,
    }))
    .sort((a, b) => b.conversions - a.conversions || b.clicks - a.clicks)
    .slice(0, 10);

  // Top Publishers: sorted by conversions DESC, clicks DESC
  const publishers = await prisma.user.findMany({
    where: {
      role: 'PUBLISHER',
      ...(publisherId ? { id: publisherId } : {}),
    },
    select: {
      id: true,
      name: true,
      clicks: { select: { id: true } },
      conversions: { select: { id: true } },
    },
  });

  const topPublishers = publishers
    .map((p) => ({
      id: p.id,
      name: p.name,
      clicks: p.clicks.length,
      conversions: p.conversions.length,
    }))
    .sort((a, b) => b.conversions - a.conversions || b.clicks - a.clicks)
    .slice(0, 10);

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
