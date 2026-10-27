import { ANNOUNCE_CHANNEL_ID, ANNOUNCE_ROLE_ID } from "~/env";
import type { RestManager } from "@discordeno/rest";

/**
 * Announce a live collab in the announce channel
 * @param rest The Discordeno REST manager
 * @param data The data needed to announce a collab
 */
export async function announceCollab(
	rest: RestManager,
	{
		name,
		hostId,
		threadId,
		avatarUrl,
	}: {
		name: string;
		hostId: string;
		threadId: string;
		avatarUrl: string;
	},
) {
	const starterMessage = await rest.getMessage(threadId, threadId);
	const imageUrl = starterMessage?.attachments?.[0]?.proxyUrl;

	await rest.sendMessage(ANNOUNCE_CHANNEL_ID, {
		content: `<@&${ANNOUNCE_ROLE_ID}>`,
		embeds: [
			{
				color: 0xfc0303,
				description: `
					# ${name} hosted by <@${hostId}> is now taking entries!
					## Check it out here! <#${threadId}>
				`,
				thumbnail: { url: avatarUrl },
				image: imageUrl ? { url: imageUrl } : undefined,
			},
		],
	});
}
