import fs from 'node:fs/promises';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { pool, withTransaction } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { createIncidentReference } from '../utils/reference.js';
import { isAllowedStatusTransition } from '../utils/status.js';
import { preparePhoto, savePreparedPhoto, uploadDir } from '../services/photo.js';

const upload = multer({ storage: multer.memoryStorage() });
export const incidentsRouter = Router();
incidentsRouter.use(requireAuth);

const ALLOWED_CATEGORIES = ['theft', 'medical', 'suspicious activity', 'vandalism', 'harassment', 'other'];

function publicIncident(row) {
  return {
    id: row.id,
    reference: row.reference,
    category: row.category,
    status: row.status,
    createdAt: row.created_at,
    lat: Number(row.lat),
    lng: Number(row.lng),
  };
}

incidentsRouter.get('/map', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, reference, category, status, created_at,
            ST_Y(location) AS lat, ST_X(location) AS lng
       FROM incidents
      WHERE status NOT IN ('Invalid','Duplicate')
      ORDER BY created_at DESC`
  );
  res.json({ incidents: rows.map(publicIncident) });
});

incidentsRouter.get('/mine', requireRole('Student'), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT i.id, i.reference, i.category, i.description, i.status, i.created_at, i.updated_at,
            ST_Y(i.location) AS lat, ST_X(i.location) AS lng,
            EXISTS(SELECT 1 FROM photos p WHERE p.incident_id=i.id) AS has_photo
       FROM incidents i
      WHERE i.reporter_id=$1
      ORDER BY i.created_at DESC`,
    [req.user.sub]
  );
  res.json({ incidents: rows.map((r) => ({ ...r, lat: Number(r.lat), lng: Number(r.lng) })) });
});

incidentsRouter.post('/', requireRole('Student'), upload.single('photo'), async (req, res) => {
  const category = String(req.body?.category ?? '').trim().toLowerCase();
  const description = String(req.body?.description ?? '').trim();
  const lat = Number(req.body?.lat);
  const lng = Number(req.body?.lng);
  const fieldErrors = {};
  if (!ALLOWED_CATEGORIES.includes(category)) fieldErrors.category = 'Choose one of the listed incident types.';
  if (!description) fieldErrors.description = 'A short description is required.';
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) fieldErrors.location = 'Choose a location on the campus map.';
  if (Object.keys(fieldErrors).length) return res.status(400).json({ error: 'Please correct the highlighted fields.', fieldErrors });

  const boundaryCheck = await pool.query(
    `SELECT EXISTS(
       SELECT 1 FROM campus_boundaries
        WHERE is_active=TRUE
          AND ST_Covers(geom, ST_SetSRID(ST_MakePoint($1,$2),4326))
     ) AS inside`,
    [lng, lat]
  );
  if (!boundaryCheck.rows[0]?.inside) {
    return res.status(400).json({ error: 'The incident pin must be inside the defined campus area.', fieldErrors: { location: 'Move the pin inside the campus boundary.' } });
  }

  const preparedPhoto = await preparePhoto(req.file);
  const reference = createIncidentReference();
  const incident = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO incidents (reference, reporter_id, category, description, location, status)
       VALUES ($1,$2,$3,$4,ST_SetSRID(ST_MakePoint($5,$6),4326),'New')
       RETURNING id, reference, category, description, status, created_at, ST_Y(location) AS lat, ST_X(location) AS lng`,
      [reference, req.user.sub, category, description, lng, lat]
    );
    await client.query(
      `INSERT INTO status_history (incident_id, old_status, new_status, changed_by, note)
       VALUES ($1,NULL,'New',$2,'Incident created')`,
      [rows[0].id, req.user.sub]
    );
    return rows[0];
  });

  let photoWarning = preparedPhoto.reason;
  let hasPhoto = false;
  if (preparedPhoto.accepted) {
    try {
      const savedPath = await savePreparedPhoto(preparedPhoto);
      try {
        await pool.query(
          `INSERT INTO photos (incident_id, storage_key, mime_type, size_bytes) VALUES ($1,$2,$3,$4)`,
          [incident.id, preparedPhoto.key, preparedPhoto.mimeType, preparedPhoto.sizeBytes]
        );
        hasPhoto = true;
      } catch (error) {
        await fs.rm(savedPath, { force: true });
        throw error;
      }
    } catch (error) {
      console.error('Photo storage failed', error);
      photoWarning = 'The report was saved, but the photo could not be stored.';
    }
  }

  req.app.get('io')?.to('CPS').emit('incident:created', { id: incident.id, reference: incident.reference });
  res.status(201).json({
    incident: { ...incident, lat: Number(incident.lat), lng: Number(incident.lng), hasPhoto },
    photoWarning,
  });
});

incidentsRouter.get('/:id/photo', async (req, res) => {
  const incidentId = Number(req.params.id);
  const { rows } = await pool.query(
    `SELECT p.storage_key, p.mime_type, i.reporter_id
       FROM photos p JOIN incidents i ON i.id=p.incident_id
      WHERE i.id=$1`,
    [incidentId]
  );
  const photo = rows[0];
  if (!photo) return res.status(404).json({ error: 'No photo is attached to this incident.' });
  const allowed = req.user.role === 'CPS' || String(photo.reporter_id) === String(req.user.sub);
  if (!allowed) return res.status(403).json({ error: 'You do not have permission to view this photo.' });
  const filePath = path.join(uploadDir, photo.storage_key);
  try {
    const bytes = await fs.readFile(filePath);
    res.set('Content-Type', photo.mime_type);
    res.set('Cache-Control', 'private, no-store');
    res.send(bytes);
  } catch {
    res.status(404).json({ error: 'The stored photo could not be found.' });
  }
});

incidentsRouter.get('/:id', async (req, res) => {
  const incidentId = Number(req.params.id);
  const { rows } = await pool.query(
    `SELECT i.id, i.reference, i.reporter_id, i.category, i.description, i.status, i.created_at, i.updated_at,
            ST_Y(i.location) AS lat, ST_X(i.location) AS lng,
            u.display_name AS reporter_name, u.email AS reporter_email,
            EXISTS(SELECT 1 FROM photos p WHERE p.incident_id=i.id) AS has_photo
       FROM incidents i JOIN users u ON u.id=i.reporter_id
      WHERE i.id=$1`,
    [incidentId]
  );
  const incident = rows[0];
  if (!incident) return res.status(404).json({ error: 'Incident not found.' });
  if (req.user.role === 'Student' && String(incident.reporter_id) !== String(req.user.sub)) {
    return res.status(403).json({ error: 'Students may only open their own submitted reports.' });
  }

  const payload = { ...incident, lat: Number(incident.lat), lng: Number(incident.lng) };
  if (req.user.role !== 'CPS') {
    delete payload.reporter_id;
    delete payload.reporter_name;
    delete payload.reporter_email;
  } else {
    const history = await pool.query(
      `SELECT h.id, h.old_status, h.new_status, h.note, h.changed_at, u.display_name AS changed_by
         FROM status_history h JOIN users u ON u.id=h.changed_by
        WHERE h.incident_id=$1 ORDER BY h.changed_at DESC`,
      [incidentId]
    );
    payload.history = history.rows;
  }
  res.json({ incident: payload });
});

incidentsRouter.get('/security/list/all', requireRole('CPS'), async (req, res) => {
  const category = String(req.query.category ?? '').trim().toLowerCase();
  const status = String(req.query.status ?? '').trim();
  const from = String(req.query.from ?? '').trim();
  const to = String(req.query.to ?? '').trim();
  const params = [];
  const where = [];
  if (category && ALLOWED_CATEGORIES.includes(category)) { params.push(category); where.push(`i.category=$${params.length}`); }
  if (status) { params.push(status); where.push(`i.status=$${params.length}`); }
  if (from) { params.push(from); where.push(`i.created_at >= $${params.length}::timestamptz`); }
  if (to) { params.push(to); where.push(`i.created_at <= $${params.length}::timestamptz + interval '1 day'`); }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT i.id, i.reference, i.category, i.description, i.status, i.created_at, i.updated_at,
            ST_Y(i.location) AS lat, ST_X(i.location) AS lng,
            u.display_name AS reporter_name, u.email AS reporter_email,
            EXISTS(SELECT 1 FROM photos p WHERE p.incident_id=i.id) AS has_photo
       FROM incidents i JOIN users u ON u.id=i.reporter_id
       ${clause}
      ORDER BY i.created_at DESC`,
    params
  );
  res.json({ incidents: rows.map((r) => ({ ...r, lat: Number(r.lat), lng: Number(r.lng) })) });
});

incidentsRouter.patch('/security/:id/status', requireRole('CPS'), async (req, res) => {
  const incidentId = Number(req.params.id);
  const nextStatus = String(req.body?.status ?? '').trim();
  const note = String(req.body?.note ?? '').trim().slice(0, 1000) || null;

  const result = await withTransaction(async (client) => {
    const currentResult = await client.query('SELECT id, status FROM incidents WHERE id=$1 FOR UPDATE', [incidentId]);
    const current = currentResult.rows[0];
    if (!current) return { notFound: true };
    if (!isAllowedStatusTransition(current.status, nextStatus)) {
      return { invalid: true, current: current.status };
    }
    const { rows } = await client.query(
      `UPDATE incidents SET status=$1, updated_at=NOW() WHERE id=$2
       RETURNING id, reference, status, updated_at`,
      [nextStatus, incidentId]
    );
    await client.query(
      `INSERT INTO status_history (incident_id, old_status, new_status, changed_by, note)
       VALUES ($1,$2,$3,$4,$5)`,
      [incidentId, current.status, nextStatus, req.user.sub, note]
    );
    return { incident: rows[0] };
  });

  if (result.notFound) return res.status(404).json({ error: 'Incident not found.' });
  if (result.invalid) return res.status(400).json({ error: `Status cannot move directly from ${result.current} to ${nextStatus}.` });
  req.app.get('io')?.to('CPS').emit('incident:updated', { id: result.incident.id, status: result.incident.status });
  res.json(result);
});
