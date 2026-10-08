/**
 * Expediente del contacto en HubSpot (portal de soyroman) cuando usa una herramienta de /recursos:
 * - nota en su línea de tiempo con lo que capturó y lo que salió;
 * - primera herramienta (una sola vez), lista de herramientas usadas y contador.
 * Usa la API de CRM con un token de app privada (HUBSPOT_RECORD_TOKEN, solo permisos de contactos).
 * Es un extra: si falla, el lead ya entró por el formulario. Sin token no hace nada.
 */

export type ToolRecord = {
  email: string
  name?: string
  company?: string
  tool: string
  slug?: string
  domain?: string
  score?: number | null
  finding?: string
  summary?: string
  items?: { t: string; fix?: string }[]
  page?: string
}

const API = 'https://api.hubapi.com'
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const cut = (s: unknown, n: number) => String(s ?? '').slice(0, n)
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function hs(token: string, method: string, path: string, body?: unknown) {
  const res = await fetch(API + path, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path.split('?')[0]} → ${res.status} ${text.slice(0, 200)}`)
  return text ? JSON.parse(text) : {}
}

/** Nota en HTML con lo que el visitante hizo en la herramienta. */
export function noteHtml(r: ToolRecord, at: Date) {
  const fecha = at.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Mexico_City' })
  const meta = [r.domain && `Dominio: ${esc(cut(r.domain, 120))}`, r.score != null && `Puntaje: ${esc(r.score)}`].filter(Boolean).join(' · ')
  const lines = cut(r.summary, 2000).split('\n').map((l) => l.trim()).filter(Boolean)
  const items = (r.items || []).slice(0, 3).filter((x) => x?.t)
  return [
    `<p><strong>Recurso: ${esc(cut(r.tool, 80))}</strong> · ${esc(fecha)}</p>`,
    meta && `<p>${meta}</p>`,
    r.finding && `<p><strong>Hallazgo:</strong> ${esc(cut(r.finding, 240))}</p>`,
    lines.length && `<p>${lines.map(esc).join('<br>')}</p>`,
    items.length && `<p><strong>Lo primero que arreglaría:</strong></p><ol>${items.map((x) => `<li>${esc(cut(x.t, 160))}${x.fix ? ` — ${esc(cut(x.fix, 320))}` : ''}</li>`).join('')}</ol>`,
    r.page && `<p>Desde: ${esc(cut(r.page, 300))}</p>`,
  ].filter(Boolean).join('')
}

/** Cambios al contacto: primera herramienta (si no hay), lista sin repetir, contador +1, nombre y empresa si faltan. */
export function contactPatch(p: Record<string, string | null | undefined>, r: ToolRecord, at: Date) {
  const patch: Record<string, string> = {}
  if (!p.sr_primer_recurso && r.slug) {
    patch.sr_primer_recurso = r.slug
    patch.sr_fecha_primer_recurso = String(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()))
  }
  const used = String(p.sr_recursos_usados || '').split(';').map((s) => s.trim()).filter(Boolean)
  if (r.slug && !used.includes(r.slug)) used.push(r.slug)
  if (used.length) patch.sr_recursos_usados = used.join(';')
  patch.sr_num_recursos = String((Number(p.sr_num_recursos) || 0) + 1)
  if (!p.firstname && r.name) patch.firstname = cut(r.name, 120)
  if (!p.company && r.company) patch.company = cut(r.company, 160)
  return patch
}

export async function recordToolUse(r: ToolRecord) {
  const token = process.env.HUBSPOT_RECORD_TOKEN
  if (!token) return
  const email = r.email.trim().toLowerCase()
  const at = new Date()
  try {
    // Deja que el formulario cree el contacto primero (evita duplicados), luego lo busca o lo crea
    await wait(4000)
    const up = await hs(token, 'POST', '/crm/v3/objects/contacts/batch/upsert', { inputs: [{ idProperty: 'email', id: email, properties: { email } }] })
    const id = up?.results?.[0]?.id
    if (!id) throw new Error('sin id de contacto')
    const props = 'sr_primer_recurso,sr_recursos_usados,sr_num_recursos,firstname,company'
    const c = await hs(token, 'GET', `/crm/v3/objects/contacts/${id}?properties=${props}`)
    await hs(token, 'PATCH', `/crm/v3/objects/contacts/${id}`, { properties: contactPatch(c.properties || {}, r, at) })
    await hs(token, 'POST', '/crm/v3/objects/notes', {
      properties: { hs_timestamp: at.toISOString(), hs_note_body: noteHtml(r, at) },
      associations: [{ to: { id }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 202 }] }],
    })
    console.info(`[expediente] ${r.slug || r.tool} → contacto ${id}`)
  } catch (err) {
    console.warn('[expediente] no se pudo registrar', err instanceof Error ? err.message : err)
  }
}
