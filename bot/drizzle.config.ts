import { defineConfig } from "drizzle-kit";

import { DATABASE_URL } from "../shared/env";

export default defineConfig({
	out: "./../shared/infra/database/drizzle",
	schema: "./../shared/database/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: DATABASE_URL?.toString() ?? "",
	},
	strict: true,
});
