# CampusSafe Twin

CampusSafe Twin is the CMPG323 prototype defined by the supplied Business Case, Functional Specification and Technical Specification. It is a map-centred Progressive Web App for the NWU Potchefstroom Campus prototype area.

## Locked implementation stack

- React + Vite frontend
- Leaflet map client
- Node.js + Express service
- PostgreSQL + PostGIS
- Socket.IO near-real-time channel on the same service process
- Private server-side photo storage
- Hand-curated pedestrian graph + Dijkstra shortest-path routing

The Technical Specification is treated as the technology authority where older business-case wording conflicts with it.

## Core flows implemented

1. Student/security authentication with hashed passwords and signed JWTs.
2. Role-separated student and CPS screens and server routes.
3. Student incident reporting with closed categories, in-boundary map pin, description and optional JPEG/PNG.
4. Private attachment retrieval for the reporter and CPS only.
5. Student map and own-report history.
6. CPS incident feed + map + filters + status lifecycle + notes/history.
7. Socket updates with polling fallback and a visible connection-state indicator.
8. CPS-only category counts, time trend and hotspot intensity.
9. Safer-route recommendation using the same valid incident records as analytics.
10. Deterministic practice-data reset.

## Demo accounts

After seeding:

- Student: `student@nwu.ac.za` / `CampusSafe123!`
- Student 2: `student2@nwu.ac.za` / `CampusSafe123!`
- CPS: `security@nwu.ac.za` / `CampusSafe123!`

Change credentials before any real deployment. They exist only for the academic prototype.

## Quick start

### 1. Start PostgreSQL/PostGIS

If you have Docker Desktop:

```bash
docker compose up -d db
```

Or point `DATABASE_URL` at any PostgreSQL database with PostGIS and pgcrypto enabled.

### 2. Configure and initialise the server

```bash
cd server
cp ../.env.example .env
npm install
npm run db:init
npm run dev
```

### 3. Start the React client

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

## Reset the demonstration dataset

```bash
cd server
npm run db:reset
```

Resetting twice recreates the same incident set and therefore the same headline analytics counts. Timestamps are seeded relative to the reset time so the reports remain inside the configured analytics/routing windows.

## Important prototype boundary note

The repository contains a **defined demonstration polygon and hand-curated path graph centred on the NWU Potchefstroom Campus** so the prototype is runnable immediately. The supplied specifications require a single agreed campus boundary but do not provide its final vertex coordinates. Replace the polygon/path nodes in `server/db/002_seed.sql` if the project manager approves a different exact working area.

## Verification status

The source package has been statically checked in the build environment. The server JavaScript passes `node --check`; the routing, JWT and status-lifecycle unit tests pass; and all React/JavaScript source files parse without syntax errors. A full browser-to-PostGIS integration run still has to be performed on a machine with npm dependencies and PostgreSQL/PostGIS available. Run the checks in `docs/Test_Plan.md` before the formal demonstration.

## Public deployment

The code is prepared for a static React host plus a Node/PostgreSQL host. A public URL still requires credentials/accounts on the chosen hosting service, which are not stored in this repository.

## Submission documentation

See `docs/` for:

- `User_Guide.md`
- `Developer_Manual.md`
- `Video_Demonstration_Script.md`
- `Test_Plan.md`
- `Submission_Checklist.md`
