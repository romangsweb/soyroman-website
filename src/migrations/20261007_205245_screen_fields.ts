import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" ADD COLUMN "screen_figure" varchar;
  ALTER TABLE "posts" ADD COLUMN "screen_tag" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN "version_screen_figure" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN "version_screen_tag" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts" DROP COLUMN "screen_figure";
  ALTER TABLE "posts" DROP COLUMN "screen_tag";
  ALTER TABLE "_posts_v" DROP COLUMN "version_screen_figure";
  ALTER TABLE "_posts_v" DROP COLUMN "version_screen_tag";`)
}
