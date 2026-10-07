'use client'

import React, { useCallback, useRef, useState } from 'react'

/**
 * "Aparato" industrial para los micro aplicativos de /recursos (inspirado en el
 * EP sample tool): pantalla negra, teclas A–G para elegir variable, teclado
 * numérico + ENTER para escribir el valor y fader para moverlo.
 */

export type Param = {
  id: string
  key: string // A–G
  label: string
  unit: '$' | '%' | 'n'
  min: number
  max: number
  step: number
  val: number
  log?: boolean
  hint?: string
}
export type Values = Record<string, number>

export const fmt = (n: number, d = 0) =>
  Number.isFinite(n) ? n.toLocaleString('es-MX', { maximumFractionDigits: d, minimumFractionDigits: d }) : '—'
export const showValue = (p: Param, v: number) =>
  p.unit === '$' ? `$${fmt(v)}` : p.unit === '%' ? `${fmt(v, 1)}%` : fmt(v)
export const defaults = (params: Param[]): Values => Object.fromEntries(params.map((p) => [p.id, p.val]))

type Props = {
  model: string
  sub: string
  tab: string
  params: Param[]
  values: Values
  onChange: (v: Values) => void
  big: React.ReactNode
  readings: [string, React.ReactNode][]
  planLabel?: string
  onPlan?: () => void
}

const KEYS_LEFT = ['A', 'B', 'C', 'D']
const KEYS_RIGHT = ['E', 'F', 'G']

export function Device({ model, sub, tab, params, values, onChange, big, readings, planLabel = 'PLAN', onPlan }: Props) {
  const [sel, setSel] = useState(params[0].id)
  const [buf, setBuf] = useState('')
  const [pressed, setPressed] = useState<string | null>(null)
  const [turn, setTurn] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const P = params.find((p) => p.id === sel)!
  const byKey = (k: string) => params.find((p) => p.key === k)
  const flash = (id: string) => {
    setPressed(id)
    setTimeout(() => setPressed(null), 90)
  }

  const set = useCallback((id: string, v: number) => onChange({ ...values, [id]: v }), [onChange, values])

  const act = (a: string) => {
    const i = params.indexOf(P)
    if (/^[0-9]$/.test(a) || a === '.') {
      if (buf.length < 10 && !(a === '.' && buf.includes('.'))) setBuf(buf + a)
    } else if (a === 'back') setBuf(buf.slice(0, -1))
    else if (a === 'clear') setBuf('')
    else if (a === 'enter') {
      const v = parseFloat(buf)
      if (Number.isFinite(v)) set(P.id, Math.min(P.max, Math.max(P.min, v)))
      setBuf('')
    } else if (a === 'next' || a === 'prev') {
      setSel(params[(i + (a === 'next' ? 1 : params.length - 1)) % params.length].id)
      setBuf('')
    } else if (a === 'reset') {
      onChange(defaults(params))
      setBuf('')
      setTurn(true)
      setTimeout(() => setTurn(false), 250)
    } else if (a === 'plan') onPlan?.()
  }

  const toF = (p: Param) =>
    p.log
      ? Math.round((Math.log(values[p.id] / p.min) / Math.log(p.max / p.min)) * 1000)
      : Math.round(((values[p.id] - p.min) / (p.max - p.min)) * 1000)
  const fromF = (p: Param, f: number) => {
    const v = p.log ? p.min * Math.pow(p.max / p.min, f / 1000) : p.min + ((p.max - p.min) * f) / 1000
    return Math.round(v / p.step) * p.step
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return
    const k = e.key
    const p = k.length === 1 ? byKey(k.toUpperCase()) : undefined
    if (p) {
      setSel(p.id)
      setBuf('')
    } else if (/^[0-9.]$/.test(k)) act(k)
    else if (k === 'Enter' && !(e.target as HTMLElement).closest('button')) act('enter')
    else if (k === 'Backspace') act('back')
    else return
    e.preventDefault()
  }

  // Funciones de render (no componentes) para que los botones no se remonten en cada render
  const btn = (id: string, cls: string, label: string, children?: React.ReactNode) => (
    <button type="button" className={`k ${cls}${pressed === id ? ' press' : ''}`} aria-label={label} onClick={() => { flash(id); act(id) }}>
      {children}
    </button>
  )
  const letter = (k: string) => {
    const p = byKey(k)
    if (!p)
      return (
        <div className="cell" key={`l${k}`}>
          <span className="led off" />
          <span className="k light blank" aria-hidden="true" />
        </div>
      )
    return (
      <div className="cell" key={`l${k}`}>
        <span className={`led${p.id === sel ? ' on' : ''}`} />
        <button
          type="button"
          className={`k light${p.id === sel ? ' sel' : ''}${pressed === p.id ? ' press' : ''}`}
          aria-label={`Elegir ${p.label}`}
          aria-pressed={p.id === sel}
          onClick={() => { flash(p.id); setSel(p.id); setBuf('') }}
        >
          {k}
        </button>
      </div>
    )
  }
  const num = (a: string, t: string = a, cls = 'dark', label: string = a) => (
    <div className="cell" key={`n${a}`}>
      <span className="led" />
      {btn(a, cls, label, t)}
    </div>
  )
  const side = (a: string, t: string, cls: string, label: string, key: string) => (
    <div className="cell" key={key}>
      <span className="led off" />
      {a === 'noop' ? <span className={`k ${cls}`} aria-hidden="true" /> : btn(a, cls, label, t)}
    </div>
  )

  return (
    <div className="unit" ref={rootRef} tabIndex={0} onKeyDown={onKeyDown} aria-label={`${model}: ${sub}`}>
      <div className="ports" aria-hidden="true">
        <span className="p1" /><span className="p2" /><span className="p3" /><span className="usb">USB</span>
      </div>
      <div className="dev">
        <div className="face">
          <div className="top">
            <div className="brand">
              <i className="screw" style={{ left: 8, top: 8 }} />
              <div className="model">{model}</div>
              <div className="sub">{sub}</div>
            </div>
            <div className="grille" aria-hidden="true" />
            <span className="tab">{tab}</span>
          </div>
          <div className="screen" aria-live="polite">
            <div className="scr-line">
              <span>{P.key} · {P.label}</span>
              <b>{showValue(P, values[P.id])}</b>
            </div>
            <div className="scr-edit">
              {buf ? <>&gt; {buf}<span className="cur" /></> : <span style={{ opacity: 0.45 }}>{P.hint}</span>}
            </div>
            <div className="scr-big">{big}</div>
            <div className="scr-sub">
              {readings.map(([k, v]) => (
                <div key={k}><span>{k}</span>{v}</div>
              ))}
            </div>
          </div>
          <div className="io" aria-hidden="true"><span className="in">IN</span><span className="out">OUT</span></div>
          <div className="pad">
            <div className="cell">
              <button type="button" className={`knob${turn ? ' turn' : ''}`} aria-label="Restablecer valores" onClick={() => act('reset')} />
              <span className="lbl">reset</span>
            </div>
            <div className="cell">{btn('prev', 'split small', 'Variable anterior', '◂')}</div>
            <div className="cell">{btn('next', 'split ors small', 'Variable siguiente', '▸')}</div>
            <div className="cell">{btn('clear', 'split small', 'Borrar entrada', 'CLR')}</div>
            <div className="cell" />
            <div className="cell"><span className="knob or" aria-hidden="true" /></div>
            <div className="cell"><span className="knob bk" aria-hidden="true" /></div>

            <div className="cell fader-cell">
              <input
                className="fader"
                type="range"
                min={0}
                max={1000}
                value={toF(P)}
                aria-label={`Ajustar ${P.label}`}
                onChange={(e) => { set(P.id, fromF(P, +e.target.value)); setBuf('') }}
              />
            </div>
            {letter(KEYS_LEFT[0])}{num('7')}{num('8')}{num('9')}{letter(KEYS_RIGHT[0])}
            {side('back', '⌫', 'paper small', 'Borrar último dígito', 's1')}
            {letter(KEYS_LEFT[1])}{num('4')}{num('5')}{num('6')}{letter(KEYS_RIGHT[1])}
            {side('noop', '', 'paper', '', 'p1')}
            {letter(KEYS_LEFT[2])}{num('1')}{num('2')}{num('3')}{letter(KEYS_RIGHT[2])}
            {side('noop', '', 'paper', '', 'p2')}
            {letter(KEYS_LEFT[3])}{num('.', '•', 'dark', 'punto decimal')}{num('0')}{num('enter', 'ENTER', 'dark small', 'Confirmar valor')}
            {side('plan', planLabel, 'or small', planLabel, 'plan')}
            {side('noop', '', 'gr', '', 'gr')}
          </div>
        </div>
        <div className="side" aria-hidden="true" />
        <div className="bottom" aria-hidden="true" />
      </div>
    </div>
  )
}

/** Alternativa sin teclado virtual: campos numéricos normales (lectores de pantalla, móvil). */
export function ListMode({ params, values, onChange }: { params: Param[]; values: Values; onChange: (v: Values) => void }) {
  return (
    <details className="listmode">
      <summary>Modo lista: editar valores con campos normales</summary>
      <div className="grid">
        {params.map((p) => (
          <label key={p.id}>
            {p.key} · {p.label} {p.unit === '%' ? '(%)' : p.unit === '$' ? '(USD)' : ''}
            <input
              type="number"
              inputMode="decimal"
              min={p.min}
              max={p.max}
              step={p.step}
              value={values[p.id]}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                if (Number.isFinite(v)) onChange({ ...values, [p.id]: Math.min(p.max, Math.max(p.min, v)) })
              }}
            />
          </label>
        ))}
      </div>
    </details>
  )
}
