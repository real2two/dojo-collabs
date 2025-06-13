/** Get the amount of star reactions based on a message id */
export const star_reactions_cache = new Map<string, Set<string>>();

/** Get the cached star reactions for a message */
export function getStarReactionsCache(id: string) {
	return star_reactions_cache.get(id);
}

/** Create set for storing cached star reactions if it doesn't already exist */
export function createReactionsCache(id: string) {
	const reaction_cache = getStarReactionsCache(id);
	if (reaction_cache) return reaction_cache;

	const new_reaction_cache = new Set<string>();
	star_reactions_cache.set(id, new_reaction_cache);
	return new_reaction_cache;
}

/** Remove message star reaction cache */
export function deleteStarReactionsCache(id: string) {
	star_reactions_cache.delete(id);
}
