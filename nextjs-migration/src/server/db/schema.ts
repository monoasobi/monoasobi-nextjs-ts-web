import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const musics = sqliteTable("musics", {
  id: integer("id").primaryKey(),
  korTitle: text("kor_title").notNull(),
  enTitle: text("en_title").notNull(),
  title: text("title").notNull(),
  specialPath: text("special_path"),
  youtubeId: text("youtube_id").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const books = sqliteTable("books", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const novels = sqliteTable("novels", {
  id: integer("id").primaryKey(),
  musicId: integer("music_id")
    .notNull()
    .references(() => musics.id),
  bookId: integer("book_id").references(() => books.id),
  title: text("title").notNull(),
  writer: text("writer").notNull(),
  originUrl: text("origin_url").notNull(),
  translator: text("translator"),
  translatorUrl: text("translator_url"),
  translated: integer("translated", { mode: "boolean" }).notNull().default(false),
  isPublished: integer("is_published", { mode: "boolean" })
    .notNull()
    .default(false),
  contentKey: text("content_key").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const comics = sqliteTable("comics", {
  id: integer("id").primaryKey(),
  musicId: integer("music_id")
    .notNull()
    .references(() => musics.id),
  title: text("title").notNull(),
  writer: text("writer").notNull(),
  originUrl: text("origin_url").notNull(),
  translator: text("translator").notNull(),
  translatorUrl: text("translator_url").notNull(),
  length: integer("length").notNull(),
  imagePrefix: text("image_prefix").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const bookNovels = sqliteTable(
  "book_novels",
  {
    bookId: integer("book_id")
      .notNull()
      .references(() => books.id),
    novelId: integer("novel_id")
      .notNull()
      .references(() => novels.id),
    order: integer("order").notNull(),
  },
  (table) => [unique().on(table.bookId, table.novelId)],
);

export const bookPurchaseLinks = sqliteTable("book_purchase_links", {
  bookId: integer("book_id")
    .primaryKey()
    .references(() => books.id),
  kyoboUrl: text("kyobo_url").notNull().default(""),
  yes24Url: text("yes24_url").notNull().default(""),
  aladinUrl: text("aladin_url").notNull().default(""),
  ridiUrl: text("ridi_url").notNull().default(""),
  naverUrl: text("naver_url").notNull().default(""),
});

export const lyricTracks = sqliteTable("lyric_tracks", {
  musicId: integer("music_id")
    .primaryKey()
    .references(() => musics.id),
  sync: integer("sync").notNull().default(0),
  lyricJson: text("lyric_json", { mode: "json" }).notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const musicsRelations = relations(musics, ({ many, one }) => ({
  novels: many(novels),
  comics: many(comics),
  lyricTrack: one(lyricTracks),
}));

export const booksRelations = relations(books, ({ many, one }) => ({
  novels: many(bookNovels),
  purchaseLinks: one(bookPurchaseLinks),
}));

export const novelsRelations = relations(novels, ({ one, many }) => ({
  music: one(musics, {
    fields: [novels.musicId],
    references: [musics.id],
  }),
  book: one(books, {
    fields: [novels.bookId],
    references: [books.id],
  }),
  bookLinks: many(bookNovels),
}));

export const comicsRelations = relations(comics, ({ one }) => ({
  music: one(musics, {
    fields: [comics.musicId],
    references: [musics.id],
  }),
}));

export const bookNovelsRelations = relations(bookNovels, ({ one }) => ({
  book: one(books, {
    fields: [bookNovels.bookId],
    references: [books.id],
  }),
  novel: one(novels, {
    fields: [bookNovels.novelId],
    references: [novels.id],
  }),
}));

export const bookPurchaseLinksRelations = relations(
  bookPurchaseLinks,
  ({ one }) => ({
    book: one(books, {
      fields: [bookPurchaseLinks.bookId],
      references: [books.id],
    }),
  }),
);

export const lyricTracksRelations = relations(lyricTracks, ({ one }) => ({
  music: one(musics, {
    fields: [lyricTracks.musicId],
    references: [musics.id],
  }),
}));
