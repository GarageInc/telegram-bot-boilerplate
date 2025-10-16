-- This sql file was generated with drizzle-kit introspect
-- This is the base truth generated from the old bot's database

CREATE TYPE "public"."enum_users_status" AS ENUM('IDLE', 'SUCCESS');--> statement-breakpoint
CREATE TABLE "MessageStore" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"message_id" integer NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"origin" varchar(50) NOT NULL,
	"text" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone,
	"whitelisted_access" boolean,
	"new_feature_access" boolean,
	"username" varchar(255),
	"updatedAt" timestamp with time zone NOT NULL,
	"email" varchar(255),
	"status" "enum_users_status" DEFAULT 'IDLE',
	"last_time_active" timestamp with time zone DEFAULT now() NOT NULL,
	"referrerId" varchar(255),
	"app_version" varchar(255) DEFAULT '1.0.0',
	"ref_code" varchar(255),
	"notifications_enabled" boolean DEFAULT true NOT NULL,
	"referrals_enabled" boolean DEFAULT false NOT NULL,
	CONSTRAINT "users_ref_code_key" UNIQUE("ref_code")
);
--> statement-breakpoint
