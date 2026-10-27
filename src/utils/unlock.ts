import { THREAD_TAG_ID } from "~/env";
import type { RestManager } from "@discordeno/rest";

/**
 * 
 * @param rest The Discordeno REST manager
 * @param threadId The thread ID
 * @param name The name of the collab
 */
export async function unlockCollab(
	rest: RestManager,
	threadId: string,
	name: string,
) {
	const channel = await rest.getChannel(threadId);

	const oldTags = channel?.appliedTags ?? [];
	const newTags =
		oldTags.includes(THREAD_TAG_ID) || oldTags.length >= 5
			? oldTags
			: [THREAD_TAG_ID, ...oldTags];

	await rest.editChannel(threadId, {
		name,
		archived: false,
		locked: false,
		appliedTags: newTags,
	});
}
