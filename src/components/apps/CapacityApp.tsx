'use client'

import Link from 'next/link'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { fmt } from './Device'
import { AppHeader } from './Panels'
import { Gate } from './Gate'
import { ShareButton, query } from './share'
import { useToolTracking } from './useToolTracking'

type K = { id: string; label: string; unit: '$' | '%' | ''; val: number; min: number; max: number; step: number; hint?: string }
// Valores de ejemplo (meta, ticket y tasas iguales al Embudo inverso para que cuadren)
const KNOBS: K[] = [
  { id: 'goal', label: 'Meta de ingresos nuevos / año', unit: '$', val: 1500000, min: 100000, max: 20000000, step: 50000 },
  { id: 'ticket', label: 'Ticket promedio', unit: '$', val: 25000, min: 1000, max: 1000000, step: 1000 },
  { id: 'win', label: 'Oportunidad → ganado', unit: '%', val: 25, min: 5, max: 80, step: 1 },
  { id: 'opp', label: 'SQL → oportunidad', unit: '%', val: 50, min: 10, max: 100, step: 1 },
  { id: 'sqlSdr', label: 'SQL que entrega un SDR / mes', unit: '', val: 12, min: 2, max: 60, step: 1, hint: 'reuniones calificadas por persona' },
  { id: 'oppAe', label: 'Oportunidades nuevas por vendedor / mes', unit: '', val: 8, min: 2, max: 40, step: 1, hint: 'las que puede trabajar bien' },
  { id: 'quota', label: 'Cuota anual por vendedor', unit: '$', val: 500000, min: 50000, max: 5000000, step: 25000, hint: 'lo que cierra uno productivo' },
  { id: 'ramp', label: 'Meses de rampa', unit: '', val: 3, min: 0, max: 9, step: 1, hint: 'hasta que es productivo' },
  { id: 'cycle', label: 'Ciclo de venta (meses)', unit: '', val: 4, min: 1, max: 18, step: 1, hint: 'del primer contacto a la firma' },
  { id: 'sdrCost', label: 'Costo mensual por SDR (opcional)', unit: '$', val: 0, min: 0, max: 20000, step: 250, hint: 'sueldo + cargas, USD' },
  { id: 'aeCost', label: 'Costo mensual por vendedor (opcional)', unit: '$', val: 0, min: 0, max: 30000, step: 250, hint: 'sueldo + comisión promedio, USD' },
]
type V = Record<string, number>
const show = (x: number, u: K['unit']) => (u === '$' ? `$${fmt(Math.round(x))}` : u === '%' ? `${fmt(x)}%` : fmt(x))
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export function CapacityApp() {
  const [v, setV] = useState<V>(() => Object.fromEntries(KNOBS.map((k) => [k.id, k.val])))
  const [gate, setGate] = useState(false)
  useToolTracking('Capacidad comercial', v, gate)
  useEffect(() => {
    const q = query()
    const next: V = {}
    for (const k of KNOBS) {
      if (!q.has(k.id)) continue
      const n = Number(q.get(k.id))
      if (Number.isFinite(n) && n >= k.min && n <= k.max) next[k.id] = n
    }
    if (Object.keys(next).length) setV((x) => ({ ...x, ...next }))
  }, [])

  const o = useMemo(() => {
    const deals = v.goal / v.ticket
    const oppY = deals / (v.win / 100)
    const sqlY = oppY / (v.opp / 100)
    const sdr = Math.max(1, Math.ceil(sqlY / 12 / v.sqlSdr))
    const aeCap = Math.ceil(oppY / 12 / v.oppAe)
    const aeQuota = Math.ceil(v.goal / v.quota)
    const ae = Math.max(1, aeCap, aeQuota)
    const firstClose = v.ramp + v.cycle + 1 // mes en que cierra quien entra en enero
    const cost = (sdr * v.sdrCost + ae * v.aeCost) * 12
    return { deals, oppY, sqlY, sdr, aeCap, aeQuota, ae, firstClose, cost, costShare: cost / v.goal, bottleneck: aeCap >= aeQuota ? 'capacidad' : 'cuota' }
  }, [v])

  const print = useCallback(() => {
    setGate(false)
    setTimeout(() => window.print(), 150)
  }, [])

  const dx = [
    `Necesitas ${o.sdr} SDR y ${o.ae} vendedores para ${fmt(Math.round(o.deals))} negocios al año (${fmt(Math.ceil(o.oppY / 12))} oportunidades y ${fmt(Math.ceil(o.sqlY / 12))} SQL al mes).`,
    `Quien contrates en enero cierra su primer negocio hacia el mes ${o.firstClose} (${v.ramp} de rampa + ${v.cycle} de ciclo).${o.firstClose > 6 ? ' Más de medio año sin ingresos de esa persona: contrata antes o ajusta la meta del año.' : ''}`,
    o.bottleneck === 'capacidad'
      ? 'El cuello de botella es la capacidad: tus vendedores podrían cerrar más, pero no alcanzan a atender tantas oportunidades. Mejor calificación (SDR) o más vendedores.'
      : 'El cuello de botella es la cuota: aunque haya oportunidades, cada vendedor no llega a más. Sube el ticket o la tasa de cierre antes de contratar.',
    ...(o.cost ? [`El equipo cuesta $${fmt(Math.round(o.cost))} al año: ${fmt(o.costShare * 100, 1)}% de la meta, solo en personas (sin medios).`] : []),
  ]
  const summary = [`Meta ${show(v.goal, '$')} · ticket ${show(v.ticket, '$')} · cierre ${v.win}% · SQL→opp ${v.opp}%`, `Equipo: ${o.sdr} SDR y ${o.ae} vendedores (cuello de botella: ${o.bottleneck})`, ...dx].join('\n')

  const cells = (startProd: number) =>
    MONTHS.map((m, i) => <span key={m} className={`cp-c ${i === 0 ? 'h' : i <= v.ramp ? 'r' : i < startProd ? 'p' : 'a'}`} title={m} />)

  return (
    <>
      <AppHeader
        top="CAP"
        bottom="TEAM"
        cable="DATOS DE EJEMPLO"
        message={gate ? 'Ingresa tu correo para recibir el plan' : `${o.sdr} SDR y ${o.ae} vendedores · cuello de botella: ${o.bottleneck}`}
      />
      <div className="x-dev">
        <div className="x-brand"><span><b>CAP·01</b> ¿cuánta gente necesito?</span><span>SDR · vendedores · contratación</span></div>
        <div className="cp-wrap">
          <div className="cp-knobs">
            {KNOBS.map((k) => (
              <label key={k.id} className="cp-k">
                <span className="cp-l">{k.label}<b>{k.id.endsWith('Cost') && !v[k.id] ? '—' : show(v[k.id], k.unit)}</b></span>
                <input type="range" min={k.min} max={k.max} step={k.step} value={v[k.id]} onChange={(e) => setV({ ...v, [k.id]: Number(e.target.value) })} aria-label={k.label} />
                {k.hint && <small>{k.hint}</small>}
              </label>
            ))}
          </div>
          <div>
            <div className="e-lcd" style={{ marginTop: 0 }}>
              <div className="cp-team">
                {[
                  { t: 'SDR', n: o.sdr, p: `${fmt(Math.ceil(o.sqlY / 12))} SQL al mes ÷ ${v.sqlSdr} por SDR` },
                  { t: 'Vendedores', n: o.ae, p: o.bottleneck === 'capacidad' ? `limita la capacidad: ${fmt(Math.ceil(o.oppY / 12))} oportunidades al mes ÷ ${v.oppAe}` : `limita la cuota: ${show(v.goal, '$')} ÷ ${show(v.quota, '$')}` },
                ].map((r) => (
                  <div key={r.t} className="cp-role">
                    <h4>{r.t}</h4>
                    <div className="cp-n">{r.n}<small> personas</small></div>
                    <div className="cp-people" aria-hidden="true">{Array.from({ length: Math.min(r.n, 40) }, (_, i) => <i key={i} />)}</div>
                    <p>{r.p}</p>
                  </div>
                ))}
              </div>
              <div className="cp-tl" aria-label="Línea de tiempo de una contratación en enero">
                <div className="cp-r"><span /> {MONTHS.map((m) => <span key={m} className="cp-m">{m}</span>)}</div>
                <div className="cp-r"><span>Contratación en enero</span>{cells(o.firstClose - 1)}</div>
                <div className="cp-lg"><span className="h">contratar</span><span className="r">rampa</span><span className="p">primeros ciclos, sin cierre</span><span className="a">cerrando</span></div>
              </div>
            </div>
            <div className="x-dx">
              <h3>Diagnóstico · lo que significa</h3>
              <ol>{dx.map((d) => <li key={d}>{d}</li>)}</ol>
            </div>
            {gate ? (
              <div className="s-gate"><Gate tool="Capacidad comercial" summary={summary} meta={{ slug: 'capacidad-comercial', finding: summary.split('\n')[1], items: dx.slice(0, 3).map((t) => ({ t })) }} onDone={print} onCancel={() => setGate(false)} /></div>
            ) : (
              <div className="s-keys">
                <button type="button" className="btn or" onClick={() => setGate(true)}>Plan de contratación por correo ▸</button>
                <ShareButton tool="Capacidad comercial" params={() => v} />
                <Link className="btn" href={`/recursos/embudo-inverso?goal=${v.goal}&ticket=${v.ticket}&win=${v.win}&opp=${v.opp}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>◂ Ver el embudo</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="te-print" aria-hidden="true">
        <span className="tag">soyroman.com · Capacidad comercial</span>
        <h1>{o.sdr} SDR y {o.ae} vendedores para {show(v.goal, '$')} al año</h1>
        <table>
          <thead><tr><th>Supuesto</th><th>Valor</th></tr></thead>
          <tbody>{KNOBS.filter((k) => !(k.id.endsWith('Cost') && !v[k.id])).map((k) => <tr key={k.id}><td>{k.label}</td><td>{show(v[k.id], k.unit)}</td></tr>)}</tbody>
        </table>
        <h3>Diagnóstico</h3>
        <ol>{dx.map((d) => <li key={d}>{d}</li>)}</ol>
        <p>Valores de ejemplo hasta que los sustituyas por los de tu equipo y tu CRM.</p>
        <p>¿Quieres revisarlo juntos? contacto@soyroman.com · soyroman.com/consultoria</p>
      </section>
    </>
  )
}
