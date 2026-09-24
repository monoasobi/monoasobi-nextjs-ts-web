CREATE TABLE `loudasobi_call_guides` (
	`music_id` integer PRIMARY KEY NOT NULL,
	`guide_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`music_id`) REFERENCES `loudasobi_lyric_tracks`(`music_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `loudasobi_lyric_tracks` (
	`music_id` integer PRIMARY KEY NOT NULL,
	`sync` real DEFAULT 0 NOT NULL,
	`lyric_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`music_id`) REFERENCES `musics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `loudasobi_music_settings` (
	`music_id` integer PRIMARY KEY NOT NULL,
	`youtube_id` text,
	`fan_light_color` text,
	`publish` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`music_id`) REFERENCES `musics`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "loudasobi_publish_boolean" CHECK("loudasobi_music_settings"."publish" IN (0, 1)),
	CONSTRAINT "loudasobi_publish_requires_audio" CHECK("loudasobi_music_settings"."publish" = 0 OR ("loudasobi_music_settings"."youtube_id" IS NOT NULL AND length(trim("loudasobi_music_settings"."youtube_id")) > 0))
);
--> statement-breakpoint
ALTER TABLE `musics` ADD `deleted_at` text;