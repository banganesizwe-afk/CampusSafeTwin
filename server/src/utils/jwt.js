import crypto from 'node:crypto';

function base64Url(input) {
  return Buffer.from(input).toString('base64url');
}

function signPart(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

export function signJwt(payload, secret, expiresInSeconds = 8 * 60 * 60) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64Url(JSON.stringify({ ...payload, iat: now, exp: now + expiresInSeconds }));
  const unsigned = `${header}.${body}`;
  return `${unsigned}.${signPart(unsigned, secret)}`;
}

export function verifyJwt(token, secret) {
  if (!token || typeof token !== 'string') throw new Error('Missing token');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed token');
  const [header, body, signature] = parts;
  const unsigned = `${header}.${body}`;
  const expected = signPart(unsigned, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw new Error('Invalid signature');
  }
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp <= now) throw new Error('Expired token');
  return payload;
}
