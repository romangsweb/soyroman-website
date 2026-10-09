/**
 * Perfil de empresa de Mi taller: qué datos tiene, qué herramientas precarga y cómo se traduce a cada una.
 * Sin dependencias de servidor: lo usan el formulario, las herramientas y las acciones.
 */

export const SIZES = ['1–10', '11–50', '51–200', '201–1,000', '1,000+'] as const // mismos rangos que el Generador de ICP
export const INDUSTRIES = ['Software y SaaS', 'Servicios profesionales', 'Manufactura', 'Salud', 'Educación', 'Finanzas', 'Logística', 'Otra'] as const

export type ProfileData = {
  domain?: string
  service?: string // lo que vende, como lo buscaría un comprador (radar de IA)
  industry?: string
  size?: number // índice de SIZES
  country?: string
  goal?: number // meta de ingresos nuevos al año (USD)
  ticket?: number // USD por negocio
  cycle?: number // meses
  model?: 'rec' | 'prj'
  margin?: number // %
  visit?: number // visita → lead (%)
  mql?: number // lead → MQL (%)
  sql?: number // MQL → SQL (%)
  opp?: number // SQL → oportunidad (%)
  win?: number // oportunidad → ganado (%)
  sdr?: number
  ae?: number
}

type NumKey = { [K in keyof ProfileData]-?: NonNullable<ProfileData[K]> extends number ? K : never }[keyof ProfileData]

export type FieldDef =
  | { id: 'domain' | 'country' | 'service'; kind: 'text'; label: string; ph: string; max: number; hint?: string }
  | { id: 'industry'; kind: 'select'; label: string; options: readonly string[]; hint?: string }
  | { id: 'size'; kind: 'size'; label: string; hint?: string }
  | { id: 'model'; kind: 'model'; label: string; hint?: string }
  | { id: NumKey; kind: 'num'; label: string; unit: '$' | '%' | 'meses' | ''; min: number; max: number; step: number; hint?: string }

export const GROUPS: { title: string; fields: FieldDef[] }[] = [
  {
    title: 'EMPRESA',
    fields: [
      { id: 'domain', kind: 'text', label: 'Dominio', ph: 'empresa.com', max: 120, hint: 'auditor AEO, stack, correo y radar de IA' },
      { id: 'service', kind: 'text', label: 'Qué vendes, como lo buscaría un comprador', ph: 'consultoría de CRM', max: 80, hint: 'el radar de IA pregunta por esto cada mes' },
      { id: 'industry', kind: 'select', label: 'Industria', options: INDUSTRIES },
      { id: 'size', kind: 'size', label: 'Tamaño (personas)' },
      { id: 'country', kind: 'text', label: 'País principal', ph: 'México', max: 60 },
    ],
  },
  {
    title: 'MODELO DE VENTA',
    fields: [
      { id: 'goal', kind: 'num', label: 'Meta de ingresos nuevos al año', unit: '$', min: 10000, max: 100000000, step: 10000, hint: 'USD' },
      { id: 'ticket', kind: 'num', label: 'Ticket promedio', unit: '$', min: 100, max: 10000000, step: 500, hint: 'USD por negocio' },
      { id: 'cycle', kind: 'num', label: 'Ciclo de venta', unit: 'meses', min: 1, max: 36, step: 1 },
      { id: 'model', kind: 'model', label: 'Modelo de ingreso' },
      { id: 'margin', kind: 'num', label: 'Margen bruto', unit: '%', min: 1, max: 100, step: 1 },
    ],
  },
  {
    title: 'EMBUDO',
    fields: [
      { id: 'visit', kind: 'num', label: 'Visita → lead', unit: '%', min: 0.1, max: 50, step: 0.1 },
      { id: 'mql', kind: 'num', label: 'Lead → MQL', unit: '%', min: 1, max: 100, step: 0.5 },
      { id: 'sql', kind: 'num', label: 'MQL → SQL', unit: '%', min: 0.5, max: 80, step: 0.5 },
      { id: 'opp', kind: 'num', label: 'SQL → oportunidad', unit: '%', min: 1, max: 100, step: 0.5 },
      { id: 'win', kind: 'num', label: 'Oportunidad → ganado', unit: '%', min: 1, max: 90, step: 0.5, hint: 'tasa de cierre' },
    ],
  },
  {
    title: 'EQUIPO',
    fields: [
      { id: 'sdr', kind: 'num', label: 'SDR', unit: '', min: 0, max: 200, step: 1 },
      { id: 'ae', kind: 'num', label: 'Vendedores', unit: '', min: 0, max: 500, step: 1 },
    ],
  },
]

export const FIELDS = GROUPS.flatMap((g) => g.fields)

/** Qué precarga cada grupo de datos (texto para el perfil). */
export const FEEDS: [string, string][] = [
  ['Meta, ticket y ciclo', 'Embudo · Presupuesto · Capacidad · Velocidad · Brecha'],
  ['Tasas del embudo', 'Embudo · Presupuesto · CPL máx. · Capacidad · Velocidad'],
  ['Margen y modelo', 'LTV:CAC · CPL máx. · Presupuesto · ROAS/ROMI'],
  ['Industria, tamaño, ticket', 'Generador de ICP'],
  ['Dominio, servicio y país', 'Radar de IA mensual'],
]

/** Porcentaje del perfil lleno (el equipo cuenta como un solo dato). */
export function completeness(p: ProfileData) {
  const keys: (keyof ProfileData)[] = ['domain', 'service', 'industry', 'size', 'goal', 'ticket', 'cycle', 'model', 'margin', 'visit', 'mql', 'sql', 'opp', 'win']
  const filled = keys.filter((k) => p[k] !== undefined && p[k] !== '').length + (p.ae !== undefined ? 1 : 0)
  return Math.round((filled / (keys.length + 1)) * 100)
}

const has = (...xs: (number | undefined)[]) => xs.every((x) => typeof x === 'number' && Number.isFinite(x))

/** Valores con que el perfil precarga una herramienta (solo los que tiene; la herramienta los ajusta a sus rangos). */
export function prefillFor(slug: string, p: ProfileData): Record<string, number | string> {
  const out: Record<string, number | string | undefined> = {}
  const conv = has(p.mql, p.sql, p.opp, p.win) ? +((p.mql! * p.sql! * p.opp! * p.win!) / 1e6).toFixed(4) : undefined
  switch (slug) {
    case 'embudo-inverso':
      Object.assign(out, { goal: p.goal, ticket: p.ticket, win: p.win, sql: p.sql, opp: p.opp, mql: p.mql, visit: p.visit })
      break
    case 'presupuesto-marketing':
      Object.assign(out, { goal: p.goal, ticket: p.ticket, conv, margin: p.margin, cycle: p.cycle })
      break
    case 'cpl-maximo':
      Object.assign(out, { ticket: p.ticket, margin: p.margin, conv, visit: p.visit })
      break
    case 'capacidad-comercial':
      Object.assign(out, { goal: p.goal, ticket: p.ticket, win: p.win, opp: p.opp, cycle: p.cycle })
      break
    case 'velocidad-pipeline':
      Object.assign(out, { tk: p.ticket, wr: p.win, cy: p.cycle !== undefined ? p.cycle * 30 : undefined, goal: p.goal !== undefined ? Math.round(p.goal / 4) : undefined })
      break
    case 'brecha-pipeline':
      Object.assign(out, { ticket: p.ticket, goal: p.goal !== undefined ? Math.round(p.goal / 4) : undefined })
      break
    case 'ltv-cac':
      Object.assign(out, { modo: p.model, ...(p.model === 'prj' ? { pgm: p.margin } : { gm: p.margin }) })
      break
    case 'roas-romi-roi':
      Object.assign(out, { margin: p.margin })
      break
    case 'icp':
      Object.assign(out, { industria: p.industry, tam: p.size, ticket: p.ticket, ciclo: p.cycle })
      break
  }
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined && v !== '')) as Record<string, number | string>
}

/** Ajusta valores precargados a los rangos de una herramienta (campos con id, min y max). */
export function fit(defs: readonly { id: string; min: number; max: number }[], vals: Record<string, unknown>) {
  const out: Record<string, number> = {}
  for (const d of defs) {
    const x = vals[d.id]
    if (typeof x === 'number' && Number.isFinite(x)) out[d.id] = Math.min(d.max, Math.max(d.min, x))
  }
  return out
}

/** Mercado del radar de IA a partir del país del perfil. */
export function marketFor(country?: string): 'México' | 'Latinoamérica' | 'España' {
  const c = (country || '').trim().toLowerCase()
  if (!c || c.startsWith('méx') || c.startsWith('mex')) return 'México'
  if (c.startsWith('esp')) return 'España'
  return 'Latinoamérica'
}
