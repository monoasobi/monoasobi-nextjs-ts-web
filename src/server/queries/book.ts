import { db } from "@/server/db";
import { cacheLife, cacheTag } from "next/cache";
import { PUBLIC_CATALOG_CACHE_TAG } from "./publicCatalog";

export const getBookById = async (id: number) => {
  return db.query.books.findFirst({
    where: (books, { eq }) => eq(books.id, id),
    with: {
      novels: {
        with: {
          novel: true,
        },
      },
      purchaseLinks: true,
    },
  });
};

export const getBookPurchaseInfoById = async (id: number) => {
  "use cache";
  cacheTag(PUBLIC_CATALOG_CACHE_TAG);
  cacheLife("hours");

  const book = await db.query.books.findFirst({
    where: (books, { eq }) => eq(books.id, id),
    with: {
      novels: {
        orderBy: (bookNovels, { asc }) => asc(bookNovels.order),
        with: {
          novel: {
            with: {
              music: true,
            },
          },
        },
      },
      purchaseLinks: true,
    },
  });

  if (!book) return null;

  return {
    id: book.id,
    name: book.name,
    novels: book.novels.map(({ novel }) => ({
      id: novel.id,
      title: novel.title,
      writer: novel.writer,
      musicKorTitle: novel.music?.korTitle ?? "",
    })),
    purchaseLinks: {
      kyoboURL: book.purchaseLinks?.kyoboUrl ?? "",
      yes24URL: book.purchaseLinks?.yes24Url ?? "",
      aladinURL: book.purchaseLinks?.aladinUrl ?? "",
      ridiURL: book.purchaseLinks?.ridiUrl ?? "",
      naverURL: book.purchaseLinks?.naverUrl ?? "",
    },
  };
};
