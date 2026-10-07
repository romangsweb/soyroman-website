/** Modelo de la brecha de pipeline (lo usan la herramienta y la hoja imprimible). */
export type Stage = { name: string; amount: number; prob: number } // prob = % de ganar DENTRO del periodo
export type PipelineIn = { goal: number; won: number; ticket: number; l2o: number; stages: Stage[] }

export const DEFAULTS: PipelineIn = {
  goal: 450000,
  won: 120000,
  ticket: 25000,
  l2o: 5,
  stages: [
    { name: 'Calificación', amount: 180000, prob: 10 },
    { name: 'Diagnóstico', amount: 140000, prob: 25 },
    { name: 'Propuesta', amount: 120000, prob: 50 },
    { name: 'Negociación', amount: 60000, prob: 75 },
  ],
}

export function pipeline(i: PipelineIn) {
  const rows = i.stages.map((s) => ({ ...s, weighted: s.amount * (s.prob / 100) }))
  const open = rows.reduce((a, r) => a + r.amount, 0)
  const weighted = rows.reduce((a, r) => a + r.weighted, 0)
  const forecast = i.won + weighted
  const remaining = Math.max(0, i.goal - i.won)
  const gap = Math.max(0, i.goal - forecast)
  const last = rows[rows.length - 1]
  const commit = i.won + (last ? last.weighted : 0) // caso seguro: solo la última etapa
  const best = i.won + open
  const earlyProb = Math.max((rows[0]?.prob || 10) / 100, 0.01)
  const newPipe = gap / earlyProb
  const opps = newPipe / Math.max(i.ticket, 1)
  const leads = opps / Math.max(i.l2o / 100, 1e-4)
  return {
    rows,
    open,
    weighted,
    forecast,
    remaining,
    gap,
    commit,
    best,
    coverage: remaining > 0 ? open / remaining : 0,
    attainment: forecast / Math.max(i.goal, 1),
    earlyProb,
    newPipe,
    opps,
    leads,
  }
}
