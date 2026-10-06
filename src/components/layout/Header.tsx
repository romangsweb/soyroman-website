import React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function HeaderComponent() {
  const payload = await getPayload({ config: configPromise })
  const header = await payload.findGlobal({ slug: 'header' })

  return (
    <header className="sticky top-0 z-50 border-b border-black bg-[#f4f4f4]">
      <div className="container mx-auto max-w-[1920px]">
        <div className="flex h-12 items-center justify-between border-x border-black bg-white px-4">
          <Link href="/" className="font-mono text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 hover:text-[#ff3300] transition-colors">
            <span className="w-2 h-2 bg-black"></span>
            SOY_ROMAN
          </Link>

          <nav className="hidden md:flex items-center">
            {header?.navItems?.map((item: any, i: number) => {
              const link = item?.link
              if (!link) return null
              const href =
                link.type === 'reference' && link.reference?.value
                  ? `/${(link.reference.value as any).slug || ''}`
                  : link.url || '#'

              return (
                <Link
                  key={i}
                  href={href}
                  className="font-mono text-[9px] uppercase font-bold tracking-widest px-4 h-12 flex items-center border-l border-black hover:bg-[#ff3300] hover:text-white transition-colors"
                  {...(link.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Mobile menu placeholder */}
          <button
            className="md:hidden font-mono text-[9px] uppercase font-bold tracking-widest px-4 h-12 flex items-center border-l border-black hover:bg-[#ff3300] hover:text-white transition-colors"
            aria-label="Menú"
          >
            [MENU]
          </button>
        </div>
      </div>
    </header>
  )
}
