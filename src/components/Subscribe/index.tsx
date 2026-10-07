'use client'

import Link from 'next/link'
import React, { useActionState, useEffect } from 'react'

import { submitSubscriber, type LeadState } from '@/actions/lead'
import { track } from '@/lib/analytics'
import { dotMatrix } from '@/components/layout/dotFont'

/** Panel de suscripción al blog con estética de aparato. `compact` para columnas angostas. */
export function Subscribe({ where, compact = false }: { where: string; compact?: boolean }) {
  const [state, action, pending] = useActionState<LeadState, FormData>(submitSubscriber, { status: 'idle' })
  const ok = state.status === 'ok'

  useEffect(() => {
    if (ok) track('sign_up', { method: 'newsletter', where })
  }, [ok, where])

  const screen = dotMatrix(ok ? 'OK' : pending ? '···' : 'RX', ok ? '#3ddc84' : '#e85a2a', '#1f1f1f', 4)
  const key =
    'h-11 px-4 border-2 border-black bg-black text-white font-mono text-[10px] uppercase font-bold tracking-widest shadow-[3px_3px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_#000] transition-[transform,box-shadow] disabled:opacity-60'

  return (
    <div className="border-2 border-black bg-[#f2f1ec] shadow-[6px_6px_0_#000] text-black">
      <div className="flex items-center justify-between h-9 px-4 border-b-2 border-black bg-black text-white">
        <span className="font-mono text-[10px] uppercase font-bold tracking-widest">CH-02 — RX · Blog</span>
        <span
          aria-hidden="true"
          className={`w-2 h-2 rounded-full ${ok ? 'bg-[#3ddc84] shadow-[0_0_0_3px_#3ddc8440]' : 'bg-[#e85a2a] animate-pulse shadow-[0_0_0_3px_#e85a2a40]'}`}
        />
      </div>
      <div className={compact ? 'p-5' : 'p-6 md:p-8 grid md:grid-cols-[140px_1fr] gap-6 items-center'}>
        <div className={`bg-[#0b0b0b] flex items-center justify-center border border-black ${compact ? 'h-16 mb-4' : 'h-24'}`}>
          <svg viewBox={`0 0 ${screen.w} ${screen.h}`} className={compact ? 'h-8' : 'h-10'} aria-hidden="true">{screen.dots}</svg>
        </div>
        <div>
          {ok ? (
            <p className="font-semibold tracking-tight text-lg leading-tight" role="status">
              Listo. Te llega el próximo envío a tu correo.
            </p>
          ) : (
            <>
              <p className={`font-semibold tracking-tight leading-tight ${compact ? 'text-lg' : 'text-2xl'}`}>Recibe lo nuevo del blog.</p>
              <p className="font-mono text-[12px] leading-relaxed opacity-80 mt-2">
                Marketing B2B sin humo: demanda, RevOps, SEO y AEO. Sin spam; te das de baja con un clic.
              </p>
              <form action={action} className={`mt-4 flex gap-3 ${compact ? 'flex-col' : 'flex-col sm:flex-row'}`}>
                <input type="hidden" name="where" value={where} />
                <div className="hidden" aria-hidden="true"><input name="website" tabIndex={-1} autoComplete="off" /></div>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="tu@empresa.com"
                  aria-label="Correo"
                  autoComplete="email"
                  className="flex-1 min-w-0 h-11 px-3 border-2 border-black bg-white font-mono text-sm focus:outline-none focus:border-[#e85a2a]"
                />
                <button type="submit" disabled={pending} className={key}>
                  {pending ? 'Enviando…' : 'Suscribir ▸'}
                </button>
              </form>
              {state.status === 'error' && (
                <p role="alert" className="font-mono text-[11px] text-[#e85a2a] mt-2">{state.message}</p>
              )}
              <p className="font-mono text-[10px] opacity-60 mt-3">
                Al suscribirte aceptas el{' '}
                <Link href="/privacidad" className="underline hover:text-[#e85a2a]">aviso de privacidad</Link>.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
