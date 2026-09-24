PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_loudasobi_call_guides` (
	`music_id` integer PRIMARY KEY NOT NULL,
	`guide_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`music_id`) REFERENCES `musics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_loudasobi_call_guides`("music_id", "guide_json", "created_at", "updated_at") SELECT "music_id", "guide_json", "created_at", "updated_at" FROM `loudasobi_call_guides`;--> statement-breakpoint
DROP TABLE `loudasobi_call_guides`;--> statement-breakpoint
ALTER TABLE `__new_loudasobi_call_guides` RENAME TO `loudasobi_call_guides`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `loudasobi_music_settings` ADD `sync_offset` real DEFAULT 0 NOT NULL;