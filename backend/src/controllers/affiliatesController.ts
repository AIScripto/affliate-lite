import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export async function getOfferAffiliates(req: Request, res: Response): Promise<void> {
  const offerId = parseInt(req.params.id as string, 10);
  if (isNaN(offerId)) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid offer ID' });
    return;
  }

  const search = ((req.query.search as string) || '').trim().toLowerCase();

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    select: { id: true, visibility: true },
  });

  if (!offer) {
    res.status(404).json({ error: 'Not Found', message: 'Offer not found' });
    return;
  }

  // Fetch all active publishers
  const activePublishers = await prisma.user.findMany({
    where: {
      role: 'PUBLISHER',
      status: 'ACTIVE',
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
    },
    orderBy: { id: 'asc' },
  });

  // Fetch currently enabled publishers for this offer
  const enabledRecords = await prisma.offerPublisher.findMany({
    where: { offerId },
    select: { publisherId: true },
  });

  const enabledSet = new Set(enabledRecords.map((r) => r.publisherId));

  const allAffiliates = activePublishers.filter((p) => !enabledSet.has(p.id));
  const enabledAffiliates = activePublishers.filter((p) => enabledSet.has(p.id));

  res.json({
    offerId,
    visibility: offer.visibility,
    allAffiliates,
    enabledAffiliates,
  });
}

export async function assignOfferAffiliate(req: Request, res: Response): Promise<void> {
  const offerId = parseInt(req.params.id as string, 10);
  const publisherId = parseInt(req.params.publisherId as string, 10);

  if (isNaN(offerId) || isNaN(publisherId)) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid offer or publisher ID' });
    return;
  }

  const publisher = await prisma.user.findFirst({
    where: { id: publisherId, role: 'PUBLISHER', status: 'ACTIVE' },
  });

  if (!publisher) {
    res.status(400).json({ error: 'Bad Request', message: 'Publisher is not active or does not exist' });
    return;
  }

  await prisma.offerPublisher.upsert({
    where: {
      offerId_publisherId: {
        offerId,
        publisherId,
      },
    },
    update: {
      isEnabled: true,
      approvalStatus: 'APPROVED',
    },
    create: {
      offerId,
      publisherId,
      isEnabled: true,
      approvalStatus: 'APPROVED',
    },
  });

  res.json({ message: 'Affiliate assigned to offer successfully' });
}

export async function unassignOfferAffiliate(req: Request, res: Response): Promise<void> {
  const offerId = parseInt(req.params.id as string, 10);
  const publisherId = parseInt(req.params.publisherId as string, 10);

  if (isNaN(offerId) || isNaN(publisherId)) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid offer or publisher ID' });
    return;
  }

  await prisma.offerPublisher.deleteMany({
    where: {
      offerId,
      publisherId,
    },
  });

  res.json({ message: 'Affiliate removed from offer successfully' });
}
