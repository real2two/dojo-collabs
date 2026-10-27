// Taken and forked from carbon
// https://github.com/buape/carbon/blob/7681111d077974756240a64a7d11df95b3bd360a/packages/carbon/src/types/listeners.ts#L108

import {
	GatewayDispatchEvents,
	type GatewayGuildMemberAddDispatchData,
	type GatewayGuildMemberUpdateDispatchData,
	type GatewayMessageDeleteDispatchData,
	type GatewayMessageReactionAddDispatchData,
	type GatewayMessageReactionRemoveAllDispatchData,
	type GatewayMessageReactionRemoveDispatchData,
	type GatewayMessageReactionRemoveEmojiDispatchData,
	type GatewayReadyDispatchData,
	type GatewayThreadCreateDispatchData,
	type GatewayThreadDeleteDispatchData,
} from "discord-api-types/v10";

export const ListenerEvent = {
	Ready: GatewayDispatchEvents.Ready,
	GuildMemberUpdate: GatewayDispatchEvents.GuildMemberUpdate,
	GuildMemberAdd: GatewayDispatchEvents.GuildMemberAdd,
	ThreadCreate: GatewayDispatchEvents.ThreadCreate,
	ThreadDelete: GatewayDispatchEvents.ThreadDelete,
	MessageDelete: GatewayDispatchEvents.MessageDelete,
	MessageReactionAdd: GatewayDispatchEvents.MessageReactionAdd,
	MessageReactionRemove: GatewayDispatchEvents.MessageReactionRemove,
	MessageReactionRemoveEmoji: GatewayDispatchEvents.MessageReactionRemoveEmoji,
	MessageReactionRemoveAll: GatewayDispatchEvents.MessageReactionRemoveAll,
} as const;

export type ListenerEventType = keyof ListenerEventData;

export type ListenerEventData = {
	[ListenerEvent.Ready]: GatewayReadyDispatchData;
	[ListenerEvent.GuildMemberUpdate]: GatewayGuildMemberUpdateDispatchData;
	[ListenerEvent.GuildMemberAdd]: GatewayGuildMemberAddDispatchData;
	[ListenerEvent.ThreadCreate]: GatewayThreadCreateDispatchData;
	[ListenerEvent.ThreadDelete]: GatewayThreadDeleteDispatchData;
	[ListenerEvent.MessageDelete]: GatewayMessageDeleteDispatchData;
	[ListenerEvent.MessageReactionAdd]: GatewayMessageReactionAddDispatchData;
	[ListenerEvent.MessageReactionRemove]: GatewayMessageReactionRemoveDispatchData;
	[ListenerEvent.MessageReactionRemoveEmoji]: GatewayMessageReactionRemoveEmojiDispatchData;
	[ListenerEvent.MessageReactionRemoveAll]: GatewayMessageReactionRemoveAllDispatchData;
};
