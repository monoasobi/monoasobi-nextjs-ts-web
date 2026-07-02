import { db } from "@/server/db";
import { toMusic, toNovel } from "./mapper";

export const getSidebarItems = async () => {
  const musics = await db.query.musics.findMany({
    orderBy: (musics, { asc }) => asc(musics.id),
    with: {
      novels: {
        limit: 1,
      },
    },
  });

  return musics
    .map((music) => {
      const novel = music.novels[0];
      if (!novel) return null;

      return {
        music: toMusic(music),
        novel: toNovel(novel),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
};
