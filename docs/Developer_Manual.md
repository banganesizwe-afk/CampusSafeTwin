# CampusSafe Twin — Developer Manual

## 1. Architecture
CampusSafe Twin is a three-layer web application with one real-time channel:

1. **React client**: role-specific screens, forms and Leaflet map.
2. **Node.js/Express service**: authentication, incident rules, private photo handling, analytics, routing, reset and Socket.IO.
3. **PostgreSQL/PostGIS data layer**: users, incidents, status history, boundary polygon and prepared path graph.
4. **Socket.IO channel on the same service process**: CPS incident-created/status-updated notifications.

All reporting, CPS operations, analytics and routing use the same `incidents` table. There is no private analytics/routing copy.

## 2. Repository structure

```text
CampusSafeTwin_Final/
  client/                  React/Vite/Leaflet PWA
  server/
    db/                    schema, seed and reset SQL
    private_uploads/       private photo storage, not publicly served
    src/
      middleware/          JWT/role checks and error handling
      routes/              API contracts
      services/            routing and photo processing
      scripts/             database init/reset
      utils/               JWT, reference and status rules
  docs/                    submission documentation
  docker-compose.yml       local PostGIS database
  .env.example             configuration template
```

## 3. Prerequisites
- Node.js 20+ recommended.
- npm.
- PostgreSQL with PostGIS and pgcrypto, or Docker Desktop.

## 4. Local setup

### Database
```bash
docker compose up -d db
```

### Server
```bash
cd server
cp ../.env.example .env
npm install
npm run db:init
npm run dev
```

### Client
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

## 5. Environment configuration
Important server values:
- `DATABASE_URL`
- `JWT_SECRET`
- `CLIENT_ORIGIN`
- `RESET_KEY`
- `PHOTO_MAX_BYTES`
- `ROUTE_RISK_RADIUS_METRES`
- `ROUTE_RISK_PENALTY_METRES`
- `ROUTE_INCIDENT_WINDOW_DAYS`
- `ROUTE_SNAP_RADIUS_METRES`

The route weighting values are intentionally configurable because the supplied project documents require a team-agreed weighting/time window but do not specify final numeric values.

## 6. Database model

### `users`
Username/email, display name, hashed password and exactly one role (`Student` or `CPS`). Password hashes are generated and verified through PostgreSQL `pgcrypto`.

### `incidents`
Single source of truth containing reporter, closed category, description, PostGIS point, status, reference and server timestamps.

### `status_history`
Audit record with incident, old/new status, actor, note and timestamp.

### `photos`
Private storage metadata only. Raw bytes are kept in `server/private_uploads/` and can only be retrieved through an authenticated API route.

### `campus_boundaries`
Active PostGIS polygon used by server-side report and route-point validation.

### `path_nodes` / `path_edges`
Prepared small pedestrian graph used by Dijkstra routing.

### `seed_records`
Records when the known practice set was generated.

## 7. Authentication and authorisation
The service issues an HMAC-SHA256 signed JWT after a successful login. Protected routes parse the Bearer token and check the role on the server.

The client hiding a button is never treated as authorisation. Student tokens cannot call CPS status, CPS list, analytics or reset actions.

## 8. Incident creation flow
1. Authenticated Student request enters the service.
2. Category is checked against the closed list.
3. Description is required.
4. PostGIS verifies that the point is covered by the active campus polygon.
5. Optional JPEG/PNG is checked for type and size.
6. Accepted images are re-encoded with `sharp`, removing embedded metadata.
7. Incident is inserted with `New` and server time.
8. Initial status-history entry is recorded.
9. A valid photo is stored privately and linked.
10. Socket.IO emits `incident:created` to the CPS room.
11. The student receives a reference number.

An invalid optional photo does not cancel an otherwise valid text report.

## 9. Status flow
The service accepts only one forward operational step:
- New → Acknowledged
- Acknowledged → In Progress
- In Progress → Resolved

Invalid and Duplicate can classify a non-terminal operational record and are terminal thereafter. The incident row and status-history row are committed in the same transaction before an update event is emitted.

## 10. Analytics
The analytics endpoint uses only records whose status is neither `Invalid` nor `Duplicate`.
- category counts use SQL grouping;
- daily trend uses `date_trunc`;
- hotspots group nearby records onto a small PostGIS grid and return centroid + intensity.

## 11. Routing
The routing endpoint:
1. verifies start and end are inside the campus polygon;
2. snaps each to the nearest prepared path node within the configured threshold;
3. loads the graph;
4. calculates a distance-only Dijkstra path;
5. counts recent valid incidents near each path edge with PostGIS `ST_DWithin`;
6. recalculates Dijkstra using `length + risk_count × penalty`;
7. returns both paths plus the mandatory non-guarantee warning.

The hand-curated graph and demo polygon are in `server/db/002_seed.sql`.

## 12. Near-real-time behaviour
CPS sockets authenticate using the same JWT and join the `CPS` room. Events:
- `incident:created`
- `incident:updated`
- `dataset:reset`

The dashboard fetches only the affected incident after normal create/update events, merges it into the current filtered state and preserves map position, filters and selection. If the socket disconnects, an 8-second polling fallback refreshes the filtered list.

## 13. API summary

| Method | Route | Role | Purpose |
|---|---|---|---|
| POST | `/api/auth/login` | Practice user | Sign in |
| GET | `/api/auth/me` | Signed in | Session/account details |
| GET | `/api/meta/campus` | Signed in | Boundary geometry |
| GET | `/api/meta/network` | Signed in | Prepared route nodes |
| GET | `/api/incidents/map` | Signed in | Limited valid incident markers |
| POST | `/api/incidents` | Student | Create incident |
| GET | `/api/incidents/mine` | Student | Own reports |
| GET | `/api/incidents/:id` | Owner/CPS | Detailed incident |
| GET | `/api/incidents/:id/photo` | Owner/CPS | Private photo bytes |
| GET | `/api/incidents/security/list/all` | CPS | Filtered operations feed |
| PATCH | `/api/incidents/security/:id/status` | CPS | Allowed status transition |
| GET | `/api/analytics/summary` | CPS | Counts, timeline, hotspots |
| POST | `/api/routes` | Student | Distance + safer recommendation |
| POST | `/api/admin/reset` | CPS + reset key | Restore practice set |

## 14. Tests
Pure service logic tests are included for JWT signing/verification, lifecycle transitions and distance/risk routing.

```bash
cd server
npm test
```

The final pre-demo checklist in `Test_Plan.md` adds integration/UAT checks that require PostgreSQL and the browser client.

## 15. Deployment
Recommended prototype deployment:
- React build on a free static host.
- Node/Express + Socket.IO on a free application host.
- PostgreSQL/PostGIS on a free database tier.
- HTTPS on all public endpoints.
- Secrets in host environment variables only.

Do not commit production `JWT_SECRET`, database passwords or reset keys.

## 16. Recovery
Tag a known-good release before the assessment. Keep a local copy. If a free host is unavailable, run the same tagged build locally, reset the seed, and use the bounded prototype data.
