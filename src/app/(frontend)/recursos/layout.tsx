import React from 'react'

import { ToolCall, ToolIntro } from '@/components/apps/ToolFrame'

import './apps.css'

/** Todo /recursos usa el estilo industrial de los aparatos. */
export default function RecursosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="te-app border-x border-black max-w-[1920px] mx-auto">
      <div className="te-wrap"><ToolIntro />{children}<ToolCall /></div>
    </div>
  )
}
