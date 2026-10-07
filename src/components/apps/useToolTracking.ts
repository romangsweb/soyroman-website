'use client'

import { useEffect, useRef } from 'react'

import { track } from '@/lib/analytics'

/**
 * Eventos de uso de un recurso: `tool_start` con el primer cambio del usuario y
 * `tool_complete` cuando llega al resultado (pide el plan o termina el diagnóstico).
 */
export function useToolTracking(tool: string, state: unknown, completed = false) {
  const first = useRef(true)
  const started = useRef(false)
  const done = useRef(false)
  const key = JSON.stringify(state)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (!started.current) {
      started.current = true
      track('tool_start', { tool })
    }
  }, [key, tool])

  useEffect(() => {
    if (completed && !done.current) {
      done.current = true
      track('tool_complete', { tool })
    }
  }, [completed, tool])
}
