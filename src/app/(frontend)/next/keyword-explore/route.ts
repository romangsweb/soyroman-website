import { AuditError } from '@/lib/aeoAudit'
import { COUNTRIES, runExplore, type Country } from '@/lib/keywordExplore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const hits = new Map<string, number[]>()
const cache = new Map<string, { at: number; data: unknown }>()
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 5
const CACHE_MS = 7 * 24 * 60 * 60 * 1000

export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon'
  const now = Date.now()
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) return Response.json({ error: 'Demasiadas búsquedas seguidas. Espera un minuto.' }, { status: 429 })
  hits.set(ip, [...recent, now])
  if (hits.size > 5000) hits.clear()

  const body = await req.json().catch(() => ({}))
  const seed = String(body?.seed || '').replace(/\s+/g, ' ').trim().toLowerCase()
  const country: Country = body?.country in COUNTRIES ? body.country : 'mx'
  if (seed.length < 2 || seed.length > 60 || !/^[\p{L}\p{N} .&+-]+$/u.test(seed)) {
    return Response.json({ error: 'Escribe una palabra o frase corta (2 a 60 caracteres).' }, { status: 400 })
  }
  const ck = `${country}:${seed}`
  const hit = cache.get(ck)
  if (hit && now - hit.at < CACHE_MS) return Response.json(hit.data)
  try {
    const data = await runExplore(seed, country)
    // Sin agrupación de Gemini el resultado se guarda poco tiempo, para reintentar pronto
    cache.set(ck, { at: data.grouped ? now : now - CACHE_MS + 10 * 60 * 1000, data })
    if (cache.size > 500) cache.delete(cache.keys().next().value as string)
    return Response.json(data)
  } catch (e) {
    const msg = e instanceof AuditError ? e.message : 'No pude completar la exploración. Intenta de nuevo.'
    if (!(e instanceof AuditError)) console.error('[keyword-explore]', seed, e)
    return Response.json({ error: msg }, { status: 422 })
  }
}
