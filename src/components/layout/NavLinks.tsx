'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

import { track } from '@/lib/analytics'
import type { NavItem } from './MobileMenu'

const cell = 'relative font-mono text-[9px] uppercase font-bold tracking-widest px-4 h-14 flex items-center border-l border-black transition-colors'
const isActive = (path: string, href: string) => path === href || path.startsWith(`${href}/`)

/** LED encima de cada enlace: naranja en la página actual y al pasar el cursor. */
function Led({ on, color = '#e85a2a', idle = '#d0d0cc' }: { on: boolean; color?: string; idle?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute top-2.5 left-1/2 -ml-[2.5px] w-[5px] h-[5px] rounded-full transition-colors ${on ? 'bg-[var(--led)]' : 'bg-[var(--idle)] group-hover:bg-[var(--led)]'}`}
      style={{ ['--led' as string]: color, ['--idle' as string]: idle, boxShadow: on ? `0 0 0 3px ${color}40` : undefined }}
    />
  )
}

export function NavLinks({ items }: { items: NavItem[] }) {
  const path = usePathname() || '/'
  return (
    <nav className="hidden lg:flex items-stretch ml-auto" aria-label="Principal">
      {items.map((item, i) => {
        const on = isActive(path, item.href)
        return (
          <Link key={`${item.href}-${i}`} href={item.href} aria-current={on ? 'page' : undefined}
            className={`group ${cell} hover:bg-[#f4f4f4] ${on ? 'text-[#e85a2a]' : ''}`}
            {...(item.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
            <Led on={on} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

/** Teclas destacadas al final del menú: misma forma de celda con LED, otro color. */
export function NavKeys({ available }: { available: boolean }) {
  const path = usePathname() || '/'
  const rec = isActive(path, '/recursos')
  const con = isActive(path, '/contacto')
  return (
    <div className="flex items-stretch">
      <Link href="/recursos" aria-current={rec ? 'page' : undefined}
        className={`group ${cell} hidden lg:flex bg-[#e85a2a] text-white hover:bg-[#c94b20]`}>
        <Led on={rec} color="#ffffff" idle="rgba(255,255,255,.45)" />
        Recursos
      </Link>
      <Link href="/contacto" onClick={() => track('contact_click', { from: 'nav' })} aria-current={con ? 'page' : undefined}
        className={`group ${cell} bg-black text-white hover:bg-[#2a2d30]`}>
        <Led on color={available ? '#3ddc84' : '#e85a2a'} idle={available ? '#3ddc84' : '#e85a2a'} />
        Contacto
      </Link>
    </div>
  )
}
