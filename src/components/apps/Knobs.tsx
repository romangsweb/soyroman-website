'use client'

import React from 'react'

import { fmt } from './Device'
import { query } from './share'

/** Perillas tipo fader para las calculadoras de una columna (mismo estilo que Capacidad comercial). */
export type Knob = { id: string; label: string; unit: '$' | '%' | '' | 'd'; val: number; min: number; max: number; step: number; hint?: string }
export type KnobValues = Record<string, number>

export const showKnob = (x: number, u: Knob['unit']) =>
  u === '$' ? `$${fmt(Math.round(x))}` : u === '%' ? `${fmt(x, x % 1 ? 1 : 0)}%` : u === 'd' ? `${fmt(x)} días` : fmt(x)
export const knobDefaults = (ks: Knob[]): KnobValues => Object.fromEntries(ks.map((k) => [k.id, k.val]))

/** Valores de la URL validados contra mínimo y máximo (enlace para compartir). */
export function readKnobs(ks: Knob[]): KnobValues {
  const q = query()
  const out: KnobValues = {}
  for (const k of ks) {
    if (!q.has(k.id)) continue
    const n = Number(q.get(k.id))
    if (Number.isFinite(n) && n >= k.min && n <= k.max) out[k.id] = n
  }
  return out
}

export function KnobList({ knobs, v, set }: { knobs: Knob[]; v: KnobValues; set: (id: string, n: number) => void }) {
  return (
    <div className="cp-knobs">
      {knobs.map((k) => (
        <label key={k.id} className="cp-k">
          <span className="cp-l">{k.label}<b>{showKnob(v[k.id], k.unit)}</b></span>
          <input type="range" min={k.min} max={k.max} step={k.step} value={v[k.id]} onChange={(e) => set(k.id, Number(e.target.value))} aria-label={k.label} />
          {k.hint && <small>{k.hint}</small>}
        </label>
      ))}
    </div>
  )
}

/** Selector de modo con teclas (mismo estilo que las pestañas del planeador). */
export function ModeKeys<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="pl-tabs" role="tablist" aria-label={label}>
      {options.map(([k, l]) => (
        <button key={k} type="button" role="tab" aria-selected={value === k} className={`pl-tab${value === k ? ' on' : ''}`} onClick={() => onChange(k)}>{l}</button>
      ))}
    </div>
  )
}
