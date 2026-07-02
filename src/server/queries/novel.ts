import { db } from "@/server/db";
import { toMusic, toNovel } from "./mapper";

export const getNovelById = async (id: number) => {
  const novel = await db.query.novels.findFirst({
    where: (novels, { eq }) => eq(novels.id, id),
    with: {
      music: true,
      book: true,
    },
  });

  if (!novel?.music) return null;

  return {
    novel: toNovel(novel),
    music: toMusic(novel.music),
    book: novel.book,
  };
};

export const getNovelByMusicId = async (musicId: number) => {
  const novel = await db.query.novels.findFirst({
    where: (novels, { eq }) => eq(novels.musicId, musicId),
    with: {
      music: true,
      book: true,
    },
  });

  if (!novel?.music) return null;

  return {
    novel: toNovel(novel),
    music: toMusic(novel.music),
    book: novel.book,
  };
};

export const getNovelContentAccess = async (id: number) => {
  return db.query.novels.findFirst({
    columns: {
      id: true,
      isPublished: true,
    },
    where: (novels, { eq }) => eq(novels.id, id),
  });
};
