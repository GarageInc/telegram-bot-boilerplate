-- Add clicker game fields
ALTER TABLE "users" ADD COLUMN "click_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "users" ADD COLUMN "display_name" varchar(255);
ALTER TABLE "users" ADD CONSTRAINT "users_display_name_key" UNIQUE("display_name");

-- Create index for leaderboard queries
CREATE INDEX "users_click_count_idx" ON "users" ("click_count" DESC);

