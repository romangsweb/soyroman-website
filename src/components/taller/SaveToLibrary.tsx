'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'

import { libraryState, markRead, toggleSaved } from '@/actions/tallerLibrary'

const hasAccount = () => {
  try {
    return localStorage.getItem('sr-taller-cuenta') === '1'
  } catch {
    return false
  }
}

/**
 * Botón "Guardar en mi biblioteca" para posts y términos. Con cuenta en este navegador, además marca
 * el artículo como leído tras 30 segundos en la página. Sin cuenta no hace llamadas hasta el clic.
 */
export function SaveToLibrary({ kind, slug, title }: { kind: 'post' | 'term'; slug: string; title: string }) {
  const [saved, setSaved] = useState(false)
  const [state, setState] = useState<'idle' | 'busy' | 'login'>('idle')

  useEffect(() => {
    if (!hasAccount()) return
    let alive = true
    libraryState({ kind, slug }).then((s) => alive && s && setSaved(s.saved)).catch(() => {})
    const t = setTimeout(() => markRead({ kind, slug, title }).catch(() => {}), 30_000)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [kind, slug, title])

  const click = async () => {
    setState('busy')
    const r = await toggleSaved({ kind, slug, title }).catch(() => null)
    if (r?.ok) {
      setSaved(r.saved)
      setState('idle')
    } else setState(r && !r.ok && r.reason === 'auth' ? 'login' : 'idle')
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={click}
        disabled={state === 'busy'}
        aria-pressed={saved}
        className={`inline-flex items-center gap-2 px-3 py-1 border border-black text-[10px] uppercase tracking-widest font-bold font-mono transition-colors ${saved ? 'bg-black text-white' : 'bg-white hover:bg-[#e85a2a] hover:border-[#e85a2a] hover:text-white'}`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z" /></svg>
        {saved ? 'En tu biblioteca' : 'Guardar en mi biblioteca'}
      </button>
      {state === 'login' && (
        <span className="font-mono text-[11px]">
          <Link href="/entrar" className="underline">Entra a tu taller</Link> para guardar artículos.
        </span>
      )}
    </span>
  )
}
