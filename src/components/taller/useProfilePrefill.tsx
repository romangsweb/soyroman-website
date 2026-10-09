'use client'

import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'

import { getMyProfile } from '@/actions/tallerProfile'
import { prefillFor } from '@/lib/taller/profile'

/**
 * Bandera en este navegador: "aquí hay una cuenta del taller". Solo con ella se consulta el perfil,
 * así las visitas sin cuenta no hacen ninguna llamada al servidor.
 */
const FLAG = 'sr-taller-cuenta'
export function setAccountFlag(on: boolean) {
  try {
    if (on) localStorage.setItem(FLAG, '1')
    else localStorage.removeItem(FLAG)
  } catch {}
}

/**
 * Precarga una herramienta con el perfil de empresa. No hace nada si la URL trae valores
 * (enlace compartido o datos que vienen de otra herramienta): esos mandan.
 */
export function useProfilePrefill(slug: string, apply: (vals: Record<string, number | string>) => void) {
  const [on, setOn] = useState(false)
  const ref = useRef(apply)
  ref.current = apply
  useEffect(() => {
    if (window.location.search.length > 1) return
    try {
      if (localStorage.getItem(FLAG) !== '1') return
    } catch {
      return
    }
    let alive = true
    getMyProfile()
      .then((p) => {
        if (!alive) return
        if (!p) return
        const vals = prefillFor(slug, p.data)
        if (!Object.keys(vals).length) return
        ref.current(vals)
        setOn(true)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [slug])
  return on
}

export function PrefillNote({ on }: { on: boolean }) {
  if (!on) return null
  return (
    <p className="tl-prefill" role="status">
      Precargado con tu <Link href="/taller/perfil">perfil de empresa</Link>. Lo que cambies aquí no modifica tu perfil.
    </p>
  )
}
