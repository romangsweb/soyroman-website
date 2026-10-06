'use client'

import { useEffect } from 'react'

/** Feeds pointer coordinates to every `.spotlight` card for the glow effect. */
export function SpotlightTracker() {
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const target = (e.target as HTMLElement | null)?.closest?.('.spotlight') as HTMLElement | null
      if (!target) return
      const rect = target.getBoundingClientRect()
      target.style.setProperty('--mx', `${e.clientX - rect.left}px`)
      target.style.setProperty('--my', `${e.clientY - rect.top}px`)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])
  return null
}
