import nextEnv from '@next/env';
import { createHmac } from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';
nextEnv.loadEnvConfig(process.cwd());
const base = process.env.ALBUM_ART_TEST_URL ?? 'http://localhost:3001';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Use a local server for these checks');
const sign = role => {
  const payload = Buffer.from(JSON.stringify({ role, expiresAt: Date.now() + 60000 })).toString('base64url');
  return `monoasobi_admin=${payload}.${createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(payload).digest('hex')}`;
};
for (const [label, id, headers, body, expected] of [
  ['unauthenticated', '0', {}, 'bad', 401],
  ['viewer', '0', { cookie: sign('viewer') }, 'bad', 403],
  ['invalid id', 'bad', { cookie: sign('admin') }, 'bad', 400],
  ['invalid image', '0', { cookie: sign('admin') }, 'bad', 400],
  ['oversized', '0', { cookie: sign('admin') }, Buffer.alloc(3 * 1024 * 1024 + 1), 413],
  ['missing music', '999999', { cookie: sign('admin') }, await sharp({ create: { width: 10, height: 10, channels: 3, background: '#fff' } }).png().toBuffer(), 404],
]) {
  const res = await fetch(`${base}/api/admin/musics/${id}/album-art`, { method: 'PUT', headers, body });
  assert.equal(res.status, expected, label);
  console.log(label, res.status);
}
const admin = await fetch(`${base}/admin`, { headers: { cookie: sign('admin') } });
assert.equal(admin.status, 200);
console.log('admin page', admin.status);
