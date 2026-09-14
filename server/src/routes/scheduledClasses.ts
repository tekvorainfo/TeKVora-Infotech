import { Router } from 'express';

export default function scheduledClassesRoutes() {
  const router = Router();

  // In-memory store for local dev (since Prisma schema doesn't have this model)
  // On production, data goes to Supabase directly from the frontend
  const classes: Record<string, unknown>[] = [];

  router.get('/', (_req, res) => {
    const sorted = [...classes].sort(
      (a, b) => new Date(a.date as string).getTime() - new Date(b.date as string).getTime()
    );
    res.json(sorted);
  });

  router.post('/', (req, res) => {
    const { title, date, link, instructor = 'Admin', tags = [] } = req.body;
    if (!title || !date || !link) {
      return res.status(400).json({ error: 'title, date, and link are required' });
    }
    const entry = {
      id: `cls-${Date.now()}`,
      title,
      date,
      link,
      instructor,
      tags,
      created_at: new Date().toISOString(),
    };
    classes.push(entry);
    res.json(entry);
  });

  router.delete('/:id', (req, res) => {
    const idx = classes.findIndex(c => c.id === req.params.id);
    if (idx !== -1) classes.splice(idx, 1);
    res.json({ success: true });
  });

  return router;
}
