/** Generate timestamp markdown for Discord based on the date */
export function timestamp(date: number): string {
	return `<t:${Math.floor(date / 1000)}:R>`;
}

/**
 * Add "..." at the end of the string if it passes the maximum length limit
 * @param text The text to ellipsis
 * @param maxLength The maximum length of the text
 * @returns The text or the ellipsis text if it passed the character limit
 */
export function ellipsisText(text: string, maxLength: number) {
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength - 3)}...`;
}
