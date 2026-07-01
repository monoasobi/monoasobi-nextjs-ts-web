import { db } from "@/server/db";
import { toMusic } from "./mapper";

export const getMusicById = async (id: number) => {
  const music = await db.query.musics.findFirst({
    where: (musics, { eq }) => eq(musics.id, id),
  });

  return music ? toMusic(music) : null;
};

export const getMusicCatalog = async () => {
  const catalog = await db.query.musics.findMany({
    orderBy: (musics, { asc }) => asc(musics.id),
    with: {
      novels: true,
      comics: true,
      lyricTrack: true,
    },
  });

  return catalog.map((music) => ({
    ...toMusic(music),
    novels: music.novels.map((novel) => novel.id),
    comics: music.comics.map((comic) => comic.id),
    hasLyricTrack: Boolean(music.lyricTrack),
  }));
};
