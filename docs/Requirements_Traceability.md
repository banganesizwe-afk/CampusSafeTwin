# CampusSafe Twin — Business / Functional / Technical / Code Traceability

| Business requirement | Implemented behaviour | Main code home |
|---|---|---|
| BR-01 Incident reporting | Authenticated Student report, closed category, pin, description, server time, optional photo, reference | `ReportIncidentPage.jsx`, `routes/incidents.js`, `db/001_schema.sql` |
| BR-02 Shared campus map | Stored boundary, incident markers, shared Leaflet map, boundary note | `MapCanvas.jsx`, `routes/meta.js`, `db/002_seed.sql` |
| BR-03 Near-real-time CPS view | CPS feed + map, Socket.IO events, 8-second fallback polling | `SecurityDashboardPage.jsx`, `index.js` |
| BR-04 Incident lifecycle | Forward status path, Invalid/Duplicate terminal classification, transactional history | `utils/status.js`, `routes/incidents.js`, `status_history` |
| BR-05 Safety analysis | Valid-only type counts, daily trend, hotspot intensity, CPS role check | `AnalyticsPage.jsx`, `routes/analytics.js` |
| BR-06 Route guidance | Prepared graph, distance Dijkstra, incident-weighted Dijkstra, warning | `RoutePlannerPage.jsx`, `services/routing.js`, `routes/routing.js` |
| BR-07 Role separation | JWT session, server-side role middleware, own-report/photo rules | `middleware/auth.js`, `routes/auth.js`, `routes/incidents.js` |
| BR-08 Scope/prototype limits | One boundary, two roles, simulated seed, deterministic reset | `db/002_seed.sql`, `db/003_reset.sql`, `scripts/resetDb.js` |

## Acceptance baseline path
1. Sign in as Student.
2. Submit an in-boundary valid report.
3. Receive reference and New status.
4. Observe the report on CPS dashboard within the near-real-time target.
5. Progress the status through the allowed lifecycle.
6. Observe valid records in analytics/hotspots.
7. Request a route on the curated graph.
8. Observe the non-guarantee safer-route warning.
