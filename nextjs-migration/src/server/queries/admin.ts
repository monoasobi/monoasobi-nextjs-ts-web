import { db } from "@/server/db";

export const getAdminDashboard = async () => {
  const [musics, novels, comics, books, lyricTracks] = await Promise.all([
    db.query.musics.findMany({
      orderBy: (musics, { asc }) => asc(musics.id),
    }),
    db.query.novels.findMany({
      orderBy: (novels, { asc }) => asc(novels.id),
      with: {
        music: true,
        book: true,
      },
    }),
    db.query.comics.findMany({
      orderBy: (comics, { asc }) => asc(comics.id),
      with: {
        music: true,
      },
    }),
    db.query.books.findMany({
      orderBy: (books, { asc }) => asc(books.id),
      with: {
        novels: {
          orderBy: (bookNovels, { asc }) => asc(bookNovels.order),
          with: {
            novel: true,
          },
        },
        purchaseLinks: true,
      },
    }),
    db.query.lyricTracks.findMany({
      orderBy: (lyricTracks, { asc }) => asc(lyricTracks.musicId),
    }),
  ]);

  return {
    musics,
    novels,
    comics,
    books,
    lyricTracks: lyricTracks.map((track) => ({
      musicId: track.musicId,
      sync: track.sync,
      lineCount: Array.isArray(track.lyricJson) ? track.lyricJson.length : 0,
      lyricJson: track.lyricJson,
    })),
  };
};
