import React from 'react'
import { Aldrich } from 'next/font/google'

import './apps.css'

const aldrich = Aldrich({ subsets: ['latin'], weight: '400', variable: '--font-aldrich', display: 'swap' })

/** Todo /recursos usa el estilo industrial de los aparatos. */
export default function RecursosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${aldrich.variable} te-app border-x border-black max-w-[1920px] mx-auto`}>
      <div className="te-wrap">{children}</div>
    </div>
  )
}
