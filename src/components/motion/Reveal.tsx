'use client'

import React, { useEffect, useRef } from 'react'

type RevealProps = {
  children: React.ReactNode
  as?: React.ElementType
  className?: string
  /** Delay in ms before the element animates in. */
  delay?: number
  /** Extra variant class: 'fade' | 'scale' | 'left' | 'line' | 'line-y' */
  variant?: 'up' | 'fade' | 'scale' | 'left' | 'line' | 'line-y'
  style?: React.CSSProperties
} & Record<string, unknown>

const variantClass: Record<NonNullable<RevealProps['variant']>, string> = {
  up: 'reveal',
  fade: 'reveal reveal-fade',
  scale: 'reveal reveal-scale',
  left: 'reveal reveal-left',
  line: 'reveal-line',
  'line-y': 'reveal-line-y',
}

/** Adds `.is-visible` once the element enters the viewport. */
export function Reveal({
  children,
  as: Tag = 'div',
  className = '',
  delay = 0,
  variant = 'up',
  style,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Elementos más altos que la pantalla, o sin IntersectionObserver: mostrar ya
    if (typeof IntersectionObserver === 'undefined' || el.offsetHeight > window.innerHeight * 0.9) {
      el.classList.add('is-visible')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      className={`${variantClass[variant]} ${className}`}
      style={{ ...style, ['--delay' as string]: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
