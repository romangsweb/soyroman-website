/**
 * Auditoría de base de CRM: corre en el navegador del visitante (el CSV nunca sale de su equipo).
 * Detecta columnas por nombre (español/inglés) de exportaciones de HubSpot, Salesforce, Pipedrive o Zoho.
 * La "salud" es una calificación propia de soyroman que pondera los indicadores; no es un estándar de la industria.
 */

export const MAX_ROWS = 100_000

const FREE = /@(gmail|googlemail|hotmail|outlook|yahoo|live|icloud|me|aol|protonmail|proton|msn|prodigy|yandex|gmx)\./i
const COLS: Record<string, RegExp> = {
  email: /^(e-?mail|correo|email address|correo electr|dirección de correo)/i,
  first: /^(first ?name|nombre)$/i,
  last: /^(last ?name|apellidos?)$/i,
  company: /^(company|empresa|company name|nombre de la empresa|account name|organización|organization)/i,
  owner: /(owner|propietario)/i,
  stage: /(lifecycle|ciclo de vida|lead status|estado del lead|etapa)/i,
  last_act: /(last activity|última actividad|ultima actividad|last contacted|último contacto|ultimo contacto|last modified)/i,
  phone: /(phone|teléfono|telefono|móvil|movil)/i,
  title: /(job ?title|cargo|puesto|title)/i,
}
export const FIELD_LABEL: Record<string, string> = { email: 'Correo', company: 'Empresa', owner: 'Propietario', stage: 'Etapa del ciclo', phone: 'Teléfono', title: 'Cargo' }

/** CSV con comillas, coma o punto y coma como separador. */
export function parseCSV(text: string): string[][] {
  const firstLine = text.slice(0, text.indexOf('\n') > 0 ? text.indexOf('\n') : 2000)
  const sep = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ','
  const rows: string[][] = []
  let row: string[] = []
  let f = ''
  let q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { f += '"'; i++ } else q = false
      } else f += c
    } else if (c === '"') q = true
    else if (c === sep) { row.push(f); f = '' }
    else if (c === '\n') {
      row.push(f); rows.push(row); row = []; f = ''
      if (rows.length > MAX_ROWS + 1) break
    } else if (c !== '\r') f += c
  }
  if (f || row.length) { row.push(f); rows.push(row) }
  return rows
}

export type CrmAudit = {
  total: number
  columns: string[] // campos detectados
  dupEmail: number
  dupName: number
  invalid: number
  personal: number
  noEmail: number
  noOwner: number | null
  stale: number
  withDate: number
  completeness: Record<string, number>
  stages: [string, number][]
  score: number
  truncated: boolean
  findings: { title: string; fix: string; weight: number }[]
}

export function auditRows(rows: string[][]): CrmAudit {
  if (rows.length < 2) throw new Error('El archivo no tiene filas de datos.')
  const header = rows[0].map((h) => h.replace(/^﻿/, '').trim())
  const idx: Record<string, number> = {}
  for (const [k, re] of Object.entries(COLS)) {
    const i = header.findIndex((h) => re.test(h))
    if (i >= 0 && !Object.values(idx).includes(i)) idx[k] = i
  }
  if (idx.email == null && idx.company == null) throw new Error('No encontré columnas de correo ni de empresa. ¿Es una exportación de contactos?')
  const truncated = rows.length - 1 > MAX_ROWS
  const data = rows.slice(1, MAX_ROWS + 1).filter((r) => r.some((x) => x && x.trim()))
  const n = data.length
  const g = (r: string[], k: string) => (idx[k] != null ? (r[idx[k]] || '').trim() : '')

  const seen = new Set<string>()
  let dupEmail = 0, invalid = 0, personal = 0, noEmail = 0
  for (const r of data) {
    const e = g(r, 'email').toLowerCase()
    if (!e) { noEmail++; continue }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) invalid++
    if (FREE.test(e)) personal++
    if (seen.has(e)) dupEmail++
    seen.add(e)
  }
  const nameSeen = new Set<string>()
  let dupName = 0
  if (idx.first != null || idx.last != null) {
    for (const r of data) {
      const key = [g(r, 'first'), g(r, 'last'), g(r, 'company')].join('|').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      if (key.replace(/\|/g, '').length < 5 || !g(r, 'company')) continue
      if (nameSeen.has(key)) dupName++
      nameSeen.add(key)
    }
  }
  const completeness: Record<string, number> = {}
  for (const k of Object.keys(FIELD_LABEL)) if (idx[k] != null) completeness[k] = n ? data.filter((r) => g(r, k)).length / n : 0
  const st: Record<string, number> = {}
  if (idx.stage != null) for (const r of data) { const s = g(r, 'stage') || '(vacío)'; st[s] = (st[s] || 0) + 1 }
  const stages = Object.entries(st).sort((a, b) => b[1] - a[1]).slice(0, 8)
  let stale = 0, withDate = 0
  const now = Date.now()
  if (idx.last_act != null) for (const r of data) {
    const d = Date.parse(g(r, 'last_act'))
    if (!Number.isNaN(d)) { withDate++; if (now - d > 365 * 864e5) stale++ }
  }
  const noOwner = idx.owner != null ? data.filter((r) => !g(r, 'owner')).length : null

  const p = (x: number) => (n ? x / n : 0)
  const staleShare = withDate ? stale / withDate : 0
  let score = 100
  score -= Math.min(25, p(dupEmail) * 200)
  score -= Math.min(15, p(dupName) * 150)
  score -= Math.min(10, p(invalid) * 200)
  score -= Math.min(15, (1 - (completeness.company ?? 1)) * 30)
  score -= noOwner != null ? Math.min(15, p(noOwner) * 30) : 0
  score -= Math.min(20, staleShare * 30)
  score = Math.max(0, Math.round(score))

  const pct = (x: number) => `${(x * 100).toFixed(x < 0.1 ? 1 : 0)}%`
  const F: CrmAudit['findings'] = []
  if (p(dupEmail) > 0.02) F.push({ weight: 10, title: `${pct(p(dupEmail))} de contactos duplicados por correo`, fix: 'Se cuentan doble en los reportes y reciben el mismo correo dos veces. Fusiónalos antes de cualquier campaña.' })
  if (p(dupName) > 0.02) F.push({ weight: 7, title: `${pct(p(dupName))} de duplicados probables (mismo nombre y empresa, distinto correo)`, fix: 'Suelen ser la misma persona con correo personal y de trabajo: revísalos y fusiona conservando el corporativo.' })
  if (noOwner != null && p(noOwner) > 0.1) F.push({ weight: 8, title: `${pct(p(noOwner))} de contactos sin propietario`, fix: 'Nadie les da seguimiento: define reglas de asignación automática por territorio, industria o fuente.' })
  if (staleShare > 0.3) F.push({ weight: 7, title: `${pct(staleShare)} sin actividad en los últimos 12 meses`, fix: 'Pesan en tu plan de contactos y bajan la entregabilidad: haz una campaña de reactivación y depura a quien no responda.' })
  if ((completeness.company ?? 1) < 0.7) F.push({ weight: 6, title: `Solo ${pct(completeness.company || 0)} de los contactos tiene empresa`, fix: 'Sin empresa no hay ABM ni scoring por perfil: complétala a partir del dominio del correo.' })
  if (p(invalid) > 0.01) F.push({ weight: 5, title: `${pct(p(invalid))} de correos con formato inválido`, fix: 'Rebotan y dañan tu reputación de envío: corrígelos o elimínalos.' })
  if (p(personal) > 0.3) F.push({ weight: 4, title: `${pct(p(personal))} usa correo personal (Gmail, Hotmail…)`, fix: 'En B2B suelen ser leads de menor calidad o duplicados de un contacto corporativo: pide correo de trabajo en tus formularios.' })
  if (idx.stage != null && (st['(vacío)'] || 0) / Math.max(n, 1) > 0.2) F.push({ weight: 5, title: `${pct((st['(vacío)'] || 0) / n)} sin etapa del ciclo de vida`, fix: 'Sin etapa no puedes medir el embudo de MQL a cliente: asígnala con reglas automáticas.' })
  F.sort((a, b) => b.weight - a.weight)

  return { total: n, columns: Object.keys(idx), dupEmail, dupName, invalid, personal, noEmail, noOwner, stale, withDate, completeness, stages, score, truncated, findings: F }
}

/** Lee el archivo como UTF-8 y, si trae caracteres rotos, como Windows-1252 (exportaciones de Excel). */
export async function readCsvFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const utf = new TextDecoder('utf-8').decode(buf)
  return utf.includes('�') ? new TextDecoder('windows-1252').decode(buf) : utf
}

/** Base ficticia para probar la herramienta sin datos reales. */
export function demoRows(): string[][] {
  const st = ['subscriber', 'lead', 'lead', 'lead', 'marketingqualifiedlead', 'salesqualifiedlead', 'opportunity', 'customer', '']
  const co = ['Acme', 'Globex', 'Initech', 'Umbrella', 'Stark', 'Wayne', '', 'Hooli']
  const fn = ['Ana', 'Luis', 'Sofía', 'Carlos', 'Mariana', 'Jorge', 'Paola', 'Diego']
  const rows = [['Email', 'First Name', 'Last Name', 'Company Name', 'Contact owner', 'Lifecycle Stage', 'Last Activity Date', 'Phone Number', 'Job Title']]
  for (let i = 0; i < 1200; i++) {
    const f = fn[i % 8], c = co[(i * 7) % 8]
    let e = `${f}${i}@${i % 4 === 0 ? 'gmail.com' : `${(c || 'empresa').toLowerCase()}.com`}`.toLowerCase()
    if (i % 37 === 0 && i > 5) e = rows[i - 5][0]
    if (i % 91 === 0) e = 'correo-mal'
    const d = new Date(Date.now() - ((i * 53) % 900) * 864e5).toISOString().slice(0, 10)
    const prev = i % 23 === 0 && i > 1 ? rows[i - 1] : null // duplicado probable: misma persona y empresa, otro correo
    rows.push([e, prev ? prev[1] : f, prev ? prev[2] : `Apellido${i}`, prev ? prev[3] || 'Acme' : c, i % 5 === 0 ? '' : 'Dueño A', st[i % 9], i % 6 === 0 ? '' : d, i % 3 === 0 ? '' : '555', i % 4 === 0 ? '' : 'Gerente'])
  }
  return rows
}
