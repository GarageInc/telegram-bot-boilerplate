import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	throw new Error("DATABASE_URL is required");
}

const pool = new pg.Pool({
	connectionString: DATABASE_URL,
});

export const db = drizzle(pool);

export async function closeDatabase() {
	await pool.end();
}

