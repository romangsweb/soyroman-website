// Solo servidor: lo importa la ruta /next/compare

import { AuditError, runAudit } from './aeoAudit'
import { cruxField } from './speedScan'
import { runStackScan } from './stackScan'

/**
 * Comparador: corre el auditor AEO, la radiografía de stack y los datos de campo de Chrome
 * para 2 o 3 dominios en paralelo y los resume en una fila por dominio.
 */

export type Side = {
  domain: string
  error?: string
  aeo: number | null
  lcp: number | null
  inp: number | null
  cls: number | null
  cwv: boolean | null
  crm: string[] | null
  scheduling: string[] | null
  ads: string[] | null
  analytics: string[] | null
  dmarc: string | null
  tools: number | null
}

const META = new Set(['HTTPS', 'SPF', 'DMARC', 'Formulario en el sitio', 'Aviso de cookies propio'])
const SCHED = ['Calendly', 'HubSpot Meetings', 'Cal.com']

async function side(domain: string): Promise<Side> {
  const [audit, stack, crux] = await Promise.allSettled([
    runAudit(domain),
    runStackScan(domain),
    process.env.PAGESPEED_API_KEY ? cruxField(domain, 'mobile') : Promise.resolve(null),
  ])
  const a = audit.status === 'fulfilled' ? audit.value : null
  const s = stack.status === 'fulfilled' ? stack.value : null
  const f = crux.status === 'fulfilled' ? crux.value : null
  const err = [audit, stack].find((x) => x.status === 'rejected') as PromiseRejectedResult | undefined
  const hits = s ? s.bands.flatMap((b) => b.hits) : []
  const names = (band: string) => (s ? hits.filter((h) => h.band === band).map((h) => h.name) : null)
  const m = (id: string) => f?.metrics.find((x) => x.id === id)?.p75 ?? null
  const dm = hits.find((h) => h.name === 'DMARC')
  return {
    domain,
    error: !a && !s ? (err?.reason instanceof AuditError ? err.reason.message : 'No respondió.') : undefined,
    aeo: a?.score ?? null,
    lcp: m('lcp'),
    inp: m('inp'),
    cls: m('cls'),
    cwv: f?.passes ?? null,
    crm: names('crm'),
    scheduling: s ? hits.filter((h) => SCHED.includes(h.name)).map((h) => h.name) : null,
    ads: names('ads'),
    analytics: names('analytics'),
    dmarc: s ? (dm ? (dm.note === 'aplicado' ? 'aplicado' : 'p=none') : 'no tiene') : null,
    tools: s ? hits.filter((h) => !META.has(h.name)).length : null,
  }
}

export async function runCompare(domains: string[]): Promise<{ sides: Side[]; at: string }> {
  const sides = await Promise.all(domains.map(side))
  return { sides, at: new Date().toISOString() }
}
