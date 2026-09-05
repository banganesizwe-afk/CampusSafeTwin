import { Router } from 'express';
import { pool } from '../db.js';
import { config } from '../config.js';
import { signJwt } from '../utils/jwt.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const identifier = String(req.body?.identifier ?? '').trim();
  const password = String(req.body?.password ?? '');
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Username or email and password are required.' });
  }

  const { rows } = await pool.query(
    `SELECT id, username, email, display_name, role
       FROM users
      WHERE (lower(email)=lower($1) OR lower(username)=lower($1))
        AND password_hash = crypt($2, password_hash)
      LIMIT 1`,
    [identifier, password]
  );

  const user = rows[0];
  if (!user) {
    return res.status(401).json({ error: 'The sign-in details are incorrect.' });
  }

  const token = signJwt({
    sub: String(user.id),
    role: user.role,
    name: user.display_name,
    username: user.username,
  }, config.jwtSecret);

  res.json({ token, user });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, username, email, display_name, role FROM users WHERE id=$1',
    [req.user.sub]
  );
  if (!rows[0]) return res.status(401).json({ error: 'Account no longer exists.' });
  res.json({ user: rows[0] });
});
