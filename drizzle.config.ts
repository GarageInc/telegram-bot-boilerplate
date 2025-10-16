import { defineConfig } from "drizzle-kit";

import { PG } from "./src/env";

export default defineConfig({
	out: "./src/infra/database/drizzle",
	schema: "./src/infra/database/drizzle/schema.ts",
	dialect: "postgresql",
	dbCredentials: { ...PG, ssl: false },
	strict: true,
});
