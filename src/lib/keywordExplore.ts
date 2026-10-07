// Solo servidor: lo importa la ruta /next/keyword-explore

import { AuditError } from './aeoAudit'
import { geminiJson } from './gemini'

/**
 * Explorador de búsquedas: junta lo que Google sugiere al escribir una palabra (con ~30 variantes),
 * calcula una señal de popularidad por posición y repetición, y agrupa por intención.
 * No hay volumen de búsqueda: el autocompletado no lo publica.
 */

export type Country = 'mx' | 'co' | 'ar' | 'es'
export const COUNTRIES: Record<Country, string> = { mx: 'México', co: 'Colombia', ar: 'Argentina', es: 'España' }
export type Intent = 'inf' | 'com' | 'tra' | 'nav'
export type Term = { q: string; signal: number; intent: Intent }
export type Cluster = { name: string; intent: Intent; type: string; title: string; count: number }
export type ExploreResult = {
  seed: string
  country: Country
  terms: Term[]
  questions: string[]
  clusters: Cluster[]
  mix: Record<Intent, number>
  grouped: boolean // true = Gemini agrupó; false = solo reglas
  at: string
}

const PREFIX = ['qué es', 'qué', 'cómo', 'cuánto cuesta', 'cuál es el mejor', 'por qué', 'dónde', 'cuándo', 'para qué sirve', 'mejor', 'mejores']
const SUFFIX = ['', 'para', 'precio', 'gratis', 'vs', 'en', 'que es', 'como', 'ejemplos', 'alternativas', 'online', 'para empresas', 'para pymes', 'curso', 'tipos', 'ventajas', 'requisitos']

async function suggest(q: string, c: Country): Promise<string[]> {
  const u = `https://suggestqueries.google.com/complete/search?client=firefox&hl=es&gl=${c}&ie=utf-8&oe=utf-8&q=${encodeURIComponent(q)}`
  const res = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' }, signal: AbortSignal.timeout(5000), cache: 'no-store' })
  if (!res.ok) throw new Error(`suggest ${res.status}`)
  const buf = new Uint8Array(await res.arrayBuffer())
  let txt = new TextDecoder('utf-8').decode(buf)
  if (txt.includes('�')) txt = new TextDecoder('latin1').decode(buf) // algunas respuestas llegan en ISO-8859-1
  const data = JSON.parse(txt) as [string, string[]]
  return Array.isArray(data?.[1]) ? data[1].map((s) => String(s).toLowerCase().trim()).filter(Boolean) : []
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const TRA = /\b(precio|precios|costo|costos|cuesta|cuanto|comprar|cotizacion|cotizar|gratis|demo|prueba|contratar|planes|descargar|licencia|tarifa)\b/
const COM = /\b(mejor|mejores|vs|versus|alternativa|alternativas|comparativa|comparacion|opiniones|resenas|top|recomendad[oa]s?|ranking|para (pymes|empresas|pequenas))\b/
const INF = /^(que|como|cual|cuales|por que|porque|para que|donde|cuando|quien)\b|\b(que es|ejemplos?|tipos|definicion|significado|curso|pdf|guia|ventajas|requisitos|funciona)\b/
const ruleIntent = (q: string): Intent => {
  const n = norm(q)
  return TRA.test(n) ? 'tra' : COM.test(n) ? 'com' : INF.test(n) ? 'inf' : 'inf'
}
const isQuestion = (q: string) => /^(que|como|cual|cuales|por que|porque|para que|donde|cuando|quien|cuanto|cuanta|es|se puede)\b/.test(norm(q))

async function pool<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<PromiseSettledResult<R>[]> {
  const out: PromiseSettledResult<R>[] = new Array(items.length)
  let i = 0
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) {
      const k = i++
      out[k] = await fn(items[k]).then((value) => ({ status: 'fulfilled', value }) as const, (reason) => ({ status: 'rejected', reason }) as const)
    }
  }))
  return out
}

type GemOut = { clusters?: { name?: string; intent?: string; type?: string; title?: string; items?: number[] }[]; brands?: number[] }

export async function runExplore(seedRaw: string, country: Country): Promise<ExploreResult> {
  const seed = seedRaw.toLowerCase().replace(/\s+/g, ' ').trim()
  const queries = [...new Set([...SUFFIX.map((s) => `${seed} ${s}`.trim()), ...PREFIX.map((p) => `${p} ${seed}`)])]
  const results = await pool(queries, 8, (q) => suggest(q, country))
  const okCount = results.filter((r) => r.status === 'fulfilled').length
  if (!okCount) throw new AuditError('Google no respondió las sugerencias. Intenta de nuevo en unos minutos.')

  // Señal: suma de (10 − posición) en cada variante donde aparece
  const seedTokens = norm(seed).split(' ').filter((t) => t.length >= 3)
  const score = new Map<string, number>()
  for (const r of results) {
    if (r.status !== 'fulfilled') continue
    r.value.slice(0, 10).forEach((s, idx) => {
      const n = norm(s)
      if (seedTokens.length && !seedTokens.some((t) => n.includes(t))) return
      score.set(s, (score.get(s) || 0) + (10 - idx))
    })
  }
  if (!score.size) throw new AuditError('Google no tiene sugerencias para esa palabra. Prueba con un término más común.')
  const max = Math.max(...score.values())
  let terms: Term[] = [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 200)
    .map(([q, v]) => ({ q, signal: Math.max(1, Math.round((v / max) * 10)), intent: ruleIntent(q) }))

  // Gemini agrupa en temas y propone contenido; si falla, quedan las reglas
  let clusters: Cluster[] = []
  let grouped = false
  try {
    const list = terms.slice(0, 150)
    const out = await geminiJson<GemOut>(
      `Palabra semilla: "${seed}" (${COUNTRIES[country]}).\nBúsquedas reales del autocompletado de Google, numeradas:\n${list.map((t, i) => `${i}. ${t.q}`).join('\n')}\n\n` +
        'Agrupa las búsquedas en 4 a 6 temas. Para cada tema da: name (2-4 palabras), intent ("inf" informativa, "com" comercial, "tra" transaccional, "nav" marca), ' +
        'type (uno de: Guía, Comparativa, Landing, Glosario, Caso), title (título concreto en español para la pieza de contenido que respondería ese tema, sin inventar cifras) e items (números de las búsquedas). ' +
        'Además, brands: números de las búsquedas que incluyen una marca o empresa concreta. Responde solo JSON: {"clusters":[...],"brands":[...]}',
      'Eres un estratega de contenido SEO B2B. Respondes solo con JSON válido.',
    )
    const valid: Intent[] = ['inf', 'com', 'tra', 'nav']
    for (const c of out.clusters || []) {
      const intent = valid.includes(c.intent as Intent) ? (c.intent as Intent) : 'inf'
      const items = (c.items || []).filter((i) => Number.isInteger(i) && i >= 0 && i < list.length)
      if (!c.name || !c.title || !items.length) continue
      for (const i of items) list[i].intent = intent
      clusters.push({ name: String(c.name).slice(0, 40), intent, type: String(c.type || 'Guía').slice(0, 20), title: String(c.title).slice(0, 140), count: items.length })
    }
    for (const i of out.brands || []) if (Number.isInteger(i) && list[i]) list[i].intent = 'nav'
    terms = [...list, ...terms.slice(150)]
    grouped = clusters.length > 0
    clusters = clusters.sort((a, b) => b.count - a.count).slice(0, 6)
  } catch (e) {
    console.warn('[keyword-explore] sin agrupación de Gemini', e instanceof Error ? e.message : e)
  }

  const count = (k: Intent) => terms.filter((t) => t.intent === k).length
  const mix = { inf: count('inf'), com: count('com'), tra: count('tra'), nav: count('nav') }
  const questions = terms.filter((t) => isQuestion(t.q)).slice(0, 12).map((t) => `¿${t.q}?`)
  return { seed, country, terms, questions, clusters, mix, grouped, at: new Date().toISOString() }
}
