import { getDb } from '@/db'
import { event } from '@/db/schema'
import { RECURSOS } from '@/data/recursos'
import { currentUser } from '@/lib/auth'
import { EVENT_TYPES, type EventType } from '@/lib/taller/events'

const SITE = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://soyroman.com').replace(/\/$/, '')
const TOOLS = new Set(RECURSOS.filter((r) => r.href).map((r) => r.slug))
const BOT = /bot|crawl|spider|slurp|headless|preview|lighthouse|pagespeed/i
const UUID = /^[0-9a-f-]{36}$/i

/** Recibe un evento de uso. Responde 204 siempre: nunca afecta la página. */
export async function POST(req: Request) {
  const done = new Response(null, { status: 204 })
  try {
    if (!process.env.TALLER_DATABASE_URL) return done
    const origin = req.headers.get('origin')
    if (origin && origin !== SITE) return done
    if (BOT.test(req.headers.get('user-agent') || '')) return done
    const raw = await req.text()
    if (raw.length > 1000) return done
    const b = JSON.parse(raw) as { t?: unknown; p?: unknown; a?: unknown; u?: unknown }
    if (typeof b.t !== 'string' || !(EVENT_TYPES as readonly string[]).includes(b.t)) return done
    const path = typeof b.p === 'string' && b.p.startsWith('/') ? b.p.slice(0, 200) : null
    const m = path?.match(/^\/recursos\/([a-z0-9-]+)/)
    const toolSlug = m && TOOLS.has(m[1]) ? m[1] : null
    const anonId = typeof b.a === 'string' && UUID.test(b.a) ? b.a : null
    const user = b.u === 1 ? await currentUser().catch(() => null) : null
    await getDb().insert(event).values({ type: b.t as EventType, path, toolSlug, anonId, userId: user?.id ?? null })
  } catch {}
  return done
}
