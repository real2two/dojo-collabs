import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const pending_collabs = pgTable("pending_collabs", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	user_id: text("userId").notNull(),
	created_at: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const collab_cooldown = pgTable("collab_cooldown", {
	id: text("id").primaryKey(),
	created_at: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});
