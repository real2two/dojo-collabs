import { eq, sql } from "drizzle-orm";
import { db, last_collab_timestamp } from "../db";

/**
 * Get the last collab timestamp by channel ID
 * @param channelId The channel ID
 * @returns The last collab timestamp
 */
export async function getLastCollabTimestamp(channelId: string) {
	const rows = await db
		.select()
		.from(last_collab_timestamp)
		.where(eq(last_collab_timestamp.id, channelId));
	return rows[0] ?? null;
}

/**
 * Set the last collab timestamp by channel ID
 * @param channelId The channel ID
 * @param lastTimestamp The last collab timestamp
 */
export async function setLastCollabTimestamp(
	channelId: string,
	lastTimestamp: Date,
) {
	await db
		.insert(last_collab_timestamp)
		.values({ id: channelId, lastTimestamp })
		.onConflictDoUpdate({
			target: last_collab_timestamp.id,
			set: {
				lastTimestamp: sql`max(${last_collab_timestamp.lastTimestamp}, excluded.last_timestamp)`,
			},
		});
}
