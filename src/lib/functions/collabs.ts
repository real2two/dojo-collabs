import { eq, lt } from "drizzle-orm";
import { db, pending_collabs } from "../db";

/** Cached all pending collabs (key = message id) */
const pending_collabs_cache = new Map<
	string,
	{
		name: string;
		user_id: string;
		bot_message_id: string | null;
		created_at: number;
	}
>();

// Cache all pending collabs in memory
// WARNING: This is probably not a good idea to do if the collabs channel ever rapidly increases activity
//          But this probably won't be a big issue, since it should only store pending collabs that only
//          last up to 3 days if they don't get the star reaction requirement.
await cacheAllPendingCollabs();

/**
 * Get all pending collabs
 * @returns All pending collabs
 */
export async function cacheAllPendingCollabs() {
	const raw_all_pending_collabs = await db.select().from(pending_collabs);
	const all_pending_collabs = raw_all_pending_collabs.map((c) => ({
		id: c.id,
		name: c.name,
		user_id: c.user_id,
		bot_message_id: c.bot_message_id,
		created_at: c.created_at.getTime(),
	}));
	for (const pending_collab of all_pending_collabs) {
		pending_collabs_cache.set(pending_collab.id, {
			name: pending_collab.name,
			user_id: pending_collab.user_id,
			bot_message_id: pending_collab.bot_message_id,
			created_at: pending_collab.created_at,
		});
	}
}

/**
 * Get expired pending collabs
 * @returns Expired pending collabs
 */
export async function getExpiredPendingCollabs(voting_period_time: number) {
	const expired_pending_collabs = await db
		.select()
		.from(pending_collabs)
		.where(
			lt(pending_collabs.created_at, new Date(Date.now() - voting_period_time)),
		);
	return expired_pending_collabs.map((c) => ({
		id: c.id,
		name: c.name,
		user_id: c.user_id,
		created_at: c.created_at.getTime(),
	}));
}

/**
 * Get a pending collab
 * @param id The message ID of the first thread message
 */
export function getCachedPendingCollab(id: string) {
	const pending_collab = pending_collabs_cache.get(id);
	if (!pending_collab) return null;
	return {
		id,
		name: pending_collab.name,
		user_id: pending_collab.user_id,
		bot_message_id: pending_collab.bot_message_id,
		created_at: pending_collab.created_at,
	};
}

/**
 * Create a pending collab
 * @param data The message ID of the first thread message and the user ID
 */
export async function createPendingCollab({
	id,
	name,
	user_id,
}: { id: string; name: string; user_id: string }) {
	// Save in cache
	const created_at = new Date();
	pending_collabs_cache.set(id, {
		name,
		user_id,
		bot_message_id: null,
		created_at: created_at.getTime(),
	});

	// Save in database
	await db.insert(pending_collabs).values({
		id,
		name,
		user_id,
		created_at,
	});
}

/**
 * Create a pending collab
 * @param data The message ID of the first thread message and the user ID
 */
export async function setPendingCollabBotMessage({
	id,
	bot_message_id,
}: { id: string; bot_message_id: string }) {
	// Get if the collab is cached. If it's not, fail.
	const pending_collab = pending_collabs_cache.get(id);
	if (!pending_collab) return false;

	// Save in cache
	pending_collab.bot_message_id = bot_message_id;

	// Set data into the database
	const success = await db
		.update(pending_collabs)
		.set({ bot_message_id })
		.where(eq(pending_collabs.id, id));
	return !!success.rowCount;
}

/**
 * Delete a pending collab
 * @param id The message ID of the first thread message
 */
export async function deletePendingCollab(id: string) {
	// Remove from cache
	pending_collabs_cache.delete(id);

	// Remove from database
	await db.delete(pending_collabs).where(eq(pending_collabs.id, id));
}
