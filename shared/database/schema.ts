import { pgTable, varchar, integer, text, timestamp, boolean, unique, pgEnum } from "drizzle-orm/pg-core";

export const enumUsersStatus = pgEnum("enum_users_status", ["IDLE", "SUCCESS"]);

export const messageStore = pgTable("MessageStore", {
	id: varchar({ length: 255 }).primaryKey().notNull(),
	messageId: integer("message_id").notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	origin: varchar({ length: 50 }).notNull(),
	text: text().notNull(),
	createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
});

export const sequelizeMeta = pgTable("SequelizeMeta", {
	name: varchar({ length: 255 }).primaryKey().notNull(),
});

export const users = pgTable("users", {
	id: varchar({ length: 255 }).primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	whitelistedAccess: boolean("whitelisted_access"),
	newFeatureAccess: boolean("new_feature_access"),
	username: varchar({ length: 255 }),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	email: varchar({ length: 255 }),
	status: enumUsersStatus().default('IDLE'),
	lastTimeActive: timestamp("last_time_active", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	referrerId: varchar({ length: 255 }),
	appVersion: varchar("app_version", { length: 255 }).default('1.0.0'),
	refCode: varchar("ref_code", { length: 255 }),
	notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
	referralsEnabled: boolean("referrals_enabled").default(false).notNull(),
	clickCount: integer("click_count").default(0).notNull(),
	displayName: varchar("display_name", { length: 255 }),
}, (table) => [
	unique("users_ref_code_key").on(table.refCode),
	unique("users_display_name_key").on(table.displayName),
]);

