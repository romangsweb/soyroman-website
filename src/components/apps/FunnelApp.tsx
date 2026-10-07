'use client'

import React, { useCallback, useMemo, useState } from 'react'

import { Device, ListMode, defaults, fmt, type Param, type Values } from './Device'
import { AppHeader, Library } from './Panels'
import { Gate } from './Gate'
import { useToolTracking } from './useToolTracking'
import Link from 'next/link'

const PARAMS: Param[] = [
  { id: 'goal', key: 'A', label: 'Meta de ingresos / año', unit: '$', min: 50000, max: 20000000, step: 10000, val: 1500000, log: true, hint: 'USD por año' },
  { id: 'ticket', key: 'B', label: 'Ticket promedio', unit: '$', min: 500, max: 1000000, step: 500, val: 25000, log: true, hint: 'USD por negocio' },
  { id: 'win', key: 'C', label: 'Oportunidad → ganado', unit: '%', min: 1, max: 90, step: 0.5, val: 25, hint: 'tasa de cierre' },
  { id: 'sql', key: 'D', label: 'MQL → SQL', unit: '%', min: 0.5, max: 80, step: 0.5, val: 6.5, hint: 'dato real de Román: 6.5 %' },
  { id: 'opp', key: 'E', label: 'SQL → oportunidad', unit: '%', min: 1, max: 100, step: 0.5, val: 50, hint: 'valor de ejemplo' },
  { id: 'mql', key: 'F', label: 'Lead → MQL', unit: '%', min: 1, max: 100, step: 0.5, val: 40, hint: 'valor de ejemplo' },
  { id: 'visit', key: 'G', label: 'Visita → lead', unit: '%', min: 0.1, max: 20, step: 0.1, val: 1.5, hint: 'valor de ejemplo' },
]

const n = (v: number) => fmt(v < 10 ? v : Math.ceil(v), v < 10 ? 1 : 0)

export function FunnelApp() {
  const [v, setV] = useState<Values>(() => defaults(PARAMS))
  const [gate, setGate] = useState(false)
  useToolTracking('Embudo inverso', v, gate)

  const o = useMemo(() => {
    const won = v.goal / v.ticket / 12
    const opp = won / (v.win / 100)
    const sql = opp / (v.opp / 100)
    const mql = sql / (v.sql / 100)
    const leads = mql / (v.mql / 100)
    const visits = leads / (v.visit / 100)
    return { won, opp, sql, mql, leads, visits, rev: v.goal / 12, pipe: opp * v.ticket }
  }, [v])

  const max = Math.log10(o.visits + 1)
  const meter = (x: number) => (Math.log10(x + 1) / max) * 100
  const stages: [string, number][] = [
    ['Visitas', o.visits], ['Leads', o.leads], ['MQL', o.mql], ['SQL', o.sql], ['Oportunidades', o.opp], ['Negocios ganados', o.won],
  ]
  const summary = [
    `Meta anual: $${fmt(v.goal)} · Ticket: $${fmt(v.ticket)}`,
    `Tasas: visita→lead ${fmt(v.visit, 1)}%, lead→MQL ${fmt(v.mql, 1)}%, MQL→SQL ${fmt(v.sql, 1)}%, SQL→opp ${fmt(v.opp, 1)}%, cierre ${fmt(v.win, 1)}%`,
    `Por mes: ${n(o.visits)} visitas, ${n(o.leads)} leads, ${n(o.mql)} MQL, ${n(o.sql)} SQL, ${n(o.opp)} oportunidades, ${n(o.won)} negocios`,
  ].join('\n')

  const print = useCallback(() => {
    setGate(false)
    setTimeout(() => window.print(), 150)
  }, [])

  return (
    <>
      <AppHeader
        top="LEAD"
        bottom="CALC"
        cable="DATOS DE EJEMPLO"
        message={gate ? 'Ingresa tu correo para descargar el plan' : `Necesitas ${fmt(Math.ceil(o.leads))} leads al mes para ${fmt(o.won, 1)} negocios`}
      />
      <div className="scene">
        <Device
          model="EMBUDO I"
          sub="calculadora inversa"
          tab="Meta → leads"
          params={PARAMS}
          values={v}
          onChange={setV}
          big={<>{fmt(Math.ceil(o.leads))}<span style={{ fontSize: '.28em', opacity: 0.55 }}> LEADS/MES</span></>}
          readings={[['MQL/mes', fmt(Math.ceil(o.mql))], ['SQL/mes', fmt(Math.ceil(o.sql))], ['Negocios/mes', fmt(o.won, 1)]]}
          onPlan={() => setGate(true)}
        />
        <div>
          <Library
            title="Embudo · mensual"
            blanks={3}
            rows={[
              ...stages.map(([label, val], i) => ({ label, value: n(val), meter: meter(val), active: i === 1, won: i === 5 })),
              { label: 'Pipeline necesario', value: `$${fmt(o.pipe)}` },
              { label: 'Ingresos / mes', value: `$${fmt(o.rev)}` },
            ]}
          >
            {gate ? <Gate tool="Embudo inverso" summary={summary} onDone={print} onCancel={() => setGate(false)} /> : undefined}
          </Library>
          <ListMode params={PARAMS} values={v} onChange={setV} />
          <Link
            className="btn or"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', marginTop: 18 }}
            href={`/recursos/presupuesto-marketing?goal=${v.goal}&ticket=${v.ticket}&conv=${+(v.mql * v.sql * v.opp * v.win / 1e6).toFixed(4)}`}
          >
            Siguiente: ¿cuánto presupuesto necesito? ▸
          </Link>
        </div>
      </div>

      <section className="te-print" aria-hidden="true">
        <span className="tag">soyroman.com · Embudo inverso</span>
        <h1>Plan de demanda para ${fmt(v.goal)} al año</h1>
        <p>Ticket promedio ${fmt(v.ticket)} · {fmt(o.won * 12, 0)} negocios al año</p>
        <table>
          <thead><tr><th>Etapa</th><th>Por mes</th><th>Por año</th><th>Tasa a la siguiente etapa</th></tr></thead>
          <tbody>
            {stages.map(([label, val], i) => (
              <tr key={label}>
                <td>{label}</td><td>{n(val)}</td><td>{n(val * 12)}</td>
                <td>{[v.visit, v.mql, v.sql, v.opp, v.win][i] !== undefined ? `${fmt([v.visit, v.mql, v.sql, v.opp, v.win][i], 1)}%` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>Pipeline que necesitas abierto cada mes: ${fmt(o.pipe)}.</p>
        <h3>Siguientes pasos</h3>
        <ol>
          <li>Sustituye las tasas de ejemplo por las de tu CRM de los últimos 6–12 meses.</li>
          <li>Identifica la etapa con la tasa más baja frente a tu histórico: ahí está la palanca más barata.</li>
          <li>Compara los leads necesarios con tu capacidad actual de captación y tu presupuesto por canal.</li>
        </ol>
        <p>¿Quieres revisarlo juntos? contacto@soyroman.com · soyroman.com/consultoria</p>
      </section>
    </>
  )
}
