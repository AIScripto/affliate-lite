import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../db/prisma';

export async function createPublisher(req: Request, res: Response): Promise<void> {
  const { name, email, password, publisherType, postbackUrl, offerIds } = req.body;

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existing) {
    res.status(409).json({ error: 'Conflict', message: 'A user with this email already exists' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const publisher = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: 'PUBLISHER',
        status: 'ACTIVE',
        publisherType: publisherType || 'Publisher',
        postbackUrl: postbackUrl?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        publisherType: true,
        postbackUrl: true,
        createdAt: true,
      },
    });

    if (Array.isArray(offerIds) && offerIds.length > 0) {
      await tx.offerPublisher.createMany({
        data: offerIds.map((offerId: number) => ({
          offerId: Number(offerId),
          publisherId: user.id,
          isEnabled: true,
          approvalStatus: 'APPROVED',
        })),
        skipDuplicates: true,
      });
    }

    const assigned = await tx.offerPublisher.findMany({
      where: { publisherId: user.id },
      select: {
        offer: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      ...user,
      assignedOffers: assigned,
    };
  });

  res.status(201).json(publisher);
}

export async function getPublishers(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
  const search = ((req.query.search as string) || '').trim();
  const sortDir = (req.query.sortDir as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc';

  const where = {
    role: 'PUBLISHER' as const,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [total, publishers] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: sortDir },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        publisherType: true,
        postbackUrl: true,
        createdAt: true,
        assignedOffers: {
          select: {
            offer: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: {
            assignedOffers: true,
            clicks: true,
            conversions: true,
          },
        },
      },
    }),
  ]);

  res.json({
    data: publishers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function getPublisherById(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid publisher ID' });
    return;
  }

  const publisher = await prisma.user.findFirst({
    where: { id, role: 'PUBLISHER' },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      publisherType: true,
      postbackUrl: true,
      createdAt: true,
      assignedOffers: {
        select: {
          offer: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!publisher) {
    res.status(404).json({ error: 'Not Found', message: 'Publisher not found' });
    return;
  }

  res.json({ publisher });
}

export async function updatePublisher(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid publisher ID' });
    return;
  }

  const { name, email, password, publisherType, postbackUrl, offerIds } = req.body;
  const updateData: Record<string, unknown> = {};

  if (name) updateData.name = name;
  if (email) updateData.email = email.toLowerCase();
  if (password) updateData.passwordHash = await bcrypt.hash(password, 10);
  if (publisherType) updateData.publisherType = publisherType;
  if (postbackUrl !== undefined) updateData.postbackUrl = postbackUrl?.trim() || null;

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        publisherType: true,
        postbackUrl: true,
        updatedAt: true,
      },
    });

    if (Array.isArray(offerIds)) {
      await tx.offerPublisher.deleteMany({
        where: { publisherId: id },
      });

      if (offerIds.length > 0) {
        await tx.offerPublisher.createMany({
          data: offerIds.map((offerId: number) => ({
            offerId: Number(offerId),
            publisherId: id,
            isEnabled: true,
            approvalStatus: 'APPROVED',
          })),
          skipDuplicates: true,
        });
      }
    }

    const assigned = await tx.offerPublisher.findMany({
      where: { publisherId: id },
      select: {
        offer: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      ...user,
      assignedOffers: assigned,
    };
  });

  res.json({ publisher: updated });
}

/**
 * Transactional Status Update with Automatic Offer Revocation
 * Per [02:08]–[02:25] & specs/backend/04-Backend-DoD-Skill.md Section 3.2
 */
export async function updatePublisherStatus(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid publisher ID' });
    return;
  }

  const { status } = req.body;

  // Use interactive transaction to guarantee atomicity
  const updatedUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id },
      data: { status },
      select: { id: true, name: true, status: true },
    });

    // If deactivated (INACTIVE or PAUSED), remove all assigned offers atomically
    if (status === 'INACTIVE' || status === 'PAUSED') {
      await tx.offerPublisher.deleteMany({
        where: { publisherId: id },
      });
    }

    return user;
  });

  res.json({
    message: `Publisher status updated to ${status}`,
    publisher: updatedUser,
  });
}

export async function deletePublisher(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid publisher ID' });
    return;
  }

  await prisma.user.delete({
    where: { id },
  });

  res.json({ message: 'Publisher deleted successfully' });
}
