/**
 * Registro propio de uso (para el panel de admin del taller). Solo navegador.
 * - Sin consentimiento de cookies: el evento va sin identificador (solo cuenta).
 * - Con consentimiento: lleva un id aleatorio de este navegador para contar personas.
 * - Si este navegador ya entró al taller, el servidor lo asocia a la cuenta.
 */

export const EVENT_TYPES = [
  'tool_view',
  'tool_start',
  'tool_complete',
  'generate_lead',
  'share',
  'sign_up',
  'contact_click',
  'agendar',
  'taller_view',
] as const
export type EventType = (typeof EVENT_TYPES)[number]

const ANON = 'sr-anon'

function anonId(): string | null {
  try {
    if (localStorage.getItem('sr_consent') !== 'granted') return null
    let id = localStorage.getItem(ANON)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(ANON, id)
    }
    return id
  } catch {
    return null
  }
}

function hasAccount() {
  try {
    return localStorage.getItem('sr-taller-cuenta') === '1'
  } catch {
    return false
  }
}

export function logEvent(type: EventType) {
  if (typeof window === 'undefined') return
  try {
    const body = JSON.stringify({ t: type, p: window.location.pathname.slice(0, 200), a: anonId(), u: hasAccount() ? 1 : 0 })
    const blob = new Blob([body], { type: 'application/json' })
    if (!navigator.sendBeacon?.('/next/taller/e', blob)) {
      fetch('/next/taller/e', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {})
    }
  } catch {}
}

/** Clics en cualquier botón de agenda del sitio (los marcados con data-cta="agendar"). */
let installed = false
export function listenAgendar() {
  if (installed || typeof document === 'undefined') return
  installed = true
  document.addEventListener(
    'click',
    (e) => {
      const el = (e.target as Element | null)?.closest?.('[data-cta="agendar"]')
      if (el) logEvent('agendar')
    },
    { capture: true },
  )
}
