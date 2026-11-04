import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export async function getNetworksReport(req: Request, res: Response): Promise<void> {
  const isPublisher = req.user?.role === 'PUBLISHER';
  const publisherId = isPublisher ? req.user?.id : undefined;
  const search = ((req.query.search as string) || '').trim().toLowerCase();

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

  // Database-level grouping for clicks and conversions
  const clickWhere = publisherId ? { publisherId } : {};
  const convWhere = publisherId ? { publisherId } : {};

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
  }> = [];

  for (const net of networks) {
    if (net.offers.length === 0) {
      rows.push({
        id: net.id,
        networkName: net.name,
        offerName: '-',
        clicks: 0,
        approvedConversions: 0,
        uncheckedConversions: 0,
        totalConversions: 0,
        payout: 0.0,
        revenue: 0.0,
      });
    } else {
      for (const off of net.offers) {
        const clicks = clickMap.get(off.id) || 0;
        const conv = convMap.get(off.id) || { approved: 0, unchecked: 0, total: 0, payout: 0, revenue: 0 };

        rows.push({
          id: net.id,
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

  res.json({ data: rows, rows, summary });
}

export async function getOffersReport(req: Request, res: Response): Promise<void> {
  const isPublisher = req.user?.role === 'PUBLISHER';
  const publisherId = isPublisher ? req.user?.id : undefined;
  const search = ((req.query.search as string) || '').trim().toLowerCase();

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

  const clickWhere = publisherId ? { publisherId } : {};
  const convWhere = publisherId ? { publisherId } : {};

  const [offers, clickCounts, conversionAggs] = await Promise.all([
    prisma.offer.findMany({
      where: offerWhere,
      select: { id: true, name: true },
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

    return {
      id: off.id,
      name: off.name,
      offerName: off.name,
      conversions: conv.count,
      payout: Number(conv.payout.toFixed(2)),
      revenue: Number(conv.revenue.toFixed(2)),
      clicks,
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

  res.json({ data: rows, rows, summary });
}

export async function getPublishersReport(req: Request, res: Response): Promise<void> {
  const isPublisher = req.user?.role === 'PUBLISHER';
  const publisherId = isPublisher ? req.user?.id : undefined;
  const search = ((req.query.search as string) || '').trim().toLowerCase();

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

  // Grouped aggregation by publisherId and offerId
  const [clickCounts, conversionAggs, offers] = await Promise.all([
    prisma.click.groupBy({
      by: ['publisherId', 'offerId'],
      where: { publisherId: { in: pubIds } },
      _count: { id: true },
    }),
    prisma.conversion.groupBy({
      by: ['publisherId', 'offerId', 'status'],
      where: { publisherId: { in: pubIds } },
      _count: { id: true },
      _sum: { payout: true },
    }),
    prisma.offer.findMany({
      select: { id: true, name: true },
    }),
  ]);

  const offerNameMap = new Map<number, string>();
  for (const o of offers) {
    offerNameMap.set(o.id, o.name);
  }

  // Aggregate stats per [publisherId, offerId]
  const pubOfferMap = new Map<
    string,
    { publisherId: number; offerId: number; clicks: number; approved: number; unchecked: number; total: number; payout: number }
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
      });
    }
    const item = pubOfferMap.get(key)!;
    item.total += c._count.id;
    if (c.status === 'APPROVED') item.approved += c._count.id;
    if (c.status === 'UNCHECKED') item.unchecked += c._count.id;
    item.payout += Number(c._sum.payout || 0);
  }

  const rows: Array<{
    id: number;
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
    payout: number;
  }> = [];

  for (const pub of publishers) {
    const userOffers = Array.from(pubOfferMap.values()).filter((v) => v.publisherId === pub.id);

    if (userOffers.length === 0) {
      rows.push({
        id: pub.id,
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
        payout: 0.0,
      });
    } else {
      for (const val of userOffers) {
        const epc = val.clicks > 0 ? Number((val.payout / val.clicks).toFixed(2)) : 0.0;
        const offerName = offerNameMap.get(val.offerId) || `Offer #${val.offerId}`;

        rows.push({
          id: pub.id,
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
          payout: Number(val.payout.toFixed(2)),
        });
      }
    }
  }

  const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
  const totalPayout = Number(rows.reduce((s, r) => s + r.payout, 0).toFixed(2));
  const avgEpc = totalClicks > 0 ? Number((totalPayout / totalClicks).toFixed(2)) : 0.0;

  const summary = {
    totalClicks,
    totalApproved: rows.reduce((s, r) => s + r.approvedConversions, 0),
    totalUnchecked: rows.reduce((s, r) => s + r.uncheckedConversions, 0),
    totalConversions: rows.reduce((s, r) => s + r.totalConversions, 0),
    totalPayout,
    weightedEpc: avgEpc,
    averageEpc: avgEpc,
  };

  res.json({ data: rows, rows, summary });
}
