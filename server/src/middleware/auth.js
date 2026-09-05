import { config } from '../config.js';
import { verifyJwt } from '../utils/jwt.js';

function getBearerToken(req) {
  const header = req.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' ? token : null;
}

export function requireAuth(req, res, next) {
  try {
    const payload = verifyJwt(getBearerToken(req), config.jwtSecret);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Authentication required.' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    }
    next();
  };
}
