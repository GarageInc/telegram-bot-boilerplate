import { drizzle } from "drizzle-orm/node-postgres";
import { PG } from "../../env.ts";
import { Pool } from "pg";
import { traceFunction } from "../../plugins/opentelemetry.ts";

export async function makeClient() {
	console.log("🔌 Connecting to database...");
	console.log(`   Host: ${PG.host}`);
	console.log(`   Port: ${PG.port}`);
	console.log(`   Database: ${PG.database}`);
	console.log(`   User: ${PG.user}`);
	console.log(`   Password: ${PG.password ? "***" : "NOT SET"}`);

	const pool = new Pool(PG);

	// Test the connection
	pool.on("error", err => console.error("❌ Database connection error:", err));

	const db = drizzle(pool);

	// Test the connection with a simple query
	await pool
		.query("SELECT NOW()")
		.then(result => console.log("✅ Database test query successful:", JSON.stringify(result.rows[0])))
		.catch(err => Promise.reject(new Error("❌ Database test query failed!", { cause: err })));

	pool.query = traceFunction("db.query", pool.query.bind(pool));

	return db;
}

export type DatabaseClient = Awaited<ReturnType<typeof makeClient>>;
