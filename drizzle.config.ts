import {
	DATABASE_HOST,
	DATABASE_NAME,
	DATABASE_PASSWORD,
	DATABASE_PORT,
	DATABASE_SSL,
	DATABASE_USER,
} from "$env";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "./src/lib/db/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		host: DATABASE_HOST,
		port: DATABASE_PORT,
		user: DATABASE_USER,
		password: DATABASE_PASSWORD,
		database: DATABASE_NAME,
		ssl: DATABASE_SSL,
	},
});
