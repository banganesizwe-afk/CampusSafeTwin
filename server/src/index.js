import http from 'node:http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { Server } from 'socket.io';
import { config } from './config.js';
import { pool } from './db.js';
import { verifyJwt } from './utils/jwt.js';
import { authRouter } from './routes/auth.js';
import { incidentsRouter } from './routes/incidents.js';
import { analyticsRouter } from './routes/analytics.js';
import { routingRouter } from './routes/routing.js';
import { metaRouter } from './routes/meta.js';
import { adminRouter } from './routes/admin.js';
import { errorHandler, notFound } from './middleware/errors.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: config.clientOrigin, methods: ['GET', 'POST', 'PATCH'] },
});
app.set('io', io);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', service: 'CampusSafe Twin API', time: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', service: 'CampusSafe Twin API' });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/incidents', incidentsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/routes', routingRouter);
app.use('/api/meta', metaRouter);
app.use('/api/admin', adminRouter);

app.use(notFound);
app.use(errorHandler);

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    const user = verifyJwt(token, config.jwtSecret);
    socket.user = user;
    next();
  } catch {
    next(new Error('Authentication required'));
  }
});

io.on('connection', (socket) => {
  if (socket.user?.role === 'CPS') socket.join('CPS');
  if (socket.user?.sub) socket.join(`USER:${socket.user.sub}`);
  socket.emit('connection:ready', { connectedAt: new Date().toISOString() });
});

server.listen(config.port, () => {
  console.log(`CampusSafe Twin API listening on http://localhost:${config.port}`);
});

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down.`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
