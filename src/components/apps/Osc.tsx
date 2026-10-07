import React from 'react'

/** Carcasa horizontal de los aparatos tipo oscilador (madurez, ICP). */
export function Osc({
  model,
  sub,
  leds,
  active,
  screen,
  panel,
  label,
}: {
  model: string
  sub: string
  leds: number
  active: number // índice del LED encendido; los anteriores quedan en negro; -1 = todos completos
  screen: React.ReactNode
  panel: React.ReactNode
  label: string
}) {
  return (
    <section className="osc" aria-label={label}>
      <div className="body">
        <div className="o-top">
          <div className="o-brand">{model}<small>{sub}</small></div>
          <div className="o-leds" aria-hidden="true">
            {Array.from({ length: leds }).map((_, i) => (
              <i key={i} className={active === -1 || i < active ? 'done' : i === active ? 'on' : ''} />
            ))}
          </div>
        </div>
        <div className="main">
          <div className="o-screen">{screen}</div>
          <div className="panel">{panel}</div>
        </div>
        <div className="o-grille" aria-hidden="true" />
      </div>
    </section>
  )
}

/** Etiqueta superior tipo sticker para los osciladores. */
export function OscLabel({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="osc-label">
      <span className="a">RG</span>
      <span className="b">{title}<small>{sub}</small></span>
    </div>
  )
}
