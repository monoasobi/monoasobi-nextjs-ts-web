import {
  bookNovels,
  bookPurchaseLinks,
  books,
  comics,
  db,
  lyricTracks,
  musics,
  novels,
} from "@/server/db";
import type {
  BookInput,
  ComicInput,
  LyricTrackInput,
  MusicInput,
  NovelInput,
} from "@/server/schemas/admin.schema";
import { eq, inArray } from "drizzle-orm";

const now = () => new Date().toISOString();

export const createMusic = async (input: MusicInput) => {
  const [created] = await db.insert(musics).values(input).returning();
  return created;
};

export const updateMusic = async (id: number, input: MusicInput) => {
  const [updated] = await db
    .update(musics)
    .set({ ...input, updatedAt: now() })
    .where(eq(musics.id, id))
    .returning();

  return updated ?? null;
};

export const deleteMusic = async (id: number) => {
  const relatedNovels = await db.query.novels.findMany({
    where: (novels, { eq }) => eq(novels.musicId, id),
    columns: { id: true },
  });
  const novelIds = relatedNovels.map((novel) => novel.id);

  if (novelIds.length > 0) {
    await db.delete(bookNovels).where(inArray(bookNovels.novelId, novelIds));
  }

  await db.delete(lyricTracks).where(eq(lyricTracks.musicId, id));
  await db.delete(comics).where(eq(comics.musicId, id));
  await db.delete(novels).where(eq(novels.musicId, id));

  const [deleted] = await db
    .delete(musics)
    .where(eq(musics.id, id))
    .returning();

  return deleted ?? null;
};

export const createNovel = async (input: NovelInput) => {
  const [created] = await db.insert(novels).values(input).returning();
  return created;
};

export const updateNovel = async (id: number, input: NovelInput) => {
  const [updated] = await db
    .update(novels)
    .set({ ...input, updatedAt: now() })
    .where(eq(novels.id, id))
    .returning();

  return updated ?? null;
};

export const deleteNovel = async (id: number) => {
  await db.delete(bookNovels).where(eq(bookNovels.novelId, id));

  const [deleted] = await db
    .delete(novels)
    .where(eq(novels.id, id))
    .returning();

  return deleted ?? null;
};

export const createComic = async (input: ComicInput) => {
  const [created] = await db.insert(comics).values(input).returning();
  return created;
};

export const updateComic = async (id: number, input: ComicInput) => {
  const [updated] = await db
    .update(comics)
    .set({ ...input, updatedAt: now() })
    .where(eq(comics.id, id))
    .returning();

  return updated ?? null;
};

export const deleteComic = async (id: number) => {
  const [deleted] = await db
    .delete(comics)
    .where(eq(comics.id, id))
    .returning();

  return deleted ?? null;
};

export const createLyricTrack = async (input: LyricTrackInput) => {
  const [created] = await db.insert(lyricTracks).values(input).returning();
  return created;
};

export const updateLyricTrack = async (
  musicId: number,
  input: LyricTrackInput,
) => {
  const [updated] = await db
    .update(lyricTracks)
    .set({ sync: input.sync, lyricJson: input.lyricJson, updatedAt: now() })
    .where(eq(lyricTracks.musicId, musicId))
    .returning();

  return updated ?? null;
};

export const deleteLyricTrack = async (musicId: number) => {
  const [deleted] = await db
    .delete(lyricTracks)
    .where(eq(lyricTracks.musicId, musicId))
    .returning();

  return deleted ?? null;
};

export const createBook = async (input: BookInput) => {
  const [book] = await db.insert(books).values({ name: input.name }).returning();
  if (!book) return null;

  await replaceBookDetails(book.id, input);
  return book;
};

export const updateBook = async (id: number, input: BookInput) => {
  const [updated] = await db
    .update(books)
    .set({ name: input.name, updatedAt: now() })
    .where(eq(books.id, id))
    .returning();

  if (!updated) return null;

  await replaceBookDetails(id, input);
  return updated;
};

export const deleteBook = async (id: number) => {
  await db.delete(bookNovels).where(eq(bookNovels.bookId, id));
  await db.delete(bookPurchaseLinks).where(eq(bookPurchaseLinks.bookId, id));

  const [deleted] = await db
    .delete(books)
    .where(eq(books.id, id))
    .returning();

  return deleted ?? null;
};

const replaceBookDetails = async (bookId: number, input: BookInput) => {
  await db.delete(bookNovels).where(eq(bookNovels.bookId, bookId));
  await db.delete(bookPurchaseLinks).where(eq(bookPurchaseLinks.bookId, bookId));
  await db.insert(bookPurchaseLinks).values({
    bookId,
    ...input.purchaseLinks,
  });

  if (input.novelIds.length === 0) return;

  await db.insert(bookNovels).values(
    input.novelIds.map((novelId, index) => ({
      bookId,
      novelId,
      order: index + 1,
    })),
  );
};
