import React, { ViewTransition } from 'react'

/**
 * Wrap each page's content so route changes crossfade/slide.
 * Must live in page.tsx (not layout) so enter/exit fire on navigation.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      <div>{children}</div>
    </ViewTransition>
  )
}

/** Shared-element morph between list and detail views. */
export function Morph({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <ViewTransition name={name} share="morph" default="none">
      {children}
    </ViewTransition>
  )
}
