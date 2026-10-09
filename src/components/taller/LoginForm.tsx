'use client'

import Link from 'next/link'
import React, { useState } from 'react'

import { authClient } from '@/lib/authClient'

const GOOGLE = process.env.NEXT_PUBLIC_GOOGLE_LOGIN === '1'

/** Entrada a Mi taller: enlace por correo y, si está configurado, Google. Sin contraseñas. */
export function LoginForm({ callbackURL = '/taller', compact = false }: { callbackURL?: string; compact?: boolean }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setState('error')
    setState('sending')
    const { error } = await authClient.signIn.magicLink({ email: email.trim().toLowerCase(), callbackURL, errorCallbackURL: '/entrar?error=enlace' })
    setState(error ? 'error' : 'sent')
  }

  if (state === 'sent') {
    return (
      <div className="tl-login" role="status">
        <b>Revisa tu correo</b>
        <p>Te mandamos un enlace a {email}. Funciona una sola vez y vence en 10 minutos.</p>
        <button type="button" className="btn" onClick={() => setState('idle')}>Usar otro correo</button>
      </div>
    )
  }

  return (
    <form className="tl-login" onSubmit={send}>
      {!compact && <b>Entra a tu taller</b>}
      <label htmlFor="tl-email">Correo de trabajo</label>
      <input id="tl-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@empresa.com" />
      <button type="submit" className="btn or" disabled={state === 'sending'}>{state === 'sending' ? 'Enviando…' : 'Enviarme el enlace ▸'}</button>
      {GOOGLE && (
        <button type="button" className="btn" onClick={() => authClient.signIn.social({ provider: 'google', callbackURL })}>Continuar con Google</button>
      )}
      {state === 'error' && <p className="tl-err" role="alert">Revisa el correo o inténtalo en un minuto.</p>}
      <p className="tl-fine">Sin contraseña. Al entrar aceptas el <Link href="/privacidad">aviso de privacidad</Link>; puedes borrar tu cuenta cuando quieras.</p>
    </form>
  )
}
