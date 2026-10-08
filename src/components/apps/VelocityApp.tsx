'use client'

import Link from 'next/link'
import React, { useCallback, useEffect, useState } from 'react'

import { fmt } from './Device'
import { AppHeader } from './Panels'
import { Gate } from './Gate'
import { KnobList, ModeKeys, knobDefaults, readKnobs, showKnob, type Knob, type KnobValues } from './Knobs'
import { ShareButton, query } from './share'
import { useToolTracking } from './useToolTracking'
import { DAYS_Q, decompose, levers, velocity } from './velocity'

const NOW: Knob[] = [
  { id: 'opp', label: 'Oportunidades abiertas', unit: '', val: 40, min: 1, max: 1000, step: 1, hint: 'calificadas, en el pipeline hoy' },
  { id: 'tk', label: 'Ticket promedio', unit: '$', val: 25000, min: 1000, max: 1000000, step: 1000 },
  { id: 'wr', label: 'Tasa de cierre', unit: '%', val: 25, min: 1, max: 90, step: 1, hint: 'oportunidad → venta' },
  { id: 'cy', label: 'Ciclo de venta', unit: 'd', val: 90, min: 7, max: 540, step: 1, hint: 'de oportunidad creada a firma' },
  { id: 'goal', label: 'Meta del trimestre', unit: '$', val: 450000, min: 10000, max: 20000000, step: 10000 },
]
const BEFORE: Knob[] = [
  { id: 'opp0', label: 'Oportunidades', unit: '', val: 36, min: 1, max: 1000, step: 1 },
  { id: 'tk0', label: 'Ticket', unit: '$', val: 24000, min: 1000, max: 1000000, step: 1000 },
  { id: 'wr0', label: 'Tasa de cierre', unit: '%', val: 28, min: 1, max: 90, step: 1 },
  { id: 'cy0', label: 'Ciclo de venta', unit: 'd', val: 75, min: 7, max: 540, step: 1 },
]
const ALL = [...NOW, ...BEFORE]
type Mode = 'one' | 'cmp'
const usd = (x: number) => `$${fmt(Math.round(x))}`

export function VelocityApp() {
  const [v, setV] = useState<KnobValues>(() => knobDefaults(ALL))
  const [mode, setMode] = useState<Mode>('one')
  const [gate, setGate] = useState(false)
  useEffect(() => {
    setV((x) => ({ ...x, ...readKnobs(ALL) }))
    if (query().get('modo') === 'cmp') setMode('cmp')
  }, [])
  useToolTracking('Velocidad de pipeline', v, gate)
  const set = (id: string, n: number) => setV((x) => ({ ...x, [id]: n }))

  const now = { opp: v.opp, tk: v.tk, wr: v.wr, cy: v.cy }
  const before = { opp: v.opp0, tk: v.tk0, wr: v.wr0, cy: v.cy0 }
  const vel = velocity(now)
  const q = vel * DAYS_Q
  const lev = levers(now, v.goal)
  const dec = decompose(before, now)
  const maxL = Math.max(...dec.parts.map((p) => Math.abs(p.pts)), 0.0001)
  const worst = dec.parts.reduce((a, b) => (b.pts < a.pts ? b : a))
  const best = dec.parts.reduce((a, b) => (b.pts > a.pts ? b : a))
  const reach = q / Math.max(v.goal, 1)

  const dx = mode === 'one'
    ? reach >= 1
      ? [
          `Con este ritmo entran ${usd(q)} en el trimestre: llegas a la meta de ${usd(v.goal)}.`,
          'La fórmula supone que el pipeline se repone al ritmo en que cierra. Si no entran oportunidades nuevas, el número baja mes con mes.',
        ]
      : [
          `Te faltan ${usd(v.goal - q)} para la meta del trimestre (llegas al ${fmt(reach * 100)}%).`,
          `Mover una sola palanca rara vez alcanza: combinar +10% en oportunidades, +10% en cierre y −10% en ciclo sube la velocidad ${fmt((1.1 * 1.1 / 0.9 - 1) * 100)}%.`,
          'El ciclo es la palanca que más se ignora: reducirlo 20% sube la velocidad 25%, no 20%.',
          'La fórmula supone que el pipeline se repone al ritmo en que cierra. Si no entran oportunidades nuevas, el número baja mes con mes.',
        ]
    : [
        `La velocidad ${dec.change < 0 ? 'bajó' : 'subió'} ${fmt(Math.abs(dec.change) * 100, 1)}%: de ${usd(dec.v0)} a ${usd(dec.v1)} por día.`,
        ...(worst.pts < 0 ? [`Lo que más la frenó: ${worst.label.toLowerCase()} (${fmt(worst.pts, 1)} puntos).`] : []),
        ...(best.pts > 0 ? [`Lo que más ayudó: ${best.label.toLowerCase()} (+${fmt(best.pts, 1)} puntos).`] : []),
        'Los puntos suman el cambio total. Se reparten con logaritmos para que el orden en que cambian las palancas no altere el resultado.',
      ]
  const summary = [
    `Velocidad ${usd(vel)} por día · ${usd(q)} en el trimestre · ${fmt(reach * 100)}% de la meta ${usd(v.goal)}`,
    `Oportunidades ${v.opp} · ticket ${usd(v.tk)} · cierre ${v.wr}% · ciclo ${v.cy} días`,
    ...dx,
  ]
  const print = useCallback(() => {
    setGate(false)
    setTimeout(() => window.print(), 150)
  }, [])

  return (
    <>
      <AppHeader
        top="VEL"
        bottom="PIPE"
        cable="DATOS DE EJEMPLO"
        message={gate ? 'Ingresa tu correo para recibir el diagnóstico'
          : mode === 'one' ? `${usd(vel)} por día · ${fmt(reach * 100)}% de la meta del trimestre`
            : `La velocidad ${dec.change < 0 ? 'bajó' : 'subió'} ${fmt(Math.abs(dec.change) * 100, 1)}% contra el trimestre anterior`}
      />
      <div className="x-dev">
        <div className="x-brand"><span><b>VEL·01</b> ¿cuánto dinero sale de tu pipeline por día?</span><span>oportunidades × ticket × cierre ÷ ciclo</span></div>
        <ModeKeys label="Modo" value={mode} onChange={setMode} options={[['one', 'Calcular'], ['cmp', 'Comparar dos trimestres']]} />
        <div className="cp-wrap">
          <div>
            {mode === 'cmp' && <h3 className="pl-h" style={{ marginTop: 0 }}>Trimestre anterior</h3>}
            {mode === 'cmp' && <KnobList knobs={BEFORE} v={v} set={set} />}
            {mode === 'cmp' && <h3 className="pl-h">Este trimestre</h3>}
            <KnobList knobs={mode === 'one' ? NOW : NOW.slice(0, 4)} v={v} set={set} />
          </div>
          <div>
            <div className="e-lcd" style={{ marginTop: 0 }} aria-live="polite">
              {mode === 'one' ? (
                <>
                  <div className="vl-t">velocidad de pipeline</div>
                  <div className={`vl-big ${reach < 0.8 ? 'bad' : reach < 1 ? 'warn' : 'ok'}`}>{usd(vel)} <small>por día</small></div>
                  <div className="vl-tiles">
                    <div><b>{usd(vel * 30)}</b><span>al mes</span></div>
                    <div><b>{usd(q)}</b><span>en {DAYS_Q} días</span></div>
                    <div><b>{fmt(reach * 100)}%</b><span>de la meta del trimestre</span></div>
                    <div><b>{fmt((v.opp * v.wr) / 100 / v.cy * 30, 1)}</b><span>negocios al mes</span></div>
                  </div>
                  <div className="vl-t" style={{ marginTop: 14 }}>para llegar a la meta moviendo solo una palanca</div>
                  <table className="vl-lev">
                    <tbody>
                      {lev.map((l) => (
                        <tr key={l.id}>
                          <td>{l.label}</td>
                          <td>{showKnob(l.cur, NOW.find((k) => k.id === l.id)!.unit)} → <b className={Math.abs(l.change) > 0.5 || l.impossible ? 'far' : 'near'}>{l.impossible ? 'no alcanza' : showKnob(l.to, NOW.find((k) => k.id === l.id)!.unit)}</b></td>
                          <td>{reach >= 1 ? 'ya llegas' : `${l.change >= 0 ? '+' : '−'}${fmt(Math.abs(l.change) * 100)}%`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <>
                  <div className="vl-t">cambio de velocidad vs trimestre anterior</div>
                  <div className={`vl-big ${dec.change < 0 ? 'bad' : 'ok'}`}>{dec.change >= 0 ? '+' : ''}{fmt(dec.change * 100, 1)}%</div>
                  <div className="vl-tiles">
                    <div><b>{usd(dec.v0)}</b><span>antes, por día</span></div>
                    <div><b>{usd(dec.v1)}</b><span>ahora, por día</span></div>
                  </div>
                  <div className="vl-t" style={{ marginTop: 14 }}>de dónde viene el cambio</div>
                  <div className="vl-dec" role="img" aria-label={dec.parts.map((p) => `${p.label} ${fmt(p.pts, 1)} puntos`).join(', ')}>
                    {dec.parts.map((p) => (
                      <div key={p.id} className="vl-row">
                        <span>{p.label}</span>
                        <div className="vl-axis"><i className={p.pts < 0 ? 'neg' : ''} style={{ left: `${p.pts < 0 ? 50 - (Math.abs(p.pts) / maxL) * 50 : 50}%`, width: `${(Math.abs(p.pts) / maxL) * 50}%` }} /></div>
                        <span>{p.pts >= 0 ? '+' : ''}{fmt(p.pts, 1)} pts</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="x-dx">
              <h3>Diagnóstico · lo que significa</h3>
              <ol>{dx.map((d) => <li key={d}>{d}</li>)}</ol>
            </div>
            {gate ? (
              <div className="s-gate"><Gate tool="Velocidad de pipeline" summary={summary.join('\n')} meta={{ slug: 'velocidad-pipeline', finding: summary[0], items: dx.slice(0, 3).map((t) => ({ t })) }} onDone={print} onCancel={() => setGate(false)} /></div>
            ) : (
              <div className="s-keys">
                <button type="button" className="btn or" onClick={() => setGate(true)}>Diagnóstico en PDF ▸</button>
                <ShareButton tool="Velocidad de pipeline" params={() => ({ ...v, modo: mode })} />
                <Link className="btn" href="/recursos/planeador-marketing" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>Planear el pipeline del año ▸</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="te-print" aria-hidden="true">
        <span className="tag">soyroman.com · Velocidad de pipeline</span>
        <h2 className="pt">{usd(vel)} por día · {usd(q)} en el trimestre</h2>
        <table>
          <thead><tr><th>Palanca</th><th>Hoy</th><th>Para llegar a la meta ({usd(v.goal)})</th></tr></thead>
          <tbody>{lev.map((l) => <tr key={l.id}><td>{l.label}</td><td>{showKnob(l.cur, NOW.find((k) => k.id === l.id)!.unit)}</td><td>{l.impossible ? 'no alcanza sola' : showKnob(l.to, NOW.find((k) => k.id === l.id)!.unit)}</td></tr>)}</tbody>
        </table>
        {mode === 'cmp' && (
          <table>
            <thead><tr><th>Palanca</th><th>Trimestre anterior</th><th>Este trimestre</th><th>Efecto</th></tr></thead>
            <tbody>{dec.parts.map((p, i) => <tr key={p.id}><td>{p.label}</td><td>{showKnob(Object.values(before)[i], BEFORE[i].unit)}</td><td>{showKnob(Object.values(now)[i], NOW[i].unit)}</td><td>{p.pts >= 0 ? '+' : ''}{fmt(p.pts, 1)} pts</td></tr>)}</tbody>
          </table>
        )}
        <h3>Diagnóstico</h3>
        <ol>{dx.map((d) => <li key={d}>{d}</li>)}</ol>
        <p>¿Quieres revisarlo juntos? contacto@soyroman.com · soyroman.com/consultoria</p>
      </section>
    </>
  )
}
