# DB Seed Strategy

Initial seed data should preserve the numeric ids used by the existing Vite
routes.

- `src/lib/music.ts` seeds `musics`.
- `src/lib/novel.ts` seeds `novels`; `contentKey` is `novel/{id}.md`.
- `src/lib/comic.ts` seeds `comics`; `imagePrefix` is `comics/{id}/`.
- `src/lib/book.ts` seeds `books`, `book_novels`, and `book_purchase_links`.
- `src/lib/lyrics/*.json` seeds `lyric_tracks` as JSON in `lyric_json`.

R2 object contents are not stored in the database. The database stores only
object keys or prefixes needed by the content API.

Run the initial seed with:

```sh
npm run db:seed
```

The seed script is idempotent for current static ids. Re-running it updates
existing rows with the same primary keys and relationship keys.
