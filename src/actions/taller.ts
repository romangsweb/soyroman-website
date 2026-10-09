'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getDb } from '@/db'
import { toolRun } from '@/db/schema'
import { currentUser } from '@/lib/auth'
import { TALLER_SLUGS } from '@/lib/taller/tools'

/*
 * Mi taller: guardar, reclamar y borrar corridas. Toda escritura exige sesión y valida forma y tamaño.
 */

const RunIn = z.object({
  slug: z.enum(TALLER_SLUGS),
  inputs: z.record(z.string(), z.unknown()),
  metrics: z.record(z.string(), z.number().nullable()),
  summary: z.string().max(4000),
  label: z.string().max(80).optional(),
})
export type RunInput = z.infer<typeof RunIn>

type Result = { ok: true; count: number } | { ok: false; reason: 'auth' | 'invalid' | 'error' }

const MAX_INPUTS = 16_000 // caracteres de JSON por corrida

function clean(raw: unknown): RunInput | null {
  const p = RunIn.safeParse(raw)
  if (!p.success) return null
  if (JSON.stringify(p.data.inputs).length > MAX_INPUTS) return null
  if (Object.keys(p.data.metrics).length > 20) return null
  return p.data
}

async function insert(userId: string, runs: RunInput[]) {
  if (!runs.length) return
  await getDb()
    .insert(toolRun)
    .values(runs.map((r) => ({ userId, toolSlug: r.slug, label: r.label ?? null, inputs: r.inputs, metrics: r.metrics, summary: r.summary })))
}

/** Guarda el resultado actual de una herramienta. */
export async function saveRun(raw: unknown): Promise<Result> {
  const user = await currentUser().catch(() => null)
  if (!user) return { ok: false, reason: 'auth' }
  const run = clean(raw)
  if (!run) return { ok: false, reason: 'invalid' }
  try {
    await insert(user.id, [run])
    revalidatePath('/taller')
    return { ok: true, count: 1 }
  } catch (err) {
    console.warn('[taller] no se pudo guardar', err instanceof Error ? err.message : err)
    return { ok: false, reason: 'error' }
  }
}

/** Sube lo que el visitante guardó en este navegador antes de tener cuenta (máximo 10). */
export async function claimRuns(raw: unknown): Promise<Result> {
  const user = await currentUser().catch(() => null)
  if (!user) return { ok: false, reason: 'auth' }
  if (!Array.isArray(raw)) return { ok: false, reason: 'invalid' }
  const runs = raw.slice(0, 10).map(clean).filter((r): r is RunInput => r !== null)
  try {
    await insert(user.id, runs)
    revalidatePath('/taller')
    return { ok: true, count: runs.length }
  } catch (err) {
    console.warn('[taller] no se pudieron reclamar', err instanceof Error ? err.message : err)
    return { ok: false, reason: 'error' }
  }
}

/** Borra una corrida propia. */
export async function deleteRun(id: string): Promise<Result> {
  const user = await currentUser().catch(() => null)
  if (!user) return { ok: false, reason: 'auth' }
  if (!z.uuid().safeParse(id).success) return { ok: false, reason: 'invalid' }
  try {
    const rows = await getDb()
      .delete(toolRun)
      .where(and(eq(toolRun.id, id), eq(toolRun.userId, user.id)))
      .returning({ slug: toolRun.toolSlug })
    revalidatePath('/taller')
    if (rows[0]) revalidatePath(`/taller/historial/${rows[0].slug}`)
    return { ok: true, count: rows.length }
  } catch {
    return { ok: false, reason: 'error' }
  }
}
