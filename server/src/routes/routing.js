import { Router } from 'express';
import { pool } from '../db.js';
import { config } from '../config.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { dijkstra, pathCoordinates } from '../services/routing.js';

export const routingRouter = Router();
routingRouter.use(requireAuth, requireRole('Student'));

async function snapPoint(lat, lng) {
  const inside = await pool.query(
    `SELECT EXISTS(
       SELECT 1 FROM campus_boundaries
        WHERE is_active=TRUE
          AND ST_Covers(geom, ST_SetSRID(ST_MakePoint($1,$2),4326))
     ) AS inside`, [lng, lat]
  );
  if (!inside.rows[0]?.inside) return { error: 'Point is outside the defined campus area.' };

  const { rows } = await pool.query(
    `SELECT id, code, name, ST_Y(location) AS lat, ST_X(location) AS lng,
            ST_Distance(location::geography, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography) AS distance_m
       FROM path_nodes
      ORDER BY location <-> ST_SetSRID(ST_MakePoint($1,$2),4326)
      LIMIT 1`, [lng, lat]
  );
  const node = rows[0];
  if (!node || Number(node.distance_m) > config.routeSnapRadiusMetres) {
    return { error: `Point must be on or close to the prepared walking network (within ${config.routeSnapRadiusMetres} m).` };
  }
  return { node: { ...node, lat: Number(node.lat), lng: Number(node.lng), distance_m: Number(node.distance_m) } };
}

routingRouter.post('/', async (req, res) => {
  const startLat = Number(req.body?.start?.lat);
  const startLng = Number(req.body?.start?.lng);
  const endLat = Number(req.body?.end?.lat);
  const endLng = Number(req.body?.end?.lng);
  if (![startLat, startLng, endLat, endLng].every(Number.isFinite)) {
    return res.status(400).json({ error: 'Choose both a start and an end point on the campus map.' });
  }

  const [startSnap, endSnap] = await Promise.all([snapPoint(startLat, startLng), snapPoint(endLat, endLng)]);
  if (startSnap.error) return res.status(400).json({ error: `Start: ${startSnap.error}` });
  if (endSnap.error) return res.status(400).json({ error: `End: ${endSnap.error}` });
  if (String(startSnap.node.id) === String(endSnap.node.id)) {
    return res.status(400).json({ error: 'Start and end must resolve to different path-network points.' });
  }

  const [nodesResult, edgesResult] = await Promise.all([
    pool.query(`SELECT id, code, name, ST_Y(location) AS lat, ST_X(location) AS lng FROM path_nodes ORDER BY id`),
    pool.query(
      `SELECT e.id, e.from_node, e.to_node, e.length_m,
              COUNT(i.id)::int AS risk_count
         FROM path_edges e
         LEFT JOIN incidents i
           ON i.status NOT IN ('Invalid','Duplicate')
          AND i.created_at >= NOW() - ($1::int * interval '1 day')
          AND ST_DWithin(i.location::geography, e.geom::geography, $2)
        GROUP BY e.id, e.from_node, e.to_node, e.length_m
        ORDER BY e.id`,
      [config.routeIncidentWindowDays, config.routeRiskRadiusMetres]
    ),
  ]);

  const nodes = nodesResult.rows.map((n) => ({ ...n, lat: Number(n.lat), lng: Number(n.lng) }));
  const edges = edgesResult.rows;
  const shortest = dijkstra(nodes, edges, startSnap.node.id, endSnap.node.id, { useRisk: false });
  const safer = dijkstra(nodes, edges, startSnap.node.id, endSnap.node.id, {
    useRisk: true,
    riskPenaltyMetres: config.routeRiskPenaltyMetres,
  });
  if (!shortest || !safer) return res.status(422).json({ error: 'No route connects those points on the prepared campus graph.' });

  const saferChanged = safer.nodePath.join(',') !== shortest.nodePath.join(',');
  const warning = `Safer-route recommendation only. It uses reported incidents from the last ${config.routeIncidentWindowDays} days and does not guarantee safety. Unreported incidents, lighting, foot traffic and live security presence are not included.`;
  res.json({
    start: startSnap.node,
    end: endSnap.node,
    shortest: { ...shortest, coordinates: pathCoordinates(shortest, nodes) },
    safer: { ...safer, coordinates: pathCoordinates(safer, nodes) },
    saferChanged,
    warning,
    configuration: {
      incidentWindowDays: config.routeIncidentWindowDays,
      riskRadiusMetres: config.routeRiskRadiusMetres,
      penaltyMetresPerNearbyIncident: config.routeRiskPenaltyMetres,
    },
  });
});
