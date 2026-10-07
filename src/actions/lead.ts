'use server'

import { cookies, headers } from 'next/headers'

/**
 * Envía un lead al formulario de HubSpot (portal de soyroman) vía Forms API v3.
 * No requiere token: solo portal + ID de formulario (valores públicos).
 */
const PORTAL_ID = process.env.HUBSPOT_PORTAL_ID || '51346021'
const FORM_GUID = process.env.HUBSPOT_FORM_GUID || '5f4b698f-db18-4c9a-b547-1c37d54d1ce1'
const SUB_GUID = process.env.HUBSPOT_SUBSCRIBE_FORM_GUID || '89dc04aa-03b8-4810-a373-9468478e0e38'
const SUB_TYPE = Number(process.env.HUBSPOT_BLOG_SUBSCRIPTION_ID || 0)
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
  ]
  return sendToHubspot(fields, `Recurso · ${tool}`, 'https://soyroman.com/recursos')
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
