'use client'

import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { claimRuns } from '@/actions/taller'
import { clearPending, readPending } from '@/lib/taller/pending'
import { logEvent } from '@/lib/taller/events'
import { setAccountFlag } from './useProfilePrefill'

/** Al entrar al taller, sube lo que quedó apartado en este navegador. */
export function ClaimPending() {
  const router = useRouter()
  const [n, setN] = useState(0)
  useEffect(() => {
    setAccountFlag(true)
    logEvent('taller_view')
    const list = readPending()
    if (!list.length) return
    claimRuns(list).then((r) => {
      if (!r.ok) return
      clearPending()
      setN(r.count)
      router.refresh()
    })
  }, [router])
  if (!n) return null
  return <p className="tl-note" role="status">Subimos {n === 1 ? '1 resultado' : `${n} resultados`} que tenías en este navegador.</p>
}

/** Salir de la cuenta. */
export function SignOut() {
  const router = useRouter()
  return (
    <button
      type="button"
      className="btn"
      onClick={async () => {
        const { authClient } = await import('@/lib/authClient')
        await authClient.signOut()
        setAccountFlag(false)
        router.push('/')
        router.refresh()
      }}
    >
      Salir
    </button>
  )
}
