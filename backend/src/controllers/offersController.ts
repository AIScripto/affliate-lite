import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export async function createOffer(req: Request, res: Response): Promise<void> {
  const rawBody = req.body || {};
  const general = rawBody.general || {
    name: rawBody.name,
    networkId: rawBody.advertiserId || rawBody.networkId,
    visibility: rawBody.visibility,
    status: rawBody.status,
    previewUrl: rawBody.previewUrl,
    description: rawBody.description,
  };
  const tracking = rawBody.tracking || {
    domainId: rawBody.domainId,
    destinationUrl: rawBody.baseDestinationUrl || rawBody.destinationUrl,
    trafficbackUrl: rawBody.trafficbackUrl,
    cookieLifetimeDays: rawBody.cookieLifetimeDays,
    clickSessionLifespanHours: rawBody.clickSessionLifespanHours,
    allowConversionsWithoutSession: rawBody.allowConversionsWithoutSession,
    enforceIpUniqueness: rawBody.enforceIpUniqueness,
    blockDuplicateIps: rawBody.blockDuplicateIps,
  };
  const targeting = rawBody.targeting || {
    name: rawBody.targetingGroups?.[0]?.name || rawBody.targetingName || 'Targeting group #1',
    conditionOp: rawBody.targetingGroups?.[0]?.condition || rawBody.condition || 'AND',
    isEnabled: true,
    devices: rawBody.targetingGroups?.[0]?.devices || rawBody.devices || ['ALL'],
    countries: rawBody.targetingGroups?.[0]?.countries || rawBody.countries || ['ALL'],
    excludeCountries: Boolean(rawBody.targetingGroups?.[0]?.excludeCountries ?? rawBody.excludeCountries),
    cities: rawBody.targetingGroups?.[0]?.cities || rawBody.cities || [],
    regions: rawBody.targetingGroups?.[0]?.regions || rawBody.regions || [],
  };
  const affiliates = rawBody.affiliates || {
    enabledPublisherIds: rawBody.enabledAffiliates?.map((a: any) => a.id) || rawBody.enabledPublisherIds || [],
  };
  const revenuePayouts = rawBody.revenuePayouts || {
    title: 'Default',
    goalValue: '1',
    paymentModel: rawBody.payouts?.[0]?.paymentModel || rawBody.paymentModel || 'CPA_FIXED',
    currency: rawBody.payouts?.[0]?.currency || rawBody.currency || 'USD',
    revenue: rawBody.payouts?.[0]?.revenue ?? rawBody.revenue ?? 0,
    payout: rawBody.payouts?.[0]?.payout ?? rawBody.payout ?? 0,
  };

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Base Offer
    const offer = await tx.offer.create({
      data: {
        name: general.name,
        networkId: general.networkId,
        domainId: tracking.domainId || null,
        visibility: general.visibility,
        status: general.status,
        previewUrl: general.previewUrl || null,
        description: general.description || null,
        destinationUrl: tracking.destinationUrl,
        trafficbackUrl: tracking.trafficbackUrl?.trim() || null,
        cookieLifetimeDays: tracking.cookieLifetimeDays ?? 30,
        clickSessionLifespanHours: tracking.clickSessionLifespanHours ?? 24,
        allowConversionsWithoutSession: Boolean(tracking.allowConversionsWithoutSession),
        enforceIpUniqueness: Boolean(tracking.enforceIpUniqueness),
        blockDuplicateIps: Boolean(tracking.blockDuplicateIps),
        postbackMacroParam: tracking.postbackMacroParam || '{clickid}',
        advertiserSecurityToken: tracking.advertiserSecurityToken || null,
        postbackExtraQuery: tracking.postbackExtraQuery || '',
        postbackCustomParams: tracking.postbackCustomParams || null,
      },
    });

    // 2. Create Targeting Group
    await tx.offerTargetingGroup.create({
      data: {
        offerId: offer.id,
        name: targeting.name || 'Targeting group #1',
        conditionOp: targeting.conditionOp || 'AND',
        isEnabled: targeting.isEnabled ?? true,
        preset: targeting.preset || null,
        affiliateIds: targeting.affiliateIds || [],
        devices: targeting.devices || ['ALL'],
        countries: targeting.countries || ['ALL'],
        excludeCountries: Boolean(targeting.excludeCountries),
        cities: targeting.cities || [],
        excludeCities: Boolean(targeting.excludeCities),
        regions: targeting.regions || [],
        excludeRegions: Boolean(targeting.excludeRegions),
        operatingSystems: targeting.operatingSystems || [],
        browsers: targeting.browsers || [],
        connectionTypes: targeting.connectionTypes || [],
        carriers: targeting.carriers || [],
        ips: targeting.ips || [],
        languages: targeting.languages || [],
        additionalUrls: targeting.additionalUrls || [],
      },
    });

    // 3. Create Offer Payout
    await tx.offerPayout.create({
      data: {
        offerId: offer.id,
        title: revenuePayouts.title || 'Default',
        goalValue: revenuePayouts.goalValue || '1',
        paymentModel: revenuePayouts.paymentModel || 'CPA_FIXED',
        currency: revenuePayouts.currency || 'USD',
        revenue: revenuePayouts.revenue || 0,
        payout: revenuePayouts.payout || 0,
      },
    });

    // 4. Handle Visibility State Machine & Affiliates Assignment
    if (general.visibility === 'PRIVATE' && affiliates.enabledPublisherIds.length > 0) {
      await tx.offerPublisher.createMany({
        data: affiliates.enabledPublisherIds.map((pubId: number) => ({
          offerId: offer.id,
          publisherId: pubId,
          isEnabled: true,
          approvalStatus: 'APPROVED',
        })),
        skipDuplicates: true,
      });
    }

    return offer;
  });

  const fullOffer = await prisma.offer.findUnique({
    where: { id: result.id },
    include: {
      network: true,
      domain: true,
      targetingGroups: true,
      payouts: true,
      publishers: {
        include: { publisher: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  res.status(201).json(fullOffer);
}

export async function getOffers(req: Request, res: Response): Promise<void> {
  const isPublisher = req.user?.role === 'PUBLISHER';
  const publisherId = isPublisher ? req.user?.id : undefined;

  let whereClause: Record<string, unknown> = {};

  if (isPublisher && publisherId) {
    // Publisher can see PUBLIC active offers OR PRIVATE active offers assigned to them
    whereClause = {
      status: 'ACTIVE',
      OR: [
        { visibility: 'PUBLIC' },
        {
          visibility: 'PRIVATE',
          publishers: {
            some: {
              publisherId,
              isEnabled: true,
            },
          },
        },
        { visibility: 'REQUIRES_APPROVAL' },
      ],
    };
  }

  const offers = await prisma.offer.findMany({
    where: whereClause,
    orderBy: { id: 'desc' },
    include: {
      network: { select: { id: true, name: true } },
      domain: { select: { id: true, name: true } },
      payouts: true,
      targetingGroups: true,
      _count: {
        select: {
          clicks: true,
          conversions: true,
          publishers: true,
        },
      },
    },
  });

  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

  const formatted = offers.map((o) => {
    const defaultPayout = o.payouts[0];
    const postbackUrl = `${baseUrl}/postback?clickid={clickid}`;

    return {
      id: o.id,
      name: o.name,
      domain: o.domain,
      domainId: o.domainId,
      network: o.network.name,
      networkId: o.network.id,
      advertiser: o.network,
      advertiserId: o.network.id,
      visibility: o.visibility,
      status: o.status,
      clicks: o._count.clicks,
      clicksCount: o._count.clicks,
      conversions: o._count.conversions,
      conversionsCount: o._count.conversions,
      postbackUrl,
      payout: defaultPayout ? Number(defaultPayout.payout) : 0.0,
      revenue: defaultPayout ? Number(defaultPayout.revenue) : 0.0,
      currency: defaultPayout?.currency || 'USD',
      paymentModel: defaultPayout?.paymentModel || 'CPA_FIXED',
      destinationUrl: o.destinationUrl,
      baseDestinationUrl: o.destinationUrl,
      trafficbackUrl: o.trafficbackUrl,
      cookieLifetimeDays: o.cookieLifetimeDays,
      clickSessionLifespanHours: o.clickSessionLifespanHours,
      allowConversionsWithoutSession: o.allowConversionsWithoutSession,
      enforceIpUniqueness: o.enforceIpUniqueness,
      blockDuplicateIps: o.blockDuplicateIps,
      previewUrl: o.previewUrl,
      description: o.description,
      targetingGroups: o.targetingGroups,
      payouts: o.payouts,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    };
  });

  res.json({ offers: formatted });
}

export async function getOfferById(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid offer ID' });
    return;
  }

  const offer = await prisma.offer.findUnique({
    where: { id },
    include: {
      network: true,
      domain: true,
      targetingGroups: true,
      payouts: true,
      publishers: {
        include: {
          publisher: { select: { id: true, name: true, email: true, status: true } },
        },
      },
      _count: {
        select: { clicks: true, conversions: true },
      },
    },
  });

  if (!offer) {
    res.status(404).json({ error: 'Not Found', message: 'Offer not found' });
    return;
  }

  const formattedOffer = {
    ...offer,
    advertiser: offer.network,
    advertiserId: offer.networkId,
    baseDestinationUrl: offer.destinationUrl,
    clicksCount: offer._count.clicks,
    conversionsCount: offer._count.conversions,
  };

  res.json({ offer: formattedOffer });
}

export async function updateOffer(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid offer ID' });
    return;
  }

  const rawBody = req.body || {};
  const general = rawBody.general || {
    name: rawBody.name,
    networkId: rawBody.advertiserId || rawBody.networkId,
    visibility: rawBody.visibility,
    status: rawBody.status,
    previewUrl: rawBody.previewUrl,
    description: rawBody.description,
  };
  const tracking = rawBody.tracking || {
    domainId: rawBody.domainId,
    destinationUrl: rawBody.baseDestinationUrl || rawBody.destinationUrl,
    trafficbackUrl: rawBody.trafficbackUrl,
    cookieLifetimeDays: rawBody.cookieLifetimeDays,
    clickSessionLifespanHours: rawBody.clickSessionLifespanHours,
    allowConversionsWithoutSession: rawBody.allowConversionsWithoutSession,
    enforceIpUniqueness: rawBody.enforceIpUniqueness,
    blockDuplicateIps: rawBody.blockDuplicateIps,
    postbackMacroParam: rawBody.postbackMacroParam,
    advertiserSecurityToken: rawBody.advertiserSecurityToken,
    postbackExtraQuery: rawBody.postbackExtraQuery,
    postbackCustomParams: rawBody.postbackCustomParams,
  };
  const targeting = rawBody.targeting || {
    name: rawBody.targetingGroups?.[0]?.name || rawBody.targetingName || 'Targeting group #1',
    conditionOp: rawBody.targetingGroups?.[0]?.condition || rawBody.condition || 'AND',
    isEnabled: true,
    preset: rawBody.targetingGroups?.[0]?.preset || rawBody.preset || null,
    affiliateIds: rawBody.targetingGroups?.[0]?.affiliateIds || rawBody.affiliateIds || [],
    devices: rawBody.targetingGroups?.[0]?.devices || rawBody.devices || ['ALL'],
    countries: rawBody.targetingGroups?.[0]?.countries || rawBody.countries || ['ALL'],
    excludeCountries: Boolean(rawBody.targetingGroups?.[0]?.excludeCountries ?? rawBody.excludeCountries),
    cities: rawBody.targetingGroups?.[0]?.cities || rawBody.cities || [],
    excludeCities: Boolean(rawBody.targetingGroups?.[0]?.excludeCities ?? rawBody.excludeCities),
    regions: rawBody.targetingGroups?.[0]?.regions || rawBody.regions || [],
    excludeRegions: Boolean(rawBody.targetingGroups?.[0]?.excludeRegions ?? rawBody.excludeRegions),
    operatingSystems: rawBody.targetingGroups?.[0]?.operatingSystems || rawBody.operatingSystems || [],
    browsers: rawBody.targetingGroups?.[0]?.browsers || rawBody.browsers || [],
    connectionTypes: rawBody.targetingGroups?.[0]?.connectionTypes || rawBody.connectionTypes || [],
    carriers: rawBody.targetingGroups?.[0]?.carriers || rawBody.carriers || [],
    ips: rawBody.targetingGroups?.[0]?.ips || rawBody.ips || [],
    languages: rawBody.targetingGroups?.[0]?.languages || rawBody.languages || [],
    additionalUrls: rawBody.targetingGroups?.[0]?.additionalUrls || rawBody.additionalUrls || [],
  };
  const affiliates = rawBody.affiliates || {
    enabledPublisherIds: rawBody.enabledAffiliates?.map((a: any) => a.id) || rawBody.enabledPublisherIds || [],
  };
  const revenuePayouts = rawBody.revenuePayouts || {
    title: 'Default',
    goalValue: '1',
    paymentModel: rawBody.payouts?.[0]?.paymentModel || rawBody.paymentModel || 'CPA_FIXED',
    currency: rawBody.payouts?.[0]?.currency || rawBody.currency || 'USD',
    revenue: rawBody.payouts?.[0]?.revenue ?? rawBody.revenue ?? 0,
    payout: rawBody.payouts?.[0]?.payout ?? rawBody.payout ?? 0,
  };

  await prisma.$transaction(async (tx) => {
    // 1. Update Core Offer
    await tx.offer.update({
      where: { id },
      data: {
        name: general.name,
        networkId: general.networkId,
        domainId: tracking.domainId || null,
        visibility: general.visibility,
        status: general.status,
        previewUrl: general.previewUrl || null,
        description: general.description || null,
        destinationUrl: tracking.destinationUrl,
        trafficbackUrl: tracking.trafficbackUrl?.trim() || null,
        cookieLifetimeDays: tracking.cookieLifetimeDays ?? 30,
        clickSessionLifespanHours: tracking.clickSessionLifespanHours ?? 24,
        allowConversionsWithoutSession: Boolean(tracking.allowConversionsWithoutSession),
        enforceIpUniqueness: Boolean(tracking.enforceIpUniqueness),
        blockDuplicateIps: Boolean(tracking.blockDuplicateIps),
        postbackMacroParam: tracking.postbackMacroParam || '{clickid}',
        advertiserSecurityToken: tracking.advertiserSecurityToken || null,
        postbackExtraQuery: tracking.postbackExtraQuery !== undefined ? tracking.postbackExtraQuery : '',
        postbackCustomParams: tracking.postbackCustomParams !== undefined ? tracking.postbackCustomParams : null,
      },
    });

    // 2. Upsert Targeting Group
    const existingGroup = await tx.offerTargetingGroup.findFirst({ where: { offerId: id } });
    if (existingGroup) {
      await tx.offerTargetingGroup.update({
        where: { id: existingGroup.id },
        data: {
          name: targeting.name || existingGroup.name,
          conditionOp: targeting.conditionOp || existingGroup.conditionOp,
          isEnabled: targeting.isEnabled ?? existingGroup.isEnabled,
          preset: targeting.preset !== undefined ? targeting.preset : existingGroup.preset,
          affiliateIds: targeting.affiliateIds || existingGroup.affiliateIds,
          devices: targeting.devices || existingGroup.devices,
          countries: targeting.countries || existingGroup.countries,
          excludeCountries: Boolean(targeting.excludeCountries),
          cities: targeting.cities || existingGroup.cities,
          excludeCities: Boolean(targeting.excludeCities),
          regions: targeting.regions || existingGroup.regions,
          excludeRegions: Boolean(targeting.excludeRegions),
          operatingSystems: targeting.operatingSystems || existingGroup.operatingSystems,
          browsers: targeting.browsers || existingGroup.browsers,
          connectionTypes: targeting.connectionTypes || existingGroup.connectionTypes,
          carriers: targeting.carriers || existingGroup.carriers,
          ips: targeting.ips || existingGroup.ips,
          languages: targeting.languages || existingGroup.languages,
          additionalUrls: targeting.additionalUrls || existingGroup.additionalUrls,
        },
      });
    }

    // 3. Upsert Payout
    const existingPayout = await tx.offerPayout.findFirst({ where: { offerId: id } });
    if (existingPayout) {
      await tx.offerPayout.update({
        where: { id: existingPayout.id },
        data: {
          title: revenuePayouts.title || existingPayout.title,
          goalValue: revenuePayouts.goalValue || existingPayout.goalValue,
          paymentModel: revenuePayouts.paymentModel || existingPayout.paymentModel,
          currency: revenuePayouts.currency || existingPayout.currency,
          revenue: revenuePayouts.revenue || existingPayout.revenue,
          payout: revenuePayouts.payout || existingPayout.payout,
        },
      });
    }

    // 4. Update Affiliates based on visibility state machine
    if (general.visibility === 'PUBLIC') {
      // Clear enabled affiliates list per client directive at [04:10]
      await tx.offerPublisher.deleteMany({ where: { offerId: id } });
    } else if (general.visibility === 'PRIVATE' && affiliates?.enabledPublisherIds) {
      await tx.offerPublisher.deleteMany({ where: { offerId: id } });
      if (affiliates.enabledPublisherIds.length > 0) {
        await tx.offerPublisher.createMany({
          data: affiliates.enabledPublisherIds.map((pubId: number) => ({
            offerId: id,
            publisherId: pubId,
            isEnabled: true,
            approvalStatus: 'APPROVED',
          })),
          skipDuplicates: true,
        });
      }
    }
  });

  const updatedOffer = await prisma.offer.findUnique({
    where: { id },
    include: {
      network: true,
      domain: true,
      targetingGroups: true,
      payouts: true,
      publishers: {
        include: { publisher: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  res.json({ message: 'Offer updated successfully', offer: updatedOffer });
}

export async function updateOfferStatus(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid offer ID' });
    return;
  }

  const { status } = req.body;

  const updated = await prisma.offer.update({
    where: { id },
    data: { status },
  });

  res.json({ message: `Offer status updated to ${status}`, offer: updated });
}

export async function deleteOffer(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid offer ID' });
    return;
  }

  await prisma.offer.delete({
    where: { id },
  });

  res.json({ message: 'Offer deleted successfully' });
}

export async function duplicateOffer(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid offer ID' });
    return;
  }

  const source = await prisma.offer.findUnique({
    where: { id },
    include: {
      targetingGroups: true,
      payouts: true,
    },
  });

  if (!source) {
    res.status(404).json({ error: 'Not Found', message: 'Source offer not found' });
    return;
  }

  const clone = await prisma.$transaction(async (tx) => {
    const newOffer = await tx.offer.create({
      data: {
        name: `${source.name} - Copy`,
        networkId: source.networkId,
        domainId: source.domainId,
        visibility: source.visibility,
        status: 'PAUSED', // Duplicated offer starts as paused for safety
        previewUrl: source.previewUrl,
        description: source.description,
        destinationUrl: source.destinationUrl,
        enforceIpUniqueness: source.enforceIpUniqueness,
        blockDuplicateIps: source.blockDuplicateIps,
      },
    });

    if (source.targetingGroups.length > 0) {
      await tx.offerTargetingGroup.createMany({
        data: source.targetingGroups.map((tg) => ({
          offerId: newOffer.id,
          name: tg.name,
          conditionOp: tg.conditionOp,
          isEnabled: tg.isEnabled,
          devices: tg.devices,
          countries: tg.countries,
          excludeCountries: tg.excludeCountries,
          cities: tg.cities,
          regions: tg.regions,
        })),
      });
    }

    if (source.payouts.length > 0) {
      await tx.offerPayout.createMany({
        data: source.payouts.map((p) => ({
          offerId: newOffer.id,
          title: p.title,
          goalValue: p.goalValue,
          paymentModel: p.paymentModel,
          currency: p.currency,
          revenue: p.revenue,
          payout: p.payout,
          countries: p.countries,
          excludeCountries: p.excludeCountries,
        })),
      });
    }

    return newOffer;
  });

  res.status(201).json({ message: 'Offer duplicated successfully', offer: clone });
}
