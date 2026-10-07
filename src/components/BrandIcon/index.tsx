import React from 'react'

import { brandFor } from '@/data/brandIcons'
import { cn } from '@/utilities/ui'

/** Iniciales para marcas sin logo en simple-icons (p. ej. "Screaming Frog" → "SF"). */
const initials = (name: string) =>
  name
    .replace(/\(.*?\)/g, '')
    .split(/[\s/+.-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

/** Logo monocromo de una herramienta (hereda el color del texto). */
export function BrandIcon({ name, className }: { name: string; className?: string }) {
  const brand = brandFor(name)
  if (!brand) {
    return (
      <span
        aria-hidden="true"
        className={cn('inline-flex items-center justify-center font-mono font-bold text-[9px] leading-none tracking-wider', className)}
      >
        {initials(name)}
      </span>
    )
  }
  return (
    <svg role="img" aria-label={brand.title} viewBox="0 0 24 24" className={cn('fill-current', className)}>
      <path d={brand.path} />
    </svg>
  )
}

/** Logo dentro del recuadro con esquina naranja (mismo lenguaje que IconTile). */
export function BrandTile({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md'; className?: string }) {
  const box = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
  const icon = size === 'sm' ? 'w-3.5 h-3.5' : 'w-[18px] h-[18px]'
  return (
    <span
      title={name}
      className={cn('relative inline-flex items-center justify-center border border-current shrink-0', box, className)}
    >
      <BrandIcon name={name} className={icon} />
      <span className="absolute -top-px -right-px w-1.5 h-1.5 bg-[#e85a2a]" />
    </span>
  )
}
