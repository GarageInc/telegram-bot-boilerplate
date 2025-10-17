import * as schema from "../../../database/schema";

export declare namespace Database {
	export type EnumUsersStatus = (typeof schema.enumUsersStatus.enumValues)[number];
	export type User = typeof schema.users.$inferSelect;

	// Insert types
	export namespace Insert {
	}
}
