import React from 'react'

import { Media } from '@/components/Media'
import type { Media as MediaType } from '@/payload-types'
import { cn } from '@/utilities/ui'

type Props = {
  cover?: MediaType | number | string | null
  className?: string
  priority?: boolean
  sizes?: string
  /** Si no hay portada, dibuja un marcador con retícula en lugar de nada. */
  fallback?: boolean
}

/** ¿El post trae una portada poblada (objeto Media con URL)? */
export const hasCover = (cover: Props['cover']): cover is MediaType =>
  Boolean(cover && typeof cover === 'object' && (cover as MediaType).url)

/**
 * Portada de un post con proporción fija (la define `className`, p. ej. aspect-[16/9]).
 * No renderiza nada si el post no tiene portada.
 */
export function PostCover({ cover, className, priority, sizes, fallback }: Props) {
  if (!hasCover(cover)) {
    if (!fallback) return null
    return (
      <div
        aria-hidden="true"
        className={cn(
          'relative overflow-hidden bg-[#e5e5e5] flex items-center justify-center',
          "bg-[radial-gradient(circle,rgba(0,0,0,0.18)_1px,transparent_1px)] [background-size:12px_12px]",
          className,
        )}
      >
        <span className="w-10 h-10 border border-black bg-[#f4f4f4] flex items-center justify-center">
          <span className="w-3 h-3 bg-[#e85a2a]" />
        </span>
      </div>
    )
  }
  return (
    <div className={cn('relative overflow-hidden bg-[#e5e5e5]', className)}>
      <Media
        resource={cover}
        fill
        htmlElement={null}
        imgClassName="object-cover"
        priority={priority}
        size={sizes}
      />
    </div>
  )
}
