import { THREAD_CHANNEL_ID } from "~/env";
import {
	getLastCollabTimestamp,
	setLastCollabTimestamp,
} from "./lib/functions";

/**
 * Handles creating threads created when the bot was offline
 */
export async function handleDeadThreads() {
	const last = await getLastCollabTimestamp(THREAD_CHANNEL_ID);
	if (!last) {
		await setLastCollabTimestamp(THREAD_CHANNEL_ID, new Date());
	}
}

await handleDeadThreads();
