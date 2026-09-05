import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Router } from 'express';
import { config } from '../config.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { runSqlFile } from '../scripts/runSql.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '../../private_uploads');
export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('CPS'));

adminRouter.post('/reset', async (req, res) => {
  if (req.get('x-reset-key') !== config.resetKey) {
    return res.status(403).json({ error: 'The demonstration reset key is incorrect.' });
  }
  await runSqlFile('003_reset.sql');
  await runSqlFile('001_schema.sql');
  await runSqlFile('002_seed.sql');
  const files = await fs.readdir(uploadDir).catch(() => []);
  await Promise.all(files.filter((name) => name !== '.gitkeep').map((name) => fs.rm(path.join(uploadDir, name), { force: true })));
  req.app.get('io')?.to('CPS').emit('dataset:reset', { at: new Date().toISOString() });
  res.json({ message: 'Practice data restored to the known CampusSafe Twin seed.' });
});
