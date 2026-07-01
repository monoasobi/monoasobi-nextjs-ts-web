import { db } from "@/server/db";
import { toComic, toMusic, toNovel } from "./mapper";

const mapMusicSummary = (music: Awaited<ReturnType<typeof getAgentMusicsRaw>>[number]) => ({
  ...toMusic(music),
  novels: music.novels.map((novel) => novel.id),
  comics: music.comics.map((comic) => comic.id),
  hasLyricTrack: Boolean(music.lyricTrack),
});

const getAgentMusicsRaw = () =>
  db.query.musics.findMany({
    orderBy: (musics, { asc }) => asc(musics.id),
    with: {
      novels: true,
      comics: true,
      lyricTrack: true,
    },
  });

export const getAgentCatalog = async () => {
  const [musics, novels, comics, books] = await Promise.all([
    getAgentMusicsRaw(),
    db.query.novels.findMany({
      orderBy: (novels, { asc }) => asc(novels.id),
    }),
    db.query.comics.findMany({
      orderBy: (comics, { asc }) => asc(comics.id),
    }),
    db.query.books.findMany({
      orderBy: (books, { asc }) => asc(books.id),
      with: {
        novels: true,
        purchaseLinks: true,
      },
    }),
  ]);

  return {
    musics: musics.map(mapMusicSummary),
    novels: novels.map(toNovel),
    comics: comics.map(toComic),
    books: books.map((book) => ({
      id: book.id,
      name: book.name,
      novels: book.novels
        .sort((left, right) => left.order - right.order)
        .map(({ novelId }) => novelId),
      purchaseLinks: book.purchaseLinks
        ? {
            kyoboURL: book.purchaseLinks.kyoboUrl,
            yes24URL: book.purchaseLinks.yes24Url,
            aladinURL: book.purchaseLinks.aladinUrl,
            ridiURL: book.purchaseLinks.ridiUrl,
            naverURL: book.purchaseLinks.naverUrl,
          }
        : null,
    })),
  };
};

export const getAgentMusics = async () => {
  const musics = await getAgentMusicsRaw();
  return musics.map(mapMusicSummary);
};

export const getAgentMusicById = async (id: number) => {
  const music = await db.query.musics.findFirst({
    where: (musics, { eq }) => eq(musics.id, id),
    with: {
      novels: true,
      comics: true,
      lyricTrack: true,
    },
  });

  if (!music) return null;

  return mapMusicSummary(music);
};

export const searchAgentMusics = async (query: string) => {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return [];

  const musics = await getAgentMusics();

  return musics.filter((music) =>
    [music.title, music.korTitle, music.enTitle]
      .filter(Boolean)
      .some((value) => value.toLocaleLowerCase().includes(normalizedQuery)),
  );
};
