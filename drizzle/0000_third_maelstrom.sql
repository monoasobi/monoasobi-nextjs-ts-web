CREATE TABLE `book_novels` (
	`book_id` integer NOT NULL,
	`novel_id` integer NOT NULL,
	`order` integer NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`novel_id`) REFERENCES `novels`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `book_novels_book_id_novel_id_unique` ON `book_novels` (`book_id`,`novel_id`);--> statement-breakpoint
CREATE TABLE `book_purchase_links` (
	`book_id` integer PRIMARY KEY NOT NULL,
	`kyobo_url` text DEFAULT '' NOT NULL,
	`yes24_url` text DEFAULT '' NOT NULL,
	`aladin_url` text DEFAULT '' NOT NULL,
	`ridi_url` text DEFAULT '' NOT NULL,
	`naver_url` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `books` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `comics` (
	`id` integer PRIMARY KEY NOT NULL,
	`music_id` integer NOT NULL,
	`title` text NOT NULL,
	`writer` text NOT NULL,
	`origin_url` text NOT NULL,
	`translator` text NOT NULL,
	`translator_url` text NOT NULL,
	`length` integer NOT NULL,
	`image_prefix` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`music_id`) REFERENCES `musics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lyric_tracks` (
	`music_id` integer PRIMARY KEY NOT NULL,
	`sync` integer DEFAULT 0 NOT NULL,
	`lyric_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`music_id`) REFERENCES `musics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `musics` (
	`id` integer PRIMARY KEY NOT NULL,
	`kor_title` text NOT NULL,
	`en_title` text NOT NULL,
	`title` text NOT NULL,
	`special_path` text,
	`youtube_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `novels` (
	`id` integer PRIMARY KEY NOT NULL,
	`music_id` integer NOT NULL,
	`book_id` integer,
	`title` text NOT NULL,
	`writer` text NOT NULL,
	`origin_url` text NOT NULL,
	`translator` text,
	`translator_url` text,
	`translated` integer DEFAULT false NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	`content_key` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`music_id`) REFERENCES `musics`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE no action
);
