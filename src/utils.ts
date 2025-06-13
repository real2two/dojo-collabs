import { getRandomValues } from "node:crypto";

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

/**
 * Generate a randomly generated code
 * @param length The length of the randomly generated code
 * @returns The randomly generated code
 */
export function generateRandom(length: number) {
	const charset =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const values = new Uint32Array(length);
	let result = "";
	getRandomValues(values);
	for (let i = 0; i < length; i++) {
		const value = values[i];
		if (!value) {
			throw new Error(`values[${i}] is not defined in createCode - ${value}`);
		}
		result += charset[value % charset.length];
	}
	return result;
}
