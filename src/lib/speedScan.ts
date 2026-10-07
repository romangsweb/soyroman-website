// Solo servidor: lo importan /next/speed-scan y /next/compare (usa la API key de Google)

import { AuditError } from './aeoAudit'

/**
 * Velocidad real: datos de campo de Chrome (CrUX, usuarios reales, 28 días) y la prueba de laboratorio
 * de PageSpeed Insights (Lighthouse). Google hace las visitas: este servidor solo consulta sus APIs.
 */

export type Strategy = 'mobile' | 'desktop'
export type SpeedStatus = 'ok' | 'warn' | 'bad'
export type FieldMetric = {
  id: 'lcp' | 'inp' | 'cls' | 'fcp' | 'ttfb'
  label: string
  p75: number
  unit: 'ms' | ''
  status: SpeedStatus
  dist: [number, number, number] // % bueno, mejorable, lento
}
export type Field = { metrics: FieldMetric[]; passes: boolean | null; period: string }
export type Lab = { score: number; metrics: { label: string; value: string }[]; fixes: { title: string; ms: number }[] }

// Umbrales oficiales de Core Web Vitals (bueno / lento)
export const LIMITS: Record<FieldMetric['id'], [number, number]> = {
  lcp: [2500, 4000],
  inp: [200, 500],
  cls: [0.1, 0.25],
  fcp: [1800, 3000],
  ttfb: [800, 1800],
}
const CRUX_KEYS: [FieldMetric['id'], string, string][] = [
  ['lcp', 'largest_contentful_paint', 'Carga (LCP)'],
  ['inp', 'interaction_to_next_paint', 'Interacción (INP)'],
  ['cls', 'cumulative_layout_shift', 'Estabilidad (CLS)'],
  ['fcp', 'first_contentful_paint', 'Primer contenido (FCP)'],
  ['ttfb', 'experimental_time_to_first_byte', 'Respuesta del servidor (TTFB)'],
]

const key = () => {
  const k = process.env.PAGESPEED_API_KEY
  if (!k) throw new AuditError('La medición de velocidad no está configurada todavía.')
  return k
}

const statusOf = (id: FieldMetric['id'], v: number): SpeedStatus => (v <= LIMITS[id][0] ? 'ok' : v <= LIMITS[id][1] ? 'warn' : 'bad')

type CruxMetric = { histogram?: { density?: number }[]; percentiles?: { p75?: number | string } }
type CruxDate = { year: number; month: number; day: number }

/** Datos de usuarios reales del origen. `null` si el sitio no tiene suficiente tráfico en Chrome. */
export async function cruxField(domain: string, strategy: Strategy): Promise<Field | null> {
  const query = (host: string) =>
    fetch(`https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${key()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin: `https://${host}`, formFactor: strategy === 'mobile' ? 'PHONE' : 'DESKTOP', metrics: CRUX_KEYS.map((m) => m[1]) }),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    })
  let res = await query(domain)
  // Muchos sitios redirigen a www: CrUX guarda los datos con el origen final
  if (res.status === 404 && !domain.startsWith('www.')) res = await query(`www.${domain}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`crux ${res.status}`)
  const data = (await res.json()) as { record?: { metrics?: Record<string, CruxMetric>; collectionPeriod?: { firstDate: CruxDate; lastDate: CruxDate } } }
  const raw = data.record?.metrics || {}
  const metrics: FieldMetric[] = []
  for (const [id, k, label] of CRUX_KEYS) {
    const m = raw[k]
    const p75 = Number(m?.percentiles?.p75)
    if (!m || !Number.isFinite(p75)) continue
    const h = (m.histogram || []).map((b) => Math.round((b.density || 0) * 100))
    metrics.push({ id, label, p75, unit: id === 'cls' ? '' : 'ms', status: statusOf(id, p75), dist: [h[0] || 0, h[1] || 0, h[2] || 0] })
  }
  if (!metrics.length) return null
  const core = ['lcp', 'inp', 'cls'].map((id) => metrics.find((m) => m.id === id))
  // Pasa si LCP, INP y CLS son buenos en el percentil 75 (INP puede faltar en sitios con poca interacción)
  const passes = core[0] && core[2] ? core.every((m) => !m || m.status === 'ok') : null
  const p = data.record?.collectionPeriod
  const fmt = (d: CruxDate) => `${d.day}/${d.month}/${d.year}`
  return { metrics, passes, period: p ? `${fmt(p.firstDate)} – ${fmt(p.lastDate)}` : '' }
}

type LhAudit = { title?: string; score?: number | null; displayValue?: string; numericValue?: number; details?: { overallSavingsMs?: number }; metricSavings?: Record<string, number> }

/** Prueba de laboratorio de PageSpeed Insights (tarda entre 10 y 40 s). */
export async function psiLab(domain: string, strategy: Strategy): Promise<Lab> {
  const qs = new URLSearchParams({ url: `https://${domain}/`, strategy, category: 'performance', locale: 'es-419', key: key() })
  const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${qs}`, { signal: AbortSignal.timeout(55_000), cache: 'no-store' })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    if (res.status === 400 || res.status === 500) throw new AuditError('Google no pudo cargar el sitio para la prueba de laboratorio.')
    throw new Error(`psi ${res.status} ${body.slice(0, 200)}`)
  }
  const data = (await res.json()) as { lighthouseResult?: { categories?: { performance?: { score?: number } }; audits?: Record<string, LhAudit> } }
  const lh = data.lighthouseResult
  if (!lh?.audits) throw new AuditError('La prueba de laboratorio no devolvió resultados.')
  const A = lh.audits
  const metrics = [
    ['first-contentful-paint', 'Primer contenido'],
    ['largest-contentful-paint', 'Contenido principal'],
    ['total-blocking-time', 'Tiempo bloqueado'],
    ['cumulative-layout-shift', 'Saltos de diseño'],
    ['speed-index', 'Índice de velocidad'],
  ]
    .filter(([id]) => A[id]?.displayValue)
    .map(([id, label]) => ({ label, value: A[id].displayValue!.replace(/ /g, ' ') }))
  const seen = new Set<string>()
  const fixes = Object.values(A)
    .filter((a) => typeof a.score === 'number' && a.score < 0.9)
    .map((a) => ({ title: (a.title || '').replace(/`/g, '').trim(), ms: Math.round(a.details?.overallSavingsMs ?? a.metricSavings?.LCP ?? a.metricSavings?.FCP ?? 0) }))
    .filter((f) => f.title && f.ms >= 100 && !seen.has(f.title) && seen.add(f.title))
    .sort((x, y) => y.ms - x.ms)
    .slice(0, 6)
  return { score: Math.round((lh.categories?.performance?.score ?? 0) * 100), metrics, fixes }
}
