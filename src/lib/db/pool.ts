import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import {
	DATABASE_HOST,
	DATABASE_NAME,
	DATABASE_PASSWORD,
	DATABASE_PORT,
	DATABASE_SSL,
	DATABASE_USER,
} from "../../env";
import * as schema from "./schema";

export const pool = new pg.Pool({
	host: DATABASE_HOST,
	port: DATABASE_PORT,
	user: DATABASE_USER,
	password: DATABASE_PASSWORD,
	database: DATABASE_NAME,
	ssl: DATABASE_SSL,
});

export const db = drizzle(pool, { schema });
