import crypto from 'node:crypto';

export function createIncidentReference(date = new Date()) {
  const day = date.toISOString().slice(0, 10).replaceAll('-', '');
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `CST-${day}-${suffix}`;
}
