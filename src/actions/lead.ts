'use server'

import { cookies, headers } from 'next/headers'

/**
 * Envía un lead al formulario de HubSpot (portal de soyroman) vía Forms API v3.
 * No requiere token: solo portal + ID de formulario (valores públicos).
 */
const PORTAL_ID = process.env.HUBSPOT_PORTAL_ID || '51346021'
const FORM_GUID = process.env.HUBSPOT_FORM_GUID || '5f4b698f-db18-4c9a-b547-1c37d54d1ce1'
const ENDPOINT = `https://api.hsforms.com/submissions/v3/integration/submit/${PORTAL_ID}/${FORM_GUID}`

export type LeadState = { status: 'idle' | 'ok' | 'error'; message?: string }

const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? '').trim().slice(0, max)
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function submitLead(_prev: LeadState, form: FormData): Promise<LeadState> {
  // Campo trampa: los humanos no lo ven; si viene lleno, fingimos éxito y descartamos.
  if (clean(form.get('website'), 200)) return { status: 'ok' }

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

async function sendToHubspot(fields: Field[], origin: string, fallbackUri: string): Promise<LeadState> {
  const h = await headers()
  const hutk = (await cookies()).get('hubspotutk')?.value
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim()

  try {
    const res = await fetch(ENDPOINT, {
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
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      console.error('[hubspot] envío rechazado', res.status, (await res.text()).slice(0, 500))
      return { status: 'error', message: 'No se pudo enviar. Escríbeme directo a contacto@soyroman.com.' }
    }
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
  if (clean(form.get('website'), 200)) return { status: 'ok' }
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
