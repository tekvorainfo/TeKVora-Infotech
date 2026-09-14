import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

export default function contactRoutes(prisma: PrismaClient) {
  const router = Router();

  router.post('/', async (req, res) => {
    const item = await prisma.contactSubmission.create({ data: req.body });
    res.json(item);
  });

  return router;
}
