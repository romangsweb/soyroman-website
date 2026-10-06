import React from 'react'
import Link from 'next/link'
import { cms } from '@/lib/cms'

export async function FooterComponent() {
  const footer = await cms.findGlobal({ slug: 'footer' })
  const profile = await cms.findGlobal({ slug: 'profile' })

  return (
    <footer className="bg-[#f4f4f4] border-t border-black mt-auto max-w-[1920px] mx-auto w-full">
      <div className="container mx-auto border-x border-black bg-white">
        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-black">
          {/* Brand */}
          <div className="md:col-span-5 p-8 md:p-12 flex flex-col justify-between">
            <div>
              <Link href="/" className="font-mono text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 mb-6">
                <span className="w-2 h-2 bg-[#ff3300] animate-pulse"></span>
                SOY_ROMAN_SYS
              </Link>
              {profile?.shortBio && (
                <p className="font-mono text-[10px] leading-relaxed max-w-[30ch] opacity-70">
                  {profile.shortBio}
                </p>
              )}
            </div>
            <div className="mt-12 hidden md:block">
              <div className="w-full h-8 border border-black/20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMjIyIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-20"></div>
            </div>
          </div>

          {/* Nav */}
          <div className="md:col-span-4 p-8 md:p-12 bg-[#f4f4f4]">
            <h4 className="font-mono text-[10px] uppercase font-bold tracking-widest opacity-50 mb-6 border-b border-black/10 pb-2">
              // Navigation
            </h4>
            <nav className="flex flex-col gap-0 divide-y divide-black/10">
              {footer?.navItems?.map((item: any, i: number) => {
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
                    className="font-mono text-[10px] uppercase font-bold tracking-widest py-3 hover:text-[#ff3300] hover:pl-2 transition-all"
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Social */}
          <div className="md:col-span-3 p-8 md:p-12">
            <h4 className="font-mono text-[10px] uppercase font-bold tracking-widest opacity-50 mb-6 border-b border-black/10 pb-2">
              // Outbound_Links
            </h4>
            <div className="flex flex-col gap-0 divide-y divide-black/10">
              {profile?.socialLinks?.map((social: any, i: number) => (
                <a
                  key={i}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] uppercase font-bold tracking-widest py-3 hover:text-[#0A32B8] hover:pl-2 transition-all flex items-center justify-between"
                >
                  {social.platform}
                  <span>→</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-black bg-[#e5e5e5] flex flex-col sm:flex-row items-center justify-between text-[9px] font-mono uppercase font-bold tracking-widest">
          <p>
            {footer?.copyright || `© ${new Date().getFullYear()} Román García`}
          </p>
          <div className="flex gap-4 mt-2 sm:mt-0 opacity-50">
            <span>SYS_VERSION: 2.4.0</span>
            <span>STATUS: ONLINE</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
