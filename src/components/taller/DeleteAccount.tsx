'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import { deleteAccount } from '@/actions/tallerProfile'
import { clearPending } from '@/lib/taller/pending'
import { setAccountFlag } from './useProfilePrefill'

/** Borrar la cuenta: hay que escribir BORRAR para confirmar (sin diálogos del navegador). */
export function DeleteAccount() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'error'>('idle')

  if (!open) {
    return <button type="button" className="tl-del" onClick={() => setOpen(true)}>Borrar mi cuenta</button>
  }
  return (
    <div className="tl-danger">
      <p>Se borran tu cuenta, tu perfil y todos tus resultados guardados. No se puede deshacer.</p>
      <label htmlFor="tl-confirm">Escribe BORRAR para confirmar</label>
      <input id="tl-confirm" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
      <div className="tl-links">
        <button
          type="button"
          className="btn or"
          disabled={text.trim().toUpperCase() !== 'BORRAR' || state === 'busy'}
          onClick={async () => {
            setState('busy')
            const r = await deleteAccount()
            if (!r.ok) return setState('error')
            setAccountFlag(false)
            clearPending()
            const { authClient } = await import('@/lib/authClient')
            await authClient.signOut().catch(() => {})
            router.push('/?cuenta=borrada')
            router.refresh()
          }}
        >
          {state === 'busy' ? 'Borrando…' : 'Borrar definitivamente'}
        </button>
        <button type="button" className="btn" onClick={() => { setOpen(false); setText('') }}>Cancelar</button>
      </div>
      {state === 'error' && <p className="tl-err" role="alert">No se pudo borrar. Inténtalo de nuevo o escríbeme a contacto@soyroman.com.</p>}
    </div>
  )
}
