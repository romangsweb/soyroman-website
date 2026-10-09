import Link from 'next/link'
import React from 'react'

/** Pestañas del taller. */
export function TallerNav({ active, profilePct }: { active: 'panel' | 'perfil'; profilePct?: number }) {
  const items: [string, string, 'panel' | 'perfil', string?][] = [
    ['/taller', 'Panel', 'panel'],
    ['/taller/perfil', 'Perfil de empresa', 'perfil', profilePct !== undefined ? `${profilePct}%` : undefined],
  ]
  return (
    <nav className="pl-tabs tl-nav" aria-label="Mi taller">
      {items.map(([href, label, key, extra]) => (
        <Link key={href} href={href} className={`pl-tab${active === key ? ' on' : ''}`} aria-current={active === key ? 'page' : undefined}>
          {label}
          {extra && <small> · {extra}</small>}
        </Link>
      ))}
    </nav>
  )
}
