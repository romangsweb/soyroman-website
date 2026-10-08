import { recordToolRun } from '@/actions/lead'
import { AuditError, normalizeDomain } from '@/lib/aeoAudit'
import { runAiRecommend, type Market } from '@/lib/aiRecommend'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// El techo real es la cuota gratuita de Gemini (proyecto sin facturación). Esto reparte el uso entre visitantes.
const byIp = new Map<string, number[]>()
const byEmail = new Map<string, number>()
const cache = new Map<string, { at: number; data: unknown }>()
const DAY = 24 * 60 * 60 * 1000
const MAX_IP_DAY = 3
const CACHE_MS = 7 * DAY
const MARKETS: Market[] = ['México', 'Latinoamérica', 'España']
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon'
  const now = Date.now()
  const body = await req.json().catch(() => ({}))
  if (String(body?.sr_trap || '')) return Response.json({ error: 'No se pudo completar.' }, { status: 400 })

  const email = String(body?.email || '').trim().toLowerCase().slice(0, 200)
  const service = String(body?.service || '').replace(/\s+/g, ' ').trim().slice(0, 80)
  const brand = String(body?.brand || '').replace(/\s+/g, ' ').trim().slice(0, 60)
  const market: Market = MARKETS.includes(body?.market) ? body.market : 'México'
  let domain: string
  try {
    domain = normalizeDomain(String(body?.domain || ''))
  } catch (e) {
    return Response.json({ error: e instanceof AuditError ? e.message : 'Dominio no válido.' }, { status: 400 })
  }
  if (!EMAIL.test(email)) return Response.json({ error: 'Escribe tu correo para recibir el diagnóstico.' }, { status: 400 })
  if (service.length < 4) return Response.json({ error: 'Describe tu servicio en pocas palabras (ej. "consultoría de CRM").' }, { status: 400 })

  const ck = [domain, brand.toLowerCase(), service.toLowerCase(), market].join('|')
  const hit = cache.get(ck)
  if (hit && now - hit.at < CACHE_MS) return Response.json(hit.data)

  const recent = (byIp.get(ip) || []).filter((t) => now - t < DAY)
  const last = byEmail.get(email)
  if (recent.length >= MAX_IP_DAY || (last && now - last < DAY)) {
    return Response.json({ error: 'Ya corriste tu diagnóstico de hoy. Vuelve mañana o escríbeme a contacto@soyroman.com.' }, { status: 429 })
  }
  byIp.set(ip, [...recent, now])
  byEmail.set(email, now)
  if (byIp.size > 5000) byIp.clear()
  if (byEmail.size > 5000) byEmail.clear()

  try {
    const data = await runAiRecommend(domain, brand, service, market)
    cache.set(ck, { at: now, data })
    if (cache.size > 300) cache.delete(cache.keys().next().value as string)
    // El lead no bloquea el resultado si HubSpot falla
    await recordToolRun(email, '¿Te recomienda la IA?', `Dominio: ${domain}\nServicio: ${service} (${market})\nMenciones: ${data.mentions}/5\nCompetidores: ${data.rivals.map((r) => r.domain).join(', ') || '—'}`, {
      slug: 'te-recomienda-la-ia',
      domain,
      score: (data.mentions / Math.max(1, data.answers.filter((a) => !a.failed).length)) * 100,
      finding: data.findings[0]?.title,
    }).catch(() => null)
    return Response.json(data)
  } catch (e) {
    byEmail.delete(email) // si falló, no le cuenta como su diagnóstico del día
    const msg = e instanceof AuditError ? e.message : 'No pude completar el diagnóstico. Intenta de nuevo en unos minutos.'
    if (!(e instanceof AuditError)) console.error('[ai-recommend]', domain, e)
    return Response.json({ error: msg }, { status: 422 })
  }
}
