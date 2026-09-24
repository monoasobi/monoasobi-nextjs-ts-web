import { createClient } from "@libsql/client";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// Only run --apply after deploying the MONOASOBI ID-preserving writer.
const apply = process.argv.includes("--apply");
if (apply && !process.argv.includes("--confirm-mono-deployed")) {
  throw new Error("Deploy MONOASOBI and refresh open lyric editors before backfilling IDs.");
}
const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
let tx;
try {
  tx = await db.transaction(apply ? "write" : "read");
  const { rows } = await tx.execute("SELECT music_id, sync, lyric_json, updated_at FROM lyric_tracks ORDER BY music_id");
  let addedIds = 0;
  const changes = [];
  for (const row of rows) {
    const lines = JSON.parse(row.lyric_json);
    if (!Array.isArray(lines)) throw new Error("Invalid lyric array");
    const ids = new Set();
    let changed = false;
    const next = lines.map(line => {
      if (!line || typeof line !== "object") throw new Error("Invalid lyric line");
      if (line.id !== undefined && (typeof line.id !== "string" || !line.id || ids.has(line.id))) throw new Error("Invalid or duplicate existing line ID");
      const id = line.id ?? randomUUID();
      ids.add(id);
      if (line.id !== undefined) return line;
      changed = true; addedIds++;
      return { ...line, id };
    });
    if (changed) changes.push({ musicId: row.music_id, lyricJson: JSON.stringify(next) });
  }
  if (apply && changes.length) {
    const directory = resolve(".backups");
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const backup = resolve(directory, "shared-lyric-ids-" + Date.now() + ".json");
    await writeFile(backup, JSON.stringify(rows, null, 2), { mode: 0o600, flag: "wx" });
    for (const change of changes) {
      await tx.execute({ sql: "UPDATE lyric_tracks SET lyric_json = ?, updated_at = ? WHERE music_id = ?", args: [change.lyricJson, new Date().toISOString(), change.musicId] });
    }
    console.log("Backup: " + backup);
  }
  await tx.commit();
  console.log(JSON.stringify({ applied: apply, tracks: changes.length, addedIds }));
} catch (error) {
  if (tx && !tx.closed) await tx.rollback();
  console.error(error.message);
  process.exitCode = 1;
} finally { db.close(); }
