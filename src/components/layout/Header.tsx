import React from 'react'
import Link from 'next/link'
import { cms } from '@/lib/cms'
import { MobileMenu, type NavItem } from './MobileMenu'
import { NavKeys, NavLinks } from './NavLinks'
import { LogoScreen } from './DotMatrix'

// Respaldo mientras el global "Header" del CMS esté vacío
const DEFAULT_NAV: NavItem[] = [
  { href: '/expertise', label: 'Expertise' },
  { href: '/proyectos', label: 'Proyectos' },
  { href: '/blog', label: 'Blog' },
  { href: '/glosario', label: 'Glosario' },
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
  const [header, profile] = await Promise.all([cms.findGlobal({ slug: 'header' }), cms.findGlobal({ slug: 'profile' })])
  // Recursos y Contacto van aparte, como teclas al final; se quitan de la lista del CMS si vienen ahí
  const special = (href: string) => /\/(recursos|contacto)\/?$/.test(href)
  const items = toNavItems(header?.navItems).filter((i) => !special(i.href))
  const available = (profile as any)?.available !== false

  return (
    <header className="sticky top-0 z-50 border-b border-black bg-[#f4f4f4]">
      <div className="container mx-auto max-w-[1920px]">
        <div className="flex h-14 items-stretch border-x border-black bg-white">
          <Link href="/" className="flex items-center gap-3 px-3 sm:px-4 border-r border-black group" aria-label="Román García · inicio">
            <LogoScreen />
            <span className="hidden sm:block font-mono text-[9px] uppercase font-bold tracking-widest leading-relaxed">
              Román García
              <span className="block text-[#e85a2a]">Marketing B2B</span>
            </span>
          </Link>
          <NavLinks items={items} />
          <div className="flex items-stretch ml-auto lg:ml-0">
            <NavKeys available={available} />
            <MobileMenu items={[...items, { href: '/recursos', label: 'Recursos' }, { href: '/taller', label: 'Mi taller' }]} />
          </div>
        </div>
      </div>
    </header>
  )
}
