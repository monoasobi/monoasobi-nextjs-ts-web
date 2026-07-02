DROP INDEX "book_novels_book_id_novel_id_unique";--> statement-breakpoint
ALTER TABLE `lyric_tracks` ALTER COLUMN "sync" TO "sync" real NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `book_novels_book_id_novel_id_unique` ON `book_novels` (`book_id`,`novel_id`);