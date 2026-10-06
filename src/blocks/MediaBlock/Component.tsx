import type { StaticImageData } from 'next/image'

import { cn } from '@/utilities/ui'
import React from 'react'

import type { MediaBlock as MediaBlockProps } from '@/payload-types'

import { Media } from '../../components/Media'

type Props = MediaBlockProps & {
  className?: string
  imgClassName?: string
  staticImage?: StaticImageData
  disableInnerContainer?: boolean
}

export const MediaBlock: React.FC<Props> = (props) => {
  const { className, imgClassName, media, staticImage } = props

  return (
    <div className={cn('container', className)}>
      {(media || staticImage) && (
        <Media
          imgClassName={cn('border border-border rounded-[0.8rem]', imgClassName)}
          resource={media}
          src={staticImage}
        />
      )}
    </div>
  )
}
