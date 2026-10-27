import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const pending_collabs = sqliteTable("pending_collabs", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	user_id: text("user_id").notNull(),
	bot_message_id: text("bot_message_id"),
	created_at: integer("created_at", { mode: "timestamp_ms" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
});

export const collab_cooldown = sqliteTable("collab_cooldown", {
	id: text("id").primaryKey(),
	created_at: integer("created_at", { mode: "timestamp_ms" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
});
