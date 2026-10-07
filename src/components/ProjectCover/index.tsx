import React from 'react'

import { cn } from '@/utilities/ui'

/**
 * Portada generativa de un proyecto: retícula técnica con formas y una línea de
 * acento, derivada del slug (siempre la misma para un proyecto y distinta entre
 * proyectos). Se usa mientras el proyecto no tenga portada real.
 */

// Generador pseudoaleatorio determinista (FNV-1a + mulberry32)
function seeded(seed: string) {
  let h = 2166136261
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const W = 480
const H = 300
const G = 30

type Props = {
  slug: string
  color?: string | null
  className?: string
  /** Muestra el slug como rótulo técnico en la esquina. */
  label?: boolean
}

export function ProjectCover({ slug, color, className, label = true }: Props) {
  const accent = color && /^#[0-9a-f]{3,8}$/i.test(color) ? color : '#ff3300'
  const r = seeded(slug)
  const shapes: React.ReactNode[] = []
  const n = 6 + Math.floor(r() * 5)
  for (let i = 0; i < n; i++) {
    const x = Math.floor(r() * 14) * G
    const y = Math.floor(r() * 9) * G
    const w = (1 + Math.floor(r() * 4)) * G
    const h = (1 + Math.floor(r() * 3)) * G
    const k = r()
    if (k < 0.45) shapes.push(<rect key={i} x={x} y={y} width={w} height={h} fill="none" stroke="rgba(255,255,255,.7)" />)
    else if (k < 0.7)
      shapes.push(<circle key={i} cx={x + G} cy={y + G} r={G * (0.6 + r() * 1.4)} fill="none" stroke="rgba(255,255,255,.55)" />)
    else if (k < 0.88) shapes.push(<rect key={i} x={x} y={y} width={w} height={h} fill="rgba(255,255,255,.08)" />)
    else shapes.push(<rect key={i} x={x} y={y} width={G} height={G} fill={accent} />)
  }
  const ax = Math.floor(r() * 12) * G + G
  const ay = Math.floor(r() * 7) * G + G

  return (
    <div className={cn('relative overflow-hidden bg-[#111]', className)} aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
        <defs>
          <pattern id={`grid-${slug}`} width={G} height={G} patternUnits="userSpaceOnUse">
            <path d={`M ${G} 0 L 0 0 0 ${G}`} fill="none" stroke="rgba(255,255,255,.07)" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill={`url(#grid-${slug})`} />
        {shapes}
        <line x1={0} y1={ay} x2={W} y2={ay} stroke={accent} strokeWidth={1.5} />
        <circle cx={ax} cy={ay} r={5} fill={accent} />
      </svg>
      {label && (
        <span className="absolute left-3 bottom-3 font-mono text-[9px] uppercase tracking-[0.15em] text-white/45">
          {slug}
        </span>
      )}
    </div>
  )
}
