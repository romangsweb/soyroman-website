'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import { runRadarNow } from '@/actions/tallerRadar'

export function RunRadar({ disabled, label = 'Correr ahora ▸' }: { disabled?: boolean; label?: string }) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'busy'>('idle')
  const [msg, setMsg] = useState('')
  return (
    <div className="tl-run">
      <button
        type="button"
        className="btn or"
        disabled={disabled || state === 'busy'}
        onClick={async () => {
          setState('busy')
          setMsg('')
          const r = await runRadarNow().catch(() => ({ ok: false as const, message: 'No se pudo correr el radar. Intenta más tarde.' }))
          setState('idle')
          if (r.ok) router.refresh()
          else setMsg(r.message)
        }}
      >
        {state === 'busy' ? 'Preguntando a la IA… (≈20 s)' : label}
      </button>
      {msg && <p className="tl-err" role="alert">{msg}</p>}
    </div>
  )
}
