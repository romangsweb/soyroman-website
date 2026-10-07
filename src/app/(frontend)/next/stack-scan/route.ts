import { AuditError, normalizeDomain } from '@/lib/aeoAudit'
import { runStackScan, type StackResult } from '@/lib/stackScan'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Límite por IP y caché por dominio (en memoria de cada instancia; el límite firme va en el firewall de Vercel)
const hits = new Map<string, number[]>()
const cache = new Map<string, { at: number; data: StackResult }>()
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 5
const CACHE_MS = 60 * 60 * 1000

export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon'
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) return Response.json({ error: 'Demasiados análisis seguidos. Espera un minuto.' }, { status: 429 })
  hits.set(ip, [...recent, now])
  if (hits.size > 5000) hits.clear()

  let domain: string
  try {
    const body = await req.json().catch(() => ({}))
    domain = normalizeDomain(String(body?.domain || ''))
  } catch (e) {
    return Response.json({ error: e instanceof AuditError ? e.message : 'Dominio no válido.' }, { status: 400 })
  }
  const hit = cache.get(domain)
  if (hit && now - hit.at < CACHE_MS) return Response.json(hit.data)
  try {
    const data = await runStackScan(domain)
    cache.set(domain, { at: now, data })
    if (cache.size > 500) cache.delete(cache.keys().next().value as string)
    return Response.json(data)
  } catch (e) {
    const msg = e instanceof AuditError ? e.message : 'No pude revisar ese sitio. Intenta de nuevo.'
    if (!(e instanceof AuditError)) console.error('[stack-scan]', domain, e)
    return Response.json({ error: msg }, { status: 422 })
  }
}
