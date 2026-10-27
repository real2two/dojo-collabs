export const TOKEN = process.env.TOKEN;

export const GUILD_ID = process.env.GUILD_ID;
export const THREAD_CHANNEL_ID = process.env.THREAD_CHANNEL_ID;

export const USER_COOLDOWN_TIME = Number.parseInt(
	process.env.USER_COOLDOWN_TIME,
);
export const USER_COOLDOWN_ROLE_ID = process.env.USER_COOLDOWN_ROLE_ID;

export const STARS_NEEDED = Number.parseInt(process.env.STARS_NEEDED);
export const VOTING_PERIOD_TIME = Number.parseInt(
	process.env.VOTING_PERIOD_TIME,
);
export const BYPASS_ROLE_IDS = process.env.BYPASS_ROLE_IDS.split(",");

export const ANNOUNCE_ROLE_ID = process.env.ANNOUNCE_ROLE_ID;
export const ANNOUNCE_CHANNEL_ID = process.env.ANNOUNCE_CHANNEL_ID;

export const DATABASE_URL = process.env.DATABASE_URL ?? "./data.db";

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			TOKEN: string;
			GUILD_ID: string;
			THREAD_CHANNEL_ID: string;
			USER_COOLDOWN_TIME: string;
			USER_COOLDOWN_ROLE_ID: string;
			STARS_NEEDED: string;
			VOTING_PERIOD_TIME: string;
			BYPASS_ROLE_IDS: string;
			ANNOUNCE_ROLE_ID: string;
			ANNOUNCE_CHANNEL_ID: string;
			DATABASE_URL: string;
		}
	}
}
