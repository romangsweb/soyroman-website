import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_ai_visits_kind" AS ENUM('training', 'search', 'user');
  CREATE TABLE "ai_visits" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"bot" varchar NOT NULL,
  	"company" varchar,
  	"kind" "enum_ai_visits_kind" NOT NULL,
  	"path" varchar NOT NULL,
  	"user_agent" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ai_visits_id" integer;
  CREATE INDEX "ai_visits_bot_idx" ON "ai_visits" USING btree ("bot");
  CREATE INDEX "ai_visits_kind_idx" ON "ai_visits" USING btree ("kind");
  CREATE INDEX "ai_visits_path_idx" ON "ai_visits" USING btree ("path");
  CREATE INDEX "ai_visits_updated_at_idx" ON "ai_visits" USING btree ("updated_at");
  CREATE INDEX "ai_visits_created_at_idx" ON "ai_visits" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ai_visits_fk" FOREIGN KEY ("ai_visits_id") REFERENCES "public"."ai_visits"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_ai_visits_id_idx" ON "payload_locked_documents_rels" USING btree ("ai_visits_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "ai_visits" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "ai_visits" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ai_visits_fk";
  
  DROP INDEX "payload_locked_documents_rels_ai_visits_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ai_visits_id";
  DROP TYPE "public"."enum_ai_visits_kind";`)
}
