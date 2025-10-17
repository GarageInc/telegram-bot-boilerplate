import * as schema from "./schema.ts";

export declare namespace Database {
	export type EnumUsersStatus = (typeof schema.enumUsersStatus.enumValues)[number];
	export type User = typeof schema.users.$inferSelect;

	// Insert types
	export namespace Insert {
	}
}
