/** Modelo del planificador de presupuesto (lo usan la herramienta y la hoja imprimible). */
export type BudgetIn = {
  goal: number // meta de ingresos nuevos / año (USD)
  ticket: number // ticket promedio (USD)
  conv: number // lead → cliente (%)
  paid: number // leads que vienen de medios pagados (%)
  cpl: number // costo por lead pagado (USD)
  margin: number // margen bruto (%)
  cycle: number // ciclo de venta (meses)
  tools: number // herramientas (USD / mes)
  content: number // contenido y agencia (USD / mes)
  team: number // equipo de marketing (USD / mes)
}

export type Field = { id: keyof BudgetIn; key: string; label: string; unit: string; step: number; min: number; max: number }

// Valores por defecto = los del Embudo inverso (1.5M, ticket 25k, conversión global 40 % × 6.5 % × 50 % × 25 % ≈ 0.33 %)
export const DEFAULTS: BudgetIn = {
  goal: 1500000, ticket: 25000, conv: 0.33, paid: 60, cpl: 25, margin: 40, cycle: 4, tools: 600, content: 2500, team: 6000,
}

export const FIELDS: Field[] = [
  { id: 'goal', key: 'A', label: 'Meta de ingresos nuevos / año', unit: 'USD', step: 10000, min: 10000, max: 100000000 },
  { id: 'ticket', key: 'B', label: 'Ticket promedio', unit: 'USD por negocio', step: 500, min: 100, max: 10000000 },
  { id: 'conv', key: 'C', label: 'Lead → cliente', unit: '% global del embudo', step: 0.01, min: 0.01, max: 100 },
  { id: 'paid', key: 'D', label: 'Leads de medios pagados', unit: '% del total', step: 1, min: 0, max: 100 },
  { id: 'cpl', key: 'E', label: 'Costo por lead pagado', unit: 'USD', step: 1, min: 0, max: 100000 },
  { id: 'margin', key: 'F', label: 'Margen bruto', unit: '%', step: 1, min: 1, max: 100 },
  { id: 'cycle', key: 'G', label: 'Ciclo de venta', unit: 'meses', step: 1, min: 0, max: 36 },
  { id: 'tools', key: 'H', label: 'Herramientas (CRM, automatización)', unit: 'USD / mes', step: 50, min: 0, max: 1000000 },
  { id: 'content', key: 'I', label: 'Contenido y agencia', unit: 'USD / mes', step: 100, min: 0, max: 1000000 },
  { id: 'team', key: 'J', label: 'Equipo de marketing', unit: 'USD / mes', step: 500, min: 0, max: 10000000 },
]

export const CHANNELS = [
  { id: 'search', name: 'Búsqueda', mix: 45, color: '#e85a2a' },
  { id: 'linkedin', name: 'LinkedIn', mix: 30, color: '#26292b' },
  { id: 'meta', name: 'Meta', mix: 10, color: '#7c868d' },
  { id: 'otros', name: 'Eventos y otros', mix: 15, color: '#b9a27a' },
]

export function budget(i: BudgetIn, mix: number[]) {
  const customers = i.goal / Math.max(i.ticket, 1)
  const leadsY = customers / Math.max(i.conv / 100, 1e-6)
  const media = leadsY * (i.paid / 100) * i.cpl
  const fixed = (i.tools + i.content + i.team) * 12
  const total = media + fixed
  const mixT = mix.reduce((a, b) => a + b, 0) || 1
  return {
    customers,
    leadsY,
    media,
    fixed,
    total,
    share: total / Math.max(i.goal, 1),
    cac: total / Math.max(customers, 1e-6),
    romi: (i.goal * (i.margin / 100) - total) / Math.max(total, 1),
    cash: (total / 12) * i.cycle,
    parts: [
      { name: 'Medios', value: media, color: '#e85a2a' },
      { name: 'Herramientas', value: i.tools * 12, color: '#26292b' },
      { name: 'Contenido', value: i.content * 12, color: '#7c868d' },
      { name: 'Equipo', value: i.team * 12, color: '#b9a27a' },
    ],
    channels: CHANNELS.map((c, k) => ({ ...c, pct: (mix[k] || 0) / mixT, monthly: (media * ((mix[k] || 0) / mixT)) / 12 })),
  }
}
