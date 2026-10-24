import { Request, Response } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../db/prisma';

export async function handleClickRedirect(req: Request, res: Response): Promise<void> {
  const offerId = parseInt(req.query.offer_id as string, 10);
  const publisherId = parseInt(req.query.aff_id as string, 10);
  const subId = (req.query.sub_id as string) || null;

  if (isNaN(offerId) || isNaN(publisherId)) {
    res.status(400).json({ error: 'Bad Request', message: 'Missing offer_id or aff_id' });
    return;
  }

  // 1. Verify Offer exists and is ACTIVE
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      network: true,
      publishers: { where: { publisherId } },
    },
  });

  if (!offer || offer.status !== 'ACTIVE') {
    res.status(404).json({ error: 'Not Found', message: 'Offer is inactive or not found' });
    return;
  }

  // 2. Verify Publisher exists and is ACTIVE per [02:20]
  const publisher = await prisma.user.findFirst({
    where: { id: publisherId, role: 'PUBLISHER' },
  });

  if (!publisher || publisher.status !== 'ACTIVE') {
    res.status(403).json({ error: 'Forbidden', message: 'Publisher account is inactive or paused' });
    return;
  }

  // 3. Verify Visibility Access
  if (offer.visibility === 'PRIVATE') {
    const isAssigned = offer.publishers.some((p) => p.isEnabled);
    if (!isAssigned) {
      res.status(403).json({ error: 'Forbidden', message: 'Offer is not assigned to this publisher' });
      return;
    }
  } else if (offer.visibility === 'REQUIRES_APPROVAL') {
    const isApproved = offer.publishers.some((p) => p.isEnabled && p.approvalStatus === 'APPROVED');
    if (!isApproved) {
      res.status(403).json({ error: 'Forbidden', message: 'Offer requires approval before traffic can be sent' });
      return;
    }
  }

  // 4. Capture Client Telemetry & Mint Click ID with Node.js v24 native crypto.randomUUID()
  const clickId = crypto.randomUUID();
  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown';

  // 5. Persist Click Record
  await prisma.click.create({
    data: {
      id: clickId,
      offerId,
      publisherId,
      subId,
      ipAddress,
      countryCode: (req.headers['cf-ipcountry'] as string) || 'US',
      deviceType: 'Desktop',
      userAgent,
    },
  });

  // 6. Macro Replacement in Destination URL per [04:40]–[05:00]
  let resolvedUrl = offer.destinationUrl;
  resolvedUrl = resolvedUrl.replace(/{clickid}/gi, clickId);
  resolvedUrl = resolvedUrl.replace(/{click_id}/gi, clickId);
  resolvedUrl = resolvedUrl.replace(/{aff_id}/gi, String(publisherId));
  resolvedUrl = resolvedUrl.replace(/{offer_id}/gi, String(offerId));
  resolvedUrl = resolvedUrl.replace(/{sub_id}/gi, subId || '');

  // If client requested JSON response (e.g., testing or preview)
  if (req.query.json === '1') {
    res.json({
      clickId,
      offerId,
      publisherId,
      subId,
      resolvedUrl,
    });
    return;
  }

  // Standard 302 Found Redirection
  res.redirect(302, resolvedUrl);
}

export async function handlePostback(req: Request, res: Response): Promise<void> {
  const query = { ...req.query, ...req.body };
  const clickId = (query.clickid || query.click_id) as string;
  const goalValue = (query.goal as string) || '1';
  const sumOverride = query.sum ? parseFloat(query.sum as string) : undefined;
  const statusParam = (query.status as string) || '1';

  if (!clickId) {
    res.status(400).json({ error: 'Bad Request', message: 'Missing clickid' });
    return;
  }

  // 1. Look up click
  const click = await prisma.click.findUnique({
    where: { id: clickId },
    include: {
      offer: {
        include: {
          network: true,
          payouts: true,
        },
      },
      publisher: true,
    },
  });

  if (!click) {
    res.status(404).json({ error: 'Not Found', message: 'Invalid clickid' });
    return;
  }

  // 2. Check duplicate conversions allowed per [03:00]
  const allowDuplicates = click.offer.network.allowDuplicateConversions;
  if (!allowDuplicates) {
    const existingConv = await prisma.conversion.findFirst({
      where: { clickId },
    });
    if (existingConv) {
      res.status(409).json({ error: 'Conflict', message: 'Duplicate conversion restricted by advertiser network' });
      return;
    }
  }

  // 3. Snapshot offer revenue & payout
  const defaultPayout = click.offer.payouts[0];
  const revenue = sumOverride !== undefined ? sumOverride : defaultPayout ? Number(defaultPayout.revenue) : 150.0;
  const payout = defaultPayout ? Number(defaultPayout.payout) : 100.0;
  const currency = defaultPayout?.currency || 'USD';

  // Map status: 1 = APPROVED, 2 = UNCHECKED, 3 = DECLINED
  const conversionStatus = statusParam === '1' ? 'APPROVED' : statusParam === '3' ? 'DECLINED' : 'UNCHECKED';

  // 4. Create conversion record
  const conversion = await prisma.conversion.create({
    data: {
      clickId,
      offerId: click.offerId,
      publisherId: click.publisherId,
      networkId: click.offer.networkId,
      goalValue,
      status: conversionStatus,
      currency,
      revenue,
      payout,
      externalTxId: (query.tx_id as string) || null,
    },
  });

  // 5. Outbound S2S Postback to Publisher if configured
  if (click.publisher.postbackUrl) {
    let outUrl = click.publisher.postbackUrl;
    outUrl = outUrl.replace(/{clickid}/gi, clickId);
    outUrl = outUrl.replace(/{click_id}/gi, clickId);
    outUrl = outUrl.replace(/{payout}/gi, String(payout));
    outUrl = outUrl.replace(/{sub_id}/gi, click.subId || '');

    // Fire asynchronously without awaiting
    fetch(outUrl, { method: 'GET' }).catch((err) => {
      console.warn(`Outbound publisher postback failed for ${click.publisher.name}:`, err.message);
    });
  }

  res.status(200).json({
    success: true,
    conversionId: conversion.id,
    clickId,
    payout,
    revenue,
    status: conversion.status,
  });
}
