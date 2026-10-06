'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useId, useState } from 'react'

export type NavItem = { href: string; label: string; newTab?: boolean }

export function MobileMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const panelId = useId()

  // Cierra al navegar
  useEffect(() => setOpen(false), [pathname])

  // Esc para cerrar + bloquea el scroll del fondo mientras está abierto
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        className="font-mono text-[9px] uppercase font-bold tracking-widest px-4 h-12 flex items-center border-l border-black hover:bg-[#ff3300] hover:text-white transition-colors"
      >
        {open ? '[CERRAR]' : '[MENU]'}
      </button>

      <nav
        id={panelId}
        hidden={!open}
        className="fixed inset-x-0 top-12 bottom-0 z-50 overflow-y-auto border-t border-black bg-[#f4f4f4]"
      >
        <ul className="divide-y divide-black border-b border-black bg-white">
          {items.map((item, i) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <li key={`${item.href}-${i}`}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center justify-between px-6 py-5 font-mono text-sm uppercase font-bold tracking-widest transition-colors hover:bg-[#ff3300] hover:text-white ${active ? 'text-[#ff3300]' : ''}`}
                  {...(item.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] opacity-40">{String(i + 1).padStart(2, '0')}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
