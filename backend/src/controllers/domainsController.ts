import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export async function createDomain(req: Request, res: Response): Promise<void> {
  const { name } = req.body;

  const existing = await prisma.domain.findUnique({
    where: { name: name.toLowerCase() },
  });

  if (existing) {
    res.status(409).json({ error: 'Conflict', message: 'Domain already registered' });
    return;
  }

  const domain = await prisma.domain.create({
    data: {
      name: name.toLowerCase(),
      status: 'ACTIVE',
    },
  });

  res.status(201).json(domain);
}

export async function getDomains(_req: Request, res: Response): Promise<void> {
  const domains = await prisma.domain.findMany({
    orderBy: { id: 'desc' },
    include: {
      _count: {
        select: { offers: true },
      },
    },
  });

  res.json({ domains });
}

export async function updateDomainStatus(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid domain ID' });
    return;
  }

  const { status } = req.body;

  const domain = await prisma.domain.update({
    where: { id },
    data: { status },
  });

  res.json({ message: `Domain status updated to ${status}`, domain });
}

export async function deleteDomain(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Bad Request', message: 'Invalid domain ID' });
    return;
  }

  await prisma.domain.delete({
    where: { id },
  });

  res.json({ message: 'Domain deleted successfully' });
}
