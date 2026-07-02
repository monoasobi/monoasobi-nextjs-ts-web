# DB Seed Strategy

The database is the source of truth after migration. Seed data is kept only for
initial bootstrap and local recovery, and should preserve the numeric ids used by
the existing Vite routes.

- `src/server/db/seed-data/music.ts` seeds `musics`.
- `src/server/db/seed-data/novel.ts` seeds `novels`; R2 Markdown keys are derived as `novel/{id}.md`.
- `src/server/db/seed-data/comic.ts` seeds `comics`; R2 image prefixes are derived as `comics/{id}/`.
- `src/server/db/seed-data/book.ts` seeds `books`, `book_novels`, and `book_purchase_links`.
- `src/server/db/seed-data/lyrics/*.json` seeds `lyric_tracks` as JSON in `lyric_json`.

R2 object contents are not stored in the database. Object keys and prefixes are
derived from numeric ids to avoid DB/R2 path drift.

Run the initial seed with:

```sh
npm run db:seed
```

The seed script is idempotent for current bootstrap ids. Re-running it updates
existing rows with the same primary keys and relationship keys, so do not use it
as the normal content editing path once production data starts changing directly
in Turso.
