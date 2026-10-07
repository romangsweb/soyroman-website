// Solo servidor: lo importa la ruta /next/ai-recommend (usa la API key de Gemini)

import { AuditError } from './aeoAudit'

/**
 * ¿Te recomienda la IA?: hace 5 preguntas de compra a Gemini con búsqueda en Google
 * y mide si el dominio aparece, en qué lugar, contra quién y con qué fuentes.
 * Las preguntas salen de plantillas fijas para que el resultado sea comparable en el tiempo.
 */

export type Market = 'México' | 'Latinoamérica' | 'España'
export type Answer = { q: string; mentioned: boolean; position: number | null; of: number; text: string; sources: string[]; failed?: boolean }
export type AiResult = {
  domain: string
  brand: string
  service: string
  market: Market
  answers: Answer[]
  mentions: number
  rivals: { domain: string; count: number }[]
  sources: { domain: string; count: number }[]
  quote: string | null
  findings: { title: string; detail: string }[]
  model: string
  grounded: boolean // true = Gemini buscó en Google; false = respondió con lo que aprendió en su entrenamiento
  at: string
}

const MODEL = () => process.env.GEMINI_MODEL || 'gemini-flash-latest'
// La búsqueda en Google no tiene cuota en proyectos sin facturación: se activa solo con GEMINI_GROUNDING=1
const GROUNDED = () => process.env.GEMINI_GROUNDING === '1'

export const questions = (s: string, m: Market) => [
  `¿Qué empresas ofrecen ${s} en ${m}?`,
  `¿Cuáles son los mejores proveedores de ${s} en ${m} para una empresa mediana?`,
  `¿Cuánto cuesta contratar ${s} en ${m} y qué proveedores me recomiendas?`,
  `Necesito ${s} en ${m}. ¿A quién me recomiendas contactar y por qué?`,
  `¿Qué debo revisar al elegir un proveedor de ${s} en ${m}? Menciona opciones concretas.`,
]

const SYSTEM =
  'Eres un asistente que ayuda a un comprador B2B. Responde en español, en menos de 250 palabras. ' +
  'Cuando recomiendes empresas, escribe cada una como "Nombre (dominio.com)" con su sitio web real, en orden de recomendación.'

// Dominios que no cuentan como competidores (buscadores, redes, directorios genéricos, gobierno)
const NOT_RIVAL = /(^|\.)(google|youtube|facebook|instagram|linkedin|x|twitter|wikipedia|tiktok|amazon|gob|gov|microsoft|apple|reddit|quora|medium|vertexaisearch\.cloud\.google)\.[a-z.]+$/i
const DOMAIN_RE = /\b((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com\.mx|com\.co|com\.ar|com\.br|com|mx|net|org|io|co|es|lat|ai|app|biz|info|cl|pe|us|tech|cloud|consulting))\b/gi

const root = (d: string) => d.toLowerCase().replace(/^www\./, '')
const label = (d: string) => root(d).split('.')[0]

type Gem = { candidates?: { content?: { parts?: { text?: string }[] }; groundingMetadata?: { groundingChunks?: { web?: { uri?: string; title?: string } }[] } }[] }

// Si un modelo está saturado (503) o sin cuota (429), se intenta con el siguiente
const MODELS = () => [...new Set([MODEL(), 'gemini-3.5-flash', 'gemini-flash-lite-latest'])]
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function ask(q: string): Promise<{ text: string; sources: string[] }> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new AuditError('Esta herramienta no está configurada todavía.')
  let lastStatus = 0
  for (const model of MODELS()) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: q }] }],
        ...(GROUNDED() ? { tools: [{ google_search: {} }] } : {}),
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      }),
      signal: AbortSignal.timeout(25_000),
      cache: 'no-store',
    }).catch(() => null) // tiempo agotado: probar el siguiente modelo
    if (!res) continue
    lastStatus = res.status
    if (res.status === 429 || res.status >= 500) {
      await wait(800)
      continue
    }
    if (!res.ok) throw new Error(`gemini ${model} ${res.status} ${(await res.text()).slice(0, 300)}`)
    const data = (await res.json()) as Gem
    const c = data.candidates?.[0]
    const text = (c?.content?.parts || []).map((p) => p.text || '').join('').trim()
    const sources = (c?.groundingMetadata?.groundingChunks || []).map((g) => root(g.web?.title || '')).filter((t) => t.includes('.'))
    return { text, sources: [...new Set(sources)] }
  }
  throw new AuditError(lastStatus === 429 ? 'Se agotó la cuota gratuita de hoy. Vuelve a intentarlo mañana.' : 'La IA está saturada en este momento. Intenta de nuevo en unos minutos.')
}

export async function runAiRecommend(domain: string, brandInput: string, service: string, market: Market): Promise<AiResult> {
  const brand = brandInput.trim() || label(domain)
  // Variantes para detectar la marca: dominio, nombre con espacios o sin guiones
  const b = brand.toLowerCase()
  const needles = [...new Set([root(domain), b, b.replace(/-/g, ' '), b.replace(/[-\s]/g, '')])].filter((n) => n.length >= 3)
  const qs = questions(service, market)
  const settled = await Promise.allSettled(qs.map((q) => ask(q)))
  const ok = settled.filter((x) => x.status === 'fulfilled').length
  if (ok < 3) {
    const err = settled.find((x) => x.status === 'rejected') as PromiseRejectedResult
    throw err.reason instanceof AuditError ? err.reason : new AuditError('La IA está saturada en este momento. Intenta de nuevo en unos minutos.')
  }
  const raw = settled.map((x) => (x.status === 'fulfilled' ? x.value : null))

  const rivalCount = new Map<string, number>()
  const sourceCount = new Map<string, number>()
  let quote: string | null = null
  const answers: Answer[] = raw.map((r, i) => {
    if (!r) return { q: qs[i], mentioned: false, position: null, of: 0, text: '', sources: [], failed: true }
    const low = r.text.toLowerCase()
    // Entidades en orden de aparición: dominios citados en el texto + tu marca
    const found = new Map<string, number>()
    for (const m of r.text.matchAll(DOMAIN_RE)) {
      const d = root(m[1])
      if (!found.has(d)) found.set(d, m.index ?? 0)
    }
    const youAt = needles.map((n) => low.indexOf(n)).filter((x) => x >= 0).sort((x, y) => x - y)[0]
    const mentioned = youAt !== undefined || r.sources.includes(root(domain))
    const ents = [...found.entries()].filter(([d]) => !NOT_RIVAL.test(d) && !needles.some((n) => d.includes(n)))
    for (const [d] of ents) rivalCount.set(d, (rivalCount.get(d) || 0) + 1)
    for (const s of r.sources) sourceCount.set(s, (sourceCount.get(s) || 0) + 1)
    let position: number | null = null
    if (youAt !== undefined) {
      position = ents.filter(([, at]) => at < youAt).length + 1
      if (!quote) {
        const s = r.text.lastIndexOf('\n', youAt) + 1
        const e = r.text.indexOf('\n', youAt)
        quote = r.text.slice(s, e < 0 ? undefined : e).replace(/[*#>]/g, '').trim().slice(0, 260) || null
      }
    }
    return { q: qs[i], mentioned, position, of: ents.length + (youAt !== undefined ? 1 : 0), text: r.text.slice(0, 3000), sources: r.sources }
  })

  const mentions = answers.filter((a) => a.mentioned).length
  const rivals = [...rivalCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([d, count]) => ({ domain: d, count }))
  const sources = [...sourceCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([d, count]) => ({ domain: d, count }))

  // Diagnóstico
  const F: { title: string; detail: string }[] = []
  if (!mentions) F.push({ title: 'La IA no te menciona en ninguna respuesta', detail: `Cuando alguien pregunta por ${service} en ${market}, Gemini recomienda a otros. Para la IA, todavía no eres una opción en esta categoría.` })
  const top = rivals[0]
  if (top && top.count > mentions) F.push({ title: `${top.domain} aparece en ${top.count} de ${answers.filter((x) => !x.failed).length} respuestas`, detail: mentions ? `Tú en ${mentions}. Revisa qué publica: casos, precios, comparativas; es lo que la IA encuentra y repite.` : 'Revisa qué publica: casos, precios, comparativas; es lo que la IA encuentra y repite.' })
  const late = answers.filter((a) => a.position && a.position > 3)
  if (late.length) F.push({ title: 'Apareces, pero al final de la lista', detail: `En ${late.length} respuesta${late.length > 1 ? 's' : ''} quedas después del tercer lugar: la mayoría de los compradores no llega hasta ahí.` })
  const notYou = sources.filter((s) => !needles.some((n) => s.domain.includes(n))).slice(0, 3)
  if (notYou.length) F.push({ title: `La IA se apoya en ${notYou.map((s) => s.domain).join(', ')}`, detail: 'Son las páginas que consultó para responder. Si no estás en ellas (con un perfil, un artículo o una mención), la IA no tiene de dónde sacarte.' })
  if (!GROUNDED() && !mentions) F.push({ title: 'Lo que la IA sabe de tu categoría viene de lo publicado en internet', detail: 'Sin búsqueda en vivo, Gemini responde con lo que aprendió: menciones en directorios, medios, comparativas y blogs de terceros. Aparecer ahí es lo que te mete en sus respuestas.' })
  if (GROUNDED() && !sources.some((s) => s.domain === root(domain))) F.push({ title: 'Tu sitio no aparece entre las fuentes', detail: 'Gemini no leyó tu sitio para responder. Revisa con el auditor AEO que los bots puedan entrar y que tus páginas de servicio respondan precio, plazos y para quién es.' })

  return { domain, brand, service, market, answers, mentions, rivals, sources, quote, findings: F.slice(0, 5), model: MODEL(), grounded: GROUNDED(), at: new Date().toISOString() }
}
