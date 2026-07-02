DROP INDEX "book_novels_book_id_novel_id_unique";--> statement-breakpoint
ALTER TABLE `musics` ALTER COLUMN "youtube_id" TO "youtube_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX `book_novels_book_id_novel_id_unique` ON `book_novels` (`book_id`,`novel_id`);