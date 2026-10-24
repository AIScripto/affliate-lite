import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export async function createNetwork(req: Request, res: Response): Promise<void> {
  const { name, contactDetails, allowDuplicateConversions } = req.body;

  const network = await prisma.network.create({
    data: {
      name,
      contactDetails: contactDetails || null,
      allowDuplicateConversions: Boolean(allowDuplicateConversions),
      status: 'ACTIVE',
    },
  });

  res.status(201).json(network);
}

export async function getNetworks(_req: Request, res: Response): Promise<void> {
  const networks = await prisma.network.findMany({
    orderBy: { id: 'desc' },
    include: {
      _count: {
        select: {
          offers: true,
          conversions: true,
        },
      },
    },
  });

  const formatted = networks.map((net) => ({
    id: net.id,
    name: net.name,
    contactDetails: net.contactDetails || '-',
    allowDuplicateConversions: net.allowDuplicateConversions,
    duplicate: net.allowDuplicateConversions ? 'Allowed' : 'Restricted',
    status: net.status,
    createdAt: net.createdAt,
    offersCount: net._count.offers,
  }));

  res.json({ networks: formatted });
}

export async function getNetworkById(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid network ID' });
    return;
  }

  const network = await prisma.network.findUnique({
    where: { id },
  });

  if (!network) {
    res.status(404).json({ error: 'Not Found', message: 'Network not found' });
    return;
  }

  res.json({ network });
}

export async function updateNetwork(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid network ID' });
    return;
  }

  const { name, contactDetails, allowDuplicateConversions, status } = req.body;

  const updated = await prisma.network.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(contactDetails !== undefined ? { contactDetails } : {}),
      ...(allowDuplicateConversions !== undefined ? { allowDuplicateConversions } : {}),
      ...(status ? { status } : {}),
    },
  });

  res.json({ network: updated });
}

export async function updateNetworkStatus(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid network ID' });
    return;
  }

  const { status } = req.body;

  const updated = await prisma.network.update({
    where: { id },
    data: { status },
  });

  res.json({ message: `Network status updated to ${status}`, network: updated });
}

export async function deleteNetwork(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid network ID' });
    return;
  }

  await prisma.network.delete({
    where: { id },
  });

  res.json({ message: 'Network deleted successfully' });
}
