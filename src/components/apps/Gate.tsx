'use client'

import React, { useActionState, useEffect } from 'react'

import { submitToolLead, type LeadState } from '@/actions/lead'
import { track } from '@/lib/analytics'

/** Formulario que desbloquea el plan: manda el lead a HubSpot y luego llama a onDone (imprimir). */
export function Gate({ tool, summary, onDone, onCancel }: { tool: string; summary: string; onDone: () => void; onCancel: () => void }) {
  const [state, action, pending] = useActionState<LeadState, FormData>(submitToolLead, { status: 'idle' })
  useEffect(() => {
    if (state.status === 'ok') {
      track('generate_lead', { form: 'recurso', tool })
      onDone()
    }
  }, [state.status, onDone, tool])

  return (
    <form className="gate on" action={action}>
      <p>Te dejo el plan en PDF con estas cifras. Escribe tu correo para descargarlo.</p>
      <input name="name" required placeholder="Nombre" aria-label="Nombre" autoComplete="given-name" />
      <input name="email" type="email" required placeholder="Correo de trabajo" aria-label="Correo de trabajo" autoComplete="email" />
      <input name="company" placeholder="Empresa" aria-label="Empresa" autoComplete="organization" />
      <input name="tool" type="hidden" value={tool} />
      <input name="summary" type="hidden" value={summary} />
      <div className="hp" aria-hidden="true"><input name="website" tabIndex={-1} autoComplete="off" /></div>
      {state.status === 'error' && <span className="err" role="alert">{state.message}</span>}
      <button disabled={pending}>{pending ? 'Enviando…' : 'Enviar y descargar ▸'}</button>
      <small>
        Uso tu correo solo para enviarte este recurso y, si quieres, dar seguimiento. <a href="/privacidad">Aviso de privacidad</a> ·{' '}
        <button type="button" onClick={onCancel} style={{ all: 'unset', cursor: 'pointer', textDecoration: 'underline' }}>Volver</button>
      </small>
    </form>
  )
}
