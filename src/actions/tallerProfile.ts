'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { z } from 'zod'

import { getDb } from '@/db'
import { companyProfile, user as userTable } from '@/db/schema'
import { currentUser } from '@/lib/auth'
import { markContact } from '@/lib/hubspotRecord'
import { FIELDS, INDUSTRIES, SIZES, type ProfileData } from '@/lib/taller/profile'

/*
 * Perfil de empresa y cuenta de Mi taller. Todo actúa solo sobre el usuario de la sesión.
 */

const shape: Record<string, z.ZodType> = {}
for (const f of FIELDS) {
  if (f.kind === 'text') shape[f.id] = z.string().trim().max(f.max).optional()
  else if (f.kind === 'select') shape[f.id] = z.enum(INDUSTRIES).optional()
  else if (f.kind === 'size') shape[f.id] = z.number().int().min(0).max(SIZES.length - 1).optional()
  else if (f.kind === 'model') shape[f.id] = z.enum(['rec', 'prj']).optional()
  else shape[f.id] = z.number().min(f.min).max(f.max).optional()
}
const ProfileIn = z.object({
  data: z.object(shape).strict(),
  consentBenchmarks: z.boolean(),
  consentAlerts: z.boolean(),
})

export type ProfileRecord = { data: ProfileData; consentBenchmarks: boolean; consentAlerts: boolean }

/** Perfil del usuario de la sesión (null sin sesión o sin perfil). Lo usan las herramientas para precargar. */
export async function getMyProfile(): Promise<ProfileRecord | null> {
  const u = await currentUser().catch(() => null)
  if (!u) return null
  const [row] = await getDb().select().from(companyProfile).where(eq(companyProfile.userId, u.id)).limit(1)
  return row ? { data: row.data as ProfileData, consentBenchmarks: row.consentBenchmarks, consentAlerts: row.consentAlerts } : null
}

export async function saveProfile(raw: unknown): Promise<{ ok: boolean; reason?: 'auth' | 'invalid' | 'error' }> {
  const u = await currentUser().catch(() => null)
  if (!u) return { ok: false, reason: 'auth' }
  const p = ProfileIn.safeParse(raw)
  if (!p.success) return { ok: false, reason: 'invalid' }
  const data = Object.fromEntries(Object.entries(p.data.data).filter(([, v]) => v !== undefined && v !== '')) as ProfileData
  try {
    await getDb()
      .insert(companyProfile)
      .values({ userId: u.id, data, consentBenchmarks: p.data.consentBenchmarks, consentAlerts: p.data.consentAlerts })
      .onConflictDoUpdate({
        target: companyProfile.userId,
        set: { data, consentBenchmarks: p.data.consentBenchmarks, consentAlerts: p.data.consentAlerts, updatedAt: new Date() },
      })
    // HubSpot recibe solo el resumen; el detalle vive en la base del taller
    const props: Record<string, string> = {}
    if (data.industry) props.sr_industria = data.industry
    if (data.size !== undefined) props.sr_tamano_empresa = SIZES[data.size]
    if (data.domain) props.website = data.domain
    after(() => markContact(u.email, props))
    revalidatePath('/taller')
    revalidatePath('/taller/perfil')
    return { ok: true }
  } catch (err) {
    console.warn('[taller] no se pudo guardar el perfil', err instanceof Error ? err.message : err)
    return { ok: false, reason: 'error' }
  }
}

/** Borra la cuenta y todo lo guardado (perfil, corridas, sesiones). No se puede deshacer. */
export async function deleteAccount(): Promise<{ ok: boolean }> {
  const u = await currentUser().catch(() => null)
  if (!u) return { ok: false }
  try {
    await getDb().delete(userTable).where(eq(userTable.id, u.id))
    return { ok: true }
  } catch (err) {
    console.warn('[taller] no se pudo borrar la cuenta', err instanceof Error ? err.message : err)
    return { ok: false }
  }
}
