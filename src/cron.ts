import {
	GUILD_ID,
	USER_COOLDOWN_ROLE_ID,
	USER_COOLDOWN_TIME,
	VOTING_PERIOD_TIME,
} from "$env";
import { parseCronExpression } from "cron-schedule";
import { TimerBasedCronScheduler as scheduler } from "cron-schedule/schedulers/timer-based.js";
import { client } from "./bot";
import { deleteStarReactionsCache } from "./cache";
import {
	deletePendingCollab,
	getAllCollabCooldownToRemove,
	getExpiredPendingCollabs,
} from "./lib/functions";

// Start the cron task where the function "handleDeleting" is ran every minutes
// Also, run the function when the bot starts as well
scheduler.setInterval(parseCronExpression("* * * * *"), handleDeleting);
handleDeleting();

/** Handle removing the collab cooldown role and expired pending collabs */
async function handleDeleting() {
	// Remove all users that have an expired "collab cooldown" role (aka cooldown time passed)
	for (const user_id of await getAllCollabCooldownToRemove(
		USER_COOLDOWN_TIME,
	)) {
		await client.rest.removeRole(GUILD_ID, user_id, USER_COOLDOWN_ROLE_ID);
	}

	// Check for expired pending collabs and delete them
	for (const pending_collab of await getExpiredPendingCollabs(
		VOTING_PERIOD_TIME,
	)) {
		await deletePendingCollab(pending_collab.id);
		await client.rest.deleteChannel(pending_collab.id);

		deleteStarReactionsCache(pending_collab.id);
	}
}
