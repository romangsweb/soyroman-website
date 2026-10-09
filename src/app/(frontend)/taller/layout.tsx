import type { Metadata } from 'next'
import React from 'react'

import '../recursos/apps.css'

/** Mi taller usa el mismo estilo de aparatos que /recursos. Privado: fuera de buscadores. */
export default function TallerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="te-app border-x border-black max-w-[1920px] mx-auto">
      <div className="te-wrap">{children}</div>
    </div>
  )
}

export const metadata: Metadata = { robots: { index: false, follow: false } }
