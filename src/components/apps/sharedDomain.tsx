'use client'

import Link from 'next/link'
import React, { useEffect } from 'react'

/**
 * Dominio compartido entre los analizadores: el último dominio analizado se recuerda en el navegador
 * y también se acepta ?d=dominio.com en la URL. Solo prellena el campo; nunca corre un análisis solo.
 */
const KEY = 'sr_domain'
const VALID = /^[a-z0-9.-]{3,100}$/i

export function readSharedDomain(): string {
  try {
    const q = new URLSearchParams(window.location.search).get('d')?.trim() || ''
    if (q && VALID.test(q)) return q.toLowerCase()
    const saved = localStorage.getItem(KEY) || ''
    return VALID.test(saved) ? saved : ''
  } catch {
    return ''
  }
}

export function saveSharedDomain(domain?: string | null) {
  if (!domain || !VALID.test(domain)) return
  try {
    localStorage.setItem(KEY, domain.toLowerCase())
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

/** Prellena el campo de dominio al montar (si está vacío). */
export function useSharedDomain(set: (d: string) => void) {
  useEffect(() => {
    const d = readSharedDomain()
    if (d) set(d)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

const CHAIN: { slug: string; label: string }[] = [
  { slug: 'auditor-aeo', label: 'Auditor AEO' },
  { slug: 'radiografia-stack', label: 'Radiografía de stack' },
  { slug: 'salud-correo', label: 'Salud del correo' },
  { slug: 'velocidad-real', label: 'Velocidad real' },
  { slug: 'comparador-competidores', label: 'Comparador' },
  { slug: 'te-recomienda-la-ia', label: '¿Te recomienda la IA?' },
]

/** Botón "Siguiente: …" con el dominio ya puesto. */
export function NextTool({ current, domain }: { current: string; domain?: string | null }) {
  const i = CHAIN.findIndex((c) => c.slug === current)
  const next = i >= 0 ? CHAIN[i + 1] : undefined
  if (!next) return null
  const href = `/recursos/${next.slug}${domain ? `?d=${encodeURIComponent(domain)}` : ''}`
  return (
    <Link className="btn" href={href} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
      Siguiente: {next.label} ▸
    </Link>
  )
}
