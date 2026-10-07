import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { Aldrich, Poppins } from 'next/font/google'
import React from 'react'

import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'
import { HeaderComponent } from '@/components/layout/Header'
import { FooterComponent } from '@/components/layout/Footer'
import { SpotlightTracker } from '@/components/motion/SpotlightTracker'
import { Analytics } from '@/components/analytics/Analytics'
import { cms } from '@/lib/cms'
import { SITE, PERSON_ID, ld, personLd } from '@/lib/seo'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

const aldrich = Aldrich({ subsets: ['latin'], weight: '400', variable: '--font-aldrich', display: 'swap' })

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await cms.findGlobal({ slug: 'profile' })
  return (
    <html className={cn(poppins.variable, aldrich.variable, 'font-sans light')} lang="es" suppressHydrationWarning>
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: ld(personLd(profile), {
              '@type': 'WebSite',
              '@id': `${SITE}/#website`,
              url: SITE,
              name: 'Román García',
              inLanguage: 'es-MX',
              publisher: { '@id': PERSON_ID },
            }),
          }}
        />
      </head>
      <body>
        <Providers>
          <SpotlightTracker />
          <HeaderComponent />
          <main className="flex-1">{children}</main>
          <FooterComponent />
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  alternates: { types: { 'application/rss+xml': `${SITE}/blog/rss.xml` } },
  title: {
    default: 'Román García — Director de marketing B2B',
    template: '%s | Román García',
  },
  description:
    'Director de marketing B2B: generación de demanda digital, CRM y RevOps, SEO y AEO, y la infraestructura técnica que los sostiene.',
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
  },
}
