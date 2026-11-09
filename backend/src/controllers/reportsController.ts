import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { fetchTimeline } from '../services/timeline';

function parseDateFilter(from?: string, to?: string) {
  const filter: { gte?: Date; lte?: Date } = {};
  if (from) {
    const d = new Date(from);
    if (!isNaN(d.getTime())) filter.gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!isNaN(d.getTime())) {
      // End of the chosen day in UTC, so results do not depend on the server's timezone
      d.setUTCHours(23, 59, 59, 999);
      filter.lte = d;
    }
  }
  return Object.keys(filter).length > 0 ? filter : undefined;
}

/**
 * Overview Report: Consolidated performance dashboard across all reports directly from Database
 */
export async function getReportsOverview(req: Request, res: Response): Promise<void> {
  const isPublisher = req.user?.role === 'PUBLISHER';
  const publisherId = isPublisher ? req.user?.id : undefined;
  const dateFrom = req.query.dateFrom as string;
  const dateTo = req.query.dateTo as string;

  const dateFilter = parseDateFilter(dateFrom, dateTo);

  const clickWhere: Record<string, unknown> = {};
  const convWhere: Record<string, unknown> = {};

  if (publisherId) {
    clickWhere.publisherId = publisherId;
    convWhere.publisherId = publisherId;
  }

  if (dateFilter) {
    clickWhere.createdAt = dateFilter;
    convWhere.createdAt = dateFilter;
  }

  const [
    totalClicks,
    totalConversions,
    approvedConversions,
    uncheckedConversions,
    declinedConversions,
    conversionAggs,
    topOffersGroup,
    topNetworksGroup,
    topPublishersGroup,
    recentConversions,
    timelineResult,
  ] = await Promise.all([
    prisma.click.count({ where: clickWhere }),
    prisma.conversion.count({ where: convWhere }),
    prisma.conversion.count({ where: { ...convWhere, status: 'APPROVED' } }),
    prisma.conversion.count({ where: { ...convWhere, status: 'UNCHECKED' } }),
    prisma.conversion.count({ where: { ...convWhere, status: 'DECLINED' } }),
    prisma.conversion.aggregate({
      where: convWhere,
      _sum: { payout: true, revenue: true },
    }),
    prisma.conversion.groupBy({
      by: ['offerId'],
      where: convWhere,
      _count: { id: true },
      _sum: { payout: true, revenue: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    prisma.conversion.groupBy({
      by: ['networkId'],
      where: convWhere,
      _count: { id: true },
      _sum: { payout: true, revenue: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    prisma.conversion.groupBy({
      by: ['publisherId'],
      where: convWhere,
      _count: { id: true },
      _sum: { payout: true, revenue: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    prisma.conversion.findMany({
      where: convWhere,
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        offer: { select: { id: true, name: true } },
        network: { select: { id: true, name: true } },
        publisher: { select: { id: true, name: true } },
      },
    }),
    fetchTimeline({ publisherId, dateFrom: dateFilter?.gte, dateTo: dateFilter?.lte }),
  ]);

  const totalPayout = Number(conversionAggs._sum.payout || 0);
  const totalRevenue = Number(conversionAggs._sum.revenue || 0);
  const netMargin = Number((totalRevenue - totalPayout).toFixed(2));
  const marginPercent =
    totalRevenue > 0 ? Number(((netMargin / totalRevenue) * 100).toFixed(1)) : 0;
  const overallCr =
    totalClicks > 0
      ? Number(((totalConversions / totalClicks) * 100).toFixed(2))
      : 0;
  const averageEpc =
    totalClicks > 0 ? Number((totalPayout / totalClicks).toFixed(2)) : 0;

  // Enrich top offers
  const offerIds = topOffersGroup.map((g) => g.offerId);
  const [offersList, offerClickCounts] = await Promise.all([
    prisma.offer.findMany({
      where: { id: { in: offerIds } },
      select: { id: true, name: true, network: { select: { name: true } } },
    }),
    prisma.click.groupBy({
      by: ['offerId'],
      where: { ...clickWhere, offerId: { in: offerIds } },
      _count: { id: true },
    }),
  ]);

  const offerNameMap = new Map(offersList.map((o) => [o.id, o]));
  const offerClicksMap = new Map(offerClickCounts.map((c) => [c.offerId, c._count.id]));

  const topOffers = topOffersGroup.map((g) => {
    const off = offerNameMap.get(g.offerId);
    const clicks = offerClicksMap.get(g.offerId) || 0;
    const convs = g._count.id;
    const payout = Number(g._sum.payout || 0);
    const revenue = Number(g._sum.revenue || 0);
    const cr = clicks > 0 ? Number(((convs / clicks) * 100).toFixed(2)) : 0;
    const epc = clicks > 0 ? Number((payout / clicks).toFixed(2)) : 0;

    return {
      id: g.offerId,
      name: off?.name || `Offer #${g.offerId}`,
      networkName: off?.network?.name || '-',
      clicks,
      conversions: convs,
      cr,
      payout,
      revenue,
      epc,
    };
  });

  // Enrich top networks
  const networkIds = topNetworksGroup.map((g) => g.networkId);
  const networksList = await prisma.network.findMany({
    where: { id: { in: networkIds } },
    select: { id: true, name: true },
  });
  const netNameMap = new Map(networksList.map((n) => [n.id, n.name]));

  const topNetworks = topNetworksGroup.map((g) => ({
    id: g.networkId,
    name: netNameMap.get(g.networkId) || `Network #${g.networkId}`,
    conversions: g._count.id,
    payout: Number(g._sum.payout || 0),
    revenue: Number(g._sum.revenue || 0),
  }));

  // Enrich top publishers
  const publisherIds = topPublishersGroup.map((g) => g.publisherId);
  const publishersList = await prisma.user.findMany({
    where: { id: { in: publisherIds } },
    select: { id: true, name: true },
  });
  const pubNameMap = new Map(publishersList.map((p) => [p.id, p.name]));

  const topPublishers = topPublishersGroup.map((g) => ({
    id: g.publisherId,
    name: pubNameMap.get(g.publisherId) || `Publisher #${g.publisherId}`,
    conversions: g._count.id,
    payout: Number(g._sum.payout || 0),
  }));

  const { timeline, trends } = timelineResult;

  res.json({
    summary: {
      totalClicks,
      totalConversions,
      approvedConversions,
      uncheckedConversions,
      declinedConversions,
      totalPayout: Number(totalPayout.toFixed(2)),
      totalRevenue: Number(totalRevenue.toFixed(2)),
      netMargin,
      marginPercent,
      overallCr,
      averageEpc,
    },
    timeline,
    trends,
    topOffers,
    topNetworks,
    topPublishers,
    recentConversions: recentConversions.map((c) => ({
      id: c.id,
      clickId: c.clickId,
      externalTxId: c.externalTxId || '-',
      offerId: c.offerId,
      offerName: c.offer.name,
      networkName: c.network.name,
      publisherName: c.publisher.name,
      goalValue: c.goalValue,
      status: c.status,
      currency: c.currency,
      payout: Number(c.payout),
      revenue: Number(c.revenue),
      createdAt: c.createdAt,
    })),
  });
}

/**
 * Detailed Conversions Log: Full audit trail of conversions directly from Database
 */
export async function getConversionsReport(req: Request, res: Response): Promise<void> {
  const isPublisher = req.user?.role === 'PUBLISHER';
  const publisherId = isPublisher ? req.user?.id : undefined;
  const search = ((req.query.search as string) || '').trim().toLowerCase();
  const dateFrom = req.query.dateFrom as string;
  const dateTo = req.query.dateTo as string;
  const networkId = req.query.networkId ? Number(req.query.networkId) : undefined;
  const filterPubId = req.query.publisherId ? Number(req.query.publisherId) : undefined;
  const offerId = req.query.offerId ? Number(req.query.offerId) : undefined;
  const status = req.query.status as string;
  const minAmount = req.query.minAmount !== undefined ? Number(req.query.minAmount) : undefined;
  const maxAmount = req.query.maxAmount !== undefined ? Number(req.query.maxAmount) : undefined;

  const dateFilter = parseDateFilter(dateFrom, dateTo);

  const where: Record<string, unknown> = {};

  if (publisherId) {
    where.publisherId = publisherId;
  } else if (filterPubId) {
    where.publisherId = filterPubId;
  }

  if (networkId) where.networkId = networkId;
  if (offerId) where.offerId = offerId;
  if (status && status !== 'ALL') where.status = status;
  if (dateFilter) where.createdAt = dateFilter;

  if (minAmount !== undefined || maxAmount !== undefined) {
    where.payout = {
      ...(minAmount !== undefined ? { gte: minAmount } : {}),
      ...(maxAmount !== undefined ? { lte: maxAmount } : {}),
    };
  }

  if (search) {
    where.OR = [
      { externalTxId: { contains: search, mode: 'insensitive' } },
      { offer: { name: { contains: search, mode: 'insensitive' } } },
      { network: { name: { contains: search, mode: 'insensitive' } } },
      { publisher: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [totalCount, conversions, agg] = await Promise.all([
    prisma.conversion.count({ where }),
    prisma.conversion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        offer: { select: { id: true, name: true } },
        network: { select: { id: true, name: true } },
        publisher: { select: { id: true, name: true } },
        click: {
          select: {
            ipAddress: true,
            countryCode: true,
            deviceType: true,
            subId: true,
          },
        },
      },
    }),
    prisma.conversion.aggregate({
      where,
      _sum: { payout: true, revenue: true },
    }),
  ]);

  const rows = conversions.map((c) => ({
    id: c.id,
    date: c.createdAt,
    documentNumber: `CNV-${String(c.id).padStart(6, '0')}`,
    clickId: c.clickId,
    externalTxId: c.externalTxId || '-',
    offerId: c.offerId,
    offerName: c.offer.name,
    networkId: c.networkId,
    networkName: c.network.name,
    publisherId: c.publisherId,
    publisherName: c.publisher.name,
    goalValue: c.goalValue,
    status: c.status,
    currency: c.currency,
    ipAddress: c.click.ipAddress,
    countryCode: c.click.countryCode || 'GLOBAL',
    deviceType: c.click.deviceType || 'Desktop',
    subId: c.click.subId || '-',
    payout: Number(c.payout),
    revenue: Number(c.revenue),
    gross: Number(c.revenue),
    netAmount: Number(c.payout),
  }));

  const summary = {
    totalRecords: totalCount,
    totalPayout: Number((agg._sum.payout || 0).toFixed(2)),
    totalRevenue: Number((agg._sum.revenue || 0).toFixed(2)),
  };

  res.json({ data: rows, rows, summary, total: totalCount });
}

/**
 * Traffic & Raw Clicks Log directly from Database
 */
export async function getTrafficReport(req: Request, res: Response): Promise<void> {
  const isPublisher = req.user?.role === 'PUBLISHER';
  const publisherId = isPublisher ? req.user?.id : undefined;
  const search = ((req.query.search as string) || '').trim().toLowerCase();
  const dateFrom = req.query.dateFrom as string;
  const dateTo = req.query.dateTo as string;
  const filterPubId = req.query.publisherId ? Number(req.query.publisherId) : undefined;
  const offerId = req.query.offerId ? Number(req.query.offerId) : undefined;

  const dateFilter = parseDateFilter(dateFrom, dateTo);

  const where: Record<string, unknown> = {};

  if (publisherId) {
    where.publisherId = publisherId;
  } else if (filterPubId) {
    where.publisherId = filterPubId;
  }

  if (offerId) where.offerId = offerId;
  if (dateFilter) where.createdAt = dateFilter;

  if (search) {
    where.OR = [
      { ipAddress: { contains: search } },
      { subId: { contains: search, mode: 'insensitive' } },
      { offer: { name: { contains: search, mode: 'insensitive' } } },
      { publisher: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [totalCount, clicks] = await Promise.all([
    prisma.click.count({ where }),
    prisma.click.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        offer: { select: { id: true, name: true } },
        publisher: { select: { id: true, name: true } },
        conversions: {
          select: { id: true, status: true, payout: true, revenue: true },
        },
      },
    }),
  ]);

  const rows = clicks.map((c) => ({
    id: c.id,
    date: c.createdAt,
    documentNumber: `CLK-${c.id.slice(0, 8).toUpperCase()}`,
    clickId: c.id,
    offerId: c.offerId,
    offerName: c.offer.name,
    publisherId: c.publisherId,
    publisherName: c.publisher.name,
    ipAddress: c.ipAddress,
    countryCode: c.countryCode || 'GLOBAL',
    deviceType: c.deviceType || 'Desktop',
    subId: c.subId || '-',
    hasConversion: c.conversions.length > 0,
    conversionStatus: c.conversions[0]?.status || 'NONE',
    payout: c.conversions.reduce((sum, item) => sum + Number(item.payout), 0),
    revenue: c.conversions.reduce((sum, item) => sum + Number(item.revenue), 0),
  }));

  res.json({ data: rows, rows, total: totalCount });
}

export async function getNetworksReport(req: Request, res: Response): Promise<void> {
  const isPublisher = req.user?.role === 'PUBLISHER';
  const publisherId = isPublisher ? req.user?.id : undefined;
  const search = ((req.query.search as string) || '').trim().toLowerCase();
  const dateFrom = req.query.dateFrom as string;
  const dateTo = req.query.dateTo as string;

  const dateFilter = parseDateFilter(dateFrom, dateTo);

  const networks = await prisma.network.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { offers: { some: { name: { contains: search, mode: 'insensitive' } } } },
          ],
        }
      : {},
    include: {
      offers: {
        select: { id: true, name: true, networkId: true },
      },
    },
    orderBy: { id: 'asc' },
  });

  const clickWhere: Record<string, unknown> = publisherId ? { publisherId } : {};
  const convWhere: Record<string, unknown> = publisherId ? { publisherId } : {};

  if (dateFilter) {
    clickWhere.createdAt = dateFilter;
    convWhere.createdAt = dateFilter;
  }

  const [clickCounts, conversionAggs] = await Promise.all([
    prisma.click.groupBy({
      by: ['offerId'],
      where: clickWhere,
      _count: { id: true },
    }),
    prisma.conversion.groupBy({
      by: ['offerId', 'status'],
      where: convWhere,
      _count: { id: true },
      _sum: { payout: true, revenue: true },
    }),
  ]);

  const clickMap = new Map<number, number>();
  for (const c of clickCounts) {
    clickMap.set(c.offerId, c._count.id);
  }

  const convMap = new Map<
    number,
    { approved: number; unchecked: number; total: number; payout: number; revenue: number }
  >();

  for (const c of conversionAggs) {
    if (!convMap.has(c.offerId)) {
      convMap.set(c.offerId, { approved: 0, unchecked: 0, total: 0, payout: 0, revenue: 0 });
    }
    const item = convMap.get(c.offerId)!;
    item.total += c._count.id;
    if (c.status === 'APPROVED') item.approved += c._count.id;
    if (c.status === 'UNCHECKED') item.unchecked += c._count.id;
    item.payout += Number(c._sum.payout || 0);
    item.revenue += Number(c._sum.revenue || 0);
  }

  const rows: Array<{
    id: number;
    documentNumber: string;
    networkName: string;
    offerName: string;
    name?: string;
    offer?: string;
    conversionsApproved?: number;
    conversionsUnchecked?: number;
    conversionsTotal?: number;
    clicks: number;
    approvedConversions: number;
    uncheckedConversions: number;
    totalConversions: number;
    payout: number;
    revenue: number;
    netAmount: number;
    gross: number;
    cr: number;
  }> = [];

  for (const net of networks) {
    if (net.offers.length === 0) {
      rows.push({
        id: net.id,
        documentNumber: `NET-${String(net.id).padStart(4, '0')}`,
        networkName: net.name,
        name: net.name,
        offerName: '-',
        offer: '-',
        clicks: 0,
        approvedConversions: 0,
        uncheckedConversions: 0,
        totalConversions: 0,
        payout: 0.0,
        revenue: 0.0,
        netAmount: 0.0,
        gross: 0.0,
        cr: 0.0,
      });
    } else {
      for (const off of net.offers) {
        const clicks = clickMap.get(off.id) || 0;
        const conv = convMap.get(off.id) || {
          approved: 0,
          unchecked: 0,
          total: 0,
          payout: 0,
          revenue: 0,
        };
        const cr = clicks > 0 ? Number(((conv.total / clicks) * 100).toFixed(2)) : 0.0;

        rows.push({
          id: net.id,
          documentNumber: `NET-${String(net.id).padStart(4, '0')}`,
          name: net.name,
          networkName: net.name,
          offer: off.name,
          offerName: off.name,
          clicks,
          conversionsApproved: conv.approved,
          approvedConversions: conv.approved,
          conversionsUnchecked: conv.unchecked,
          uncheckedConversions: conv.unchecked,
          conversionsTotal: conv.total,
          totalConversions: conv.total,
          payout: Number(conv.payout.toFixed(2)),
          revenue: Number(conv.revenue.toFixed(2)),
          netAmount: Number(conv.payout.toFixed(2)),
          gross: Number(conv.revenue.toFixed(2)),
          cr,
        });
      }
    }
  }

  const summary = {
    totalClicks: rows.reduce((s, r) => s + r.clicks, 0),
    totalApproved: rows.reduce((s, r) => s + r.approvedConversions, 0),
    totalUnchecked: rows.reduce((s, r) => s + r.uncheckedConversions, 0),
    totalConversions: rows.reduce((s, r) => s + r.totalConversions, 0),
    totalPayout: Number(rows.reduce((s, r) => s + r.payout, 0).toFixed(2)),
    totalRevenue: Number(rows.reduce((s, r) => s + r.revenue, 0).toFixed(2)),
  };

  res.json({ data: rows, rows, summary, total: rows.length });
}

export async function getOffersReport(req: Request, res: Response): Promise<void> {
  const isPublisher = req.user?.role === 'PUBLISHER';
  const publisherId = isPublisher ? req.user?.id : undefined;
  const search = ((req.query.search as string) || '').trim().toLowerCase();
  const dateFrom = req.query.dateFrom as string;
  const dateTo = req.query.dateTo as string;

  const dateFilter = parseDateFilter(dateFrom, dateTo);

  const offerWhere = {
    ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    ...(publisherId
      ? {
          OR: [
            { visibility: 'PUBLIC' as const },
            { publishers: { some: { publisherId, isEnabled: true } } },
          ],
        }
      : {}),
  };

  const clickWhere: Record<string, unknown> = publisherId ? { publisherId } : {};
  const convWhere: Record<string, unknown> = publisherId ? { publisherId } : {};

  if (dateFilter) {
    clickWhere.createdAt = dateFilter;
    convWhere.createdAt = dateFilter;
  }

  const [offers, clickCounts, conversionAggs] = await Promise.all([
    prisma.offer.findMany({
      where: offerWhere,
      select: {
        id: true,
        name: true,
        network: { select: { name: true } },
      },
      orderBy: { id: 'asc' },
    }),
    prisma.click.groupBy({
      by: ['offerId'],
      where: clickWhere,
      _count: { id: true },
    }),
    prisma.conversion.groupBy({
      by: ['offerId'],
      where: convWhere,
      _count: { id: true },
      _sum: { payout: true, revenue: true },
    }),
  ]);

  const clickMap = new Map<number, number>();
  for (const c of clickCounts) {
    clickMap.set(c.offerId, c._count.id);
  }

  const convMap = new Map<number, { count: number; payout: number; revenue: number }>();
  for (const c of conversionAggs) {
    convMap.set(c.offerId, {
      count: c._count.id,
      payout: Number(c._sum.payout || 0),
      revenue: Number(c._sum.revenue || 0),
    });
  }

  const rows = offers.map((off) => {
    const clicks = clickMap.get(off.id) || 0;
    const conv = convMap.get(off.id) || { count: 0, payout: 0, revenue: 0 };
    const epc = clicks > 0 ? Number((conv.payout / clicks).toFixed(2)) : 0.0;
    const cr = clicks > 0 ? Number(((conv.count / clicks) * 100).toFixed(2)) : 0.0;

    return {
      id: off.id,
      documentNumber: `OFR-${String(off.id).padStart(4, '0')}`,
      name: off.name,
      offerName: off.name,
      networkName: off.network?.name || '-',
      conversions: conv.count,
      payout: Number(conv.payout.toFixed(2)),
      revenue: Number(conv.revenue.toFixed(2)),
      netAmount: Number(conv.payout.toFixed(2)),
      gross: Number(conv.revenue.toFixed(2)),
      clicks,
      cr,
      epc,
    };
  });

  const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
  const totalPayout = Number(rows.reduce((s, r) => s + r.payout, 0).toFixed(2));
  const totalConversions = rows.reduce((s, r) => s + r.conversions, 0);
  const weightedEpc = totalClicks > 0 ? Number((totalPayout / totalClicks).toFixed(2)) : 0.0;

  const summary = {
    totalClicks,
    totalConversions,
    totalPayout,
    totalRevenue: Number(rows.reduce((s, r) => s + r.revenue, 0).toFixed(2)),
    weightedEpc,
    averageEpc: weightedEpc,
  };

  res.json({ data: rows, rows, summary, total: rows.length });
}

export async function getPublishersReport(req: Request, res: Response): Promise<void> {
  const isPublisher = req.user?.role === 'PUBLISHER';
  const publisherId = isPublisher ? req.user?.id : undefined;
  const search = ((req.query.search as string) || '').trim().toLowerCase();
  const dateFrom = req.query.dateFrom as string;
  const dateTo = req.query.dateTo as string;

  const dateFilter = parseDateFilter(dateFrom, dateTo);

  const publishers = await prisma.user.findMany({
    where: {
      role: 'PUBLISHER',
      ...(publisherId ? { id: publisherId } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: { id: 'asc' },
  });

  const pubIds = publishers.map((p) => p.id);

  const clickWhere: Record<string, unknown> = { publisherId: { in: pubIds } };
  const convWhere: Record<string, unknown> = { publisherId: { in: pubIds } };

  if (dateFilter) {
    clickWhere.createdAt = dateFilter;
    convWhere.createdAt = dateFilter;
  }

  const [clickCounts, conversionAggs, offers] = await Promise.all([
    prisma.click.groupBy({
      by: ['publisherId', 'offerId'],
      where: clickWhere,
      _count: { id: true },
    }),
    prisma.conversion.groupBy({
      by: ['publisherId', 'offerId', 'status'],
      where: convWhere,
      _count: { id: true },
      _sum: { payout: true, revenue: true },
    }),
    prisma.offer.findMany({
      select: { id: true, name: true },
    }),
  ]);

  const offerNameMap = new Map<number, string>();
  for (const o of offers) {
    offerNameMap.set(o.id, o.name);
  }

  const pubOfferMap = new Map<
    string,
    {
      publisherId: number;
      offerId: number;
      clicks: number;
      approved: number;
      unchecked: number;
      total: number;
      payout: number;
      revenue: number;
    }
  >();

  for (const c of clickCounts) {
    const key = `${c.publisherId}_${c.offerId}`;
    if (!pubOfferMap.has(key)) {
      pubOfferMap.set(key, {
        publisherId: c.publisherId,
        offerId: c.offerId,
        clicks: 0,
        approved: 0,
        unchecked: 0,
        total: 0,
        payout: 0,
        revenue: 0,
      });
    }
    pubOfferMap.get(key)!.clicks += c._count.id;
  }

  for (const c of conversionAggs) {
    const key = `${c.publisherId}_${c.offerId}`;
    if (!pubOfferMap.has(key)) {
      pubOfferMap.set(key, {
        publisherId: c.publisherId,
        offerId: c.offerId,
        clicks: 0,
        approved: 0,
        unchecked: 0,
        total: 0,
        payout: 0,
        revenue: 0,
      });
    }
    const item = pubOfferMap.get(key)!;
    item.total += c._count.id;
    if (c.status === 'APPROVED') item.approved += c._count.id;
    if (c.status === 'UNCHECKED') item.unchecked += c._count.id;
    item.payout += Number(c._sum.payout || 0);
    item.revenue += Number(c._sum.revenue || 0);
  }

  const rows: Array<{
    id: number;
    documentNumber: string;
    publisherName: string;
    offerName: string;
    name?: string;
    offer?: string;
    conversionsApproved?: number;
    conversionsUnchecked?: number;
    conversionsTotal?: number;
    clicks: number;
    approvedConversions: number;
    uncheckedConversions: number;
    totalConversions: number;
    epc: number;
    cr: number;
    payout: number;
    revenue: number;
    netAmount: number;
    gross: number;
  }> = [];

  for (const pub of publishers) {
    const userOffers = Array.from(pubOfferMap.values()).filter((v) => v.publisherId === pub.id);

    if (userOffers.length === 0) {
      rows.push({
        id: pub.id,
        documentNumber: `PUB-${String(pub.id).padStart(4, '0')}`,
        name: pub.name,
        publisherName: pub.name,
        offer: '-',
        offerName: '-',
        clicks: 0,
        approvedConversions: 0,
        conversionsApproved: 0,
        uncheckedConversions: 0,
        conversionsUnchecked: 0,
        totalConversions: 0,
        conversionsTotal: 0,
        epc: 0.0,
        cr: 0.0,
        payout: 0.0,
        revenue: 0.0,
        netAmount: 0.0,
        gross: 0.0,
      });
    } else {
      for (const val of userOffers) {
        const epc = val.clicks > 0 ? Number((val.payout / val.clicks).toFixed(2)) : 0.0;
        const cr = val.clicks > 0 ? Number(((val.total / val.clicks) * 100).toFixed(2)) : 0.0;
        const offerName = offerNameMap.get(val.offerId) || `Offer #${val.offerId}`;

        rows.push({
          id: pub.id,
          documentNumber: `PUB-${String(pub.id).padStart(4, '0')}`,
          name: pub.name,
          publisherName: pub.name,
          offer: offerName,
          offerName,
          clicks: val.clicks,
          approvedConversions: val.approved,
          conversionsApproved: val.approved,
          uncheckedConversions: val.unchecked,
          conversionsUnchecked: val.unchecked,
          totalConversions: val.total,
          conversionsTotal: val.total,
          epc,
          cr,
          payout: Number(val.payout.toFixed(2)),
          revenue: Number(val.revenue.toFixed(2)),
          netAmount: Number(val.payout.toFixed(2)),
          gross: Number(val.revenue.toFixed(2)),
        });
      }
    }
  }

  const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
  const totalPayout = Number(rows.reduce((s, r) => s + r.payout, 0).toFixed(2));
  const totalRevenue = Number(rows.reduce((s, r) => s + r.revenue, 0).toFixed(2));
  const avgEpc = totalClicks > 0 ? Number((totalPayout / totalClicks).toFixed(2)) : 0.0;

  const summary = {
    totalClicks,
    totalApproved: rows.reduce((s, r) => s + r.approvedConversions, 0),
    totalUnchecked: rows.reduce((s, r) => s + r.uncheckedConversions, 0),
    totalConversions: rows.reduce((s, r) => s + r.totalConversions, 0),
    totalPayout,
    totalRevenue,
    weightedEpc: avgEpc,
    averageEpc: avgEpc,
  };

  res.json({ data: rows, rows, summary, total: rows.length });
}
