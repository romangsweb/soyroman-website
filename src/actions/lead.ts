'use server'

import { cookies, headers } from 'next/headers'
import { after } from 'next/server'

import { notifyHall } from '@/lib/hallHook'
import { cleanItems, sendReport, type ReportItem } from '@/lib/reportEmail'

/**
 * Envía un lead al formulario de HubSpot (portal de soyroman) vía Forms API v3.
 * No requiere token: solo portal + ID de formulario (valores públicos).
 */
const PORTAL_ID = process.env.HUBSPOT_PORTAL_ID || '51346021'
const FORM_GUID = process.env.HUBSPOT_FORM_GUID || '5f4b698f-db18-4c9a-b547-1c37d54d1ce1'
const SUB_GUID = process.env.HUBSPOT_SUBSCRIBE_FORM_GUID || '89dc04aa-03b8-4810-a373-9468478e0e38'
const SUB_TYPE = Number(process.env.HUBSPOT_BLOG_SUBSCRIPTION_ID || 0)
// Formulario "Recursos · soyroman" (propiedades sr_* ocultas; crea contacto nuevo por cada correo nuevo)
const TOOLS_GUID = process.env.HUBSPOT_TOOLS_FORM_GUID || '044392eb-9190-46f3-8b30-fbf907cdd49a'
const endpoint = (guid: string) => `https://api.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${guid}`

export type LeadState = { status: 'idle' | 'ok' | 'error'; message?: string }

const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? '').trim().slice(0, max)
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Campo trampa (oculto con display:none para que el autollenado no lo toque). Lleno = bot. */
const trapped = (form: FormData, where: string) => {
  const hit = Boolean(clean(form.get('sr_trap'), 200))
  if (hit) console.warn(`[lead] descartado por campo trampa (${where})`)
  return hit
}

export async function submitLead(_prev: LeadState, form: FormData): Promise<LeadState> {
  // Campo trampa: los humanos no lo ven; si viene lleno, fingimos éxito y descartamos.
  if (trapped(form, 'contacto')) return { status: 'ok' }

  const name = clean(form.get('name'), 120)
  const email = clean(form.get('email'), 200).toLowerCase()
  const company = clean(form.get('company'), 160)
  const service = clean(form.get('service'), 120)
  const message = clean(form.get('message'), 3000)
  const origin = clean(form.get('origin'), 60) || 'Contacto'

  if (!name || !EMAIL.test(email) || !message) {
    return { status: 'error', message: 'Revisa tu nombre, correo y mensaje.' }
  }

  const fields = [
    { objectTypeId: '0-1', name: 'firstname', value: name },
    { objectTypeId: '0-1', name: 'email', value: email },
    ...(company ? [{ objectTypeId: '0-1', name: 'company', value: company }] : []),
    { objectTypeId: '0-1', name: 'message', value: service ? `[${service}]\n${message}` : message },
  ]
  return sendToHubspot(fields, origin, 'https://soyroman.com/contacto')
}

type Field = { objectTypeId: string; name: string; value: string }

/** Medianoche UTC de hoy en milisegundos: formato de las propiedades de fecha de HubSpot. */
const today = () => {
  const d = new Date()
  return String(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

export type ToolMeta = { slug: string; domain?: string; score?: number | null; finding?: string; items?: ReportItem[] }

// Máximo de reportes por correo al día por IP (en memoria de la instancia), para que nadie use el formulario para enviar correos a terceros
const reportHits = new Map<string, number[]>()
async function canSendReport() {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon'
  const now = Date.now()
  const recent = (reportHits.get(ip) || []).filter((t) => now - t < 24 * 60 * 60 * 1000)
  if (recent.length >= 3) return false
  reportHits.set(ip, [...recent, now])
  if (reportHits.size > 5000) reportHits.clear()
  return true
}

/** Propiedades sr_* del formulario de recursos. */
const metaFields = (m: Partial<Record<'sr_recurso' | 'sr_dominio' | 'sr_puntaje' | 'sr_hallazgo', string>>): Field[] => [
  ...Object.entries(m)
    .filter(([, v]) => v)
    .map(([name, value]) => ({ objectTypeId: '0-1', name, value: String(value) })),
  { objectTypeId: '0-1', name: 'sr_fecha_recurso', value: today() },
]

async function sendToHubspot(
  fields: Field[],
  origin: string,
  fallbackUri: string,
  guid = FORM_GUID,
  extra: object = {},
): Promise<LeadState> {
  const h = await headers()
  const hutk = (await cookies()).get('hubspotutk')?.value
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim()

  try {
    const res = await fetch(endpoint(guid), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields,
        context: {
          pageUri: h.get('referer') || fallbackUri,
          pageName: `soyroman.com · ${origin}`,
          ...(hutk ? { hutk } : {}),
          ...(ip ? { ipAddress: ip } : {}),
        },
        ...extra,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      console.error('[hubspot] envío rechazado', res.status, (await res.text()).slice(0, 500))
      return { status: 'error', message: 'No se pudo enviar. Escríbeme directo a contacto@soyroman.com.' }
    }
    console.info(`[hubspot] enviado ${origin} → ${guid.slice(0, 8)}`)
    return { status: 'ok' }
  } catch (err) {
    console.error('[hubspot] error de red', err)
    return { status: 'error', message: 'No se pudo enviar. Escríbeme directo a contacto@soyroman.com.' }
  }
}

/**
 * Lead desde un micro aplicativo de /recursos. El resumen del cálculo va en el
 * mensaje con el prefijo [Recurso: …] para filtrarlo o disparar workflows en HubSpot.
 */
export async function submitToolLead(_prev: LeadState, form: FormData): Promise<LeadState> {
  if (trapped(form, 'recurso')) return { status: 'ok' }
  const name = clean(form.get('name'), 120)
  const email = clean(form.get('email'), 200).toLowerCase()
  const company = clean(form.get('company'), 160)
  const tool = clean(form.get('tool'), 80)
  const summary = clean(form.get('summary'), 2000)
  if (!name || !EMAIL.test(email) || !tool) return { status: 'error', message: 'Revisa tu nombre y correo.' }

  const fields = [
    { objectTypeId: '0-1', name: 'firstname', value: name },
    { objectTypeId: '0-1', name: 'email', value: email },
    ...(company ? [{ objectTypeId: '0-1', name: 'company', value: company }] : []),
    { objectTypeId: '0-1', name: 'message', value: `[Recurso: ${tool}]\n${summary}` },
    ...metaFields({
      sr_recurso: clean(form.get('sr_recurso'), 40),
      sr_dominio: clean(form.get('sr_dominio'), 120),
      sr_puntaje: /^\d{1,3}$/.test(clean(form.get('sr_puntaje'), 3)) ? clean(form.get('sr_puntaje'), 3) : '',
      sr_hallazgo: clean(form.get('sr_hallazgo'), 240),
    }),
  ]
  const result = await sendToHubspot(fields, `Recurso · ${tool}`, 'https://soyroman.com/recursos', TOOLS_GUID)
  const slug = clean(form.get('sr_recurso'), 40)
  let items: ReportItem[] = []
  try {
    items = cleanItems(JSON.parse(clean(form.get('sr_report'), 3000) || '[]'))
  } catch {
    items = []
  }
  const score = Number(clean(form.get('sr_puntaje'), 3))
  // Expediente en HubSpot vía Hall (después de responder, para no hacer esperar a nadie)
  if (result.status === 'ok') {
    const page = (await headers()).get('referer') || undefined
    after(() =>
      notifyHall({
        event: 'tool_lead',
        email,
        name,
        company: company || undefined,
        tool,
        slug: slug || undefined,
        domain: clean(form.get('sr_dominio'), 120) || undefined,
        score: clean(form.get('sr_puntaje'), 3) && Number.isFinite(score) ? score : null,
        finding: clean(form.get('sr_hallazgo'), 240) || undefined,
        summary,
        items,
        page,
      }),
    )
  }
  // Reporte por correo (solo herramientas, no el CV), si HubSpot aceptó el lead
  if (result.status === 'ok' && slug && slug !== 'cv' && (await canSendReport())) {
    await sendReport({
      to: email,
      name,
      tool,
      slug,
      domain: clean(form.get('sr_dominio'), 120) || undefined,
      score: clean(form.get('sr_puntaje'), 3) && Number.isFinite(score) ? score : null,
      items,
    })
  }
  return result
}

/**
 * Suscripción al blog: solo correo. Si existe HUBSPOT_BLOG_SUBSCRIPTION_ID, el contacto queda
 * suscrito con consentimiento explícito a ese tipo de suscripción (necesario para enviarle correos de marketing).
 */
export async function submitSubscriber(_prev: LeadState, form: FormData): Promise<LeadState> {
  if (trapped(form, 'suscripcion')) return { status: 'ok' }
  const email = clean(form.get('email'), 200).toLowerCase()
  const where = clean(form.get('where'), 60) || 'blog'
  if (!EMAIL.test(email)) return { status: 'error', message: 'Revisa tu correo.' }

  const consent = SUB_TYPE
    ? {
        legalConsentOptions: {
          consent: {
            consentToProcess: true,
            text: 'Acepto recibir el resumen del blog de soyroman.com y el tratamiento de mis datos según el aviso de privacidad.',
            communications: [{ value: true, subscriptionTypeId: SUB_TYPE, text: 'Resumen del blog' }],
          },
        },
      }
    : {}

  return sendToHubspot(
    [{ objectTypeId: '0-1', name: 'email', value: email }],
    `Suscripción · ${where}`,
    'https://soyroman.com/blog',
    SUB_GUID,
    consent,
  )
}

/**
 * Lead previo a correr una herramienta con costo (el correo se pide antes del resultado).
 * Lo llama la ruta del servidor, no el navegador.
 */
export async function recordToolRun(email: string, tool: string, summary: string, meta?: ToolMeta): Promise<LeadState> {
  if (!EMAIL.test(email)) return { status: 'error', message: 'Revisa tu correo.' }
  return sendToHubspot(
    [
      { objectTypeId: '0-1', name: 'email', value: email.toLowerCase().slice(0, 200) },
      { objectTypeId: '0-1', name: 'message', value: `[Recurso: ${tool}]\n${summary.slice(0, 2000)}` },
      ...metaFields({
        sr_recurso: meta?.slug,
        sr_dominio: meta?.domain?.slice(0, 120),
        sr_puntaje: meta?.score != null ? String(Math.round(Math.max(0, Math.min(100, meta.score)))) : '',
        sr_hallazgo: meta?.finding?.slice(0, 240),
      }),
    ],
    `Recurso · ${tool}`,
    'https://soyroman.com/recursos',
    TOOLS_GUID,
  ).then(async (r) => {
    if (r.status === 'ok') {
      after(() =>
        notifyHall({
          event: 'tool_lead',
          email: email.toLowerCase(),
          tool,
          slug: meta?.slug,
          domain: meta?.domain,
          score: meta?.score ?? null,
          finding: meta?.finding,
          summary: summary.slice(0, 2000),
          items: cleanItems(meta?.items),
        }),
      )
    }
    if (r.status === 'ok' && meta) {
      await sendReport({ to: email, tool, slug: meta.slug, domain: meta.domain, score: meta.score ?? null, items: cleanItems(meta.items) })
    }
    return r
  })
}
