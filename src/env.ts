export const TOKEN = process.env.TOKEN;

export const GUILD_ID = process.env.GUILD_ID;
export const CHANNEL_ID = process.env.CHANNEL_ID;

export const USER_COOLDOWN_TIME = Number.parseInt(
	process.env.USER_COOLDOWN_TIME,
);
export const USER_COOLDOWN_ROLE_ID = process.env.USER_COOLDOWN_ROLE_ID;

export const STARS_NEEDED = Number.parseInt(process.env.STARS_NEEDED);
export const VOTING_PERIOD_TIME = Number.parseInt(
	process.env.VOTING_PERIOD_TIME,
);
export const RANDOM_IMAGE_API = process.env.RANDOM_IMAGE_API;
export const BYPASS_ROLE_IDS = process.env.BYPASS_ROLE_IDS.split(",");

export const DATABASE_HOST = process.env.DATABASE_HOST;
export const DATABASE_PORT = Number.parseInt(process.env.DATABASE_PORT);
export const DATABASE_USER = process.env.DATABASE_USER;
export const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
export const DATABASE_NAME = process.env.DATABASE_NAME;
export const DATABASE_SSL = process.env.DATABASE_SSL?.toLowerCase() === "true";

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			TOKEN: string;
			GUILD_ID: string;
			CHANNEL_ID: string;
			USER_COOLDOWN_TIME: string;
			USER_COOLDOWN_ROLE_ID: string;
			STARS_NEEDED: string;
			VOTING_PERIOD_TIME: string;
			RANDOM_IMAGE_API: string;
			BYPASS_ROLE_IDS: string;
			DATABASE_HOST: string;
			DATABASE_PORT: string;
			DATABASE_USER: string;
			DATABASE_PASSWORD: string;
			DATABASE_NAME: string;
			DATABASE_SSL: string;
		}
	}
}
