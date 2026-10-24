import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../db/prisma';
import { generateToken } from '../middleware/auth';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password' });
    return;
  }

  if (user.status !== 'ACTIVE') {
    res.status(403).json({ error: 'Forbidden', message: 'Your account is inactive or paused' });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password' });
    return;
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      postbackUrl: true,
      createdAt: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: 'Not Found', message: 'User not found' });
    return;
  }

  res.json({ user });
}
