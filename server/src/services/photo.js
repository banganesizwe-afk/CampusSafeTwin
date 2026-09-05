import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { config } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadDir = path.resolve(__dirname, '../../private_uploads');

export async function preparePhoto(file) {
  if (!file) return { accepted: false, reason: null };
  if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
    return { accepted: false, reason: 'The photo was not kept because only JPEG and PNG files are allowed.' };
  }
  if (file.size > config.photoMaxBytes) {
    return { accepted: false, reason: `The photo was not kept because it is larger than ${Math.round(config.photoMaxBytes / 1024 / 1024)} MB.` };
  }

  try {
    const pipeline = sharp(file.buffer).rotate();
    const cleanBuffer = file.mimetype === 'image/png'
      ? await pipeline.png().toBuffer()
      : await pipeline.jpeg({ quality: 90 }).toBuffer();
    const extension = file.mimetype === 'image/png' ? 'png' : 'jpg';
    const key = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    return { accepted: true, key, buffer: cleanBuffer, mimeType: file.mimetype, sizeBytes: cleanBuffer.length };
  } catch {
    return { accepted: false, reason: 'The photo was not kept because it could not be read as a valid image.' };
  }
}

export async function savePreparedPhoto(prepared) {
  await fs.mkdir(uploadDir, { recursive: true });
  const destination = path.join(uploadDir, prepared.key);
  await fs.writeFile(destination, prepared.buffer, { flag: 'wx' });
  return destination;
}
