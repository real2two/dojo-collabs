import {
	BYPASS_ROLE_IDS,
	STARS_NEEDED,
	THREAD_CHANNEL_ID,
	USER_COOLDOWN_ROLE_ID,
	VOTING_PERIOD_TIME,
} from "~/env";
import type { RestManager } from "@discordeno/rest";
import { getDisplayAvatarUrl } from "../lib/bot/utils";
import {
	createPendingCollab,
	setLastCollabTimestamp,
	setPendingCollabBotMessage,
	setUserCollabCooldown,
} from "../lib/functions";
import { announceCollab } from "./announce";
import { ellipsisText, timestamp } from "./text";
import { unlockCollab } from "./unlock";

/**
 * Handles newly created collab thread
 * @param rest The REST manager for Discordeno
 * @param thread Thread information
 */
export async function createCollab(
	rest: RestManager,
	thread: {
		id: string;
		name: string;
		ownerId: string;
		guildId: string;
		createdAt: number;
	},
) {
	// Handles creating collab
	const member = await rest.getMember(thread.guildId, thread.ownerId);

	if (member?.roles.some((role) => BYPASS_ROLE_IDS.includes(role))) {
		// Bypass users skip the review/locking process, but still get
		// the cooldown role + timer, the in-progress tag, and an announcement.
		await Promise.all([
			rest.addRole(thread.guildId, thread.ownerId, USER_COOLDOWN_ROLE_ID),
			setUserCollabCooldown(thread.ownerId),
		]);

		await unlockCollab(rest, thread.id, thread.name);

		await announceCollab(rest, {
			name: thread.name,
			hostId: thread.ownerId,
			threadId: thread.id,
			avatarUrl: getDisplayAvatarUrl({
				userId: thread.ownerId,
				guildId: thread.guildId,
				guildAvatar: member?.avatar,
				userAvatar: member?.user?.avatar,
			}),
		});
	} else {
		// Store the pending collab
		const createdCollab = await createPendingCollab({
			id: thread.id,
			name: thread.name,
			user_id: thread.ownerId,
		});
		if (!createdCollab) return;

		await Promise.all([
			// Lock the thread
			rest.editChannel(thread.id, {
				name: ellipsisText(`(REVIEW) ${thread.name}`, 100),
				archived: true,
				locked: true,
			}),

			// Add collab cooldown role
			rest.addRole(thread.guildId, thread.ownerId, USER_COOLDOWN_ROLE_ID),

			// Set collab cooldown timer
			setUserCollabCooldown(thread.ownerId),
		]);

		// Send the review message
		const message = await rest.sendMessage(thread.id, {
			embeds: [
				{
					color: 0xfc0303,
					description: `
						# This collab is locked and under community review! React to this post if you like the idea of this collab!
						## ${STARS_NEEDED} ⭐ needed for this collab to go live!
						## Voting period ends ${timestamp(Date.now() + VOTING_PERIOD_TIME)}
					`.trim(),
					thumbnail: {
						url: getDisplayAvatarUrl({
							userId: thread.ownerId,
							guildId: thread.guildId,
							guildAvatar: member?.avatar,
							userAvatar: member?.user?.avatar,
						}),
					},
				},
			],
		});

		// Seed the starter message with a star so the bot counts toward the goal
		await rest.addReaction(thread.id, thread.id, "⭐");

		// Leave the thread
		await rest.leaveThread(thread.id);

		// Save the bot's message ID into the database
		const saved_message_into_db = await setPendingCollabBotMessage({
			id: thread.id,
			bot_message_id: message.id,
		});
		if (!saved_message_into_db) {
			await rest.deleteMessage(thread.id, message.id);
		}
	}

	await setLastCollabTimestamp(THREAD_CHANNEL_ID, new Date(thread.createdAt));
}
