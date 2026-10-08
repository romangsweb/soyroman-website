/** LTV:CAC y payback (LTV·01). El LTV se calcula sobre margen bruto, no sobre ingreso. */

export type LtvIn = {
  mode: 'rec' | 'prj'
  mkt: number // gasto de marketing en el periodo
  sales: number // gasto de ventas en el periodo
  newc: number // clientes nuevos en el periodo
  prj: number // proyecto inicial (solo modo prj)
  pgm: number // margen del proyecto %
  arpa: number // ingreso recurrente al mes por cliente
  gm: number // margen bruto de lo recurrente %
  churn: number // % de clientes que se van al mes
}
export const MAX_LIFE = 120 // meses: tope para no inflar el LTV con cancelaciones casi nulas
export const HORIZON = 60

export function ltv(i: LtvIn) {
  const cac = i.newc > 0 ? (i.mkt + i.sales) / i.newc : 0
  const monthly = i.arpa * (i.gm / 100)
  const life = i.churn > 0 ? Math.min(1 / (i.churn / 100), MAX_LIFE) : MAX_LIFE
  const upfront = i.mode === 'prj' ? i.prj * (i.pgm / 100) : 0
  const value = upfront + monthly * life
  // Margen acumulado de un cliente, con la probabilidad de seguir activo cada mes
  const curve = [upfront - cac]
  let payback: number | null = upfront >= cac ? 0 : null
  let cum = upfront - cac
  for (let m = 1; m <= HORIZON; m++) {
    cum += monthly * Math.pow(1 - i.churn / 100, m - 1)
    curve.push(cum)
    if (payback == null && cum >= 0) payback = m
  }
  return { cac, monthly, life, upfront, ltv: value, ratio: cac > 0 ? value / cac : 0, payback, curve, upShare: value ? upfront / value : 0 }
}
