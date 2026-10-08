'use client'

import React, { useActionState, useEffect, useState } from 'react'

import { submitToolLead, type LeadState } from '@/actions/lead'
import { track } from '@/lib/analytics'

/** Botón "Descargar CV": pide nombre, correo y empresa (lead en HubSpot) y luego abre el PDF. */
export function CvDownload({ url }: { url: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<LeadState, FormData>(submitToolLead, { status: 'idle' })

  useEffect(() => {
    if (state.status === 'ok') {
      track('generate_lead', { form: 'cv', tool: 'CV' })
      window.location.href = url
    }
  }, [state.status, url])

  const btn =
    'inline-flex items-center gap-2 border border-black bg-[#e85a2a] text-white px-4 py-2 hover:bg-black transition-colors font-mono uppercase tracking-widest text-[10px] font-bold'
  if (!open) {
    return (
      <button type="button" className={btn} onClick={() => setOpen(true)}>
        Descargar CV en PDF ▸
      </button>
    )
  }
  return (
    <form action={action} className="w-full max-w-md border border-black bg-white p-5 shadow-[6px_6px_0_0_#000] flex flex-col gap-3">
      <p className="font-mono text-xs leading-relaxed">Déjame tus datos y se descarga el CV. Los uso solo para saber quién lo pidió.</p>
      <input name="name" required placeholder="Nombre" aria-label="Nombre" autoComplete="given-name" className="border border-black px-3 py-2 font-mono text-sm" />
      <input name="email" type="email" required placeholder="Correo de trabajo" aria-label="Correo de trabajo" autoComplete="email" className="border border-black px-3 py-2 font-mono text-sm" />
      <input name="company" placeholder="Empresa" aria-label="Empresa" autoComplete="organization" className="border border-black px-3 py-2 font-mono text-sm" />
      <input name="tool" type="hidden" value="CV" />
      <input name="summary" type="hidden" value="Descargó el CV en PDF desde soyroman.com/cv" />
      <input name="sr_recurso" type="hidden" value="cv" />
      <div className="hidden" aria-hidden="true"><input name="sr_trap" tabIndex={-1} autoComplete="off" /></div>
      {state.status === 'error' && <span className="font-mono text-xs text-[#e85a2a]" role="alert">{state.message}</span>}
      <div className="flex gap-3 items-center">
        <button disabled={pending} className={btn}>{pending ? 'Enviando…' : 'Enviar y descargar ▸'}</button>
        <button type="button" onClick={() => setOpen(false)} className="font-mono text-[10px] uppercase tracking-widest underline">Cancelar</button>
      </div>
      <small className="font-mono text-[10px] text-black/60">
        <a href="/privacidad" className="underline">Aviso de privacidad</a>
      </small>
    </form>
  )
}
