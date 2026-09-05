import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../db.js';
import { runSqlFile } from './runSql.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '../../private_uploads');

try {
  await runSqlFile('003_reset.sql');
  await runSqlFile('001_schema.sql');
  await runSqlFile('002_seed.sql');
  const files = await fs.readdir(uploadDir).catch(() => []);
  await Promise.all(files.filter((name) => name !== '.gitkeep').map((name) => fs.rm(path.join(uploadDir, name), { force: true })));
  console.log('CampusSafe Twin demonstration data reset to the known seed.');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
