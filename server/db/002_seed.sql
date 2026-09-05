-- CampusSafe Twin deterministic academic demonstration seed.
-- The exact final project polygon was not supplied in the source documents.
-- These vertices define the working prototype area around NWU Potchefstroom and can be replaced after PM approval.

INSERT INTO users (username, email, display_name, password_hash, role)
VALUES
  ('student', 'student@nwu.ac.za', 'Demo Student', crypt('CampusSafe123!', gen_salt('bf')), 'Student'),
  ('student2', 'student2@nwu.ac.za', 'Demo Student Two', crypt('CampusSafe123!', gen_salt('bf')), 'Student'),
  ('security', 'security@nwu.ac.za', 'CPS Demo Officer', crypt('CampusSafe123!', gen_salt('bf')), 'CPS')
ON CONFLICT (email) DO NOTHING;

INSERT INTO campus_boundaries (name, geom, is_active)
VALUES (
  'NWU Potchefstroom Prototype Area',
  ST_GeomFromText('POLYGON((
    27.0868 -26.6940,
    27.0977 -26.6940,
    27.1000 -26.6910,
    27.0990 -26.6854,
    27.0940 -26.6845,
    27.0880 -26.6852,
    27.0860 -26.6888,
    27.0868 -26.6940
  ))', 4326),
  TRUE
)
ON CONFLICT (name) DO UPDATE SET geom = EXCLUDED.geom, is_active = TRUE;

INSERT INTO path_nodes (code, name, location) VALUES
  ('MAIN_GATE', 'Main Gate', ST_SetSRID(ST_MakePoint(27.0909, -26.6920), 4326)),
  ('SOUTH_WALK', 'South Walk', ST_SetSRID(ST_MakePoint(27.0930, -26.6912), 4326)),
  ('CENTRAL_QUAD', 'Central Quad', ST_SetSRID(ST_MakePoint(27.0930, -26.6896), 4326)),
  ('LIBRARY', 'Library Walk', ST_SetSRID(ST_MakePoint(27.0925, -26.6882), 4326)),
  ('F12', 'F12 / Physiology', ST_SetSRID(ST_MakePoint(27.09172, -26.68677), 4326)),
  ('NORTH_WALK', 'North Walk', ST_SetSRID(ST_MakePoint(27.0949, -26.6864), 4326)),
  ('ENGINEERING', 'Engineering Walk', ST_SetSRID(ST_MakePoint(27.0960, -26.6877), 4326)),
  ('STUDENT_CENTRE', 'Student Centre', ST_SetSRID(ST_MakePoint(27.0944, -26.6897), 4326)),
  ('EAST_WALK', 'East Walk', ST_SetSRID(ST_MakePoint(27.0960, -26.6894), 4326)),
  ('EAST_GATE', 'East Gate', ST_SetSRID(ST_MakePoint(27.0972, -26.6910), 4326)),
  ('WEST_RES', 'West Residences', ST_SetSRID(ST_MakePoint(27.0894, -26.6888), 4326)),
  ('WEST_NORTH', 'West North Walk', ST_SetSRID(ST_MakePoint(27.0902, -26.6866), 4326))
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, location = EXCLUDED.location;

WITH pairs(a,b) AS (VALUES
  ('MAIN_GATE','SOUTH_WALK'),
  ('SOUTH_WALK','CENTRAL_QUAD'),
  ('CENTRAL_QUAD','LIBRARY'),
  ('LIBRARY','F12'),
  ('F12','NORTH_WALK'),
  ('NORTH_WALK','ENGINEERING'),
  ('CENTRAL_QUAD','STUDENT_CENTRE'),
  ('STUDENT_CENTRE','ENGINEERING'),
  ('STUDENT_CENTRE','EAST_WALK'),
  ('EAST_WALK','EAST_GATE'),
  ('SOUTH_WALK','EAST_GATE'),
  ('EAST_WALK','ENGINEERING'),
  ('MAIN_GATE','WEST_RES'),
  ('WEST_RES','LIBRARY'),
  ('WEST_RES','WEST_NORTH'),
  ('WEST_NORTH','F12')
)
INSERT INTO path_edges (from_node, to_node, length_m, geom)
SELECT n1.id, n2.id,
       ST_Distance(n1.location::geography, n2.location::geography),
       ST_MakeLine(n1.location, n2.location)
FROM pairs
JOIN path_nodes n1 ON n1.code = pairs.a
JOIN path_nodes n2 ON n2.code = pairs.b
ON CONFLICT (from_node, to_node) DO UPDATE
SET length_m = EXCLUDED.length_m, geom = EXCLUDED.geom;

-- Seed incidents deliberately create a visible central/eastern hotspot.
WITH s AS (SELECT id FROM users WHERE email='student@nwu.ac.za'),
     s2 AS (SELECT id FROM users WHERE email='student2@nwu.ac.za')
INSERT INTO incidents (reference, reporter_id, category, description, location, status, created_at, updated_at)
VALUES
  ('CST-SEED-001', (SELECT id FROM s), 'theft', 'Practice report near the central quad.', ST_SetSRID(ST_MakePoint(27.0932,-26.6897),4326), 'New', NOW() - INTERVAL '2 days 3 hours', NOW() - INTERVAL '2 days 3 hours'),
  ('CST-SEED-002', (SELECT id FROM s2), 'suspicious activity', 'Practice report on the student-centre walk.', ST_SetSRID(ST_MakePoint(27.0944,-26.6895),4326), 'Acknowledged', NOW() - INTERVAL '4 days 5 hours', NOW() - INTERVAL '4 days'),
  ('CST-SEED-003', (SELECT id FROM s), 'harassment', 'Practice report near the east walk.', ST_SetSRID(ST_MakePoint(27.0957,-26.6892),4326), 'In Progress', NOW() - INTERVAL '6 days 2 hours', NOW() - INTERVAL '5 days 23 hours'),
  ('CST-SEED-004', (SELECT id FROM s2), 'vandalism', 'Practice report close to the south-east path.', ST_SetSRID(ST_MakePoint(27.0950,-26.6906),4326), 'Resolved', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days'),
  ('CST-SEED-005', (SELECT id FROM s), 'medical', 'Practice medical event near Library Walk.', ST_SetSRID(ST_MakePoint(27.0924,-26.6882),4326), 'Resolved', NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days'),
  ('CST-SEED-006', (SELECT id FROM s2), 'theft', 'Practice report near Central Quad.', ST_SetSRID(ST_MakePoint(27.0931,-26.6899),4326), 'Resolved', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days'),
  ('CST-SEED-007', (SELECT id FROM s), 'other', 'Practice report on the west side.', ST_SetSRID(ST_MakePoint(27.0897,-26.6886),4326), 'Resolved', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
  ('CST-SEED-008', (SELECT id FROM s2), 'theft', 'Duplicate practice record retained for audit.', ST_SetSRID(ST_MakePoint(27.0942,-26.6897),4326), 'Duplicate', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
  ('CST-SEED-009', (SELECT id FROM s), 'suspicious activity', 'Invalid practice record retained for audit.', ST_SetSRID(ST_MakePoint(27.0959,-26.6893),4326), 'Invalid', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
ON CONFLICT (reference) DO NOTHING;

INSERT INTO status_history (incident_id, old_status, new_status, changed_by, note, changed_at)
SELECT i.id, NULL, i.status, u.id, 'Seeded demonstration state', i.updated_at
FROM incidents i
CROSS JOIN LATERAL (SELECT id FROM users WHERE role='CPS' ORDER BY id LIMIT 1) u
WHERE i.reference LIKE 'CST-SEED-%'
  AND NOT EXISTS (SELECT 1 FROM status_history h WHERE h.incident_id=i.id);

INSERT INTO seed_records (name, notes)
VALUES ('CampusSafe Twin known practice set', 'Nine incidents: seven valid operational records plus one Invalid and one Duplicate.');
