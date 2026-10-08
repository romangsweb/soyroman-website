/** Velocidad de pipeline (VEL·01): cuánto dinero sale del pipeline por día y de dónde viene el cambio. */

export type VelIn = { opp: number; tk: number; wr: number; cy: number } // wr en %, cy en días
export const DAYS_Q = 91

/** Oportunidades × ticket × tasa de cierre ÷ ciclo = ingreso por día. */
export const velocity = (v: VelIn) => (v.cy > 0 ? (v.opp * v.tk * (v.wr / 100)) / v.cy : 0)

/** Cuánto tendría que moverse cada palanca, sola, para llegar a una meta del trimestre. */
export function levers(v: VelIn, goalQ: number) {
  const now = velocity(v)
  const need = goalQ / DAYS_Q
  const k = now > 0 ? need / now : 0
  return [
    { id: 'opp', label: 'Oportunidades', cur: v.opp, to: v.opp * k, dir: 1 },
    { id: 'tk', label: 'Ticket', cur: v.tk, to: v.tk * k, dir: 1 },
    { id: 'wr', label: 'Tasa de cierre', cur: v.wr, to: v.wr * k, dir: 1, cap: 100 },
    { id: 'cy', label: 'Ciclo de venta', cur: v.cy, to: k > 0 ? v.cy / k : 0, dir: -1 },
  ].map((l) => ({ ...l, change: l.cur ? l.to / l.cur - 1 : 0, impossible: l.cap != null && l.to > l.cap }))
}

/**
 * Reparte el cambio de velocidad entre las cuatro palancas. Usa logaritmos para que el
 * resultado no dependa del orden en que se aplican los cambios; los puntos suman el cambio total.
 */
export function decompose(before: VelIn, after: VelIn) {
  const v0 = velocity(before)
  const v1 = velocity(after)
  const change = v0 ? v1 / v0 - 1 : 0
  const ln = (a: number, b: number) => (a > 0 && b > 0 ? Math.log(a / b) : 0)
  const parts = [
    { id: 'opp', label: 'Oportunidades', l: ln(after.opp, before.opp) },
    { id: 'tk', label: 'Ticket', l: ln(after.tk, before.tk) },
    { id: 'wr', label: 'Tasa de cierre', l: ln(after.wr, before.wr) },
    { id: 'cy', label: 'Ciclo de venta', l: -ln(after.cy, before.cy) },
  ]
  const total = parts.reduce((s, p) => s + p.l, 0)
  return { v0, v1, change, parts: parts.map((p) => ({ ...p, pts: total ? (p.l / total) * change * 100 : 0 })) }
}
