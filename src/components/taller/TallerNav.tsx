import Link from 'next/link'
import React from 'react'

type Tab = 'panel' | 'perfil' | 'radar' | 'biblioteca' | 'admin'

/** Pestañas del taller (la de admin solo con ese rol). */
export function TallerNav({ active, profilePct, admin = false }: { active: Tab; profilePct?: number; admin?: boolean }) {
  const items: [string, string, Tab, string?][] = [
    ['/taller', 'Panel', 'panel'],
    ['/taller/perfil', 'Perfil de empresa', 'perfil', profilePct !== undefined ? `${profilePct}%` : undefined],
    ['/taller/radar', 'Radar de IA', 'radar'],
    ['/taller/biblioteca', 'Biblioteca', 'biblioteca'],
    ...(admin ? ([['/taller/admin', 'Uso del sitio', 'admin']] as [string, string, Tab][]) : []),
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
