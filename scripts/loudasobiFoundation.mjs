import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { randomUUID, createHash } from "node:crypto";
import { resolve } from "node:path";
import { z } from "zod";

// Production application also requires --confirm-delete-paused; see docs/loudasobi-database.md.
// The default command rehearses against a local copy; only --apply writes remotely.
const apply = process.argv.includes("--apply");
if (apply && !process.argv.includes("--confirm-delete-paused")) {
  throw new Error("Pause MONOASOBI admin writes and arrange deployment before applying. See docs/loudasobi-database.md.");
}
const remote = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
const migrations = readMigrationFiles({ migrationsFolder: "./drizzle" });
const journal = JSON.parse(await readFile("./drizzle/meta/_journal.json", "utf8"));
const normalizedHashes = await Promise.all(journal.entries.map(async entry => ({
  when: entry.when,
  hash: createHash("sha256").update((await readFile("./drizzle/" + entry.tag + ".sql", "utf8")).replaceAll("\r\n", "\n")).digest("hex"),
})));
const quote = name => '"' + name.replaceAll('"', '""') + '"';
const lineSchema = z.object({
  start: z.number().finite().nonnegative(),
  end: z.number().finite(),
  jp: z.string(), kr: z.string(), jpReading: z.string(),
}).passthrough();

async function importLyrics(client) {
  const tx = await client.transaction("write");
  try {
    const tracks = await tx.execute("SELECT l.* FROM lyric_tracks l JOIN musics m ON m.id = l.music_id WHERE m.deleted_at IS NULL ORDER BY l.music_id");
    for (const row of tracks.rows) {
      const lines = z.array(lineSchema).parse(JSON.parse(row.lyric_json));
      if (!Number.isFinite(Number(row.sync))) throw new Error("Invalid sync");
      let end = 0;
      const ids = new Set();
      const converted = lines.map(line => {
        if (line.end <= line.start || line.start < end) throw new Error("Invalid lyric time range: " + row.music_id);
        end = line.end;
        const id = typeof line.id === "string" && line.id ? line.id : randomUUID();
        if (ids.has(id)) throw new Error("Duplicate lyric line ID");
        ids.add(id);
        return { ...line, id };
      });
      await tx.execute({ sql: "INSERT INTO loudasobi_music_settings (music_id) VALUES (?) ON CONFLICT(music_id) DO NOTHING", args: [row.music_id] });
      await tx.execute({ sql: "INSERT INTO loudasobi_lyric_tracks (music_id, sync, lyric_json) VALUES (?, ?, ?) ON CONFLICT(music_id) DO NOTHING", args: [row.music_id, row.sync, JSON.stringify(converted)] });
      await tx.execute({ sql: "INSERT INTO loudasobi_call_guides (music_id, guide_json) VALUES (?, ?) ON CONFLICT(music_id) DO NOTHING", args: [row.music_id, JSON.stringify({ cues: [] })] });
    }
    await tx.commit();
  } catch (error) { await tx.rollback(); throw error; }
}

async function verifyOriginalRows(client, snapshot) {
  for (const table of snapshot.tables) {
    if (table.name === "__drizzle_migrations" || table.name.startsWith("loudasobi_")) continue;
    const rows = await client.execute("SELECT * FROM " + quote(table.name));
    const columns = table.rows.length ? Object.keys(table.rows[0]).sort() : [];
    const serialize = row => JSON.stringify(columns.map(column => row[column]));
    const before = table.rows.map(serialize).sort();
    const after = rows.rows.map(serialize).sort();
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      throw new Error("Original rows changed during migration: " + table.name);
    }
  }
}

async function main() {
  const tx = await remote.transaction("read");
  const snapshot = { exportedAt: new Date().toISOString(), tables: [] };
  try {
    const tables = await tx.execute("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
    for (const table of tables.rows) {
      const rows = await tx.execute("SELECT * FROM " + quote(table.name));
      snapshot.tables.push({ name: table.name, sql: table.sql, rows: rows.rows.map(row => Object.fromEntries(rows.columns.map(col => [col, row[col]]))) });
    }
    const indexes = await tx.execute("SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL");
    snapshot.indexes = indexes.rows.map(row => row.sql);
    await tx.commit();
  } catch (error) { await tx.rollback(); throw error; }
  for (const row of snapshot.tables.find(t => t.name === "__drizzle_migrations")?.rows ?? []) {
    if (!migrations.some(m => m.hash === row.hash && m.folderMillis === Number(row.created_at)) &&
        !normalizedHashes.some(m => m.hash === row.hash && m.when === Number(row.created_at))) {
      throw new Error("Remote migration history does not match this repository");
    }
  }
  const backupDir = resolve(".backups");
  await mkdir(backupDir, { recursive: true, mode: 0o700 });
  const path = resolve(backupDir, "loudasobi-foundation-" + Date.now() + ".json");
  await writeFile(path, JSON.stringify(snapshot, null, 2), { mode: 0o600, flag: "wx" });
  const local = createClient({ url: "file:" + path + ".sqlite" });
  try {
    await local.execute("PRAGMA foreign_keys = OFF");
    for (const table of snapshot.tables) {
      await local.execute(table.sql);
      for (const row of table.rows) {
        const names = Object.keys(row);
        await local.execute({ sql: "INSERT INTO " + quote(table.name) + " (" + names.map(quote).join(",") + ") VALUES (" + names.map(() => "?").join(",") + ")", args: names.map(n => row[n]) });
      }
    }
    for (const index of snapshot.indexes) await local.execute(index);
    await local.execute("PRAGMA foreign_keys = ON");
    await migrate(drizzle(local), { migrationsFolder: "./drizzle" });
    await importLyrics(local);
    await verifyOriginalRows(local, snapshot);
    const integrity = await local.execute("PRAGMA foreign_key_check");
    if (integrity.rows.length) throw new Error("Foreign key validation failed");
    console.log("Local migration/import rehearsal passed. Backup: " + path);
  } finally { local.close(); }
  if (!apply) { console.log("No remote changes. Production application requires the deployment procedure in docs/loudasobi-database.md."); return; }
  await migrate(drizzle(remote), { migrationsFolder: "./drizzle" });
  await importLyrics(remote);
  await verifyOriginalRows(remote, snapshot);
  const counts = await remote.execute("SELECT (SELECT count(*) FROM musics) AS musics, (SELECT count(*) FROM lyric_tracks) AS mono_lyrics, (SELECT count(*) FROM loudasobi_lyric_tracks) AS loud_lyrics, (SELECT count(*) FROM loudasobi_music_settings WHERE publish=1) AS published");
  if ((await remote.execute("PRAGMA foreign_key_check")).rows.length) throw new Error("Remote foreign key validation failed");
  console.log("Migration/import completed: " + JSON.stringify(counts.rows));
}
main().catch(error => {
  console.error(error instanceof z.ZodError ? "Lyric validation failed" : error.message);
  process.exitCode = 1;
}).finally(() => remote.close());
