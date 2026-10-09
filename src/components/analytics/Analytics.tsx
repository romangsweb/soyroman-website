'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { CONSENT_KEY } from '@/lib/analytics'
import { listenAgendar } from '@/lib/taller/events'
import { CookieDeck } from './CookieDeck'

const GA = process.env.NEXT_PUBLIC_GA_ID
const HS = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID

type Consent = 'granted' | 'denied' | null | 'pending'

/** GA4 con Consent Mode v2 (todo denegado por defecto) + HubSpot solo con consentimiento. */
export function Analytics() {
  const [consent, setConsent] = useState<Consent>('pending')
  const [reopen, setReopen] = useState(false)
  const path = usePathname()

  useEffect(() => {
    listenAgendar()
    try {
      setConsent(localStorage.getItem(CONSENT_KEY) as Consent)
    } catch {
      setConsent(null)
    }
    const open = () => setReopen(true)
    window.addEventListener('sr:consent-open', open)
    return () => window.removeEventListener('sr:consent-open', open)
  }, [])

  // Navegación interna → pageview en HubSpot (GA4 lo cubre con "cambios en el historial del navegador")
  useEffect(() => {
    if (consent !== 'granted') return
    window._hsq = window._hsq || []
    window._hsq.push(['setPath', path], ['trackPageView'])
  }, [path, consent])

  const decide = (v: 'granted' | 'denied') => {
    try {
      localStorage.setItem(CONSENT_KEY, v)
    } catch {}
    window.gtag?.('consent', 'update', { analytics_storage: v })
    setConsent(v)
    setReopen(false)
  }

  return (
    <>
      {GA && (
        <>
          <Script id="ga-consent" strategy="afterInteractive">{`
            window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;
            var c=null;try{c=localStorage.getItem('${CONSENT_KEY}')}catch(e){}
            gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',
              analytics_storage:c==='granted'?'granted':'denied'});
            gtag('js',new Date());gtag('config','${GA}');`}</Script>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA}`} strategy="afterInteractive" />
        </>
      )}
      {HS && consent === 'granted' && (
        <Script id="hs-script-loader" src={`https://js.hs-scripts.com/${HS}.js`} strategy="afterInteractive" />
      )}
      <CookieDeck show={consent === null || reopen} onDecide={decide} />
    </>
  )
}
