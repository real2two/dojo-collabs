import {
	ANNOUNCE_CHANNEL_ID,
	ANNOUNCE_ROLE_ID,
	BYPASS_ROLE_IDS,
	GUILD_ID,
	THREAD_CHANNEL_ID,
	THREAD_TAG_ID,
	STARS_NEEDED,
	TOKEN,
	USER_COOLDOWN_ROLE_ID,
	USER_COOLDOWN_TIME,
	VOTING_PERIOD_TIME,
} from "$env";
import { DiscordReactionType, Intents } from "@discordeno/bot";
import {
	createReactionsCache,
	deleteStarReactionsCache,
	getStarReactionsCache,
} from "./cache";
import { GatewayClient, ListenerEvent, getDisplayAvatarUrl } from "./lib/bot";
import {
	createPendingCollab,
	deletePendingCollab,
	getCachedPendingCollab,
	getUserCollabCooldown,
	hasPendingCollab,
	removeUserCollabCooldown,
	setPendingCollabBotMessage,
	setUserCollabCooldown,
} from "./lib/functions";
import { ellipsisText, timestamp } from "./utils/text";

export const client = new GatewayClient({
	token: TOKEN,
	intents:
		Intents.Guilds |
		Intents.GuildMembers |
		Intents.GuildMessages |
		Intents.GuildMessageReactions,

	events: {
		[ListenerEvent.Ready]: () => console.info("Bot is ready"),
		[ListenerEvent.GuildMemberUpdate]: async (member) => {
			// Check if the user doesn't have the cooldown role ID
			if (member.roles.includes(USER_COOLDOWN_ROLE_ID)) return;

			// Assume the user had the role and remove cooldown timer from the database
			await removeUserCollabCooldown(member.user.id);
		},
		[ListenerEvent.GuildMemberAdd]: async (member) => {
			// If the user rejoined and still has an active cooldown, give the role back
			if (member.roles.includes(USER_COOLDOWN_ROLE_ID)) return;

			const [cooldown, has_pending_collab] = await Promise.all([
				getUserCollabCooldown(member.user.id),
				hasPendingCollab(member.user.id),
			]);

			const cooldown_is_active =
				cooldown &&
				cooldown.created_at.getTime() + USER_COOLDOWN_TIME > Date.now();

			if (cooldown_is_active || has_pending_collab) {
				await client.rest.addRole(
					member.guild_id,
					member.user.id,
					USER_COOLDOWN_ROLE_ID,
				);
			}
		},
		[ListenerEvent.ThreadCreate]: async (thread) => {
			// Check if it's from the collabs thread channel and if it's a newly created thread
			if (
				thread.guild_id !== GUILD_ID ||
				thread.parent_id !== THREAD_CHANNEL_ID ||
				!thread.newly_created ||
				!thread.owner_id
			)
				return;

			// Get the member and check if they can bypass the reaction restriction
			const member = await client.rest.getMember(GUILD_ID, thread.owner_id);

			// If user has bypass role (ex. collaborator):
			if (member?.roles.some((role) => BYPASS_ROLE_IDS.includes(role))) {
				// Give collab cooldown
				await Promise.all([
					client.rest.addRole(GUILD_ID, thread.owner_id, USER_COOLDOWN_ROLE_ID),
					setUserCollabCooldown(thread.owner_id),
				]);

				// Add the in-progress tag
				const thread_channel = await client.rest.getChannel(thread.id);
				const applied_tags = thread_channel?.appliedTags ?? [];
				const updated_tags =
					!applied_tags.includes(THREAD_TAG_ID) && applied_tags.length < 5
						? [THREAD_TAG_ID, ...applied_tags]
						: applied_tags;
				await client.rest.editChannel(thread.id, {
					appliedTags: updated_tags,
				});

				// Announce the collab
				const original_message = await client.rest.getMessage(
					thread.id,
					thread.id,
				);
				await client.rest.sendMessage(ANNOUNCE_CHANNEL_ID, {
					content: `<@&${ANNOUNCE_ROLE_ID}>`,
					embeds: [
						{
							color: 0xfc0303,
							description: `
								# ${thread.name} hosted by <@${thread.owner_id}> is now taking entries!
								## Check it out here! <#${thread.id}>
							`,
							thumbnail: {
								url: getDisplayAvatarUrl({
									userId: thread.owner_id,
									guildId: GUILD_ID,
									guildAvatar: member?.avatar,
									userAvatar: member?.user?.avatar,
								}),
							},
							image: original_message?.attachments?.[0]?.proxyUrl
								? { url: original_message.attachments[0].proxyUrl }
								: undefined,
						},
					],
				});
				return;
			}

			// Store in a database the newly created collab thread
			const finished_creating_pending_collab = createPendingCollab({
				id: thread.id,
				name: thread.name,
				user_id: thread.owner_id,
			});

			// Using Promise.all() to speed things up a bit (hopefully this doesn't get the bot rate limited)
			await Promise.all([
				// Lock the thread
				client.rest.editChannel(thread.id, {
					name: ellipsisText(`(REVIEW) ${thread.name}`, 100),
					archived: true,
					locked: true,
				}),

				// Add collab cooldown role
				client.rest.addRole(GUILD_ID, thread.owner_id, USER_COOLDOWN_ROLE_ID),

				// Set collab cooldown timer
				setUserCollabCooldown(thread.owner_id),
			]);

			// Send the message
			const message = await client.rest.sendMessage(thread.id, {
				embeds: [
					{
						color: 0xfc0303,
						description: `
							# This collab is locked and under community review! React to this post if you like the idea of this collab!
							## ${STARS_NEEDED} ⭐ needed for this collab to go live!
							## Voting period ends ${timestamp(Date.now() + VOTING_PERIOD_TIME)}
						`,
						thumbnail: {
							url: getDisplayAvatarUrl({
								userId: thread.owner_id,
								guildId: GUILD_ID,
								guildAvatar: member?.avatar,
								userAvatar: member?.user?.avatar,
							}),
						},
					},
				],
			});

			// Leave the thread
			await client.rest.leaveThread(thread.id);

			// Save bot's message ID into the database
			await finished_creating_pending_collab;
			const saved_message_into_db = await setPendingCollabBotMessage({
				id: thread.id,
				bot_message_id: message.id,
			});
			if (!saved_message_into_db) {
				// If it fails, delete the message ID
				// This deletes the message in a race condition where you meet the
				// star requirements before the bot even gets to saving this data.
				await client.rest.deleteMessage(thread.id, message.id);
			}
		},
		[ListenerEvent.ThreadDelete]: async (thread) => {
			// Delete the pending collab from the database
			await deletePendingCollab(thread.id);
			deleteStarReactionsCache(thread.id);
		},
		[ListenerEvent.MessageReactionAdd]: async (reaction) => {
			// Check if it's from the collabs thread channel and if it's a newly created thread
			if (reaction.guild_id !== GUILD_ID) return;

			// Check if it's a valid collab thread first message
			const pending_collab = getCachedPendingCollab(reaction.message_id);
			if (!pending_collab) return;

			// Only take account of star reactions
			if (reaction.emoji.name !== "⭐") return;

			// Remove brust star emojis (to prevent people from locking threads)
			if (reaction.burst) {
				return client.rest.deleteUserReaction(
					reaction.channel_id,
					reaction.message_id,
					reaction.user_id,
					"⭐",
				);
			}

			// Get the amount of stars the channel has
			let reactions_cache = getStarReactionsCache(reaction.message_id);
			if (reactions_cache) {
				// Since the reactions are already cached, all I need to do is add the new reaction to cache'
				reactions_cache.add(reaction.user_id);
			} else {
				// Get message from Discord and cache the data

				// WARNING: There's techinally a race condition here where if you quickly react then unreact,
				// it might still count towards your vote after it fetches, but this is unlikely to happen.
				// This also requires the bot to have needed to restart in the first place.

				// This is to prevent another race condition where it fetches reactions multiple times.
				// If it's trying to fetch the reactions of this message, it'll just add to
				// the counter (starting from 0) in the top (before the "} else {").
				reactions_cache = createReactionsCache(reaction.message_id);

				// This is where it actually fetches the reactions
				const reactions = await client.rest.getReactions(
					pending_collab.id,
					pending_collab.id,
					"⭐",
					{ type: DiscordReactionType.Normal, limit: STARS_NEEDED },
				);
				if (!reactions)
					throw new Error("Failed to find reactions in MessageReactionAdd");

				// Add unstored user reactions to cache
				for (const { id } of reactions) {
					reactions_cache.add(id);
				}
			}

			// Check if the collab thread has enough stars
			const count = reactions_cache.size;
			if (!count || count < STARS_NEEDED) return;

			// If the collab reached the stars needed, delete it from the database and unlock the thread
			await deletePendingCollab(reaction.message_id);

			// Get channel tags & add in-progress
			const thread_channel = await client.rest.getChannel(pending_collab.id);
			const applied_tags = thread_channel?.appliedTags ?? [];
			const updated_tags =
				!applied_tags.includes(THREAD_TAG_ID) && applied_tags.length < 5
					? [THREAD_TAG_ID, ...applied_tags]
					: applied_tags;

			// Edit thread channel
			await client.rest.editChannel(pending_collab.id, {
				name: pending_collab.name,
				archived: false,
				locked: false,
				appliedTags: updated_tags,
			});

			// Delete original bot message
			if (pending_collab.bot_message_id) {
				await client.rest.deleteMessage(
					pending_collab.id,
					pending_collab.bot_message_id,
				);
			}

			// Send an announcement message
			const host_user = await client.rest.getMember(
				GUILD_ID,
				pending_collab.user_id,
			);
			const original_message = await client.rest.getMessage(
				pending_collab.id,
				pending_collab.id,
			);
			await client.rest.sendMessage(ANNOUNCE_CHANNEL_ID, {
				content: `<@&${ANNOUNCE_ROLE_ID}>`,
				embeds: [
					{
						color: 0xfc0303,
						description: `
							# ${pending_collab.name} hosted by <@${pending_collab.user_id}> is now taking entries!
							## Check it out here! <#${pending_collab.id}>
						`,
						thumbnail: {
							url: getDisplayAvatarUrl({
								userId: pending_collab.user_id,
								guildId: GUILD_ID,
								guildAvatar: host_user?.avatar,
								userAvatar: host_user?.user?.avatar,
							}),
						},
						image: original_message?.attachments?.[0]?.proxyUrl
							? { url: original_message.attachments[0].proxyUrl }
							: undefined,
					},
				],
			});
		},
		[ListenerEvent.MessageReactionRemove]: async (reaction) => {
			// Check if it's from the collabs thread channel and if it's a newly created thread
			if (reaction.guild_id !== GUILD_ID) return;

			// Check if it's a valid collab thread first message
			const pending_collab = getCachedPendingCollab(reaction.message_id);
			if (!pending_collab) return;

			// Only take account of star reactions
			if (reaction.emoji.name !== "⭐" || reaction.burst) return;

			// Remove user from the counter
			// - Why only do minus 1 if it's cached?
			// - Well, I'm never going to need to use the amount of stars a collab thread has, until someone adds a star.
			// - I'll never need to use the star counter logic in remove stars
			//   and the add star logic will fetch the reactions in the message.
			const reactions_cache = getStarReactionsCache(reaction.message_id);
			reactions_cache?.delete(reaction.user_id);
		},
		[ListenerEvent.MessageReactionRemoveEmoji]: async (reaction) => {
			// Check if it's from the collabs thread channel and if it's a newly created thread
			if (reaction.guild_id !== GUILD_ID) return;

			// Check if it's a valid collab thread first message
			const pending_collab = getCachedPendingCollab(reaction.message_id);
			if (!pending_collab) return;

			// Only take account of star reactions
			if (reaction.emoji.name !== "⭐") return;

			// Reset counter
			const reactions_cache = getStarReactionsCache(reaction.message_id);
			reactions_cache?.clear();
		},
		[ListenerEvent.MessageReactionRemoveAll]: async (reaction) => {
			// Check if it's from the collabs thread channel and if it's a newly created thread
			if (reaction.guild_id !== GUILD_ID) return;

			// Check if it's a valid collab thread first message
			const pending_collab = getCachedPendingCollab(reaction.message_id);
			if (!pending_collab) return;

			// Reset counter
			const reactions_cache = getStarReactionsCache(reaction.message_id);
			reactions_cache?.clear();
		},
	},
});

await client.start();
