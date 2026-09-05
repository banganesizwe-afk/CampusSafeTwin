import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const metaRouter = Router();
metaRouter.use(requireAuth);

metaRouter.get('/campus', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT name, ST_AsGeoJSON(geom)::json AS geojson
       FROM campus_boundaries
      WHERE is_active=TRUE
      ORDER BY id LIMIT 1`
  );
  if (!rows[0]) return res.status(503).json({ error: 'Campus boundary has not been configured.' });
  res.json({ name: rows[0].name, geometry: rows[0].geojson });
});

metaRouter.get('/network', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, code, name, ST_Y(location) AS lat, ST_X(location) AS lng
       FROM path_nodes ORDER BY name`
  );
  res.json({ nodes: rows.map((r) => ({ ...r, lat: Number(r.lat), lng: Number(r.lng) })) });
});
