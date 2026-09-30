import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { normalizeAlbumArt } from '../src/server/albumArtImage';
import { ALBUM_ART_MAX_BYTES, getAlbumArtSrc } from '../src/lib/albumArt';

test('album art preserves aspect ratio, limits dimensions, and converts to WebP', async () => {
  for (const format of ['jpeg', 'png', 'webp'] as const) {
    const input = await sharp({ create: { width: 1400, height: 700, channels: 3, background: '#123456' } }).toFormat(format).toBuffer();
    const output = await normalizeAlbumArt(input);
    const metadata = await sharp(output).metadata();
    assert.equal(metadata.format, 'webp');
    assert.equal(metadata.width, 1000);
    assert.equal(metadata.height, 500);
  }
});

test('small album art is not enlarged', async () => {
  const input = await sharp({ create: { width: 40, height: 70, channels: 3, background: '#123456' } }).png().toBuffer();
  const metadata = await sharp(await normalizeAlbumArt(input)).metadata();
  assert.equal(metadata.width, 40);
  assert.equal(metadata.height, 70);
});

test('rejects malformed, oversized, empty, and SVG inputs', async () => {
  for (const input of [Buffer.alloc(0), Buffer.from('not an image'), Buffer.alloc(ALBUM_ART_MAX_BYTES + 1), Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>')]) {
    await assert.rejects(normalizeAlbumArt(input));
  }
});

test('new R2 artwork takes priority and existing music keeps its local fallback', () => {
  assert.equal(getAlbumArtSrc({ id: 0 }), '/images/albumart/0.webp');
  assert.equal(getAlbumArtSrc({ id: 3, albumArtKey: 'albumart/3/abc.webp' }), '/api/content/albumart/3/abc.webp');
});
