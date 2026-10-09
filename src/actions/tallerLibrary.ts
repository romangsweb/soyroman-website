'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getDb } from '@/db'
import { savedItem } from '@/db/schema'
import { currentUser } from '@/lib/auth'

/* Biblioteca de Mi taller: guardar y marcar como leídos posts y términos del glosario. Solo sobre el usuario de la sesión. */

const Item = z.object({
  kind: z.enum(['post', 'term']),
  slug: z.string().regex(/^[a-z0-9-]{1,120}$/),
  title: z.string().trim().max(200),
})

type State = { saved: boolean; read: boolean }

/** Estado de un artículo en la biblioteca (null sin sesión). */
export async function libraryState(raw: unknown): Promise<State | null> {
  const u = await currentUser().catch(() => null)
  if (!u) return null
  const p = Item.pick({ kind: true, slug: true }).safeParse(raw)
  if (!p.success) return null
  const [row] = await getDb()
    .select()
    .from(savedItem)
    .where(and(eq(savedItem.userId, u.id), eq(savedItem.kind, p.data.kind), eq(savedItem.slug, p.data.slug)))
    .limit(1)
  return { saved: !!row?.savedAt, read: !!row?.readAt }
}

/** Guarda o quita de la biblioteca. */
export async function toggleSaved(raw: unknown): Promise<{ ok: true; saved: boolean } | { ok: false; reason: 'auth' | 'invalid' | 'error' }> {
  const u = await currentUser().catch(() => null)
  if (!u) return { ok: false, reason: 'auth' }
  const p = Item.safeParse(raw)
  if (!p.success) return { ok: false, reason: 'invalid' }
  try {
    const db = getDb()
    const where = and(eq(savedItem.userId, u.id), eq(savedItem.kind, p.data.kind), eq(savedItem.slug, p.data.slug))
    const [row] = await db.select().from(savedItem).where(where).limit(1)
    const saved = !row?.savedAt
    if (row) await db.update(savedItem).set({ savedAt: saved ? new Date() : null, title: p.data.title || row.title }).where(where)
    else await db.insert(savedItem).values({ userId: u.id, ...p.data, savedAt: new Date() })
    revalidatePath('/taller/biblioteca')
    return { ok: true, saved }
  } catch {
    return { ok: false, reason: 'error' }
  }
}

/** Marca como leído (lo llama la página tras un rato de lectura). */
export async function markRead(raw: unknown): Promise<void> {
  const u = await currentUser().catch(() => null)
  if (!u) return
  const p = Item.safeParse(raw)
  if (!p.success) return
  await getDb()
    .insert(savedItem)
    .values({ userId: u.id, ...p.data, readAt: new Date() })
    .onConflictDoUpdate({ target: [savedItem.userId, savedItem.kind, savedItem.slug], set: { readAt: new Date(), title: p.data.title } })
    .catch(() => {})
}

/** Quita un artículo de la biblioteca por completo (guardado y leído). */
export async function forgetItem(id: string): Promise<void> {
  const u = await currentUser().catch(() => null)
  if (!u || !z.uuid().safeParse(id).success) return
  await getDb().delete(savedItem).where(and(eq(savedItem.id, id), eq(savedItem.userId, u.id))).catch(() => {})
  revalidatePath('/taller/biblioteca')
}
