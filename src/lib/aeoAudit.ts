// Solo servidor: lo importa la ruta /next/aeo-audit (usa node:dns y node:net)

import dns from 'node:dns/promises'
import net from 'node:net'

/**
 * Auditor AEO: revisa qué tan preparado está un sitio para buscadores con IA.
 * Solo lee 5 recursos públicos (portada como persona y como GPTBot, robots.txt, llms.txt, sitemap)
 * y bloquea cualquier destino privado o local (protección SSRF), también en cada redirección.
 */

export type Status = 'ok' | 'warn' | 'bad'
export type Check = {
  id: string
  group: 'Acceso' | 'Lectura' | 'Estructura'
  label: string
  status: Status
  points: number
  max: number
  detail?: string
  fix?: string
  bots?: { name: string; allowed: boolean }[]
}
export type Audit = { domain: string; url: string; score: number; checks: Check[]; at: string }

const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 soyroman-aeo-audit'
const GPTBOT_UA = 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)'
const AI_BOTS = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended', 'Bingbot']
const MAX_BYTES = 1_500_000
const TIMEOUT_MS = 6000

export class AuditError extends Error {}

// ───────────────────────── Red segura ─────────────────────────
function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number)
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || // CGNAT / Tailscale
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19))
    )
  }
  const v = ip.toLowerCase()
  if (v.startsWith('::ffff:')) return isPrivateIp(v.slice(7))
  return v === '::' || v === '::1' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe8') || v.startsWith('fe9') ||
    v.startsWith('fea') || v.startsWith('feb') || v.startsWith('ff')
}

async function assertPublic(url: URL) {
  if (!['http:', 'https:'].includes(url.protocol)) throw new AuditError('Solo se permiten direcciones http o https.')
  if (url.port && !['80', '443'].includes(url.port)) throw new AuditError('Solo se permiten los puertos estándar.')
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (net.isIP(host)) throw new AuditError('Escribe un dominio, no una IP.')
  if (/^(localhost|.*\.(local|localhost|internal|lan|home|ts\.net))$/i.test(host)) throw new AuditError('Ese dominio no es público.')
  let addrs: { address: string }[]
  try {
    addrs = await dns.lookup(host, { all: true })
  } catch {
    throw new AuditError('No encontré ese dominio.')
  }
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new AuditError('Ese dominio no apunta a una dirección pública.')
}

type Res = { status: number; url: string; text: string; ms: number; type: string }

async function safeFetch(start: string, ua: string, maxHops = 3): Promise<Res> {
  let url = new URL(start)
  const t0 = Date.now()
  for (let hop = 0; hop <= maxHops; hop++) {
    await assertPublic(url)
    const res = await fetch(url, {
      redirect: 'manual',
      headers: { 'User-Agent': ua, Accept: 'text/html,text/plain,application/xml;q=0.9,*/*;q=0.5' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    })
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = new URL(res.headers.get('location')!, url)
      continue
    }
    let text = ''
    if (res.body) {
      const reader = res.body.getReader()
      const chunks: Uint8Array[] = []
      let size = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        chunks.push(value)
        if (size > MAX_BYTES) {
          await reader.cancel()
          break
        }
      }
      text = new TextDecoder().decode(Buffer.concat(chunks.map((c) => Buffer.from(c))))
    }
    return { status: res.status, url: url.toString(), text, ms: Date.now() - t0, type: res.headers.get('content-type') || '' }
  }
  throw new AuditError('Demasiadas redirecciones.')
}

const tryFetch = (u: string, ua = BROWSER_UA) => safeFetch(u, ua).catch(() => null)

// ───────────────────────── Análisis ─────────────────────────
type RobotsGroup = { agents: string[]; rules: { allow: boolean; path: string }[] }

function parseRobots(txt: string) {
  const groups: RobotsGroup[] = []
  const sitemaps: string[] = []
  let cur: RobotsGroup | null = null
  let lastWasAgent = false
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim()
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i)
    if (!m) continue
    const [, k, val] = m
    const key = k.toLowerCase()
    if (key === 'user-agent') {
      if (!cur || !lastWasAgent) groups.push((cur = { agents: [], rules: [] }))
      cur.agents.push(val.trim().toLowerCase())
      lastWasAgent = true
    } else {
      lastWasAgent = false
      if (key === 'sitemap') sitemaps.push(val.trim())
      else if (cur && (key === 'allow' || key === 'disallow')) cur.rules.push({ allow: key === 'allow', path: val.trim() })
    }
  }
  return { groups, sitemaps }
}

function botAllowedRoot(groups: RobotsGroup[], bot: string): boolean {
  const b = bot.toLowerCase()
  const group = groups.find((g) => g.agents.some((a) => a !== '*' && b.includes(a))) || groups.find((g) => g.agents.includes('*'))
  if (!group) return true
  // regla más específica que aplique a "/"
  const hits = group.rules.filter((r) => r.path !== '' && '/'.startsWith(r.path.replace(/\*$/, '')))
  if (!hits.length) return true
  hits.sort((x, y) => y.path.length - x.path.length || Number(y.allow) - Number(x.allow))
  return hits[0].allow
}

const stripTags = (html: string) =>
  html
    .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

function jsonLdTypes(html: string): string[] {
  const types = new Set<string>()
  const walk = (n: any) => {
    if (!n || typeof n !== 'object') return
    if (Array.isArray(n)) return n.forEach(walk)
    const t = n['@type']
    if (typeof t === 'string') types.add(t)
    else if (Array.isArray(t)) t.forEach((x) => typeof x === 'string' && types.add(x))
    Object.values(n).forEach(walk)
  }
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      walk(JSON.parse(m[1].trim()))
    } catch {
      /* JSON-LD inválido: se ignora */
    }
  }
  return [...types]
}

const attr = (html: string, re: RegExp) => html.match(re)?.[1]?.trim() || ''

// ───────────────────────── Auditoría ─────────────────────────
export function normalizeDomain(input: string): string {
  let s = (input || '').trim().toLowerCase()
  if (!s) throw new AuditError('Escribe un dominio.')
  if (!/^https?:\/\//.test(s)) s = `https://${s}`
  let u: URL
  try {
    u = new URL(s)
  } catch {
    throw new AuditError('Ese dominio no es válido.')
  }
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(u.hostname)) throw new AuditError('Ese dominio no es válido.')
  return u.hostname
}

export async function runAudit(domain: string): Promise<Audit> {
  const base = `https://${domain}`
  const home = await safeFetch(base, BROWSER_UA).catch(async (e) => {
    if (e instanceof AuditError) throw e
    return safeFetch(`http://${domain}`, BROWSER_UA) // sin HTTPS
  }).catch((e) => {
    if (e instanceof AuditError) throw e
    throw new AuditError('El sitio no respondió.')
  })
  if (home.status >= 400) throw new AuditError(`La portada respondió con error ${home.status}.`)
  const origin = new URL(home.url).origin

  const [asBot, robotsRes, llmsRes] = await Promise.all([
    tryFetch(origin + '/', GPTBOT_UA),
    tryFetch(`${origin}/robots.txt`),
    tryFetch(`${origin}/llms.txt`),
  ])
  const robotsTxt = robotsRes && robotsRes.status === 200 && !/html/i.test(robotsRes.type) ? robotsRes.text : ''
  const robots = parseRobots(robotsTxt)
  const sitemapUrl = robots.sitemaps[0] || `${origin}/sitemap.xml`
  const sitemapRes = await tryFetch(sitemapUrl)

  const html = home.text
  const checks: Check[] = []

  // 1. robots.txt y bots de IA
  const bots = AI_BOTS.map((name) => ({ name, allowed: botAllowedRoot(robots.groups, name) }))
  const blocked = bots.filter((b) => !b.allowed)
  checks.push({
    id: 'robots', group: 'Acceso', max: 20, bots,
    points: Math.round(20 * (1 - blocked.length / bots.length)),
    status: blocked.length === 0 ? 'ok' : blocked.length <= 2 ? 'warn' : 'bad',
    label: !robotsTxt ? 'Sin robots.txt: todos los bots pueden entrar' : blocked.length ? `robots.txt bloquea a ${blocked.length} bot${blocked.length > 1 ? 's' : ''} de IA` : 'robots.txt deja pasar a todos los bots de IA',
    fix: blocked.length
      ? `Revisa si bloquear a ${blocked.map((b) => b.name).join(', ')} es una decisión consciente. Los bots de búsqueda y de consulta en vivo (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, PerplexityBot) son los que te pueden citar; bloquear solo los de entrenamiento (GPTBot, ClaudeBot, Google-Extended) es una opción válida.`
      : undefined,
  })

  // 2. Bot vs persona
  const botOk = !!asBot && asBot.status < 400
  checks.push({
    id: 'firewall', group: 'Acceso', max: 10, points: botOk ? 10 : 0, status: botOk ? 'ok' : 'bad',
    label: botOk ? 'Tu servidor responde a un bot de IA igual que a una persona' : 'Tu servidor o CDN bloquea a los bots de IA',
    detail: asBot ? `Probado con el user-agent de GPTBot: respuesta ${asBot.status}` : 'Con el user-agent de GPTBot no hubo respuesta',
    fix: botOk ? undefined : 'Revisa el firewall o la CDN (por ejemplo, la opción de bloqueo de bots de IA de Cloudflare): está rechazando a los bots aunque tu robots.txt los permita.',
  })

  // 3. Texto sin JavaScript
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || html
  const words = stripTags(body).split(' ').filter((w) => /[\p{L}\p{N}]/u.test(w)).length
  checks.push({
    id: 'nojs', group: 'Lectura', max: 15,
    points: words >= 300 ? 15 : words >= 120 ? 8 : 0,
    status: words >= 300 ? 'ok' : words >= 120 ? 'warn' : 'bad',
    label: `Contenido legible sin JavaScript: ${words.toLocaleString('es-MX')} palabras`,
    detail: 'Los bots de IA casi no ejecutan JavaScript. Menos de 300 palabras en el HTML suele indicar un sitio que se arma en el navegador.',
    fix: words >= 300 ? undefined : 'Renderiza el contenido principal en el servidor (SSR o páginas estáticas) para que llegue en el HTML y no dependa de JavaScript.',
  })

  // 4. Título, descripción, H1
  const title = attr(html, /<title[^>]*>([\s\S]*?)<\/title>/i)
  const desc = attr(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || attr(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)
  const h1 = (html.match(/<h1[\s>]/gi) || []).length
  const metaPts = (title ? 4 : 0) + (desc ? 3 : 0) + (h1 === 1 ? 3 : h1 > 1 ? 1 : 0)
  checks.push({
    id: 'meta', group: 'Lectura', max: 10, points: metaPts, status: metaPts === 10 ? 'ok' : metaPts >= 6 ? 'warn' : 'bad',
    label: `Título ${title ? 'sí' : 'no'} · descripción ${desc ? 'sí' : 'no'} · ${h1} H1`,
    fix: metaPts === 10 ? undefined : [!title && 'agrega un <title> descriptivo', !desc && 'agrega una meta descripción', h1 !== 1 && 'deja exactamente un H1 que diga de qué trata la página'].filter(Boolean).join('; ') + '.',
  })

  // 5. llms.txt
  const llmsOk = !!llmsRes && llmsRes.status === 200 && !/html/i.test(llmsRes.type) && llmsRes.text.trim().length > 30
  checks.push({
    id: 'llms', group: 'Lectura', max: 10, points: llmsOk ? 10 : 0, status: llmsOk ? 'ok' : 'bad',
    label: llmsOk ? '/llms.txt encontrado' : 'No existe /llms.txt',
    detail: 'Índice en texto que resume tu sitio para los modelos de IA.',
    fix: llmsOk ? undefined : 'Publica /llms.txt: un archivo de texto con quién eres, tus páginas principales y una línea por cada página importante con su enlace.',
  })

  // 6. Datos estructurados
  const types = jsonLdTypes(html)
  const keyTypes = ['Organization', 'Person', 'WebSite', 'LocalBusiness', 'Article', 'BlogPosting', 'FAQPage', 'Product', 'Service', 'BreadcrumbList']
  const useful = types.filter((t) => keyTypes.includes(t))
  checks.push({
    id: 'schema', group: 'Estructura', max: 15,
    points: useful.length >= 2 ? 15 : useful.length === 1 ? 8 : types.length ? 4 : 0,
    status: useful.length >= 2 ? 'ok' : useful.length === 1 || types.length ? 'warn' : 'bad',
    label: types.length ? `Datos estructurados: ${types.slice(0, 5).join(', ')}` : 'Sin datos estructurados (JSON-LD)',
    fix: useful.length >= 2 ? undefined : 'Agrega JSON-LD: Organization o Person y WebSite en todo el sitio; Article y FAQPage en los artículos; Service o Product en las páginas de oferta.',
  })

  // 7. Sitemap
  const smOk = !!sitemapRes && sitemapRes.status === 200 && /<(urlset|sitemapindex)/i.test(sitemapRes.text)
  checks.push({
    id: 'sitemap', group: 'Estructura', max: 5, points: smOk ? 5 : 0, status: smOk ? 'ok' : 'bad',
    label: smOk ? `sitemap.xml encontrado${robots.sitemaps.length ? ' (declarado en robots.txt)' : ''}` : 'No encontré sitemap.xml',
    fix: smOk ? undefined : 'Publica un sitemap.xml y decláralo en robots.txt con la línea "Sitemap: https://tu-dominio/sitemap.xml".',
  })

  // 8. Canónica, idioma, Open Graph
  const canonical = /<link[^>]+rel=["']canonical["']/i.test(html)
  const lang = /<html[^>]+lang=["'][a-z]/i.test(html)
  const og = /<meta[^>]+property=["']og:title["']/i.test(html)
  const tagPts = (canonical ? 4 : 0) + (lang ? 3 : 0) + (og ? 3 : 0)
  checks.push({
    id: 'tags', group: 'Estructura', max: 10, points: tagPts, status: tagPts === 10 ? 'ok' : tagPts >= 6 ? 'warn' : 'bad',
    label: `Canónica ${canonical ? 'sí' : 'no'} · idioma ${lang ? 'sí' : 'no'} · Open Graph ${og ? 'sí' : 'no'}`,
    fix: tagPts === 10 ? undefined : [!canonical && 'agrega <link rel="canonical">', !lang && 'declara el idioma en <html lang="es">', !og && 'agrega etiquetas Open Graph (og:title, og:description, og:image)'].filter(Boolean).join('; ') + '.',
  })

  // 9. HTTPS y velocidad
  const https = home.url.startsWith('https://')
  const secs = home.ms / 1000
  const perfPts = (https ? 2 : 0) + (secs <= 1.5 ? 3 : secs <= 3 ? 2 : 0)
  checks.push({
    id: 'perf', group: 'Estructura', max: 5, points: perfPts, status: perfPts === 5 ? 'ok' : perfPts >= 3 ? 'warn' : 'bad',
    label: `${https ? 'HTTPS' : 'Sin HTTPS'} · respuesta en ${secs.toFixed(1)} s`,
    fix: perfPts === 5 ? undefined : [!https && 'activa HTTPS', secs > 1.5 && 'reduce el tiempo de respuesta del servidor (caché, CDN o páginas estáticas)'].filter(Boolean).join('; ') + '.',
  })

  const score = checks.reduce((a, c) => a + c.points, 0)
  return { domain, url: home.url, score, checks, at: new Date().toISOString() }
}
