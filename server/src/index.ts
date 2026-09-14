import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import internshipRoutes from './routes/internships.js';
import jobRoutes from './routes/jobs.js';
import contactRoutes from './routes/contact.js';
import scheduledClassesRoutes from './routes/scheduledClasses.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

const frontendDist = path.resolve(__dirname, '../../dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(frontendDist));
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'tekvora-node-backend' });
});

app.use('/api/auth', authRoutes(prisma));
app.use('/api/courses', courseRoutes(prisma));
app.use('/api/internships', internshipRoutes(prisma));
app.use('/api/jobs', jobRoutes(prisma));
app.use('/api/contact', contactRoutes(prisma));
app.use('/api/scheduled_classes', scheduledClassesRoutes());

if (process.env.NODE_ENV === 'production') {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
