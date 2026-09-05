CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('Student', 'CPS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE incident_category AS ENUM ('theft', 'medical', 'suspicious activity', 'vandalism', 'harassment', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE incident_status AS ENUM ('New', 'Acknowledged', 'In Progress', 'Resolved', 'Invalid', 'Duplicate');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(120) NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campus_boundaries (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  geom geometry(Polygon, 4326) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS campus_boundaries_geom_gix ON campus_boundaries USING GIST (geom);

CREATE TABLE IF NOT EXISTS incidents (
  id BIGSERIAL PRIMARY KEY,
  reference VARCHAR(40) NOT NULL UNIQUE,
  reporter_id BIGINT NOT NULL REFERENCES users(id),
  category incident_category NOT NULL,
  description VARCHAR(1000) NOT NULL CHECK (char_length(trim(description)) > 0),
  location geometry(Point, 4326) NOT NULL,
  status incident_status NOT NULL DEFAULT 'New',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS incidents_location_gix ON incidents USING GIST (location);
CREATE INDEX IF NOT EXISTS incidents_created_idx ON incidents (created_at DESC);
CREATE INDEX IF NOT EXISTS incidents_status_idx ON incidents (status);
CREATE INDEX IF NOT EXISTS incidents_category_idx ON incidents (category);
CREATE INDEX IF NOT EXISTS incidents_reporter_idx ON incidents (reporter_id);

CREATE TABLE IF NOT EXISTS photos (
  id BIGSERIAL PRIMARY KEY,
  incident_id BIGINT NOT NULL UNIQUE REFERENCES incidents(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL UNIQUE,
  mime_type VARCHAR(50) NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png')),
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS status_history (
  id BIGSERIAL PRIMARY KEY,
  incident_id BIGINT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  old_status incident_status,
  new_status incident_status NOT NULL,
  changed_by BIGINT NOT NULL REFERENCES users(id),
  note VARCHAR(1000),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS status_history_incident_idx ON status_history (incident_id, changed_at DESC);

CREATE TABLE IF NOT EXISTS path_nodes (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  location geometry(Point, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS path_nodes_location_gix ON path_nodes USING GIST (location);

CREATE TABLE IF NOT EXISTS path_edges (
  id BIGSERIAL PRIMARY KEY,
  from_node BIGINT NOT NULL REFERENCES path_nodes(id) ON DELETE CASCADE,
  to_node BIGINT NOT NULL REFERENCES path_nodes(id) ON DELETE CASCADE,
  length_m DOUBLE PRECISION NOT NULL CHECK (length_m > 0),
  geom geometry(LineString, 4326) NOT NULL,
  UNIQUE (from_node, to_node)
);
CREATE INDEX IF NOT EXISTS path_edges_geom_gix ON path_edges USING GIST (geom);

CREATE TABLE IF NOT EXISTS seed_records (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);
