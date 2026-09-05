import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth, requireRole('CPS'));

function timeFilters(query, params) {
  const conditions = ["i.status NOT IN ('Invalid','Duplicate')"];
  const from = String(query.from ?? '').trim();
  const to = String(query.to ?? '').trim();
  if (from) { params.push(from); conditions.push(`i.created_at >= $${params.length}::timestamptz`); }
  if (to) { params.push(to); conditions.push(`i.created_at < $${params.length}::timestamptz + interval '1 day'`); }
  return conditions.join(' AND ');
}

analyticsRouter.get('/summary', async (req, res) => {
  const params = [];
  const where = timeFilters(req.query, params);
  const [counts, timeline, hotspots] = await Promise.all([
    pool.query(
      `SELECT category, COUNT(*)::int AS count
         FROM incidents i WHERE ${where}
        GROUP BY category ORDER BY count DESC, category`, params
    ),
    pool.query(
      `SELECT to_char(date_trunc('day', i.created_at), 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
         FROM incidents i WHERE ${where}
        GROUP BY date_trunc('day', i.created_at)
        ORDER BY date_trunc('day', i.created_at)`, params
    ),
    pool.query(
      `SELECT ST_Y(ST_Centroid(ST_Collect(i.location))) AS lat,
              ST_X(ST_Centroid(ST_Collect(i.location))) AS lng,
              COUNT(*)::int AS intensity
         FROM incidents i
        WHERE ${where}
        GROUP BY ST_SnapToGrid(i.location, 0.0008)
        ORDER BY intensity DESC`, params
    ),
  ]);

  const total = counts.rows.reduce((sum, row) => sum + Number(row.count), 0);
  res.json({
    total,
    counts: counts.rows,
    timeline: timeline.rows,
    hotspots: hotspots.rows.map((h) => ({ lat: Number(h.lat), lng: Number(h.lng), intensity: Number(h.intensity) })),
  });
});
