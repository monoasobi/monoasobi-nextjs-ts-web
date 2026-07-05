import type { Comic } from "@appTypes/comic";
import type { Music } from "@appTypes/music";
import type { Novel } from "@appTypes/novel";
import { db } from "@/server/db";
import { cacheLife, cacheTag } from "next/cache";
import { toComic, toMusic, toNovel } from "./mapper";

export const PUBLIC_CATALOG_CACHE_TAG = "public-catalog";

interface PublicCatalogItem {
  music: Music;
  novels: Novel[];
  comics: Comic[];
  hasLyricTrack: boolean;
}

export const getPublicCatalog = async (): Promise<PublicCatalogItem[]> => {
  "use cache";
  cacheTag(PUBLIC_CATALOG_CACHE_TAG);
  cacheLife("hours");

  const catalog = await db.query.musics.findMany({
    orderBy: (musics, { asc }) => asc(musics.id),
    with: {
      novels: true,
      comics: true,
      lyricTrack: {
        columns: {
          musicId: true,
        },
      },
    },
  });

  return catalog.map((music) => ({
    music: toMusic(music),
    novels: music.novels.map(toNovel),
    comics: music.comics.map(toComic),
    hasLyricTrack: Boolean(music.lyricTrack),
  }));
};

export const getSidebarItems = async () => {
  const catalog = await getPublicCatalog();

  return catalog
    .map((item) => {
      const novel = item.novels[0];
      if (!novel) return null;

      return {
        music: item.music,
        novel,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
};

export const getNovelSummaryById = async (id: number) => {
  const catalog = await getPublicCatalog();

  for (const item of catalog) {
    const novel = item.novels.find((candidate) => candidate.id === id);
    if (novel) {
      return {
        music: item.music,
        novel,
      };
    }
  }

  return null;
};

export const getComicSummaryById = async (id: number) => {
  const catalog = await getPublicCatalog();

  for (const item of catalog) {
    const comic = item.comics.find((candidate) => candidate.id === id);
    if (comic) {
      return {
        music: item.music,
        comic,
      };
    }
  }

  return null;
};

export const getSpecialPageSummaryByMusicId = async (musicId: number) => {
  const catalog = await getPublicCatalog();
  const item = catalog.find((candidate) => candidate.music.id === musicId);
  if (!item) return null;

  return {
    music: item.music,
    novel: item.novels[0],
    comic: item.comics[0],
  };
};

export const getNovelStaticParams = async () => {
  const catalog = await getPublicCatalog();

  return catalog.flatMap((item) =>
    item.novels.map((novel) => ({ id: String(novel.id) })),
  );
};

export const getComicStaticParams = async () => {
  const catalog = await getPublicCatalog();

  return catalog.flatMap((item) =>
    item.comics.map((comic) => ({ id: String(comic.id) })),
  );
};
