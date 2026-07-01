import { existsSync, readFileSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { books as sourceBooks } from "../../lib/book";
import { comics as sourceComics } from "../../lib/comic";
import { musics as sourceMusics } from "../../lib/music";
import { novels as sourceNovels } from "../../lib/novel";
import {
  bookNovels,
  bookPurchaseLinks,
  books,
  comics,
  lyricTracks,
  musics,
  novels,
} from "./schema";
import * as schema from "./schema";

interface LyricTrackSeed {
  id: number;
  sync: number;
  lyric: unknown;
}

const lyricsDir = new URL("../../../public/lyrics/", import.meta.url);
const envFile = new URL("../../../.env", import.meta.url);

const loadEnvFile = () => {
  if (!existsSync(envFile)) return;

  const envText = readFileSync(envFile, "utf8");
  for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const index = trimmed.indexOf("=");
    if (index === -1) continue;

    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1).replace(/^['"]|['"]$/g, "");
    process.env[key] ??= value;
  }
};

loadEnvFile();

const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl) {
  throw new Error("TURSO_DATABASE_URL is required");
}

const db = drizzle(
  createClient({
    url: databaseUrl,
    authToken,
  }),
  { schema },
);

const seedMusics = async () => {
  for (const music of sourceMusics) {
    await db
      .insert(musics)
      .values({
        id: music.id,
        korTitle: music.korTitle,
        enTitle: music.enTitle,
        title: music.title,
        specialPath: music.specialPath ?? null,
        youtubeId: music.youtubeId,
      })
      .onConflictDoUpdate({
        target: musics.id,
        set: {
          korTitle: music.korTitle,
          enTitle: music.enTitle,
          title: music.title,
          specialPath: music.specialPath ?? null,
          youtubeId: music.youtubeId,
        },
      });
  }
};

const seedBooks = async () => {
  for (const book of sourceBooks) {
    await db
      .insert(books)
      .values({
        id: book.id,
        name: book.name,
      })
      .onConflictDoUpdate({
        target: books.id,
        set: {
          name: book.name,
        },
      });
  }
};

const seedNovels = async () => {
  for (const novel of sourceNovels) {
    await db
      .insert(novels)
      .values({
        id: novel.id,
        musicId: novel.musicId,
        bookId: novel.isPublished ? novel.bookId : null,
        title: novel.title,
        writer: novel.writer,
        originUrl: novel.originUrl,
        translator: novel.translated ? novel.translator : null,
        translatorUrl: novel.translated ? novel.translatorUrl : null,
        translated: novel.translated ?? false,
        isPublished: novel.isPublished ?? false,
        contentKey: `novel/${novel.id}.md`,
      })
      .onConflictDoUpdate({
        target: novels.id,
        set: {
          musicId: novel.musicId,
          bookId: novel.isPublished ? novel.bookId : null,
          title: novel.title,
          writer: novel.writer,
          originUrl: novel.originUrl,
          translator: novel.translated ? novel.translator : null,
          translatorUrl: novel.translated ? novel.translatorUrl : null,
          translated: novel.translated ?? false,
          isPublished: novel.isPublished ?? false,
          contentKey: `novel/${novel.id}.md`,
        },
      });
  }
};

const seedComics = async () => {
  for (const comic of sourceComics) {
    await db
      .insert(comics)
      .values({
        id: comic.id,
        musicId: comic.musicId,
        title: comic.title,
        writer: comic.writer,
        originUrl: comic.originUrl,
        translator: comic.translator,
        translatorUrl: comic.translatorUrl,
        length: comic.length,
        imagePrefix: `comics/${comic.id}/`,
      })
      .onConflictDoUpdate({
        target: comics.id,
        set: {
          musicId: comic.musicId,
          title: comic.title,
          writer: comic.writer,
          originUrl: comic.originUrl,
          translator: comic.translator,
          translatorUrl: comic.translatorUrl,
          length: comic.length,
          imagePrefix: `comics/${comic.id}/`,
        },
      });
  }
};

const seedBookRelations = async () => {
  for (const book of sourceBooks) {
    await db
      .insert(bookPurchaseLinks)
      .values({
        bookId: book.id,
        kyoboUrl: book.purchaseLinks.kyoboURL,
        yes24Url: book.purchaseLinks.yes24URL,
        aladinUrl: book.purchaseLinks.aladinURL,
        ridiUrl: book.purchaseLinks.ridiURL,
        naverUrl: book.purchaseLinks.naverURL,
      })
      .onConflictDoUpdate({
        target: bookPurchaseLinks.bookId,
        set: {
          kyoboUrl: book.purchaseLinks.kyoboURL,
          yes24Url: book.purchaseLinks.yes24URL,
          aladinUrl: book.purchaseLinks.aladinURL,
          ridiUrl: book.purchaseLinks.ridiURL,
          naverUrl: book.purchaseLinks.naverURL,
        },
      });

    for (const [index, novelId] of book.novelIds.entries()) {
      await db
        .insert(bookNovels)
        .values({
          bookId: book.id,
          novelId,
          order: index,
        })
        .onConflictDoUpdate({
          target: [bookNovels.bookId, bookNovels.novelId],
          set: {
            order: index,
          },
        });
    }
  }
};

const seedLyrics = async () => {
  const files = await readdir(lyricsDir);
  const jsonFiles = files.filter((file) => file.endsWith(".json"));

  for (const file of jsonFiles) {
    const raw = await readFile(new URL(file, lyricsDir), "utf8");
    const track = JSON.parse(raw) as LyricTrackSeed;

    await db
      .insert(lyricTracks)
      .values({
        musicId: track.id,
        sync: track.sync,
        lyricJson: track.lyric,
      })
      .onConflictDoUpdate({
        target: lyricTracks.musicId,
        set: {
          sync: track.sync,
          lyricJson: track.lyric,
        },
      });
  }

  return jsonFiles.length;
};

const main = async () => {
  await seedMusics();
  await seedBooks();
  await seedNovels();
  await seedComics();
  await seedBookRelations();
  const lyricCount = await seedLyrics();

  console.log(
    JSON.stringify({
      musics: sourceMusics.length,
      books: sourceBooks.length,
      novels: sourceNovels.length,
      comics: sourceComics.length,
      lyricTracks: lyricCount,
    }),
  );
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
