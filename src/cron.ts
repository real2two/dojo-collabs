import {
	GUILD_ID,
	STARS_NEEDED,
	USER_COOLDOWN_ROLE_ID,
	USER_COOLDOWN_TIME,
	VOTING_PERIOD_TIME,
} from "$env";
import { DiscordReactionType } from "@discordeno/bot";
import { parseCronExpression } from "cron-schedule";
import { TimerBasedCronScheduler as scheduler } from "cron-schedule/schedulers/timer-based.js";
import { client } from "./bot";
import { deleteStarReactionsCache, getStarReactionsCache } from "./cache";
import {
	deletePendingCollab,
	getAllCollabCooldownToRemove,
	getExpiredPendingCollabs,
	removeManyCollabCooldowns,
	removeUserCollabCooldown,
} from "./lib/functions";

// Start the cron task where the function "handleDeleting" is ran every minutes
// Also, run the function when the bot starts as well
scheduler.setInterval(parseCronExpression("* * * * *"), handleDeleting);
handleDeleting();

/** Handle removing the collab cooldown role and expired pending collabs */
async function handleDeleting() {
	// Remove all users that have an expired "collab cooldown" role (aka cooldown time passed)
	const expired_collab_cooldown_users =
		await getAllCollabCooldownToRemove(USER_COOLDOWN_TIME);
	for (const user_id of expired_collab_cooldown_users) {
		try {
			await client.rest.removeRole(GUILD_ID, user_id, USER_COOLDOWN_ROLE_ID);
		} catch (err) {
			console.error(err);
		}
	}
	await removeManyCollabCooldowns(expired_collab_cooldown_users);

	// Check for expired pending collabs and delete them
	for (const pending_collab of await getExpiredPendingCollabs(
		VOTING_PERIOD_TIME,
	)) {
		// Check if the stars reaction is cached
		// If it is doesn't exist, check if the collab passed the star reactions goal
		// If it does exist, but it passed the stars needed, ignore (prevents race condition).
		const reactions_cache = getStarReactionsCache(pending_collab.id);
		if (!reactions_cache) {
			// If the reactions aren't cached, check the reactions the thread has
			const reactions = await client.rest.getReactions(
				pending_collab.id,
				pending_collab.id,
				"⭐",
				{ type: DiscordReactionType.Normal, limit: STARS_NEEDED },
			);

			// If it passes the reactions limit, accept the collab
			// This can happen when the bot turns off, it passes the reaction requirement and nothing else is done.
			if (reactions && reactions.length >= STARS_NEEDED) {
				await deletePendingCollab(pending_collab.id);
				await client.rest.editChannel(pending_collab.id, {
					name: pending_collab.name,
					archived: false,
					locked: false,
				});
				continue;
			}
		} else if (reactions_cache.size >= STARS_NEEDED) continue;

		// Delete the thread
		try {
			await client.rest.deleteChannel(pending_collab.id);
		} catch (err) {
			console.error(err);
		}

		// Delete the pending collab from the database
		await deletePendingCollab(pending_collab.id);
		deleteStarReactionsCache(pending_collab.id);

		// Removes the user's cooldown if collab fails to get out of pending status
		try {
			await client.rest.removeRole(
				GUILD_ID,
				pending_collab.user_id,
				USER_COOLDOWN_ROLE_ID,
			);
		} catch (err) {
			console.error(err);
		}
		await removeUserCollabCooldown(pending_collab.user_id);
	}
}
