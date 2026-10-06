import React from 'react'

import { Media } from '@/components/Media'
import type { Media as MediaType } from '@/payload-types'
import { cn } from '@/utilities/ui'

type Props = {
  cover?: MediaType | number | string | null
  className?: string
  priority?: boolean
  sizes?: string
}

/** ¿El post trae una portada poblada (objeto Media con URL)? */
export const hasCover = (cover: Props['cover']): cover is MediaType =>
  Boolean(cover && typeof cover === 'object' && (cover as MediaType).url)

/**
 * Portada de un post con proporción fija (la define `className`, p. ej. aspect-[16/9]).
 * No renderiza nada si el post no tiene portada.
 */
export function PostCover({ cover, className, priority, sizes }: Props) {
  if (!hasCover(cover)) return null
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
