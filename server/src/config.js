import 'dotenv/config';

const intValue = (name, fallback) => {
  const parsed = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  port: intValue('PORT', 4000),
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://campussafe:campussafe@localhost:5432/campussafe',
  jwtSecret: process.env.JWT_SECRET ?? 'development-only-change-me',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  resetKey: process.env.RESET_KEY ?? 'development-reset-key',
  photoMaxBytes: intValue('PHOTO_MAX_BYTES', 5 * 1024 * 1024),
  routeRiskRadiusMetres: intValue('ROUTE_RISK_RADIUS_METRES', 90),
  routeRiskPenaltyMetres: intValue('ROUTE_RISK_PENALTY_METRES', 180),
  routeIncidentWindowDays: intValue('ROUTE_INCIDENT_WINDOW_DAYS', 30),
  routeSnapRadiusMetres: intValue('ROUTE_SNAP_RADIUS_METRES', 80),
};
