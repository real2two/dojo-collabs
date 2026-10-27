CREATE TABLE `collab_cooldown` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pending_collabs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`user_id` text NOT NULL,
	`bot_message_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
