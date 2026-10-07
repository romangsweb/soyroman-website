import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "projects_outcomes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"metric" varchar NOT NULL,
  	"before" varchar,
  	"after" varchar NOT NULL,
  	"impact" varchar
  );
  
  CREATE TABLE "projects_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "projects_phases" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"duration" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "projects_architecture_columns_nodes" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"note" varchar
  );
  
  CREATE TABLE "projects_architecture_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL
  );
  
  ALTER TABLE "projects_locales" ADD COLUMN "summary" varchar;
  ALTER TABLE "projects_locales" ADD COLUMN "role" varchar;
  ALTER TABLE "projects_locales" ADD COLUMN "duration" varchar;
  ALTER TABLE "projects_locales" ADD COLUMN "team" varchar;
  ALTER TABLE "projects_locales" ADD COLUMN "architecture_caption" varchar;
  ALTER TABLE "projects_outcomes" ADD CONSTRAINT "projects_outcomes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_highlights" ADD CONSTRAINT "projects_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_phases" ADD CONSTRAINT "projects_phases_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_architecture_columns_nodes" ADD CONSTRAINT "projects_architecture_columns_nodes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_architecture_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_architecture_columns" ADD CONSTRAINT "projects_architecture_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "projects_outcomes_order_idx" ON "projects_outcomes" USING btree ("_order");
  CREATE INDEX "projects_outcomes_parent_id_idx" ON "projects_outcomes" USING btree ("_parent_id");
  CREATE INDEX "projects_outcomes_locale_idx" ON "projects_outcomes" USING btree ("_locale");
  CREATE INDEX "projects_highlights_order_idx" ON "projects_highlights" USING btree ("_order");
  CREATE INDEX "projects_highlights_parent_id_idx" ON "projects_highlights" USING btree ("_parent_id");
  CREATE INDEX "projects_highlights_locale_idx" ON "projects_highlights" USING btree ("_locale");
  CREATE INDEX "projects_phases_order_idx" ON "projects_phases" USING btree ("_order");
  CREATE INDEX "projects_phases_parent_id_idx" ON "projects_phases" USING btree ("_parent_id");
  CREATE INDEX "projects_phases_locale_idx" ON "projects_phases" USING btree ("_locale");
  CREATE INDEX "projects_architecture_columns_nodes_order_idx" ON "projects_architecture_columns_nodes" USING btree ("_order");
  CREATE INDEX "projects_architecture_columns_nodes_parent_id_idx" ON "projects_architecture_columns_nodes" USING btree ("_parent_id");
  CREATE INDEX "projects_architecture_columns_nodes_locale_idx" ON "projects_architecture_columns_nodes" USING btree ("_locale");
  CREATE INDEX "projects_architecture_columns_order_idx" ON "projects_architecture_columns" USING btree ("_order");
  CREATE INDEX "projects_architecture_columns_parent_id_idx" ON "projects_architecture_columns" USING btree ("_parent_id");
  CREATE INDEX "projects_architecture_columns_locale_idx" ON "projects_architecture_columns" USING btree ("_locale");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "projects_outcomes" CASCADE;
  DROP TABLE "projects_highlights" CASCADE;
  DROP TABLE "projects_phases" CASCADE;
  DROP TABLE "projects_architecture_columns_nodes" CASCADE;
  DROP TABLE "projects_architecture_columns" CASCADE;
  ALTER TABLE "projects_locales" DROP COLUMN "summary";
  ALTER TABLE "projects_locales" DROP COLUMN "role";
  ALTER TABLE "projects_locales" DROP COLUMN "duration";
  ALTER TABLE "projects_locales" DROP COLUMN "team";
  ALTER TABLE "projects_locales" DROP COLUMN "architecture_caption";`)
}
