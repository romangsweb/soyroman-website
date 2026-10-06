export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { Poppins } from 'next/font/google'
import React from 'react'

import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'
import { HeaderComponent } from '@/components/layout/Header'
import { FooterComponent } from '@/components/layout/Footer'
import { SpotlightTracker } from '@/components/motion/SpotlightTracker'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()

  return (
    <html className={cn(poppins.variable, 'font-sans light')} lang="es" suppressHydrationWarning>
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
      </head>
      <body>
        <Providers>
          <SpotlightTracker />
          <HeaderComponent />
          <main className="flex-1">{children}</main>
          <FooterComponent />
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  title: {
    default: 'Román García — Director de Marketing B2B',
    template: '%s | Román García',
  },
  description:
    'Director de Marketing B2B especializado en el ecosistema SAP. SEO, Paid Media, RevOps, MarTech y liderazgo de equipos.',
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
  },
}
