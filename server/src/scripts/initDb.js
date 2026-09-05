import { pool } from '../db.js';
import { runSqlFile } from './runSql.js';

try {
  await runSqlFile('001_schema.sql');
  await runSqlFile('002_seed.sql');
  console.log('CampusSafe Twin database initialised and seeded.');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
