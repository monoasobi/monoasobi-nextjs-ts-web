import nextEnv from '@next/env';
import { createClient } from '@libsql/client';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

nextEnv.loadEnvConfig(process.cwd());
const applySchema = process.argv.includes('--schema');
const apply = process.argv.includes('--apply');
const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
const s3 = new S3Client({ region: 'auto', endpoint: process.env.R2_ENDPOINT ?? process.env.R2_END_POINT ?? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } });
const Bucket = process.env.R2_BUCKET_NAME ?? 'monoasobi-contents';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const folder = `.backups/album-art-${new Date().toISOString().replaceAll(':', '-')}`;
await mkdir(folder, { recursive: true });
try {
  const rows = (await db.execute('SELECT * FROM musics ORDER BY id')).rows;
  const history = (await db.execute('SELECT * FROM __drizzle_migrations')).rows;
  const tableSql = (await db.execute("SELECT sql FROM sqlite_master WHERE name='musics'")).rows[0].sql;
  await writeFile(`${folder}/before.json`, JSON.stringify({ tableSql, rows, history }, null, 2));
  const sql = await readFile('drizzle/0008_album_art.sql', 'utf8');
  const journal = JSON.parse(await readFile('drizzle/meta/_journal.json', 'utf8'));
  const entry = journal.entries.find(item => item.tag === '0008_album_art');
  let hasColumn = (await db.execute('PRAGMA table_info(musics)')).rows.some(row => row.name === 'album_art_key');
  if (!hasColumn) {
    // Rehearse the exact additive migration against the current table definition.
    const local = createClient({ url: ':memory:' });
    await local.execute(tableSql);
    await local.execute(sql);
    if (!(await local.execute('PRAGMA table_info(musics)')).rows.some(row => row.name === 'album_art_key')) throw new Error('Schema rehearsal failed');
    local.close();
  }
  if (applySchema) {
    const previous = journal.entries.find(item => item.idx === entry.idx - 1);
    const latest = Math.max(...history.map(row => Number(row.created_at)));
    if (latest !== previous.when && latest !== entry.when) throw new Error('Unexpected migration history; stop for review');
    const tx = await db.transaction('write');
    try {
      if (!hasColumn) await tx.execute(sql);
      if (!history.some(row => Number(row.created_at) === entry.when)) {
        await tx.execute({ sql: 'INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)', args: [digest(sql), entry.when] });
      }
      await tx.commit();
      hasColumn = true;
    } catch (error) { await tx.rollback(); throw error; }
    finally { tx.close(); }
    console.log('Album art schema applied');
  }
  if (apply && !hasColumn) throw new Error('Run --schema first');
  const report = [];
  for (const file of (await readdir('public/images/albumart')).filter(file => /^\d+\.webp$/.test(file)).sort()) {
    const id = Number(file.replace('.webp', ''));
    const music = rows.find(row => Number(row.id) === id);
    if (!music) { report.push({ file, status: 'no matching music' }); continue; }
    const bytes = await readFile(`public/images/albumart/${file}`);
    const metadata = await sharp(bytes).metadata();
    if (metadata.format !== 'webp') throw new Error(`Invalid image: ${file}`);
    const key = `albumart/${id}/${digest(bytes).slice(0, 32)}.webp`;
    if (!apply) { report.push({ file, id, key, status: music.album_art_key ? 'already linked' : 'ready' }); continue; }
    const linkedKey = music.album_art_key || key;
    if (!music.album_art_key) {
      await s3.send(new PutObjectCommand({ Bucket, Key: key, Body: bytes, ContentType: 'image/webp', CacheControl: 'public, max-age=31536000, immutable' }));
    }
    const stored = await s3.send(new GetObjectCommand({ Bucket, Key: linkedKey }));
    const downloaded = await stored.Body.transformToByteArray();
    if (!music.album_art_key && digest(downloaded) !== digest(bytes)) throw new Error(`R2 verification failed: ${file}`);
    await sharp(downloaded).metadata();
    if (!music.album_art_key) {
      const updated = await db.execute({ sql: 'UPDATE musics SET album_art_key = ? WHERE id = ? AND album_art_key IS NULL', args: [key, id] });
      if (updated.rowsAffected !== 1) throw new Error(`Music ${id} changed concurrently; uploaded image preserved for review`);
    }
    report.push({ file, id, key: linkedKey, sha256: digest(downloaded), status: 'verified' });
    await writeFile(`${folder}/report.json`, JSON.stringify(report, null, 2));
  }
  await writeFile(`${folder}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', images: report.length, statuses: report.reduce((out, row) => ({ ...out, [row.status]: (out[row.status] ?? 0) + 1 }), {}), backup: folder }));
} finally { db.close(); }
