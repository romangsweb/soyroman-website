import React from 'react'
import Link from 'next/link'
import { cms } from '@/lib/cms'
import { MobileMenu, type NavItem } from './MobileMenu'

// Respaldo mientras el global "Header" del CMS esté vacío
const DEFAULT_NAV: NavItem[] = [
  { href: '/expertise', label: 'Expertise' },
  { href: '/proyectos', label: 'Proyectos' },
  { href: '/blog', label: 'Blog' },
  { href: '/glosario', label: 'Glosario' },
  { href: '/recursos', label: 'Recursos' },
  { href: '/consultoria', label: 'Consultoría' },
  { href: '/cv', label: 'CV' },
  { href: '/contacto', label: 'Contacto' },
]

function toNavItems(navItems: any[] | null | undefined): NavItem[] {
  const items = (navItems || [])
    .map((item: any): NavItem | null => {
      const link = item?.link
      if (!link?.label) return null
      const href =
        link.type === 'reference' && link.reference?.value
          ? `/${(link.reference.value as any).slug || ''}`
          : link.url || '#'
      return { href, label: link.label, newTab: Boolean(link.newTab) }
    })
    .filter((i): i is NavItem => i !== null)
  return items.length > 0 ? items : DEFAULT_NAV
}

export async function HeaderComponent() {
  const header = await cms.findGlobal({ slug: 'header' })
  const items = toNavItems(header?.navItems)

  return (
    <header className="sticky top-0 z-50 border-b border-black bg-[#f4f4f4]">
      <div className="container mx-auto max-w-[1920px]">
        <div className="flex h-12 items-center justify-between border-x border-black bg-white px-4">
          <Link href="/" className="font-mono text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 hover:text-[#e85a2a] transition-colors">
            <span className="w-2 h-2 bg-black"></span>
            SOY_ROMAN
          </Link>

          <nav className="hidden lg:flex items-center">
            {items.map((item, i) => (
              <Link
                key={`${item.href}-${i}`}
                href={item.href}
                className="font-mono text-[9px] uppercase font-bold tracking-widest px-4 h-12 flex items-center border-l border-black hover:bg-[#e85a2a] hover:text-white transition-colors"
                {...(item.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <MobileMenu items={items} />
        </div>
      </div>
    </header>
  )
}
