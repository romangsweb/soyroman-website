import { EVENT_TYPES, logEvent, type EventType } from '@/lib/taller/events'

type Params = Record<string, string | number | undefined>

declare global {
  interface Window {
    gtag?: (...a: unknown[]) => void
    _hsq?: unknown[][]
  }
}

/** Evento GA4. Si el visitante no aceptó cookies, Consent Mode lo manda como ping sin cookies. */
export function track(event: string, params: Params = {}) {
  if (typeof window === 'undefined') return
  window.gtag?.('event', event, params)
  // Copia en el registro propio del taller (sin datos personales: solo tipo de evento y página)
  if ((EVENT_TYPES as readonly string[]).includes(event)) logEvent(event as EventType)
}

export const CONSENT_KEY = 'sr_consent'
export const openConsent = () => window.dispatchEvent(new Event('sr:consent-open'))
