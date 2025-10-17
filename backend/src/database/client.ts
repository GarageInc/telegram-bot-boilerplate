import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	throw new Error("DATABASE_URL is required");
}

const url = new URL(DATABASE_URL);

const pool = new pg.Pool({
	host: url.hostname,
	port: parseInt(url.port) || 5432,
	user: url.username,
	password: url.password,
	database: url.pathname.slice(1),
});

export const db = drizzle(pool);

export async function closeDatabase() {
	await pool.end();
}

