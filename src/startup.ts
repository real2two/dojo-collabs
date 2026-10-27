import { GUILD_ID, THREAD_CHANNEL_ID } from "~/env";
import { client } from "./bot";
import {
	getLastCollabTimestamp,
	setLastCollabTimestamp,
} from "./lib/functions";
import { createCollab } from "./utils";

/**
 * Handles creating threads created when the bot was offline
 */
export async function handleDeadThreads() {
	const last = await getLastCollabTimestamp(THREAD_CHANNEL_ID);
	if (!last) {
		await setLastCollabTimestamp(THREAD_CHANNEL_ID, new Date());
		return;
	}

	const { threads } = await client.rest.getActiveThreads(GUILD_ID);

	const newThreads: {
		id: string;
		name: string;
		ownerId: string;
		guildId: string;
		createdAt: number;
	}[] = [];

	for (const thread of threads) {
		const ownerId = thread.ownerId;
		const name = thread.name;

		if (thread.parentId !== THREAD_CHANNEL_ID || !ownerId || !name) continue;

		const createdAt = new Date(
			thread.threadMetadata?.createTimestamp ?? Date.now(),
		).getTime();
		if (createdAt <= last.lastTimestamp.getTime()) continue;

		newThreads.push({
			id: thread.id,
			name,
			ownerId,
			guildId: GUILD_ID,
			createdAt,
		});
	}

	newThreads.sort((a, b) => a.createdAt - b.createdAt);

	for (const thread of newThreads) {
		await createCollab(client.rest, thread);
	}
}

await handleDeadThreads();
