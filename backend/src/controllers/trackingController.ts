import { Request, Response } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../db/prisma';
import { CLICK_ID_PATTERN, firstParam } from '../constants/tracking';

/**
 * Validates that an outbound postback URL is a public web address
 * and guards against Server-Side Request Forgery (SSRF) targeting internal IPs.
 */
function isSafePublicPostbackUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const host = parsed.hostname.toLowerCase();
    // Block localhost, link-local, loopback, and local domain suffixes
    if (
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1'
    ) {
      return false;
    }

    // Block private RFC 1918 & Cloud Metadata IP ranges (169.254.169.254)
    const ipv4Match = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (ipv4Match && ipv4Match[1] && ipv4Match[2]) {
      const b0 = parseInt(ipv4Match[1], 10);
      const b1 = parseInt(ipv4Match[2], 10);

      // 127.0.0.0/8 (Loopback)
      if (b0 === 127) return false;
      // 10.0.0.0/8 (Private)
      if (b0 === 10) return false;
      // 172.16.0.0/12 (Private)
      if (b0 === 172 && b1 >= 16 && b1 <= 31) return false;
      // 192.168.0.0/16 (Private)
      if (b0 === 192 && b1 === 168) return false;
      // 169.254.0.0/16 (Link-local & AWS/GCP/Azure Metadata service)
      if (b0 === 169 && b1 === 254) return false;
      // 0.0.0.0/8 (Broadcast/any)
      if (b0 === 0) return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Click Tracking & Zero-Leak Redirection Engine
 * Per DOD Rule 6: Missing or invalid partner parameters must safely fallback
 * to the master affiliate account so traffic and revenue are never lost.
 */
export async function handleClickRedirect(req: Request, res: Response): Promise<void> {
  const offerId = parseInt(req.query.offer_id as string, 10);
  let publisherId = parseInt(req.query.aff_id as string, 10);
  const subId = (req.query.sub_id as string) || null;

  if (isNaN(offerId)) {
    res.status(400).json({ error: 'Bad Request', message: 'Missing offer_id parameter' });
    return;
  }

  // 1. Verify Offer exists and is ACTIVE
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      network: true,
      publishers: !isNaN(publisherId) ? { where: { publisherId } } : undefined,
    },
  });

  if (!offer || offer.status !== 'ACTIVE') {
    // If offer is inactive or paused, route to trafficback URL if configured
    if (offer?.trafficbackUrl?.trim()) {
      res.redirect(302, offer.trafficbackUrl.trim());
      return;
    }
    res.status(404).json({ error: 'Not Found', message: 'Offer is inactive or not found' });
    return;
  }

  // 2. Zero-Leak Resolution: Fallback to Master Account if aff_id is missing or invalid
  let publisher = !isNaN(publisherId)
    ? await prisma.user.findFirst({
        where: { id: publisherId, role: 'PUBLISHER', status: 'ACTIVE' },
      })
    : null;

  let isMasterFallback = false;

  if (!publisher) {
    // Resolve Master Account (primary Admin or default active account)
    const masterAccount =
      (await prisma.user.findFirst({
        where: { role: 'ADMIN', status: 'ACTIVE' },
        orderBy: { id: 'asc' },
      })) ||
      (await prisma.user.findFirst({
        where: { status: 'ACTIVE' },
        orderBy: { id: 'asc' },
      }));

    if (masterAccount) {
      publisher = masterAccount;
      publisherId = masterAccount.id;
      isMasterFallback = true;
    } else {
      res.status(400).json({ error: 'Bad Request', message: 'Invalid partner attribution and no master account found' });
      return;
    }
  }

  // 3. Verify Visibility Access (skipped for Master Fallback)
  if (!isMasterFallback) {
    if (offer.visibility === 'PRIVATE') {
      const isAssigned = offer.publishers?.some((p) => p.isEnabled);
      if (!isAssigned) {
        // Fallback to trafficback if set, or route via master account rather than hard-failing
        if (offer.trafficbackUrl?.trim()) {
          res.redirect(302, offer.trafficbackUrl.trim());
          return;
        }
        isMasterFallback = true;
      }
    } else if (offer.visibility === 'REQUIRES_APPROVAL') {
      const isApproved = offer.publishers?.some((p) => p.isEnabled && p.approvalStatus === 'APPROVED');
      if (!isApproved) {
        if (offer.trafficbackUrl?.trim()) {
          res.redirect(302, offer.trafficbackUrl.trim());
          return;
        }
        isMasterFallback = true;
      }
    }
  }

  // 4. Capture Client Telemetry & Mint Click ID
  const clickId = crypto.randomUUID();
  const ipAddress =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown';

  // 5. Persist Click Record
  await prisma.click.create({
    data: {
      id: clickId,
      offerId,
      publisherId,
      subId: isMasterFallback ? (subId ? `${subId}_fallback` : 'master_fallback') : subId,
      ipAddress,
      countryCode: (req.headers['cf-ipcountry'] as string) || 'US',
      deviceType: 'Desktop',
      userAgent,
    },
  });

  // 6. Macro Replacement in Destination URL
  let resolvedUrl = offer.destinationUrl;
  resolvedUrl = resolvedUrl.replace(/{clickid}/gi, clickId);
  resolvedUrl = resolvedUrl.replace(/{click_id}/gi, clickId);
  resolvedUrl = resolvedUrl.replace(/{aff_id}/gi, String(publisherId));
  resolvedUrl = resolvedUrl.replace(/{offer_id}/gi, String(offerId));
  resolvedUrl = resolvedUrl.replace(/{sub_id}/gi, subId || '');

  // If client requested JSON response (preview / debug mode)
  if (req.query.json === '1') {
    res.json({
      clickId,
      offerId,
      publisherId,
      subId,
      isMasterFallback,
      resolvedUrl,
    });
    return;
  }

  // Standard 302 Found Redirection
  res.redirect(302, resolvedUrl);
}

/**
 * S2S Conversion Postback Receiver
 * Validates click attribution, enforces duplicate restrictions, verifies advertiser tokens,
 * and safely triggers outbound publisher postback webhooks.
 */
export async function handlePostback(req: Request, res: Response): Promise<void> {
  const query = { ...req.query, ...req.body };
  const clickId = firstParam(query.clickid) ?? firstParam(query.click_id);
  const goalValue = (query.goal as string) || '1';
  const sumOverride = query.sum ? parseFloat(query.sum as string) : undefined;
  const statusParam = (query.status as string) || '1';

  if (!clickId) {
    res.status(400).json({ error: 'Bad Request', message: 'Missing clickid parameter' });
    return;
  }

  // Networks often send the macro text itself (e.g. "{clickid}") when it is not set up yet
  if (!CLICK_ID_PATTERN.test(clickId)) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid clickid format', clickid: clickId.slice(0, 100) });
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

  // 2. Validate Advertiser Security Token if configured on the Offer
  if (click.offer.advertiserSecurityToken?.trim()) {
    const expectedToken = click.offer.advertiserSecurityToken.trim();
    const providedToken = (
      query.token ||
      query.sec_token ||
      query.security_token ||
      req.headers['x-advertiser-token']
    )?.toString().trim();

    if (!providedToken || providedToken !== expectedToken) {
      res.status(403).json({ error: 'Forbidden', message: 'Invalid or missing advertiser security token' });
      return;
    }
  }

  // 3. Check duplicate conversions allowed per network policy
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

  // 4. Snapshot offer revenue & payout
  const defaultPayout = click.offer.payouts[0];
  const revenue = sumOverride !== undefined && !isNaN(sumOverride)
    ? sumOverride
    : defaultPayout ? Number(defaultPayout.revenue) : 150.0;
  const payout = defaultPayout ? Number(defaultPayout.payout) : 100.0;
  const currency = defaultPayout?.currency || 'USD';

  // Map status: 1 = APPROVED, 2 = UNCHECKED, 3 = DECLINED
  const conversionStatus = statusParam === '1' ? 'APPROVED' : statusParam === '3' ? 'DECLINED' : 'UNCHECKED';

  // 5. Create conversion record with atomic race condition catch
  let conversion;
  try {
    conversion = await prisma.conversion.create({
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
  } catch (err: any) {
    if (err?.code === 'P2002') {
      res.status(409).json({ error: 'Conflict', message: 'Duplicate conversion already recorded for this click' });
      return;
    }
    throw err;
  }

  // 6. Outbound S2S Postback to Publisher with SSRF Protection
  if (click.publisher.postbackUrl?.trim()) {
    let outUrl = click.publisher.postbackUrl.trim();
    outUrl = outUrl.replace(/{clickid}/gi, clickId);
    outUrl = outUrl.replace(/{click_id}/gi, clickId);
    outUrl = outUrl.replace(/{payout}/gi, String(payout));
    outUrl = outUrl.replace(/{sub_id}/gi, click.subId || '');

    if (isSafePublicPostbackUrl(outUrl)) {
      // Fire asynchronously with strict 3-second timeout
      fetch(outUrl, { method: 'GET', signal: AbortSignal.timeout(3000) }).catch((err) => {
        console.warn(`Outbound publisher postback failed for ${click.publisher.name}:`, err.message);
      });
    } else {
      console.warn(`[Security] Blocked potential SSRF publisher postback dispatch to: ${outUrl}`);
    }
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
