/**
 * Referencias de la industria para las calculadoras, siempre con su fuente.
 * Son datos de EE. UU./Europa y, en Gartner, de empresas grandes: sirven de orientación, no de meta.
 */

export type Source = { name: string; url: string; note: string }

export const SOURCES = {
  metadata: {
    name: 'Metadata.io · B2B Advertising Benchmarks 2025',
    url: 'https://metadata.io/b2b-advertising-benchmarks',
    note: '153 anunciantes B2B, USD 57.6M de inversión y 211 mil leads en 2025; cifras ponderadas por inversión.',
  },
  gartner: {
    name: 'Gartner · CMO Spend Survey 2025',
    url: 'https://www.gartner.com/en/newsroom/press-releases/2025-05-12-gartner-2025-cmo-spend-survey-reveals-marketing-budgets-have-flatlined-at-seven-percent-of-overall-company-revenue',
    note: '402 CMOs de Norteamérica y Europa; la mayoría de empresas con más de USD 1,000M de ingresos.',
  },
  bloom: {
    name: 'The Digital Bloom · Pipeline Performance Benchmarks 2025',
    url: 'https://thedigitalbloom.com/learn/pipeline-performance-benchmarks-2025/',
    note: 'Recopilado de más de 40 estudios (FirstPageSage y otros); sin tamaño de muestra. Úsalo como rango orientativo.',
  },
  skok: {
    name: 'David Skok · SaaS Metrics 2.0 (For Entrepreneurs)',
    url: 'https://www.forentrepreneurs.com/saas-metrics-2/',
    note: 'Propone LTV mayor a 3 veces el CAC y recuperar el CAC en menos de 12 meses. Es una convención de la industria, no un estudio con muestra.',
  },
  rule: {
    name: 'Regla práctica de ventas B2B',
    url: '',
    note: 'Convención común en equipos de ventas, no un estudio.',
  },
} satisfies Record<string, Source>

/** Costo por canal B2B 2025 (USD). */
export const CHANNEL_COSTS = [
  { channel: 'LinkedIn', cpl: 202, cpc: 9.39, conv: 5.9 },
  { channel: 'Facebook', cpl: 145, cpc: 1.95, conv: 2.6 },
  { channel: 'Instagram', cpl: 138, cpc: 2.82, conv: 4.0 },
  { channel: 'Google Ads', cpl: 524, cpc: 9.76, conv: 1.9 },
]

/** Tasas del embudo B2B (%): rango típico entre enterprise y pyme/mid-market. */
export const FUNNEL_RANGES: Record<string, [number, number]> = {
  visit: [0.7, 1.4],
  mql: [39, 41],
  sql: [15, 39],
  opp: [36, 42],
  win: [31, 39],
}

export const BUDGET_REF = { revenueShare: 7.7, paidShare: 30.6 }
export const COVERAGE_RULE = 3
/** LTV:CAC mínimo de referencia y meses de payback que suelen aceptarse por segmento. */
export const LTV_RULE = 3
export const PAYBACK_REF = { smb: 12, mid: 18, ent: 24 }
