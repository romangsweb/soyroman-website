import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_expertise_skills_level" AS ENUM('1', '2', '3', '4', '5');
  CREATE TABLE "expertise_skills" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"level" "enum_expertise_skills_level" DEFAULT '3' NOT NULL
  );
  
  CREATE TABLE "expertise_deliverables" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL
  );
  
  ALTER TABLE "expertise_skills" ADD CONSTRAINT "expertise_skills_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."expertise"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "expertise_deliverables" ADD CONSTRAINT "expertise_deliverables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."expertise"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "expertise_skills_order_idx" ON "expertise_skills" USING btree ("_order");
  CREATE INDEX "expertise_skills_parent_id_idx" ON "expertise_skills" USING btree ("_parent_id");
  CREATE INDEX "expertise_skills_locale_idx" ON "expertise_skills" USING btree ("_locale");
  CREATE INDEX "expertise_deliverables_order_idx" ON "expertise_deliverables" USING btree ("_order");
  CREATE INDEX "expertise_deliverables_parent_id_idx" ON "expertise_deliverables" USING btree ("_parent_id");
  CREATE INDEX "expertise_deliverables_locale_idx" ON "expertise_deliverables" USING btree ("_locale");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "expertise_skills" CASCADE;
  DROP TABLE "expertise_deliverables" CASCADE;
  DROP TYPE "public"."enum_expertise_skills_level";`)
}
