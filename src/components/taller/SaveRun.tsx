'use client'

import Link from 'next/link'
import React, { useState } from 'react'

import { saveRun, type RunInput } from '@/actions/taller'
import { pushPending } from '@/lib/taller/pending'
import { LoginForm } from './LoginForm'

/**
 * "Guardar en mi taller". La sesión se revisa solo al hacer clic (la página de la herramienta sigue siendo estática).
 * Sin sesión, el resultado queda en este navegador y se sube al taller al entrar.
 */
export function SaveRun({ run }: { run: () => RunInput }) {
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'login' | 'error'>('idle')

  const save = async () => {
    setState('saving')
    const r = run()
    const res = await saveRun(r).catch(() => ({ ok: false as const, reason: 'error' as const }))
    if (res.ok) return setState('saved')
    if (res.reason === 'auth') {
      pushPending(r)
      return setState('login')
    }
    setState('error')
  }

  return (
    <div className="tl-save">
      {state === 'saved' ? (
        <Link className="btn" href="/taller" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>Guardado ✓ · Ver mi taller ▸</Link>
      ) : (
        <button type="button" className="btn dk" onClick={save} disabled={state === 'saving'}>
          {state === 'saving' ? 'Guardando…' : 'Guardar en mi taller ▸'}
        </button>
      )}
      {state === 'error' && <p className="tl-err" role="alert">No se pudo guardar. Inténtalo de nuevo.</p>}
      {state === 'login' && (
        <div className="tl-pitch">
          <p>Tu resultado quedó apartado en este navegador. Entra con tu correo y se guarda en tu taller, con su historial.</p>
          <LoginForm callbackURL="/taller" compact />
        </div>
      )}
    </div>
  )
}
