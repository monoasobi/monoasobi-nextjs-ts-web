import { activeMusicIds } from "./activeMusic";
import { db } from "@/server/db";
import { toComic, toMusic } from "./mapper";

export const getComicById = async (id: number) => {
  const comic = await db.query.comics.findFirst({
    where: (comics, { and, eq, inArray }) => and(eq(comics.id, id), inArray(comics.musicId, activeMusicIds())),
    with: {
      music: true,
    },
  });

  if (!comic?.music) return null;

  return {
    comic: toComic(comic),
    music: toMusic(comic.music),
  };
};
