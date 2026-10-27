import { eq, inArray, lt } from "drizzle-orm";
import { collab_cooldown, db } from "../db";

/**
 * Get all users that need the collab cooldown role removed
 */
export async function getAllCollabCooldownToRemove(cooldown_time: number) {
	const collab_cooldowns = await db
		.select()
		.from(collab_cooldown)
		.where(
			lt(collab_cooldown.created_at, new Date(Date.now() - cooldown_time)),
		);
	return collab_cooldowns.map((c) => c.id);
}

/**
 * Get the collab cooldown for a user
 * @param user_id The user ID to get the cooldown for
 */
export async function getUserCollabCooldown(user_id: string) {
	const collab_cooldowns = await db
		.select()
		.from(collab_cooldown)
		.where(eq(collab_cooldown.id, user_id));
	return collab_cooldowns[0];
}

/**
 * Set the collab cooldown on someone
 * @param user_id The user ID to set the cooldown to
 */
export async function setUserCollabCooldown(user_id: string) {
	await db
		.insert(collab_cooldown)
		.values({ id: user_id })
		.onConflictDoUpdate({
			target: collab_cooldown.id,
			set: { created_at: new Date() },
		});
}

/**
 * Remove the collab cooldown on someone
 * @param user_id The user ID to remove the cooldown from
 */
export async function removeUserCollabCooldown(user_id: string) {
	await db.delete(collab_cooldown).where(eq(collab_cooldown.id, user_id));
}

/**
 * Remove the collab cooldown from many people
 * @param user_ids The user IDs to remove the cooldown from
 */
export async function removeManyCollabCooldowns(user_ids: string[]) {
	await db.delete(collab_cooldown).where(inArray(collab_cooldown.id, user_ids));
}
