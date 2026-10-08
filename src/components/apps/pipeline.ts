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

/** Generador pseudoaleatorio con semilla: mismo resultado en servidor y navegador. */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Probabilidad de cerrar lo que falta (meta − ganado) con el pipeline abierto: cada etapa se
 * parte en negocios del tamaño del ticket y cada uno se gana o no con la probabilidad de su
 * etapa. También busca cuántas oportunidades nuevas (en la primera etapa) llevan a 80%.
 */
export function montecarlo(i: PipelineIn, runs = 10000) {
  const target = Math.max(0, i.goal - i.won)
  const ticket = Math.max(i.ticket, 1)
  const deals: [number, number][] = []
  for (const s of i.stages) {
    if (s.amount <= 0) continue
    const k = Math.min(200, Math.max(1, Math.round(s.amount / ticket)))
    for (let j = 0; j < k; j++) deals.push([s.amount / k, s.prob / 100])
  }
  const early = Math.max((i.stages[0]?.prob || 10) / 100, 0.01)
  const sim = (extra: number, n: number) => {
    const rand = rng(7)
    const res = new Float64Array(n)
    let hit = 0
    for (let r = 0; r < n; r++) {
      let t = 0
      for (const [v, p] of deals) if (rand() < p) t += v
      for (let j = 0; j < extra; j++) if (rand() < early) t += ticket
      res[r] = t
      if (t >= target) hit++
    }
    return { p: hit / n, res }
  }
  if (target === 0) return { p: 1, hist: [] as number[], max: 0, target, extra: 0, early }
  const base = sim(0, runs)
  let extra = 0
  if (base.p < 0.8) {
    let lo = 0
    let hi = 1
    while (sim(hi, 3000).p < 0.8 && hi < 400) hi *= 2
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (sim(mid, 3000).p >= 0.8) hi = mid
      else lo = mid
    }
    extra = hi
  }
  const max = Math.max(...base.res, target, 1)
  const B = 30
  const hist = Array<number>(B).fill(0)
  base.res.forEach((x) => hist[Math.min(B - 1, Math.floor((x / max) * B))]++)
  return { p: base.p, hist, max, target, extra, early }
}
