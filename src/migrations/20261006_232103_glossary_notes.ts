import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_glossary_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__glossary_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__glossary_v_published_locale" AS ENUM('es', 'en');
  CREATE TYPE "public"."enum_notes_stage" AS ENUM('idea', 'drafted');
  CREATE TYPE "public"."enum_notes_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__notes_v_version_stage" AS ENUM('idea', 'drafted');
  CREATE TYPE "public"."enum__notes_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__notes_v_published_locale" AS ENUM('es', 'en');
  CREATE TABLE "glossary" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_glossary_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "glossary_locales" (
  	"term" varchar,
  	"full_name" varchar,
  	"definition" varchar,
  	"formula" varchar,
  	"example" varchar,
  	"why_it_matters" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "glossary_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"glossary_id" integer,
  	"categories_id" integer
  );
  
  CREATE TABLE "_glossary_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__glossary_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__glossary_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_glossary_v_locales" (
  	"version_term" varchar,
  	"version_full_name" varchar,
  	"version_definition" varchar,
  	"version_formula" varchar,
  	"version_example" varchar,
  	"version_why_it_matters" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_glossary_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"glossary_id" integer,
  	"categories_id" integer
  );
  
  CREATE TABLE "notes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"stage" "enum_notes_stage" DEFAULT 'idea',
  	"date" timestamp(3) with time zone,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_notes_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "notes_locales" (
  	"title" varchar,
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "notes_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer
  );
  
  CREATE TABLE "_notes_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_stage" "enum__notes_v_version_stage" DEFAULT 'idea',
  	"version_date" timestamp(3) with time zone,
  	"version_notes" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__notes_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__notes_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_notes_v_locales" (
  	"version_title" varchar,
  	"version_content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_notes_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "glossary_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "notes_id" integer;
  ALTER TABLE "glossary_locales" ADD CONSTRAINT "glossary_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."glossary"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "glossary_rels" ADD CONSTRAINT "glossary_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."glossary"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "glossary_rels" ADD CONSTRAINT "glossary_rels_glossary_fk" FOREIGN KEY ("glossary_id") REFERENCES "public"."glossary"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "glossary_rels" ADD CONSTRAINT "glossary_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_glossary_v" ADD CONSTRAINT "_glossary_v_parent_id_glossary_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."glossary"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_glossary_v_locales" ADD CONSTRAINT "_glossary_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_glossary_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_glossary_v_rels" ADD CONSTRAINT "_glossary_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_glossary_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_glossary_v_rels" ADD CONSTRAINT "_glossary_v_rels_glossary_fk" FOREIGN KEY ("glossary_id") REFERENCES "public"."glossary"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_glossary_v_rels" ADD CONSTRAINT "_glossary_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "notes_locales" ADD CONSTRAINT "notes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "notes_rels" ADD CONSTRAINT "notes_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "notes_rels" ADD CONSTRAINT "notes_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_notes_v" ADD CONSTRAINT "_notes_v_parent_id_notes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."notes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_notes_v_locales" ADD CONSTRAINT "_notes_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_notes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_notes_v_rels" ADD CONSTRAINT "_notes_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_notes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_notes_v_rels" ADD CONSTRAINT "_notes_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "glossary_slug_idx" ON "glossary" USING btree ("slug");
  CREATE INDEX "glossary_updated_at_idx" ON "glossary" USING btree ("updated_at");
  CREATE INDEX "glossary_created_at_idx" ON "glossary" USING btree ("created_at");
  CREATE INDEX "glossary__status_idx" ON "glossary" USING btree ("_status");
  CREATE UNIQUE INDEX "glossary_locales_locale_parent_id_unique" ON "glossary_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "glossary_rels_order_idx" ON "glossary_rels" USING btree ("order");
  CREATE INDEX "glossary_rels_parent_idx" ON "glossary_rels" USING btree ("parent_id");
  CREATE INDEX "glossary_rels_path_idx" ON "glossary_rels" USING btree ("path");
  CREATE INDEX "glossary_rels_glossary_id_idx" ON "glossary_rels" USING btree ("glossary_id");
  CREATE INDEX "glossary_rels_categories_id_idx" ON "glossary_rels" USING btree ("categories_id");
  CREATE INDEX "_glossary_v_parent_idx" ON "_glossary_v" USING btree ("parent_id");
  CREATE INDEX "_glossary_v_version_version_slug_idx" ON "_glossary_v" USING btree ("version_slug");
  CREATE INDEX "_glossary_v_version_version_updated_at_idx" ON "_glossary_v" USING btree ("version_updated_at");
  CREATE INDEX "_glossary_v_version_version_created_at_idx" ON "_glossary_v" USING btree ("version_created_at");
  CREATE INDEX "_glossary_v_version_version__status_idx" ON "_glossary_v" USING btree ("version__status");
  CREATE INDEX "_glossary_v_created_at_idx" ON "_glossary_v" USING btree ("created_at");
  CREATE INDEX "_glossary_v_updated_at_idx" ON "_glossary_v" USING btree ("updated_at");
  CREATE INDEX "_glossary_v_snapshot_idx" ON "_glossary_v" USING btree ("snapshot");
  CREATE INDEX "_glossary_v_published_locale_idx" ON "_glossary_v" USING btree ("published_locale");
  CREATE INDEX "_glossary_v_latest_idx" ON "_glossary_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_glossary_v_locales_locale_parent_id_unique" ON "_glossary_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_glossary_v_rels_order_idx" ON "_glossary_v_rels" USING btree ("order");
  CREATE INDEX "_glossary_v_rels_parent_idx" ON "_glossary_v_rels" USING btree ("parent_id");
  CREATE INDEX "_glossary_v_rels_path_idx" ON "_glossary_v_rels" USING btree ("path");
  CREATE INDEX "_glossary_v_rels_glossary_id_idx" ON "_glossary_v_rels" USING btree ("glossary_id");
  CREATE INDEX "_glossary_v_rels_categories_id_idx" ON "_glossary_v_rels" USING btree ("categories_id");
  CREATE UNIQUE INDEX "notes_slug_idx" ON "notes" USING btree ("slug");
  CREATE INDEX "notes_updated_at_idx" ON "notes" USING btree ("updated_at");
  CREATE INDEX "notes_created_at_idx" ON "notes" USING btree ("created_at");
  CREATE INDEX "notes__status_idx" ON "notes" USING btree ("_status");
  CREATE UNIQUE INDEX "notes_locales_locale_parent_id_unique" ON "notes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "notes_rels_order_idx" ON "notes_rels" USING btree ("order");
  CREATE INDEX "notes_rels_parent_idx" ON "notes_rels" USING btree ("parent_id");
  CREATE INDEX "notes_rels_path_idx" ON "notes_rels" USING btree ("path");
  CREATE INDEX "notes_rels_categories_id_idx" ON "notes_rels" USING btree ("categories_id");
  CREATE INDEX "_notes_v_parent_idx" ON "_notes_v" USING btree ("parent_id");
  CREATE INDEX "_notes_v_version_version_slug_idx" ON "_notes_v" USING btree ("version_slug");
  CREATE INDEX "_notes_v_version_version_updated_at_idx" ON "_notes_v" USING btree ("version_updated_at");
  CREATE INDEX "_notes_v_version_version_created_at_idx" ON "_notes_v" USING btree ("version_created_at");
  CREATE INDEX "_notes_v_version_version__status_idx" ON "_notes_v" USING btree ("version__status");
  CREATE INDEX "_notes_v_created_at_idx" ON "_notes_v" USING btree ("created_at");
  CREATE INDEX "_notes_v_updated_at_idx" ON "_notes_v" USING btree ("updated_at");
  CREATE INDEX "_notes_v_snapshot_idx" ON "_notes_v" USING btree ("snapshot");
  CREATE INDEX "_notes_v_published_locale_idx" ON "_notes_v" USING btree ("published_locale");
  CREATE INDEX "_notes_v_latest_idx" ON "_notes_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_notes_v_locales_locale_parent_id_unique" ON "_notes_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_notes_v_rels_order_idx" ON "_notes_v_rels" USING btree ("order");
  CREATE INDEX "_notes_v_rels_parent_idx" ON "_notes_v_rels" USING btree ("parent_id");
  CREATE INDEX "_notes_v_rels_path_idx" ON "_notes_v_rels" USING btree ("path");
  CREATE INDEX "_notes_v_rels_categories_id_idx" ON "_notes_v_rels" USING btree ("categories_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_glossary_fk" FOREIGN KEY ("glossary_id") REFERENCES "public"."glossary"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_notes_fk" FOREIGN KEY ("notes_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_glossary_id_idx" ON "payload_locked_documents_rels" USING btree ("glossary_id");
  CREATE INDEX "payload_locked_documents_rels_notes_id_idx" ON "payload_locked_documents_rels" USING btree ("notes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "glossary" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "glossary_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "glossary_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_glossary_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_glossary_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_glossary_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "notes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "notes_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "notes_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_notes_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_notes_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_notes_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "glossary" CASCADE;
  DROP TABLE "glossary_locales" CASCADE;
  DROP TABLE "glossary_rels" CASCADE;
  DROP TABLE "_glossary_v" CASCADE;
  DROP TABLE "_glossary_v_locales" CASCADE;
  DROP TABLE "_glossary_v_rels" CASCADE;
  DROP TABLE "notes" CASCADE;
  DROP TABLE "notes_locales" CASCADE;
  DROP TABLE "notes_rels" CASCADE;
  DROP TABLE "_notes_v" CASCADE;
  DROP TABLE "_notes_v_locales" CASCADE;
  DROP TABLE "_notes_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_glossary_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_notes_fk";
  
  DROP INDEX "payload_locked_documents_rels_glossary_id_idx";
  DROP INDEX "payload_locked_documents_rels_notes_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "glossary_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "notes_id";
  DROP TYPE "public"."enum_glossary_status";
  DROP TYPE "public"."enum__glossary_v_version_status";
  DROP TYPE "public"."enum__glossary_v_published_locale";
  DROP TYPE "public"."enum_notes_stage";
  DROP TYPE "public"."enum_notes_status";
  DROP TYPE "public"."enum__notes_v_version_stage";
  DROP TYPE "public"."enum__notes_v_version_status";
  DROP TYPE "public"."enum__notes_v_published_locale";`)
}
