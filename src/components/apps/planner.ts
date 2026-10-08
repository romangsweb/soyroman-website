/**
 * Modelo del planeador de marketing (PLAN·01): de la cuota de venta por trimestre al
 * pipeline, oportunidades, SQL, MQL y leads que marketing tiene que generar, en qué mes
 * (según el ciclo de venta) y cuánto cubren las actividades planeadas.
 * Lo usan la herramienta y el generador de Excel.
 */

export const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
export const QN = ['Q1', 'Q2', 'Q3', 'Q4'] as const

export const TYPES = {
  ads: ['Medios pagados', '#e85a2a'],
  seo: ['SEO y contenido', '#3ddc84'],
  evento: ['Evento o feria', '#f2c14e'],
  webinar: ['Webinar', '#6ab0ff'],
  caso: ['Caso de éxito', '#c084fc'],
  social: ['Redes sociales', '#2dd4bf'],
  abm: ['ABM / outbound', '#fb7185'],
  tools: ['Herramientas', '#99aaaa'],
  people: ['Personal / agencia', '#d6d3d1'],
  otro: ['Otro', '#777777'],
} as const
export type TypeKey = keyof typeof TYPES
export const STAGES = { atraer: 'Atraer', convertir: 'Convertir', acelerar: 'Acelerar pipeline', retener: 'Retener y expandir', soporte: 'Operación' } as const
export type StageKey = keyof typeof STAGES
export const STATUS = ['Por definir', 'Planificado', 'En curso', 'Hecho', 'Cancelado'] as const
export const LEVELS = ['Baja', 'Media', 'Alta'] as const
export type Dist = 'uniforme' | 'curva' | 'inicio'
export const DISTS: Record<Dist, string> = { uniforme: 'Pareja', curva: 'Decreciente', inicio: 'Todo al inicio' }

/** Supuestos del embudo de una unidad. Porcentajes en 0–100. */
export type Rates = {
  mk: number // % de la venta que origina marketing
  wr: number // oportunidad → venta
  so: number // SQL → oportunidad
  ms: number // MQL → SQL
  lm: number // lead → MQL
  tk: number // ticket promedio
  cy: number // ciclo de venta en meses
}
export const RATE_FIELDS: { id: keyof Rates; label: string; pct: boolean; max: number }[] = [
  { id: 'mk', label: '% de la venta que origina marketing', pct: true, max: 100 },
  { id: 'wr', label: 'Oportunidad → venta', pct: true, max: 100 },
  { id: 'so', label: 'SQL → oportunidad', pct: true, max: 100 },
  { id: 'ms', label: 'MQL → SQL', pct: true, max: 100 },
  { id: 'lm', label: 'Lead → MQL', pct: true, max: 100 },
  { id: 'tk', label: 'Ticket promedio', pct: false, max: 1e9 },
  { id: 'cy', label: 'Ciclo de venta (meses)', pct: false, max: 12 },
]

export type Unit = {
  name: string
  quota: [number, number, number, number]
  open: number // pipeline abierto que cierra en Q1
  next: number // cuota del Q1 del año siguiente (para planear lo que se genera en Q4)
  budget: number
  fund: number // cofinanciamiento de partners
  r: Rates
}
export type Act = {
  u: string
  n: string
  t: TypeKey
  g: StageKey
  o: string
  s: number // mes de inicio 0-11
  e: number // mes de fin 0-11
  b: number // presupuesto
  real: number // gasto real a la fecha
  d: Dist
  l: number // meta de leads
  st: (typeof STATUS)[number]
}
export type Risk = { r: string; p: (typeof LEVELS)[number]; i: (typeof LEVELS)[number]; m: string; o: string }
export type Strategy = Record<'exec' | 'f' | 'd' | 'o' | 'a' | 'icp' | 'vp' | 'comp' | 'sup', string>
export type ActualKey = 'spend' | 'leads' | 'mql' | 'sql' | 'opp' | 'pipe'
export type Plan = {
  v: 1
  name: string
  year: number
  cur: 'MXN' | 'USD'
  units: Unit[]
  acts: Act[]
  str: Strategy
  risks: Risk[]
  scen: { low: number; high: number } // factor sobre la conversión lead → venta (base = 100)
  actual: Record<ActualKey, (number | null)[]>
}

export const STRATEGY_FIELDS: { id: keyof Strategy; label: string; ph: string }[] = [
  { id: 'exec', label: 'Resumen ejecutivo', ph: 'En 3 líneas: meta, apuesta principal y qué necesitas' },
  { id: 'f', label: 'Fortalezas', ph: '' },
  { id: 'd', label: 'Debilidades', ph: '' },
  { id: 'o', label: 'Oportunidades', ph: '' },
  { id: 'a', label: 'Amenazas', ph: '' },
  { id: 'icp', label: 'Cliente ideal (ICP) y comité de compra', ph: 'Industria, tamaño, región, quién decide y quién influye' },
  { id: 'vp', label: 'Propuesta de valor y mensajes clave', ph: '' },
  { id: 'comp', label: 'Competidores', ph: '' },
  { id: 'sup', label: 'Supuestos del plan', ph: 'De dónde salen las tasas, el ticket y el ciclo' },
]
export const ACTUAL_ROWS: { id: ActualKey; label: string; money: boolean }[] = [
  { id: 'spend', label: 'Gasto', money: true },
  { id: 'leads', label: 'Leads', money: false },
  { id: 'mql', label: 'MQL', money: false },
  { id: 'sql', label: 'SQL', money: false },
  { id: 'opp', label: 'Oportunidades', money: false },
  { id: 'pipe', label: 'Pipeline creado', money: true },
]

const rates = (mk: number, wr: number, tk: number, cy: number): Rates => ({ mk, wr, so: 60, ms: 25, lm: 40, tk, cy })
const empty12 = () => Array<number | null>(12).fill(null)

/** Ejemplo ficticio y genérico (empresa B2B con tres unidades). */
export const EXAMPLE: Plan = {
  v: 1,
  name: 'Plan de marketing',
  year: 2027,
  cur: 'MXN',
  units: [
    { name: 'Producto A', quota: [1500000, 2000000, 2000000, 2500000], open: 600000, next: 2500000, budget: 1500000, fund: 0, r: rates(40, 25, 250000, 3) },
    { name: 'Producto B', quota: [1000000, 1200000, 1200000, 1500000], open: 300000, next: 1500000, budget: 1200000, fund: 40000, r: rates(40, 25, 180000, 3) },
    { name: 'Servicios', quota: [400000, 400000, 400000, 400000], open: 0, next: 400000, budget: 400000, fund: 0, r: { ...rates(30, 35, 60000, 1), ms: 35 } },
  ],
  acts: [
    { u: 'Producto A', n: 'Campaña de búsqueda y LinkedIn', t: 'ads', g: 'atraer', o: 'Ana', s: 0, e: 11, b: 420000, real: 0, d: 'curva', l: 360, st: 'En curso' },
    { u: 'Producto A', n: 'SEO y blog', t: 'seo', g: 'atraer', o: 'Agencia', s: 0, e: 11, b: 300000, real: 0, d: 'uniforme', l: 120, st: 'En curso' },
    { u: 'Producto A', n: 'Evento con clientes', t: 'evento', g: 'acelerar', o: 'Luis', s: 3, e: 3, b: 30000, real: 0, d: 'uniforme', l: 25, st: 'Planificado' },
    { u: 'Producto A', n: 'Webinar: casos de uso', t: 'webinar', g: 'convertir', o: 'Ana', s: 4, e: 4, b: 0, real: 0, d: 'uniforme', l: 40, st: 'Por definir' },
    { u: 'Producto A', n: 'Caso de éxito', t: 'caso', g: 'acelerar', o: 'Luis', s: 4, e: 5, b: 25000, real: 0, d: 'uniforme', l: 0, st: 'Por definir' },
    { u: 'Producto B', n: 'Campaña de búsqueda', t: 'ads', g: 'atraer', o: 'Ana', s: 0, e: 11, b: 400000, real: 0, d: 'curva', l: 300, st: 'En curso' },
    { u: 'Producto B', n: 'Feria regional', t: 'evento', g: 'atraer', o: 'Paola', s: 5, e: 5, b: 50000, real: 0, d: 'uniforme', l: 60, st: 'Planificado' },
    { u: 'Producto B', n: 'ABM a 40 cuentas objetivo', t: 'abm', g: 'acelerar', o: 'Paola', s: 6, e: 8, b: 80000, real: 0, d: 'uniforme', l: 20, st: 'Por definir' },
    { u: 'Producto B', n: 'Contenido en redes', t: 'social', g: 'atraer', o: 'Paola', s: 0, e: 11, b: 60000, real: 0, d: 'uniforme', l: 30, st: 'En curso' },
    { u: 'Servicios', n: 'Webinar: mejores prácticas', t: 'webinar', g: 'convertir', o: 'Luis', s: 8, e: 8, b: 0, real: 0, d: 'uniforme', l: 30, st: 'Por definir' },
    { u: 'Servicios', n: 'Correo a clientes actuales', t: 'otro', g: 'retener', o: 'Luis', s: 0, e: 11, b: 0, real: 0, d: 'uniforme', l: 40, st: 'En curso' },
    { u: 'Servicios', n: 'CRM y automatización', t: 'tools', g: 'soporte', o: 'Ana', s: 0, e: 11, b: 60000, real: 0, d: 'uniforme', l: 0, st: 'En curso' },
    { u: 'Producto A', n: 'Equipo de marketing (nómina)', t: 'people', g: 'soporte', o: '—', s: 0, e: 11, b: 900000, real: 0, d: 'uniforme', l: 0, st: 'En curso' },
  ],
  str: {
    exec: 'Marketing debe originar alrededor del 40% de la venta del año. El plan prioriza búsqueda pagada y SEO en el primer semestre y ABM a cuentas grandes en el segundo.',
    f: 'Casos de éxito en las industrias objetivo.\nEquipo con dominio de CRM y automatización.',
    d: 'Poca presencia en LinkedIn.\nDependencia de una sola fuente de leads (búsqueda pagada).',
    o: 'Empresas medianas renovando sus sistemas en los próximos 2 años.\nBuscadores con IA que todavía no citan a la competencia.',
    a: 'Competidores con más presupuesto en ferias.\nAlza en el costo por clic.',
    icp: 'Empresas de 200 a 2,000 empleados en manufactura y distribución.\nDecide: dirección de finanzas y de TI. Influyen operaciones y compras.',
    vp: 'Implementación en tiempo fijo, con un equipo que ya lo hizo en tu industria.\nMensajes: menos riesgo, menos tiempo, menos retrabajo.',
    comp: 'Competidor 1: precio bajo, poca experiencia en la industria.\nCompetidor 2: marca fuerte, tiempos largos.',
    sup: 'Las tasas de conversión salen del promedio de los últimos 12 meses en el CRM.',
  },
  risks: [
    { r: 'Las ferias no generan los leads esperados', p: 'Media', i: 'Alta', m: 'Medir leads por evento y mover presupuesto a búsqueda en Q3', o: 'Paola' },
    { r: 'El ciclo de venta resulta más largo de lo supuesto', p: 'Media', i: 'Alta', m: 'Adelantar campañas de Q4 a Q3 y sumar acciones de cierre', o: 'Ana' },
    { r: 'Recorte de presupuesto a mitad de año', p: 'Baja', i: 'Media', m: 'Recortar primero lo que menos pipeline genera por peso', o: 'Luis' },
  ],
  scen: { low: 80, high: 115 },
  actual: { spend: empty12(), leads: empty12(), mql: empty12(), sql: empty12(), opp: empty12(), pipe: empty12() },
}

export const blankUnit = (name: string, r: Rates = EXAMPLE.units[0].r): Unit => ({ name, quota: [0, 0, 0, 0], open: 0, next: 0, budget: 0, fund: 0, r: { ...r } })
export const blankAct = (u: string): Act => ({ u, n: 'Nueva actividad', t: 'otro', g: 'atraer', o: '', s: 0, e: 2, b: 0, real: 0, d: 'uniforme', l: 0, st: 'Por definir' })

// ───────── cálculos ─────────
const pc = (x: number) => x / 100
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
export const qSum = (arr: number[], q: number, off = 0) => sum(arr.slice(off + q * 3, off + q * 3 + 3))

export function qOf(a: Pick<Act, 's' | 'e'>) {
  if (a.s === 0 && a.e === 11) return 'Anual'
  const qs = Math.floor(a.s / 3)
  const qe = Math.floor(a.e / 3)
  return qs === qe ? `Q${qs + 1}` : `Q${qs + 1}–Q${qe + 1}`
}
/** Meses que corresponden a un Q elegido en la tabla. */
export function monthsOfQ(q: string): [number, number] | null {
  if (q === 'Anual') return [0, 11]
  const m = /^Q([1-4])$/.exec(q)
  return m ? [(+m[1] - 1) * 3, (+m[1] - 1) * 3 + 2] : null
}

/** Gasto por mes de una actividad. */
export function monthly(a: Pick<Act, 's' | 'e' | 'b' | 'd'>) {
  const out = Array<number>(12).fill(0)
  const n = a.e - a.s + 1
  if (n <= 0) return out
  if (a.d === 'inicio') {
    out[a.s] = a.b
    return out
  }
  if (a.d === 'curva') {
    const w = Array.from({ length: n }, (_, i) => Math.max(0.4, n - i * 0.6))
    const sw = sum(w)
    for (let i = 0; i < n; i++) out[a.s + i] = Math.round((a.b * w[i]) / sw)
    return out
  }
  for (let i = a.s; i <= a.e; i++) out[i] = Math.round(a.b / n)
  return out
}
/** Leads por mes de una actividad (reparto parejo en los meses activos). */
export function leadsM(a: Pick<Act, 's' | 'e' | 'l'>) {
  const out = Array<number>(12).fill(0)
  const n = a.e - a.s + 1
  for (let i = a.s; i <= a.e; i++) out[i] = a.l / n
  return out
}
/** Conversión total lead → venta. */
export const conv = (r: Rates) => pc(r.lm) * pc(r.ms) * pc(r.so) * pc(r.wr)
const leadToPipe = (r: Rates) => pc(r.lm) * pc(r.ms) * pc(r.so) * r.tk
export const unitOf = (p: Plan, name: string) => p.units.find((u) => u.name === name)
/** Pipeline que se espera de una actividad: leads × tasas de su unidad × ticket. */
export function pipeAct(p: Plan, a: Act) {
  const u = unitOf(p, a.u)
  return u ? a.l * leadToPipe(u.r) : 0
}

export type Row = { q: number; mq: number; pipe: number; opp: number; sql: number; mql: number; leads: number }
const safe = (x: number) => (Number.isFinite(x) ? x : 0)
function fromPipe(r: Rates, q: number, mq: number, pipe: number): Row {
  const opp = safe(pipe / r.tk)
  const sql = safe(opp / pc(r.so))
  const mql = safe(sql / pc(r.ms))
  return { q, mq, pipe, opp, sql, mql, leads: safe(mql / pc(r.lm)) }
}
/** Embudo inverso por trimestre de cierre. */
export function funnel(u: Unit): Row[] {
  return u.quota.map((q, i) => {
    const mq = q * pc(u.r.mk)
    let pipe = safe(mq / pc(u.r.wr))
    if (i === 0) pipe = Math.max(0, pipe - (u.open || 0))
    return fromPipe(u.r, q, mq, pipe)
  })
}
const nextRow = (u: Unit) => {
  const mq = (u.next || 0) * pc(u.r.mk)
  return fromPipe(u.r, u.next || 0, mq, safe(mq / pc(u.r.wr)))
}
export const sumRows = (rows: Row[][]) =>
  [0, 1, 2, 3].map((i) => rows.reduce((z, r) => ({ q: z.q + r[i].q, mq: z.mq + r[i].mq, pipe: z.pipe + r[i].pipe, opp: z.opp + r[i].opp, sql: z.sql + r[i].sql, mql: z.mql + r[i].mql, leads: z.leads + r[i].leads }), { q: 0, mq: 0, pipe: 0, opp: 0, sql: 0, mql: 0, leads: 0 }))

/**
 * Cuándo hay que generar cada lead: 24 meses (0–11 = año anterior, 12–23 = año del plan).
 * Lo que se genera en los últimos meses alimenta el Q1 del año siguiente (`next`).
 */
export function need(u: Unit) {
  const rows = [...funnel(u), nextRow(u)]
  const gen = Array<number>(24).fill(0)
  const pgen = Array<number>(24).fill(0)
  rows.forEach((x, q) => {
    for (let m = 0; m < 3; m++) {
      const gi = 12 + q * 3 + m - u.r.cy
      if (gi >= 0 && gi < 24) {
        gen[gi] += x.leads / 3
        pgen[gi] += x.pipe / 3
      }
    }
  })
  return { gen, pgen }
}
export function plannedLeads(p: Plan, unit?: string) {
  const out = Array<number>(12).fill(0)
  p.acts.filter((a) => !unit || a.u === unit).forEach((a) => leadsM(a).forEach((x, i) => (out[i] += x)))
  return out
}
export function spendByMonth(p: Plan, unit?: string) {
  const out = Array<number>(12).fill(0)
  p.acts.filter((a) => !unit || a.u === unit).forEach((a) => monthly(a).forEach((x, i) => (out[i] += x)))
  return out
}

export type Coverage = { name: string; pre: number; need: number[]; plan: number[]; needM: number[]; planM: number[] }
/** Leads necesarios (por trimestre en que se generan) contra leads planeados. */
export function coverage(p: Plan): { units: Coverage[]; total: Coverage } {
  const units = p.units.map((u) => {
    const { gen } = need(u)
    const planM = plannedLeads(p, u.name)
    return { name: u.name, pre: sum(gen.slice(0, 12)), need: [0, 1, 2, 3].map((q) => qSum(gen, q, 12)), plan: [0, 1, 2, 3].map((q) => qSum(planM, q)), needM: gen, planM }
  })
  const add = (k: 'need' | 'plan' | 'needM' | 'planM') => units.reduce((z, u) => z.map((x, i) => x + u[k][i]), Array<number>(k === 'needM' ? 24 : k === 'planM' ? 12 : 4).fill(0))
  return { units, total: { name: 'Total', pre: sum(units.map((u) => u.pre)), need: add('need'), plan: add('plan'), needM: add('needM'), planM: add('planM') } }
}

/** Metas mensuales del embudo según el mes en que se generan (las que sigue marketing). */
export function monthlyTargets(p: Plan) {
  const z = () => Array<number>(12).fill(0)
  const t = { leads: z(), mql: z(), sql: z(), opp: z(), pipe: z() }
  p.units.forEach((u) => {
    const { gen } = need(u)
    for (let m = 0; m < 12; m++) {
      const l = gen[12 + m]
      t.leads[m] += l
      t.mql[m] += l * pc(u.r.lm)
      t.sql[m] += l * pc(u.r.lm) * pc(u.r.ms)
      t.opp[m] += l * pc(u.r.lm) * pc(u.r.ms) * pc(u.r.so)
      t.pipe[m] += l * leadToPipe(u.r)
    }
  })
  return t
}

/** Escenarios: la conversión lead → venta se mueve un % (base = 100). */
export function scenarios(p: Plan) {
  const cov = coverage(p)
  const needYear = sum(cov.total.need)
  const planYear = sum(cov.total.planM)
  const target = sum(p.units.map((u) => u.quota.reduce((a, b) => a + b, 0) * pc(u.r.mk)))
  const expected = sum(p.units.map((u) => sum(plannedLeads(p, u.name)) * conv(u.r) * u.r.tk))
  return [
    { k: 'low', label: 'Conservador', f: p.scen.low },
    { k: 'base', label: 'Base', f: 100 },
    { k: 'high', label: 'Agresivo', f: p.scen.high },
  ].map((s) => {
    const f = Math.max(s.f, 1) / 100
    const needed = needYear / f
    const sales = expected * f
    return { ...s, needed, planned: planYear, cover: needed ? planYear / needed : 0, sales, ofTarget: target ? sales / target : 0 }
  })
}

export function budget(p: Plan) {
  const per = p.units.map((u) => {
    const acts = p.acts.filter((a) => a.u === u.name)
    const plan = sum(acts.map((a) => a.b))
    const real = sum(acts.map((a) => a.real || 0))
    const quota = sum(u.quota)
    return { name: u.name, assigned: u.budget, fund: u.fund, plan, real, free: u.budget + u.fund - plan, quota }
  })
  const t = per.reduce((z, x) => ({ assigned: z.assigned + x.assigned, fund: z.fund + x.fund, plan: z.plan + x.plan, real: z.real + x.real, free: z.free + x.free, quota: z.quota + x.quota }), { assigned: 0, fund: 0, plan: 0, real: 0, free: 0, quota: 0 })
  const months = spendByMonth(p)
  const pipe = sum(p.acts.map((a) => pipeAct(p, a)))
  const opps = sum(p.acts.map((a) => {
    const u = unitOf(p, a.u)
    return u ? (pipeAct(p, a) / u.r.tk) : 0
  }))
  return { per, t, months, quarters: [0, 1, 2, 3].map((q) => qSum(months, q)), pipe, opps }
}

/** Revisa que un plan guardado tenga la forma esperada (localStorage). */
export function isPlan(x: unknown): x is Plan {
  const p = x as Plan
  return !!p && p.v === 1 && Array.isArray(p.units) && Array.isArray(p.acts) && !!p.str && Array.isArray(p.risks) && !!p.actual && !!p.scen &&
    p.units.every((u) => u && typeof u.name === 'string' && Array.isArray(u.quota) && u.quota.length === 4 && !!u.r)
}
