import { createClient } from "@libsql/client";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";

const directory = ".backups/english-lyrics";
const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
const source = lines => lines.map(line => {
  const result = { ...line };
  delete result.en;
  delete result.enReading;
  return result;
});
const hash = lines => createHash("sha256").update(JSON.stringify(source(lines))).digest("hex");
const [command, id] = process.argv.slice(2);
let tx;
try {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  if (command === "snapshot") {
    const { rows } = await db.execute("SELECT m.id, m.title, l.sync, l.lyric_json, l.updated_at FROM musics m JOIN lyric_tracks l ON l.music_id=m.id WHERE m.deleted_at IS NULL ORDER BY m.id");
    for (const row of rows) {
      const lines = JSON.parse(row.lyric_json);
      try {
        await writeFile(`${directory}/${row.id}.source.json`, JSON.stringify({ ...row, hash: hash(lines), lines }, null, 2), { flag: "wx", mode: 0o600 });
      } catch (error) { if (error.code !== "EEXIST") throw error; }
    }
    console.log(`Source snapshots: ${rows.length}`);
  } else if (command === "show") {
    const snapshot = JSON.parse(await readFile(`${directory}/${id}.source.json`, "utf8"));
    console.log(snapshot.title);
    snapshot.lines.forEach((line, index) => console.log(JSON.stringify([index, line.jp, line.jpReading])));
  } else if (command === "apply" || command === "check") {
    assert.match(id, /^\d+$/);
    const snapshot = JSON.parse(await readFile(`${directory}/${id}.source.json`, "utf8"));
    const pairs = JSON.parse(await readFile(`${directory}/${id}.english.json`, "utf8"));
    assert.equal(pairs.length, snapshot.lines.length, "Draft line count mismatch");
    for (const pair of pairs) {
      assert.ok(Array.isArray(pair) && pair.length === 2);
      for (const value of pair) assert.ok(typeof value === "string" && value.trim() && !/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}\p{Script=Hangul}]/u.test(value), "Invalid English text");
    }
    tx = await db.transaction(command === "apply" ? "write" : "read");
    const { rows } = await tx.execute({ sql: "SELECT music_id, sync, lyric_json, updated_at FROM lyric_tracks WHERE music_id=?", args: [Number(id)] });
    assert.equal(rows.length, 1);
    const row = rows[0];
    const lines = JSON.parse(row.lyric_json);
    assert.equal(hash(lines), snapshot.hash, "Source changed: review draft before applying");
    assert.equal(new Set(lines.map(line => line.id)).size, lines.length);
    assert.ok(lines.every(line => typeof line.id === "string" && line.id));
    let fields = 0;
    const next = lines.map((line, index) => {
      const result = { ...line };
      ["en", "enReading"].forEach((field, column) => {
        if (!result[field]?.trim()) { result[field] = pairs[index][column]; fields++; }
      });
      return result;
    });
    assert.deepEqual(source(next), source(lines));
    if (command === "apply" && fields) {
      await writeFile(`${directory}/${id}.before-${Date.now()}.json`, JSON.stringify(row, null, 2), { flag: "wx", mode: 0o600 });
      await tx.execute({ sql: "UPDATE lyric_tracks SET lyric_json=?, updated_at=? WHERE music_id=?", args: [JSON.stringify(next), new Date().toISOString(), Number(id)] });
      const saved = (await tx.execute({ sql: "SELECT lyric_json, sync FROM lyric_tracks WHERE music_id=?", args: [Number(id)] })).rows[0];
      assert.deepEqual(JSON.parse(saved.lyric_json), next);
      assert.equal(saved.sync, row.sync);
    }
    await tx.commit();
    console.log(JSON.stringify({ command, id, title: snapshot.title, lines: next.length, filledFields: fields }));
  } else if (command === "status") {
    const { rows } = await db.execute("SELECT m.id,m.title,l.lyric_json FROM musics m JOIN lyric_tracks l ON l.music_id=m.id WHERE m.deleted_at IS NULL ORDER BY m.id");
    let complete = 0, total = 0;
    for (const row of rows) {
      const lines = JSON.parse(row.lyric_json);
      const count = lines.filter(line => line.en?.trim() && line.enReading?.trim()).length;
      complete += count; total += lines.length;
      console.log(`${row.id} ${row.title}: ${count}/${lines.length}`);
    }
    console.log(`Total: ${complete}/${total}`);
  } else throw new Error("Use snapshot, show ID, check ID, apply ID, or status");
} catch (error) {
  if (tx && !tx.closed) await tx.rollback();
  console.error(error.message);
  process.exitCode = 1;
} finally { db.close(); }
