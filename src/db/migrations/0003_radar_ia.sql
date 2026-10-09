CREATE TABLE "radar_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"domain" text NOT NULL,
	"service" text NOT NULL,
	"market" text NOT NULL,
	"mentions" integer NOT NULL,
	"answered" integer NOT NULL,
	"rivals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"result" jsonb NOT NULL,
	"trigger" text DEFAULT 'cron' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "radar_snapshot" ADD CONSTRAINT "radar_snapshot_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "radar_user_created_idx" ON "radar_snapshot" USING btree ("user_id","created_at");