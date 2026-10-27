/**
 * Get the member's display avatar URL
 */
export function getDisplayAvatarUrl({
	userId,
	guildId,
	guildAvatar,
	userAvatar,
}: {
	userId: string;
	guildId: string;
	guildAvatar?: string | null;
	userAvatar?: string | null;
}): string {
	// If user has guild avatar:
	if (guildAvatar) {
		return `https://cdn.discordapp.com/guilds/${guildId}/users/${userId}/avatars/${guildAvatar}.png`;
	}

	// If user has user avatar:
	if (userAvatar) {
		return `https://cdn.discordapp.com/avatars/${userId}/${userAvatar}.png`;
	}

	// If user has no avatar:
	return `https://cdn.discordapp.com/embed/avatars/${(BigInt(userId) >> 22n) % 6n}.png`;
}
