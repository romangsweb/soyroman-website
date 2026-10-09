'use server'

import { revalidatePath } from 'next/cache'

import { getMyProfile } from '@/actions/tallerProfile'
import { AuditError } from '@/lib/aeoAudit'
import { currentUser } from '@/lib/auth'
import { canRunNow, radarReady, runRadar } from '@/lib/taller/radar'

/** "Correr ahora": una vez cada 30 días por cuenta, con el dominio y el servicio del perfil. */
export async function runRadarNow(): Promise<{ ok: true } | { ok: false; message: string }> {
  const u = await currentUser().catch(() => null)
  if (!u) return { ok: false, message: 'Tu sesión venció. Vuelve a entrar.' }
  const profile = await getMyProfile()
  if (!radarReady(profile?.data)) return { ok: false, message: 'Primero llena el dominio y qué vendes en tu perfil de empresa.' }
  const gate = await canRunNow(u.id)
  if (!gate.ok) return { ok: false, message: `Ya corrió este mes. La siguiente corrida es el ${gate.next.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', timeZone: 'America/Mexico_City' })}.` }
  try {
    await runRadar(u, profile!.data, profile!.consentAlerts, 'manual')
    revalidatePath('/taller/radar')
    revalidatePath('/taller')
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof AuditError ? e.message : 'No se pudo correr el radar. Intenta más tarde.' }
  }
}
