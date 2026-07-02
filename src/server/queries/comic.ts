import { db } from "@/server/db";
import { toComic, toMusic } from "./mapper";

export const getComicById = async (id: number) => {
  const comic = await db.query.comics.findFirst({
    where: (comics, { eq }) => eq(comics.id, id),
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
