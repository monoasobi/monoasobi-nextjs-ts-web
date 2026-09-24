import { activeMusicIds } from "./activeMusic";
import { db } from "@/server/db";
import { toMusic, toNovel } from "./mapper";

export const getNovelById = async (id: number) => {
  const novel = await db.query.novels.findFirst({
    where: (novels, { and, eq, inArray }) => and(eq(novels.id, id), inArray(novels.musicId, activeMusicIds())),
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
    where: (novels, { and, eq, inArray }) => and(eq(novels.musicId, musicId), inArray(novels.musicId, activeMusicIds())),
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
    where: (novels, { and, eq, inArray }) => and(eq(novels.id, id), inArray(novels.musicId, activeMusicIds())),
  });
};
