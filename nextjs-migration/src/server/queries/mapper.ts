import type { Comic } from "@appTypes/comic";
import type { Music } from "@appTypes/music";
import type { Novel } from "@appTypes/novel";
import type { comics, musics, novels } from "@/server/db";

type MusicRow = typeof musics.$inferSelect;
type NovelRow = typeof novels.$inferSelect;
type ComicRow = typeof comics.$inferSelect;

export const toMusic = (music: MusicRow): Music => ({
  id: music.id,
  korTitle: music.korTitle,
  enTitle: music.enTitle,
  title: music.title,
  specialPath: music.specialPath ?? undefined,
  youtubeId: music.youtubeId,
});

export const toNovel = (novel: NovelRow): Novel => {
  const base = {
    id: novel.id,
    musicId: novel.musicId,
    title: novel.title,
    writer: novel.writer,
    originUrl: novel.originUrl,
  };

  if (novel.translated && novel.isPublished) {
    return {
      ...base,
      translated: true,
      translator: novel.translator ?? "",
      translatorUrl: novel.translatorUrl ?? "",
      isPublished: true,
      bookId: novel.bookId ?? 0,
    };
  }

  if (novel.translated) {
    return {
      ...base,
      translated: true,
      translator: novel.translator ?? "",
      translatorUrl: novel.translatorUrl ?? "",
      isPublished: false,
    };
  }

  if (novel.isPublished) {
    return {
      ...base,
      translated: false,
      isPublished: true,
      bookId: novel.bookId ?? 0,
    };
  }

  return {
    ...base,
    translated: false,
    isPublished: false,
  };
};

export const toComic = (comic: ComicRow): Comic => ({
  id: comic.id,
  musicId: comic.musicId,
  title: comic.title,
  writer: comic.writer,
  originUrl: comic.originUrl,
  translator: comic.translator,
  translatorUrl: comic.translatorUrl,
  length: comic.length,
});
