import { and, desc, eq, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { savedItem, toolRun } from '@/db/schema'

/*
 * Lecturas del taller, solo servidor. No van en src/actions: todo lo exportado desde un archivo
 * 'use server' se puede llamar desde el navegador, y estas funciones reciben el id de usuario.
 */

/** Corridas de una herramienta, de la más reciente a la más vieja. */
export function runsFor(userId: string, slug: string, limit = 50) {
  return getDb()
    .select()
    .from(toolRun)
    .where(and(eq(toolRun.userId, userId), eq(toolRun.toolSlug, slug)))
    .orderBy(desc(toolRun.createdAt))
    .limit(limit)
}

/** Última corrida y total por herramienta, para las tarjetas del panel. */
export async function lastRunPerTool(userId: string) {
  const rows = await getDb()
    .selectDistinctOn([toolRun.toolSlug], {
      slug: toolRun.toolSlug,
      metrics: toolRun.metrics,
      label: toolRun.label,
      createdAt: toolRun.createdAt,
      total: sql<number>`count(*) over (partition by ${toolRun.toolSlug})`.mapWith(Number),
    })
    .from(toolRun)
    .where(eq(toolRun.userId, userId))
    .orderBy(toolRun.toolSlug, desc(toolRun.createdAt))
  return rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

/** Biblioteca: guardados y leídos, del más reciente al más viejo. */
export async function libraryFor(userId: string) {
  const rows = await getDb().select().from(savedItem).where(eq(savedItem.userId, userId))
  const saved = rows.filter((r) => r.savedAt).sort((a, b) => b.savedAt!.getTime() - a.savedAt!.getTime())
  const read = rows.filter((r) => r.readAt).sort((a, b) => b.readAt!.getTime() - a.readAt!.getTime())
  return { saved, read, readPosts: new Set(read.filter((r) => r.kind === 'post').map((r) => r.slug)) }
}
