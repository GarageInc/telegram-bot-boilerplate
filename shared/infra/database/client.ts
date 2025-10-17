import { drizzle } from "drizzle-orm/node-postgres";
import { DATABASE_URL } from "../../env.ts";
import { Pool } from "pg";

export async function makeClient() {
	console.log("🔌 Connecting to database...");

	const pool = new Pool({
		connectionString: DATABASE_URL?.toString() ?? "",
	});

	// Test the connection
	pool.on("error", (err: any) => console.error("❌ Database connection error:", err));

	const db = drizzle(pool);

	// Test the connection with a simple query
	await pool
		.query("SELECT NOW()")
		.then((result: any) => console.log("✅ Database test query successful:", JSON.stringify(result.rows[0])))
		.catch((err: any) => Promise.reject(new Error("❌ Database test query failed!", { cause: err })));

	// pool.query = traceFunction("db.query", pool.query.bind(pool));

	return db;
}

export type DatabaseClient = Awaited<ReturnType<typeof makeClient>>;
