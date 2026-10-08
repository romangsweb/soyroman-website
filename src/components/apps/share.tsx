'use client'

import React, { useEffect, useRef, useState } from 'react'

import { track } from '@/lib/analytics'
import type { Param, Values } from './Device'

/** Utilidades para compartir resultados: valores en la URL y botón "Copiar enlace". */

export const query = () => {
  try {
    return new URLSearchParams(window.location.search)
  } catch {
    return new URLSearchParams()
  }
}

/** Lee de la URL los valores numéricos de un aparato, validados contra mínimo y máximo. */
export function readParamValues(params: Param[]): Values {
  const q = query()
  const out: Values = {}
  for (const p of params) {
    if (!q.has(p.id)) continue
    const n = Number(q.get(p.id))
    if (Number.isFinite(n) && n >= p.min && n <= p.max) out[p.id] = n
  }
  return out
}

/** Estado complejo comprimido en un parámetro (JSON → base64url). */
export function encodeState(obj: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(obj))
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
export function decodeState<T = unknown>(s: string | null): T | null {
  if (!s || s.length > 4000) return null
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))) as T
  } catch {
    return null
  }
}

/** Corre el análisis una vez si la URL trae ?auto=1 y ya hay dominio. */
export function useAutoRun(ready: boolean, run: () => void) {
  const done = useRef(false)
  useEffect(() => {
    if (done.current || !ready) return
    if (query().get('auto') !== '1') return
    done.current = true
    run()
  }, [ready, run])
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const t = document.createElement('textarea')
      t.value = text
      t.style.position = 'fixed'
      t.style.opacity = '0'
      document.body.appendChild(t)
      t.select()
      const ok = document.execCommand('copy')
      t.remove()
      return ok
    } catch {
      return false
    }
  }
}

/** Botón "Copiar enlace": arma la URL de la página actual con los parámetros dados. */
export function ShareButton({ tool, params, className = 'btn' }: { tool: string; params: () => Record<string, string | number | undefined>; className?: string }) {
  const [state, setState] = useState<'idle' | 'ok' | 'fail'>('idle')
  const onClick = async () => {
    const q = new URLSearchParams()
    for (const [k, v] of Object.entries(params())) if (v !== undefined && v !== '') q.set(k, String(v))
    const url = `${window.location.origin}${window.location.pathname}?${q.toString()}`
    const ok = await copy(url)
    setState(ok ? 'ok' : 'fail')
    if (ok) track('share', { tool })
    setTimeout(() => setState('idle'), 2500)
  }
  return (
    <button type="button" className={className} onClick={onClick} aria-live="polite">
      {state === 'ok' ? 'Enlace copiado ✓' : state === 'fail' ? 'No se pudo copiar' : 'Copiar enlace ▸'}
    </button>
  )
}
