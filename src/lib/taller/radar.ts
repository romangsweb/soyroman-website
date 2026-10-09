import { and, desc, eq, gte, isNull, lt, or, sql } from 'drizzle-orm'

import { getDb } from '@/db'
import { companyProfile, radarSnapshot, user as userTable, type RadarSnapshot } from '@/db/schema'
import { AuditError, normalizeDomain } from '@/lib/aeoAudit'
import { runAiRecommend } from '@/lib/aiRecommend'
import { marketFor, type ProfileData } from './profile'
import { sendRadarAlert } from './radarEmail'

/*
 * Radar de IA mensual: corre "¿Te recomienda la IA?" con el dominio y el servicio del perfil, guarda la foto
 * y avisa por correo si algo cambió (y la persona tiene los avisos encendidos).
 */

export const RADAR_EVERY_DAYS = 30

export type RadarChange = { kind: 'up' | 'down' | 'first' | 'lost' | 'rival'; text: string }

export function radarReady(p: ProfileData | undefined) {
  return !!(p?.domain && p?.service && p.service.trim().length >= 4)
}

/** Qué cambió entre dos corridas (la nueva primero). */
export function radarChanges(now: RadarSnapshot, prev: RadarSnapshot | undefined): RadarChange[] {
  if (!prev) return []
  const out: RadarChange[] = []
  if (prev.mentions === 0 && now.mentions > 0) out.push({ kind: 'first', text: `La IA empezó a mencionarte: ${now.mentions} de ${now.answered} respuestas.` })
  else if (now.mentions === 0 && prev.mentions > 0) out.push({ kind: 'lost', text: `La IA dejó de mencionarte (antes: ${prev.mentions} de ${prev.answered}).` })
  else if (now.mentions > prev.mentions) out.push({ kind: 'up', text: `Subiste de ${prev.mentions} a ${now.mentions} menciones.` })
  else if (now.mentions < prev.mentions) out.push({ kind: 'down', text: `Bajaste de ${prev.mentions} a ${now.mentions} menciones.` })
  const before = new Set(prev.rivals.map((r) => r.domain))
  const fresh = now.rivals.filter((r) => !before.has(r.domain)).slice(0, 3)
  if (fresh.length) out.push({ kind: 'rival', text: `Competidor${fresh.length > 1 ? 'es' : ''} nuevo${fresh.length > 1 ? 's' : ''} en las respuestas: ${fresh.map((r) => r.domain).join(', ')}.` })
  return out
}

/** Últimas corridas de una cuenta (la más reciente primero). */
export function radarHistory(userId: string, limit = 12) {
  return getDb().select().from(radarSnapshot).where(eq(radarSnapshot.userId, userId)).orderBy(desc(radarSnapshot.createdAt)).limit(limit)
}

/** Corre el radar para una cuenta y guarda la foto. Lanza AuditError si Gemini no responde o no hay cuota. */
export async function runRadar(u: { id: string; email: string }, p: ProfileData, alerts: boolean, trigger: 'cron' | 'manual') {
  const domain = normalizeDomain(p.domain!)
  const service = p.service!.trim().slice(0, 80)
  const market = marketFor(p.country)
  const r = await runAiRecommend(domain, '', service, market)
  const answered = r.answers.filter((a) => !a.failed).length
  const result = { ...r, answers: r.answers.map((a) => ({ ...a, text: a.text.slice(0, 1200) })) }
  const [prev] = await radarHistory(u.id, 1)
  const [snap] = await getDb()
    .insert(radarSnapshot)
    .values({ userId: u.id, domain, service, market, mentions: r.mentions, answered, rivals: r.rivals, result: result as unknown as Record<string, unknown>, trigger })
    .returning()
  const changes = radarChanges(snap, prev)
  if (alerts && changes.length) await sendRadarAlert(u.email, snap, changes).catch((e) => console.warn('[radar] no se pudo enviar el aviso', e instanceof Error ? e.message : e))
  return { snap, changes }
}

/**
 * Lote diario del cron: cuentas con dominio y servicio en su perfil cuya última corrida tiene 30 días o más.
 * Pocas por día para no pasar la cuota gratuita de Gemini; se detiene al primer error de cuota.
 */
export async function runRadarBatch(max = 3, budgetMs = 45_000) {
  const t0 = Date.now()
  const db = getDb()
  const last = db
    .select({ userId: radarSnapshot.userId, at: sql<Date>`max(${radarSnapshot.createdAt})`.as('at') })
    .from(radarSnapshot)
    .groupBy(radarSnapshot.userId)
    .as('last')
  const due = await db
    .select({ id: userTable.id, email: userTable.email, data: companyProfile.data, alerts: companyProfile.consentAlerts })
    .from(companyProfile)
    .innerJoin(userTable, eq(userTable.id, companyProfile.userId))
    .leftJoin(last, eq(last.userId, companyProfile.userId))
    .where(and(sql`${companyProfile.data}->>'domain' is not null`, sql`length(coalesce(${companyProfile.data}->>'service', '')) >= 4`, or(isNull(last.at), lt(last.at, sql`now() - make_interval(days => ${RADAR_EVERY_DAYS})`))))
    .orderBy(sql`${last.at} asc nulls first`)
    .limit(max)

  const done: { email: string; mentions?: number; changes?: number; error?: string }[] = []
  for (const u of due) {
    if (Date.now() - t0 > budgetMs) break
    try {
      const { snap, changes } = await runRadar(u, u.data as ProfileData, u.alerts, 'cron')
      done.push({ email: u.email, mentions: snap.mentions, changes: changes.length })
    } catch (e) {
      done.push({ email: u.email, error: e instanceof Error ? e.message : String(e) })
      if (e instanceof AuditError && /cuota/i.test(e.message)) break
    }
  }
  return { due: due.length, done }
}

/** ¿Puede correrlo a mano? Una vez cada 30 días. */
export async function canRunNow(userId: string) {
  const [recent] = await getDb()
    .select({ at: radarSnapshot.createdAt })
    .from(radarSnapshot)
    .where(and(eq(radarSnapshot.userId, userId), gte(radarSnapshot.createdAt, sql`now() - make_interval(days => ${RADAR_EVERY_DAYS})`)))
    .orderBy(desc(radarSnapshot.createdAt))
    .limit(1)
  return recent ? { ok: false as const, next: new Date(recent.at.getTime() + RADAR_EVERY_DAYS * 86_400_000) } : { ok: true as const }
}
