/** Contenido fijo de /cv y del PDF (/cv/imprimir). La experiencia viene del CMS (colección experience). */

export const CV_SUMMARY =
  'Desde 2017 en empresas de tecnología B2B: dirijo campañas de generación de demanda y construyo lo que las hace funcionar — sitios, analítica, CRM y posicionamiento en buscadores y en IA. Llevo leads de MQL a SQL y a venta, con marketing y ventas sobre el mismo embudo.'

export const CV_KPIS: [string, string][] = [
  ['2017', 'en demanda B2B'],
  ['120+', 'leads al mes'],
  ['USD 1.5M', 'facturación anual por marketing'],
  ['15+', 'sitios web lanzados'],
]

export const UNIVERSITY = 'Universidad del Valle de México'

export const CERTS: { org: string; text: string; items: string[] }[] = [
  { org: 'Google', text: 'Analytics, Ads, Search Console y otras.', items: ['Google Analytics', 'Google Ads', 'Search Console'] },
  { org: 'HubSpot', text: 'Especialidades en Marketing, Sales, Service, CMS y Operations Hub.', items: ['Marketing Hub', 'Sales Hub', 'Service Hub', 'CMS Hub', 'Operations Hub'] },
  { org: 'Universidad de Helsinki', text: 'Elements of AI · Building AI · Ethics of AI', items: ['Elements of AI', 'Building AI', 'Ethics of AI'] },
]

export const TOOLS = ['HubSpot', 'GA4', 'Tag Manager', 'Search Console', 'Google Ads', 'LinkedIn Ads', 'WordPress', 'Next.js', 'Python', 'SQL', 'Docker', 'n8n']

/** Solo en el PDF. */
export const LANGS: [string, number][] = [
  ['Español', 5],
  ['Inglés · intermedio', 3],
]

export const LINKS = [
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/román-garcía/' },
  { label: 'GitHub', url: 'https://github.com/romangsweb' },
]

/** Quita del CMS las líneas genéricas o que ya viven en otra sección (certificaciones). */
const HIDE = [/^Incremento en la generación de demanda digital/i, /^Certificaciones de /i, /^Universidad de Helsinki/i]
export const cleanAchievements = (a?: { text?: string | null }[] | null) =>
  (a || []).map((x) => (x?.text || '').trim()).filter((t) => t && !HIDE.some((r) => r.test(t)))

/** "2023 — HOY" / "2020 — 2023" */
export const yearRange = (start?: string | null, end?: string | null) => {
  const y = (d?: string | null) => (d ? new Date(d).getUTCFullYear() : null)
  return `${y(start) ?? '—'} — ${end ? y(end) : 'HOY'}`
}
