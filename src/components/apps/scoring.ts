/**
 * Constructor de lead scoring (SCORE·01): modelo de dos ejes (perfil e interés) y calibración
 * con la exportación de contactos del usuario. La calibración corre en el navegador.
 */

export type Group = 'fit' | 'eng'
export type Crit = { id: string; g: Group; n: string; p: number }
export type Model = { crit: Crit[]; mql: number; fitMin: number }

export const DEFAULT_MODEL: Model = {
  mql: 50,
  fitMin: 20,
  crit: [
    { id: 'f1', g: 'fit', n: 'Industria: manufactura o distribución', p: 15 },
    { id: 'f2', g: 'fit', n: 'Tamaño: 200 a 2,000 empleados', p: 15 },
    { id: 'f3', g: 'fit', n: 'Puesto: dirección o gerencia', p: 10 },
    { id: 'f4', g: 'fit', n: 'País: México', p: 5 },
    { id: 'f5', g: 'fit', n: 'Correo personal (gmail, hotmail)', p: -15 },
    { id: 'f6', g: 'fit', n: 'Competidor o estudiante', p: -50 },
    { id: 'e1', g: 'eng', n: 'Pidió demo o cotización', p: 30 },
    { id: 'e2', g: 'eng', n: 'Visitó la página de precios', p: 10 },
    { id: 'e3', g: 'eng', n: 'Asistió a un webinar', p: 10 },
    { id: 'e4', g: 'eng', n: 'Descargó un recurso', p: 5 },
    { id: 'e5', g: 'eng', n: 'Abrió 3 o más correos en 30 días', p: 5 },
    { id: 'e6', g: 'eng', n: 'Sin actividad en 90 días', p: -15 },
  ],
}

/** Leads ficticios para probar el modelo. */
export const SAMPLE_LEADS: { n: string; on: string[] }[] = [
  { n: 'Ana · directora de finanzas · manufactura · 600 empleados', on: ['f1', 'f2', 'f3', 'f4', 'e2', 'e3'] },
  { n: 'Luis · analista · comercio · 80 empleados', on: ['f4', 'e4', 'e5'] },
  { n: 'Paola · gerente de TI · distribución · 1,200 empleados', on: ['f1', 'f2', 'f3', 'f4', 'e1'] },
  { n: 'Carlos · correo de gmail · sin empresa', on: ['f5', 'e1', 'e4'] },
  { n: 'Marta · directora · manufactura · 300 empleados', on: ['f1', 'f2', 'f3', 'f4', 'e6'] },
]

export function scoreLead(m: Model, on: string[]) {
  let f = 0
  let e = 0
  for (const id of on) {
    const c = m.crit.find((x) => x.id === id)
    if (!c) continue
    if (c.g === 'fit') f += c.p
    else e += c.p
  }
  const t = f + e
  const level: 'mql' | 'nurture' | 'cold' = t >= m.mql && f >= m.fitMin ? 'mql' : t >= m.mql * 0.6 ? 'nurture' : 'cold'
  return { f, e, t, level, blockedByFit: t >= m.mql && f < m.fitMin }
}

// ───────── Calibración con CSV ─────────
export const MIN_N = 30
const OUTCOME_COL = /(lifecycle|ciclo de vida|etapa del ciclo|lead status|estado del lead|cliente|customer|won|ganad|convirti|closed)/i
const SUCCESS = /(customer|cliente|opportunit|oportunidad|closed ?won|ganad|^s[ií]$|^yes$|^true$|^1$|evangelist)/i
const LEAK = /(lifecycle|ciclo de vida|etapa|stage|deal|negocio|oportunidad|opportunit|close|cierre|won|ganad|revenue|ingreso|owner|propietario)/i
const ENG = /(fuente|source|demo|webinar|visit|descarg|download|form|evento|event|abri|open|page|página|pagina|click|asisti)/i

export function detectOutcome(header: string[]) {
  const i = header.findIndex((h) => OUTCOME_COL.test(h))
  return i >= 0 ? i : header.length - 1
}
export function distinctValues(rows: string[][], col: number, limit = 40) {
  const m = new Map<string, number>()
  for (const r of rows) {
    const v = (r[col] ?? '').trim()
    if (v) m.set(v, (m.get(v) || 0) + 1)
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)
}
export const defaultSuccess = (values: string[]) => values.filter((v) => SUCCESS.test(v))

export type Attr = { col: string; value: string; n: number; wins: number; rate: number; lift: number; pts: number; leak: boolean; group: Group }
export type Calibration = { n: number; wins: number; base: number; attrs: Attr[]; skipped: string[] }

const num = (s: string) => {
  const x = Number(s.replace(/[,\s$]/g, ''))
  return s.trim() !== '' && Number.isFinite(x) ? x : null
}
const pts = (lift: number) => Math.max(-30, Math.min(40, Math.round(10 * Math.log2(Math.max(lift, 1 / 32)))))
const short = (x: number) => (x >= 1000 ? `${Math.round(x / 100) / 10}k` : String(Math.round(x)))

/** Por cada atributo: cuánto convierte contra el promedio (lift) y los puntos que sugiere. */
export function calibrate(table: string[][], outcome: number, success: Set<string>): Calibration {
  const [header, ...rows] = table
  const data = rows.filter((r) => r.some((c) => c && c.trim()))
  const won = data.map((r) => success.has((r[outcome] ?? '').trim()))
  const wins = won.filter(Boolean).length
  const n = data.length
  const base = n ? wins / n : 0
  const attrs: Attr[] = []
  const skipped: string[] = []
  if (!n || !wins || wins === n) return { n, wins, base, attrs, skipped }

  header.forEach((name, col) => {
    if (col === outcome || !name.trim()) return
    const vals = data.map((r) => (r[col] ?? '').trim())
    const filled = vals.filter(Boolean)
    if (filled.length < n * 0.3) return skipped.push(name)
    const nums = filled.map(num)
    const distinct = new Set(filled).size
    let label: (v: string) => string | null
    if (nums.filter((x) => x != null).length >= filled.length * 0.8 && distinct > 12) {
      // Numérica: cuartiles
      const sorted = (nums.filter((x) => x != null) as number[]).sort((a, b) => a - b)
      const q = (p: number) => sorted[Math.floor(p * (sorted.length - 1))]
      const [a, b, c] = [q(0.25), q(0.5), q(0.75)]
      label = (v) => {
        const x = num(v)
        if (x == null) return null
        return x <= a ? `≤ ${short(a)}` : x <= b ? `${short(a)}–${short(b)}` : x <= c ? `${short(b)}–${short(c)}` : `> ${short(c)}`
      }
    } else if (distinct <= 25) {
      label = (v) => v || null
    } else return skipped.push(name)

    const agg = new Map<string, [number, number]>()
    vals.forEach((v, i) => {
      const k = label(v)
      if (!k) return
      const a = agg.get(k) || [0, 0]
      a[0]++
      if (won[i]) a[1]++
      agg.set(k, a)
    })
    for (const [value, [cnt, w]] of agg) {
      if (cnt < MIN_N || /^(no|false|0|n)$/i.test(value)) continue // la ausencia de algo no se puntúa
      const rate = w / cnt
      const lift = rate / base
      attrs.push({ col: name, value, n: cnt, wins: w, rate, lift, pts: pts(lift), leak: LEAK.test(name) || lift >= 15, group: ENG.test(name) ? 'eng' : 'fit' })
    }
  })
  attrs.sort((x, y) => Math.abs(Math.log(Math.max(y.lift, 1 / 32))) - Math.abs(Math.log(Math.max(x.lift, 1 / 32))))
  return { n, wins, base, attrs: attrs.slice(0, 24), skipped }
}

/** Base ficticia para probar la calibración (semilla fija: siempre da lo mismo). */
export function demoTable(): string[][] {
  let s = 11
  const r = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648)
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)]
  const head = ['Industria', 'Número de empleados', 'Puesto', 'Fuente original', 'Pidió demo', 'Asistió a webinar', 'Ciclo de vida']
  const rows = [head]
  for (let i = 0; i < 1400; i++) {
    const ind = pick(['Manufactura', 'Manufactura', 'Distribución', 'Comercio', 'Servicios', 'Educación', 'Gobierno'])
    const emp = Math.round(Math.exp(2.5 + r() * 5.5))
    const role = pick(['Dirección', 'Gerencia', 'Gerencia', 'Analista', 'Analista', 'Estudiante'])
    const src = pick(['Búsqueda orgánica', 'Búsqueda pagada', 'LinkedIn', 'Referido', 'Recurso descargable', 'Recurso descargable'])
    const demo = r() < 0.1 ? 'Sí' : 'No'
    const web = r() < 0.16 ? 'Sí' : 'No'
    let p = 0.02
    if (ind === 'Manufactura' || ind === 'Distribución') p *= 2.2
    if (emp >= 200 && emp <= 2000) p *= 2
    if (role === 'Dirección') p *= 1.8
    if (role === 'Estudiante') p *= 0.1
    if (src === 'Referido') p *= 2.5
    if (src === 'Recurso descargable') p *= 0.6
    if (demo === 'Sí') p *= 5
    if (web === 'Sí') p *= 1.3
    rows.push([ind, String(emp), role, src, demo, web, r() < p ? 'Cliente' : pick(['Lead', 'Lead', 'Suscriptor', 'MQL'])])
  }
  return rows
}
