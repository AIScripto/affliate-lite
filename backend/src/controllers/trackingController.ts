import { Request, Response } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../db/prisma';
import { firstParam, parseDbId } from '../constants/tracking';
import { SUB_ID_MAX_LENGTH } from '../constants/postback';
import { getClientIp } from '../utils/clientIp';
import { fillUrlTemplate } from '../utils/urlTemplate';

/**
 * Click Tracking & Zero-Leak Redirection Engine
 * Per DOD Rule 6: Missing or invalid partner parameters must safely fallback
 * to the master affiliate account so traffic and revenue are never lost.
 */
export async function handleClickRedirect(req: Request, res: Response): Promise<void> {
  const offerId = parseDbId(req.query.offer_id);
  // An invalid aff_id is treated as missing: the click goes to the master account (zero-leak)
  let publisherId = parseDbId(req.query.aff_id) ?? NaN;
  // Reserve room for the "_fallback" suffix added below so the value always fits the column
  const subId = firstParam(req.query.sub_id)?.slice(0, SUB_ID_MAX_LENGTH - '_fallback'.length) ?? null;

  if (offerId === undefined) {
    res.status(400).json({ error: 'Bad Request', message: 'Missing or invalid offer_id parameter' });
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
  const ipAddress = getClientIp(req);
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
  // Values are URL-encoded so a sub_id like "a&aff_id=999" cannot add parameters to the advertiser URL
  const resolvedUrl = fillUrlTemplate(offer.destinationUrl, {
    clickid: clickId,
    click_id: clickId,
    aff_id: String(publisherId),
    offer_id: String(offerId),
    sub_id: subId || '',
  });

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
