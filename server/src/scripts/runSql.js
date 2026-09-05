import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.resolve(__dirname, '../../db');

export async function runSqlFile(filename) {
  const sql = await fs.readFile(path.join(dbDir, filename), 'utf8');
  await pool.query(sql);
}
