import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "profile" ADD COLUMN "available" boolean DEFAULT true;
  ALTER TABLE "profile" ADD COLUMN "availability_text" varchar DEFAULT 'Aceptando proyectos';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "profile" DROP COLUMN "available";
  ALTER TABLE "profile" DROP COLUMN "availability_text";`)
}
