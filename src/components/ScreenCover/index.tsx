import React from 'react'

import { cn } from '@/utilities/ui'

import { screenSvg, type ScreenOptions } from './screen'

/**
 * Portada del blog como pantalla del aparato. `speed` > 1 la hace más lenta (miniaturas);
 * `still` la congela (por ejemplo en listados largos).
 */
export function ScreenCover({ className, speed = 1, still = false, ...opts }: ScreenOptions & { className?: string; speed?: number; still?: boolean }) {
  return (
    <div
      className={cn('sc relative overflow-hidden bg-[#050607] [&>svg]:absolute [&>svg]:inset-0 [&>svg]:w-full [&>svg]:h-full', still && 'sc-still', className)}
      style={{ ['--sc' as string]: speed }}
      dangerouslySetInnerHTML={{ __html: screenSvg(opts) }}
    />
  )
}

/** Categoría principal (slug) de un post poblado, para elegir la escena. */
export const postCategory = (post: any): string | null => {
  const c = (post?.categories || []).find((x: any) => x && typeof x === 'object' && x.slug)
  return c ? c.slug : null
}
