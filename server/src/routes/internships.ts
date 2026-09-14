import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

export default function internshipRoutes(prisma: PrismaClient) {
  const router = Router();

  router.get('/', async (_req, res) => {
    const data = await prisma.internship.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(data);
  });

  router.post('/', authMiddleware, async (req, res) => {
    const item = await prisma.internship.create({ data: req.body });
    res.json(item);
  });

  return router;
}
