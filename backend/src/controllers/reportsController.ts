import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export async function getNetworksReport(req: Request, res: Response): Promise<void> {
  const isPublisher = req.user?.role === 'PUBLISHER';
  const publisherId = isPublisher ? req.user?.id : undefined;
  const search = ((req.query.search as string) || '').trim().toLowerCase();

  // Fetch all networks with their offers and stats
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
        include: {
          clicks: {
            where: publisherId ? { publisherId } : {},
            select: { id: true },
          },
          conversions: {
            where: publisherId ? { publisherId } : {},
            select: { id: true, status: true, payout: true, revenue: true },
          },
        },
      },
    },
    orderBy: { id: 'asc' },
  });

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
        const approved = off.conversions.filter((c) => c.status === 'APPROVED').length;
        const unchecked = off.conversions.filter((c) => c.status === 'UNCHECKED').length;
        const totalConv = off.conversions.length;
        const payout = off.conversions.reduce((sum, c) => sum + Number(c.payout), 0);
        const revenue = off.conversions.reduce((sum, c) => sum + Number(c.revenue), 0);

        rows.push({
          id: net.id,
          name: net.name,
          networkName: net.name,
          offer: off.name,
          offerName: off.name,
          clicks: off.clicks.length,
          conversionsApproved: approved,
          approvedConversions: approved,
          conversionsUnchecked: unchecked,
          uncheckedConversions: unchecked,
          conversionsTotal: totalConv,
          totalConversions: totalConv,
          payout: Number(payout.toFixed(2)),
          revenue: Number(revenue.toFixed(2)),
        });
      }
    }
  }

  // Summary row
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

  const offers = await prisma.offer.findMany({
    where: {
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      ...(publisherId
        ? {
            OR: [
              { visibility: 'PUBLIC' },
              { publishers: { some: { publisherId, isEnabled: true } } },
            ],
          }
        : {}),
    },
    include: {
      clicks: {
        where: publisherId ? { publisherId } : {},
        select: { id: true },
      },
      conversions: {
        where: publisherId ? { publisherId } : {},
        select: { id: true, payout: true, revenue: true },
      },
    },
    orderBy: { id: 'asc' },
  });

  const rows = offers.map((off) => {
    const clicks = off.clicks.length;
    const conversions = off.conversions.length;
    const payout = off.conversions.reduce((sum, c) => sum + Number(c.payout), 0);
    const revenue = off.conversions.reduce((sum, c) => sum + Number(c.revenue), 0);
    const epc = clicks > 0 ? Number((payout / clicks).toFixed(2)) : 0.0;

    return {
      id: off.id,
      name: off.name,
      offerName: off.name,
      conversions,
      payout: Number(payout.toFixed(2)),
      revenue: Number(revenue.toFixed(2)),
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
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    include: {
      clicks: {
        include: { offer: { select: { id: true, name: true } } },
      },
      conversions: {
        include: { offer: { select: { id: true, name: true } } },
      },
    },
    orderBy: { id: 'asc' },
  });

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
    // Group by offer
    const offerMap = new Map<
      number,
      { offerName: string; clicks: number; approved: number; unchecked: number; total: number; payout: number }
    >();

    pub.clicks.forEach((c) => {
      if (!offerMap.has(c.offer.id)) {
        offerMap.set(c.offer.id, {
          offerName: c.offer.name,
          clicks: 0,
          approved: 0,
          unchecked: 0,
          total: 0,
          payout: 0,
        });
      }
      offerMap.get(c.offer.id)!.clicks += 1;
    });

    pub.conversions.forEach((conv) => {
      if (!offerMap.has(conv.offer.id)) {
        offerMap.set(conv.offer.id, {
          offerName: conv.offer.name,
          clicks: 0,
          approved: 0,
          unchecked: 0,
          total: 0,
          payout: 0,
        });
      }
      const item = offerMap.get(conv.offer.id)!;
      item.total += 1;
      if (conv.status === 'APPROVED') item.approved += 1;
      if (conv.status === 'UNCHECKED') item.unchecked += 1;
      item.payout += Number(conv.payout);
    });

    if (offerMap.size === 0) {
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
      for (const [, val] of offerMap.entries()) {
        const epc = val.clicks > 0 ? Number((val.payout / val.clicks).toFixed(2)) : 0.0;
        rows.push({
          id: pub.id,
          name: pub.name,
          publisherName: pub.name,
          offer: val.offerName,
          offerName: val.offerName,
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
