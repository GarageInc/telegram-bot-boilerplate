import { defineConfig } from "drizzle-kit";

const DATABASE_URL = process.env.DATABASE_URL;

console.log("DATABASE_URL ===> ", DATABASE_URL);

if (!DATABASE_URL) {
	throw new Error("DATABASE_URL is required");
}

export default defineConfig({
	out: "./../shared/infra/database/drizzle",
	schema: "./../shared/database/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: DATABASE_URL?.toString() ?? "",
	}
});
