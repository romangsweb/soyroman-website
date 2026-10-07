'use client'

import Link from 'next/link'
import React from 'react'

/** Aviso de cookies con estética de aparato: panel, LED y dos teclas. */
export function CookieDeck({ show, onDecide }: { show: boolean; onDecide: (v: 'granted' | 'denied') => void }) {
  if (!show) return null
  const key =
    'h-11 px-4 border-2 border-black font-mono text-[10px] uppercase font-bold tracking-widest shadow-[3px_3px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_#000] transition-[transform,box-shadow]'

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Preferencias de cookies"
      className="fixed z-50 bottom-4 left-4 right-4 sm:right-auto sm:w-[380px] bg-[#f2f1ec] border-2 border-black shadow-[6px_6px_0_#000]"
    >
      <div className="flex items-center justify-between h-9 px-4 border-b-2 border-black bg-black text-white">
        <span className="font-mono text-[10px] uppercase font-bold tracking-widest">CH·00 — Cookies</span>
        <span aria-hidden="true" className="w-2 h-2 rounded-full bg-[#e85a2a] animate-pulse shadow-[0_0_0_3px_#e85a2a40]" />
      </div>
      <div className="p-5">
        <p className="font-semibold tracking-tight text-lg leading-tight mb-2">Medimos señales, no personas.</p>
        <p className="font-mono text-[12px] leading-relaxed opacity-80">
          Uso Google Analytics y HubSpot para saber qué artículos y herramientas sirven. Sin anuncios ni venta de datos.
          Es marketing B2B: sería raro no medir.
        </p>
        <div className="flex flex-wrap gap-3 mt-4">
          <button type="button" onClick={() => onDecide('granted')} className={`${key} bg-black text-white`}>
            Aceptar ▸ REC
          </button>
          <button type="button" onClick={() => onDecide('denied')} className={`${key} bg-white text-black`}>
            Solo lo necesario
          </button>
        </div>
        <Link href="/privacidad" className="inline-block mt-4 font-mono text-[10px] uppercase font-bold tracking-widest border-b border-black hover:text-[#e85a2a] hover:border-[#e85a2a]">
          Aviso de privacidad →
        </Link>
      </div>
    </div>
  )
}
