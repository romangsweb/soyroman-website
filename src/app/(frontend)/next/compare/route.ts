import { AuditError, normalizeDomain } from '@/lib/aeoAudit'
import { runCompare } from '@/lib/compare'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Cada comparación hace hasta 3 auditorías completas: límite más bajo que las otras herramientas
const hits = new Map<string, number[]>()
const cache = new Map<string, { at: number; data: unknown }>()
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 3
const CACHE_MS = 60 * 60 * 1000

export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon'
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) return Response.json({ error: 'Demasiadas comparaciones seguidas. Espera un minuto.' }, { status: 429 })
  hits.set(ip, [...recent, now])
  if (hits.size > 5000) hits.clear()

  let domains: string[]
  try {
    const body = await req.json().catch(() => ({}))
    const raw = (Array.isArray(body?.domains) ? body.domains : []).map((d: unknown) => String(d || '').trim()).filter(Boolean).slice(0, 3)
    domains = [...new Set(raw.map((d: string) => normalizeDomain(d)))] as string[]
  } catch (e) {
    return Response.json({ error: e instanceof AuditError ? e.message : 'Algún dominio no es válido.' }, { status: 400 })
  }
  if (domains.length < 2) return Response.json({ error: 'Escribe tu dominio y al menos un competidor.' }, { status: 400 })

  const ck = domains.join('|')
  const hit = cache.get(ck)
  if (hit && now - hit.at < CACHE_MS) return Response.json(hit.data)
  try {
    const data = await runCompare(domains)
    if (data.sides[0].error) return Response.json({ error: `${domains[0]}: ${data.sides[0].error}` }, { status: 422 })
    cache.set(ck, { at: now, data })
    if (cache.size > 300) cache.delete(cache.keys().next().value as string)
    return Response.json(data)
  } catch (e) {
    console.error('[compare]', ck, e)
    return Response.json({ error: 'No pude completar la comparación. Intenta de nuevo.' }, { status: 422 })
  }
}
