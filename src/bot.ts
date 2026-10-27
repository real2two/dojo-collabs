import {
	GUILD_ID,
	THREAD_CHANNEL_ID,
	STARS_NEEDED,
	TOKEN,
	USER_COOLDOWN_ROLE_ID,
	USER_COOLDOWN_TIME,
} from "~/env";
import { DiscordReactionType, Intents } from "@discordeno/bot";
import {
	createReactionsCache,
	deleteStarReactionsCache,
	getStarReactionsCache,
} from "./cache";
import { GatewayClient, ListenerEvent, getDisplayAvatarUrl } from "./lib/bot";
import {
	deletePendingCollab,
	getCachedPendingCollab,
	getUserCollabCooldown,
	hasPendingCollab,
	removeUserCollabCooldown,
} from "./lib/functions";
import { announceCollab, createCollab, unlockCollab } from "./utils";

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

			await createCollab(client.rest, {
				id: thread.id,
				name: thread.name,
				ownerId: thread.owner_id,
				guildId: thread.guild_id,
				createdAt: new Date(
					thread.thread_metadata?.create_timestamp ?? Date.now(),
				).getTime(),
			});
		},
		[ListenerEvent.ThreadDelete]: async (thread) => {
			// Delete the pending collab from the database
			await deletePendingCollab(thread.id);
			deleteStarReactionsCache(thread.id);
		},
		[ListenerEvent.MessageDelete]: async (message) => {
			// Check if it's from the collabs guild
			if (message.guild_id !== GUILD_ID) return;

			// Check if the deleted message is the original message of a pending collab
			const pending_collab = getCachedPendingCollab(message.id);
			if (!pending_collab) return;

			// Delete the collab thread
			try {
				await client.rest.deleteChannel(pending_collab.id);
			} catch (err) {
				console.error(err);
			}

			// Delete pending collab from the database and cache
			await deletePendingCollab(pending_collab.id);
			deleteStarReactionsCache(pending_collab.id);

			// Remove the user's cooldown role and timer since the collab was deleted
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

			// Unlock the thread and mark it as in progress
			await unlockCollab(client.rest, pending_collab.id, pending_collab.name);

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
			await announceCollab(client.rest, {
				name: pending_collab.name,
				hostId: pending_collab.user_id,
				threadId: pending_collab.id,
				avatarUrl: getDisplayAvatarUrl({
					userId: pending_collab.user_id,
					guildId: GUILD_ID,
					guildAvatar: host_user?.avatar,
					userAvatar: host_user?.user?.avatar,
				}),
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
