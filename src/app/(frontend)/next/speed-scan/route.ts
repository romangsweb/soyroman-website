import { AuditError, normalizeDomain } from '@/lib/aeoAudit'
import { cruxField, psiLab, type Strategy } from '@/lib/speedScan'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Dos pasos por medición: `field` (CrUX, rápido) y `lab` (PageSpeed, lento). Límite y caché en memoria de la instancia.
const hits = new Map<string, number[]>()
const cache = new Map<string, { at: number; data: unknown }>()
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 8
const CACHE_MS = 60 * 60 * 1000

export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon'
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) return Response.json({ error: 'Demasiadas mediciones seguidas. Espera un minuto.' }, { status: 429 })
  hits.set(ip, [...recent, now])
  if (hits.size > 5000) hits.clear()

  let domain: string
  const body = await req.json().catch(() => ({}))
  const strategy: Strategy = body?.strategy === 'desktop' ? 'desktop' : 'mobile'
  const part = body?.part === 'lab' ? 'lab' : 'field'
  try {
    domain = normalizeDomain(String(body?.domain || ''))
  } catch (e) {
    return Response.json({ error: e instanceof AuditError ? e.message : 'Dominio no válido.' }, { status: 400 })
  }
  const ck = `${part}:${strategy}:${domain}`
  const hit = cache.get(ck)
  if (hit && now - hit.at < CACHE_MS) return Response.json(hit.data)
  try {
    const data = part === 'field'
      ? { domain, strategy, field: await cruxField(domain, strategy) }
      : { domain, strategy, lab: await psiLab(domain, strategy) }
    cache.set(ck, { at: now, data })
    if (cache.size > 500) cache.delete(cache.keys().next().value as string)
    return Response.json(data)
  } catch (e) {
    const msg = e instanceof AuditError ? e.message : 'No pude medir ese sitio. Intenta de nuevo.'
    if (!(e instanceof AuditError)) console.error('[speed-scan]', part, domain, e)
    return Response.json({ error: msg }, { status: 422 })
  }
}
