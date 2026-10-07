'use client'

import React, { useEffect, useRef } from 'react'

/** Perilla giratoria: arrastre vertical, rueda del ratón y flechas del teclado (rol de slider accesible). */
export function Knob({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  valueText,
  tone = 'light',
  size = 'md',
  ticks = 0,
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  label: string
  valueText?: string
  tone?: 'light' | 'or' | 'bk'
  size?: 'md' | 'big'
  ticks?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ y: number; v: number } | null>(null)
  const clamp = (x: number) => Math.min(max, Math.max(min, Math.round(x / step) * step))
  const angle = -135 + ((value - min) / (max - min)) * 270

  // La rueda necesita un listener no pasivo para poder evitar el scroll de la página
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      onChange(clamp(value + (e.deltaY < 0 ? step : -step)))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  })

  return (
    <div className="knob-wrap">
      {ticks > 1 && (
        <svg className="ticks" viewBox="0 0 142 142" aria-hidden="true">
          {Array.from({ length: ticks }).map((_, i) => {
            const a = ((-135 + (i * 270) / (ticks - 1)) * Math.PI) / 180
            return (
              <line key={i} x1={71 + 64 * Math.sin(a)} y1={71 - 64 * Math.cos(a)} x2={71 + 70 * Math.sin(a)} y2={71 - 70 * Math.cos(a)}
                stroke="#e6e6e1" strokeWidth="2" />
            )
          })}
        </svg>
      )}
      <div
        ref={ref}
        className={`o-knob ${size === 'big' ? 'big' : ''} ${tone === 'light' ? '' : tone}`}
        style={{ ['--a' as string]: `${angle}deg` }}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueText}
        onPointerDown={(e) => {
          drag.current = { y: e.clientY, v: value }
          ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (!drag.current) return
          onChange(clamp(drag.current.v + ((drag.current.y - e.clientY) / 120) * (max - min)))
        }}
        onPointerUp={() => (drag.current = null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowRight') onChange(clamp(value + step))
          else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') onChange(clamp(value - step))
          else if (e.key === 'Home') onChange(min)
          else if (e.key === 'End') onChange(max)
          else return
          e.preventDefault()
        }}
      />
    </div>
  )
}
