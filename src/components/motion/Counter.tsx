'use client'

import React, { useEffect, useRef, useState } from 'react'

/**
 * Animates the numeric part of a value like "+10", "~68k", "6" or "+1 año"
 * from 0 when it scrolls into view. SSR renders the final value.
 */
export function Counter({ value, duration = 1800 }: { value: string; duration?: number }) {
  const match = value.match(/^([^\d]*)(\d+(?:[.,]\d+)?)(.*)$/)
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    if (!match) return
    const [, prefix, numStr, suffix] = match
    const target = parseFloat(numStr.replace(',', '.'))
    const decimals = numStr.includes('.') || numStr.includes(',') ? 1 : 0
    const el = ref.current
    if (!el) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    setDisplay(`${prefix}0${suffix}`)
    let raf = 0
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration)
          const eased = 1 - Math.pow(2, -10 * t) // easeOutExpo
          const current = t === 1 ? target : target * eased
          setDisplay(`${prefix}${current.toFixed(decimals)}${suffix}`)
          if (t < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration])

  return (
    <span ref={ref} className="tabular-nums">
      {display}
    </span>
  )
}
