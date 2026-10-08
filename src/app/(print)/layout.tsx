import { Aldrich } from 'next/font/google'
import React from 'react'

// Layout mínimo para páginas de impresión (sin menú, pie ni banner de cookies)
const aldrich = Aldrich({ subsets: ['latin'], weight: '400', variable: '--font-aldrich', display: 'swap' })

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={aldrich.variable}>
      <body style={{ margin: 0, fontFamily: 'var(--font-aldrich), ui-sans-serif, system-ui' }}>{children}</body>
    </html>
  )
}
