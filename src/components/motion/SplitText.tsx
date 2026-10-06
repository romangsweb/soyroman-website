import React from 'react'

type SplitTextProps = {
  text: string
  /** Substring rendered in the accent color with an animated underline. */
  highlight?: string
  /** Base delay (ms) before the first word animates. */
  delay?: number
  className?: string
}

/** Word-by-word masked reveal on page load. Pure CSS, server-renderable. */
export function SplitText({ text, highlight, delay = 0, className }: SplitTextProps) {
  const segments: { text: string; accent: boolean }[] = []
  if (highlight && text.includes(highlight)) {
    const [before, ...rest] = text.split(highlight)
    if (before) segments.push({ text: before, accent: false })
    segments.push({ text: highlight, accent: true })
    const after = rest.join(highlight)
    if (after) segments.push({ text: after, accent: false })
  } else {
    segments.push({ text, accent: false })
  }

  let i = 0
  return (
    <span className={className} aria-label={text}>
      {segments.map((seg, s) => {
        const words = seg.text.split(/\s+/).filter(Boolean)
        const rendered = words.map((word, w) => {
          const idx = i++
          return (
            <React.Fragment key={`${s}-${w}`}>
              <span className="split-word" aria-hidden="true">
                <span style={{ ['--i' as string]: idx, ['--base' as string]: `${delay}ms` }}>
                  {word}
                </span>
              </span>{' '}
            </React.Fragment>
          )
        })
        return seg.accent ? (
          <span
            key={s}
            className="underline-draw text-[var(--accent)]"
            style={{ ['--delay' as string]: `${delay + i * 55 + 500}ms` }}
          >
            {rendered}
          </span>
        ) : (
          <React.Fragment key={s}>{rendered}</React.Fragment>
        )
      })}
    </span>
  )
}
