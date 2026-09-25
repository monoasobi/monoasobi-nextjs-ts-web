CREATE TABLE `loudasobi_sidebar_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`layout_json` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "loudasobi_sidebar_singleton" CHECK("loudasobi_sidebar_settings"."id" = 1)
);
