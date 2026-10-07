'use client'

import React from 'react'

import { openConsent } from '@/lib/analytics'

/** Botón del footer para volver a abrir el aviso de cookies. */
export function CookieLink({ className }: { className: string }) {
  return (
    <button type="button" onClick={openConsent} className={`${className} w-full text-left`}>
      Cookies
    </button>
  )
}
