import { defineConfig } from "drizzle-kit";

import { PG } from "./src/env";

export default defineConfig({
	out: "./src/infra/database/drizzle",
	schema: "../shared/database/schema.ts",
	dialect: "postgresql",
	dbCredentials: PG,
	strict: true,
});
