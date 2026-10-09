CREATE TABLE "event" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL,
	"type" text NOT NULL,
	"tool_slug" text,
	"path" text,
	"anon_id" text,
	"user_id" text
);
--> statement-breakpoint
CREATE TABLE "saved_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"slug" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"saved_at" timestamp with time zone,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_item" ADD CONSTRAINT "saved_item_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_ts_idx" ON "event" USING btree ("ts");--> statement-breakpoint
CREATE INDEX "event_type_ts_idx" ON "event" USING btree ("type","ts");--> statement-breakpoint
CREATE INDEX "event_tool_ts_idx" ON "event" USING btree ("tool_slug","ts");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_item_user_kind_slug_idx" ON "saved_item" USING btree ("user_id","kind","slug");