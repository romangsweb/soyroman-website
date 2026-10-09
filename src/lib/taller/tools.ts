/**
 * Herramientas conectadas a Mi taller: cómo se muestran sus métricas y cómo se reabre una corrida guardada
 * (con el mismo enlace para compartir que ya usa cada herramienta). Se agregan una por una.
 */

export type MetricDef = { key: string; label: string; fmt: (n: number) => string }
export type TallerTool = {
  slug: string
  name: string
  code: string
  headline: string // métrica principal para la tarjeta del panel
  metrics: MetricDef[]
  open: (inputs: Record<string, unknown>) => string
}

const nf = (d = 0) => (n: number) => n.toLocaleString('es-MX', { maximumFractionDigits: d, minimumFractionDigits: d })
const usd = (n: number) => `$${nf()(Math.round(n))}`
const usd2 = (n: number) => `$${nf(2)(n)}`

/** Mismo formato que encodeState de share.ts (base64url de JSON en UTF-8), seguro en servidor y navegador. */
function encode(obj: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj))
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Solo números finitos y textos cortos pasan a la URL. */
function qs(inputs: Record<string, unknown>) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(inputs)) {
    if (typeof v === 'number' && Number.isFinite(v)) q.set(k, String(v))
    else if (typeof v === 'string' && v.length <= 40) q.set(k, v)
  }
  return q.toString()
}

export const TALLER_TOOLS = [
  {
    slug: 'ltv-cac',
    name: 'LTV:CAC y payback',
    code: 'LTV·01',
    headline: 'ltv_cac',
    metrics: [
      { key: 'ltv_cac', label: 'LTV : CAC', fmt: (n) => `${nf(1)(n)} : 1` },
      { key: 'cac', label: 'CAC', fmt: usd },
      { key: 'ltv', label: 'LTV (margen)', fmt: usd },
      { key: 'payback', label: 'Payback', fmt: (n) => `${nf()(n)} meses` },
    ],
    open: (i) => `/recursos/ltv-cac?${qs(i)}`,
  },
  {
    slug: 'embudo-inverso',
    name: 'Embudo inverso',
    code: 'EMBUDO I',
    headline: 'leads_mes',
    metrics: [
      { key: 'leads_mes', label: 'Leads / mes', fmt: (n) => nf()(Math.ceil(n)) },
      { key: 'mql_mes', label: 'MQL / mes', fmt: (n) => nf()(Math.ceil(n)) },
      { key: 'sql_mes', label: 'SQL / mes', fmt: (n) => nf()(Math.ceil(n)) },
      { key: 'negocios_mes', label: 'Negocios / mes', fmt: nf(1) },
      { key: 'meta_anual', label: 'Meta anual', fmt: usd },
    ],
    open: (i) => `/recursos/embudo-inverso?${qs(i)}`,
  },
  {
    slug: 'icp',
    name: 'Generador de ICP',
    code: 'ICP',
    headline: 'ticket',
    metrics: [
      { key: 'ticket', label: 'Ticket', fmt: usd },
      { key: 'ciclo', label: 'Ciclo', fmt: (n) => `${nf()(n)} meses` },
    ],
    open: (i) => `/recursos/icp?s=${encode(i)}`,
  },
  {
    slug: 'presupuesto-marketing',
    name: 'Planificador de presupuesto',
    code: 'BUDGET',
    headline: 'total',
    metrics: [
      { key: 'total', label: 'Presupuesto / año', fmt: usd },
      { key: 'cac', label: 'CAC', fmt: usd },
      { key: 'romi', label: 'ROMI', fmt: (n) => `${nf()(n)}%` },
      { key: 'adelanto', label: 'Adelanto de caja', fmt: usd },
    ],
    open: (i) => `/recursos/presupuesto-marketing?${qs(i)}`,
  },
  {
    slug: 'cpl-maximo',
    name: 'CPL máximo',
    code: 'CPL MÁX',
    headline: 'cpl_max',
    metrics: [
      { key: 'cpl_max', label: 'CPL máximo', fmt: usd2 },
      { key: 'cac_max', label: 'CAC máximo', fmt: usd },
      { key: 'cpc_max', label: 'CPC máximo', fmt: usd2 },
      { key: 'cpl_actual', label: 'Tu CPL', fmt: usd2 },
    ],
    open: (i) => `/recursos/cpl-maximo?${qs(i)}`,
  },
  {
    slug: 'roas-romi-roi',
    name: 'ROAS · ROMI · ROI',
    code: 'RENDIMIENTO',
    headline: 'romi',
    metrics: [
      { key: 'roas', label: 'ROAS', fmt: (n) => `${nf(1)(n)}x` },
      { key: 'romi', label: 'ROMI', fmt: (n) => `${nf()(n)}%` },
      { key: 'roi', label: 'ROI', fmt: (n) => `${nf()(n)}%` },
    ],
    open: (i) => `/recursos/roas-romi-roi?${qs(i)}`,
  },
  {
    slug: 'capacidad-comercial',
    name: 'Capacidad comercial',
    code: 'CAP·01',
    headline: 'ae',
    metrics: [
      { key: 'ae', label: 'Vendedores', fmt: nf() },
      { key: 'sdr', label: 'SDR', fmt: nf() },
      { key: 'primer_cierre', label: 'Primer cierre', fmt: (n) => `mes ${nf()(n)}` },
      { key: 'costo', label: 'Costo del equipo / año', fmt: usd },
    ],
    open: (i) => `/recursos/capacidad-comercial?${qs(i)}`,
  },
  {
    slug: 'velocidad-pipeline',
    name: 'Velocidad de pipeline',
    code: 'VEL·01',
    headline: 'vel_dia',
    metrics: [
      { key: 'vel_dia', label: 'Por día', fmt: usd },
      { key: 'trimestre', label: 'En el trimestre', fmt: usd },
      { key: 'alcance', label: 'De la meta', fmt: (n) => `${nf()(n)}%` },
    ],
    open: (i) => `/recursos/velocidad-pipeline?${qs(i)}`,
  },
  {
    slug: 'brecha-pipeline',
    name: 'Brecha de pipeline',
    code: 'PIPE',
    headline: 'brecha',
    metrics: [
      { key: 'brecha', label: 'Brecha', fmt: usd },
      { key: 'forecast', label: 'Forecast ponderado', fmt: usd },
      { key: 'cobertura', label: 'Cobertura', fmt: (n) => `${nf(1)(n)}x` },
      { key: 'prob', label: 'Prob. de llegar', fmt: (n) => `${nf()(n)}%` },
    ],
    open: (i) => `/recursos/brecha-pipeline?s=${encode(i)}`,
  },
] as const satisfies readonly TallerTool[]

export type TallerSlug = (typeof TALLER_TOOLS)[number]['slug']
export const TALLER_SLUGS = TALLER_TOOLS.map((t) => t.slug) as [TallerSlug, ...TallerSlug[]]
export const tallerTool = (slug: string): TallerTool | undefined => TALLER_TOOLS.find((t) => t.slug === slug)

export const fmtMetric = (t: TallerTool, key: string, v: number | null | undefined) => {
  if (v == null) return '—'
  const m = t.metrics.find((x) => x.key === key)
  return m ? m.fmt(v) : String(v)
}

/** Número finito o null (una razón con CAC en cero da Infinity, que no se guarda). */
export const finite = (x: number | null | undefined) => (x != null && Number.isFinite(x) ? x : null)
