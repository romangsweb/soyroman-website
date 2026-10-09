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
