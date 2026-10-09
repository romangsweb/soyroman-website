'use client'

import Link from 'next/link'
import React, { useCallback, useMemo, useState, useEffect } from 'react'

import { Device, ListMode, defaults, fmt, type Param, type Values } from './Device'
import { AppHeader, Library } from './Panels'
import { Benchmarks } from './Benchmarks'
import { Gate } from './Gate'
import { CHANNEL_COSTS, SOURCES } from '@/data/benchmarks'
import { ShareButton, readParamValues } from './share'
import { useToolTracking } from './useToolTracking'
import { PrefillNote, useProfilePrefill } from '@/components/taller/useProfilePrefill'
import { fit } from '@/lib/taller/profile'
import { SaveRun } from '@/components/taller/SaveRun'
import { finite } from '@/lib/taller/tools'

// Valores por defecto = los del Embudo inverso y el Planificador, para que las tres herramientas cuadren
const PARAMS: Param[] = [
  { id: 'ticket', key: 'A', label: 'Ticket promedio', unit: '$', min: 100, max: 10000000, step: 500, val: 25000, log: true, hint: 'USD por negocio' },
  { id: 'margin', key: 'B', label: 'Margen bruto', unit: '%', min: 1, max: 100, step: 1, val: 40, hint: 'porcentaje' },
  { id: 'conv', key: 'C', label: 'Lead → cliente', unit: '%', min: 0.01, max: 100, step: 0.01, val: 0.33, hint: '% global del embudo' },
  { id: 'share', key: 'D', label: 'Margen para adquirir', unit: '%', min: 1, max: 100, step: 1, val: 30, hint: '% del margen del primer negocio' },
  { id: 'other', key: 'E', label: 'Otros costos por cliente', unit: '$', min: 0, max: 1000000, step: 100, val: 0, hint: 'venta, herramientas (USD)' },
  { id: 'visit', key: 'F', label: 'Visita → lead', unit: '%', min: 0.1, max: 50, step: 0.1, val: 1.5, hint: 'conversión del sitio' },
  { id: 'cpl', key: 'G', label: 'Tu CPL actual', unit: '$', min: 0, max: 100000, step: 1, val: 25, hint: 'para comparar (USD)' },
]

const money = (x: number) => (Math.abs(x) < 10 ? `$${fmt(x, 2)}` : `$${fmt(Math.round(x))}`)

export function CplApp() {
  const [v, setV] = useState<Values>(() => defaults(PARAMS))
  useEffect(() => setV((x) => ({ ...x, ...readParamValues(PARAMS) })), [])
  const [gate, setGate] = useState(false)
  useToolTracking('CPL máximo', v, gate)
  const pre = useProfilePrefill('cpl-maximo', (x) => setV((c) => ({ ...c, ...fit(PARAMS, x) })))

  const o = useMemo(() => {
    const cacMax = Math.max(0, v.ticket * (v.margin / 100) * (v.share / 100) - v.other)
    const cplMax = cacMax * (v.conv / 100)
    const cpcMax = cplMax * (v.visit / 100)
    const ratio = cplMax > 0 ? v.cpl / cplMax : Infinity
    return { cacMax, cplMax, cpcMax, ratio, cacReal: v.cpl / Math.max(v.conv / 100, 1e-6) + v.other }
  }, [v])

  const over = o.ratio > 1
  const verdict = !v.cpl
    ? `Puedes pagar hasta ${money(o.cplMax)} por lead`
    : over
      ? `Pagas ${fmt(o.ratio, 1)}x lo que tu embudo aguanta por lead`
      : `Tu CPL está ${fmt((1 - o.ratio) * 100, 0)}% por debajo del máximo`
  const summary = [
    `Ticket ${money(v.ticket)} · margen ${fmt(v.margin)}% · lead→cliente ${fmt(v.conv, 2)}% · margen para adquirir ${fmt(v.share)}% · otros costos ${money(v.other)}`,
    `CAC máximo ${money(o.cacMax)} · CPL máximo ${money(o.cplMax)} · CPC máximo ${money(o.cpcMax)} (visita→lead ${fmt(v.visit, 1)}%)`,
    `CPL actual ${money(v.cpl)} → ${verdict}`,
  ].join('\n')

  const print = useCallback(() => {
    setGate(false)
    setTimeout(() => window.print(), 150)
  }, [])

  const gauge = Math.min(100, (v.cpl / Math.max(o.cplMax * 2, 1e-6)) * 100) // la mitad del medidor = el máximo

  return (
    <>
      <PrefillNote on={pre} />
      <AppHeader top="CPL" bottom="MAX" cable="DATOS DE EJEMPLO" message={gate ? 'Ingresa tu correo para descargar el plan' : verdict} />
      <div className="scene">
        <Device
          model="CPL MÁX"
          sub="costo por lead permitido"
          tab="Margen → CPL"
          params={PARAMS}
          values={v}
          onChange={setV}
          big={<>{money(o.cplMax)}<span style={{ fontSize: '.28em', opacity: 0.55 }}> CPL MÁX</span></>}
          readings={[['CAC máx', money(o.cacMax)], ['CPC máx', money(o.cpcMax)], ['Tu CPL', money(v.cpl)]]}
          onPlan={() => setGate(true)}
        />
        <div>
          <Library
            title="Cadena · lo máximo que aguanta"
            blanks={2}
            rows={[
              { label: 'Margen del primer negocio', value: money(v.ticket * (v.margin / 100)) },
              { label: 'CAC máximo (cliente)', value: money(o.cacMax), active: true },
              { label: 'CPL máximo (lead)', value: money(o.cplMax), won: !over },
              { label: 'CPC máximo (clic)', value: money(o.cpcMax) },
              { label: over ? 'Tu CPL: por encima' : 'Tu CPL: dentro', value: money(v.cpl), meter: gauge },
              { label: 'CAC real con tu CPL', value: money(o.cacReal) },
            ]}
          >
            {gate ? <Gate tool="CPL máximo" summary={summary} meta={{ slug: 'cpl-maximo', finding: summary.split('\n')[1], items: summary.split('\n').slice(0, 3).map((t) => ({ t })) }} onDone={print} onCancel={() => setGate(false)} /> : undefined}
          </Library>
          <Benchmarks
            title="¿Qué canales caben en tu CPL máximo?"
            rows={CHANNEL_COSTS.map((c) => ({
              label: `CPL en ${c.channel}`,
              note: `CPC $${fmt(c.cpc, 2)} · clic→lead ${fmt(c.conv, 1)}%`,
              yours: money(o.cplMax),
              ref: `$${fmt(c.cpl)}`,
              status: c.cpl <= o.cplMax ? 'fit' : 'nofit',
            }))}
            sources={[SOURCES.metadata]}
            caveat="Promedios de EE. UU. en dólares; en México el costo por clic suele ser menor, pero la conversión también varía. Úsalo para ordenar canales, no como presupuesto."
          />
          <ListMode params={PARAMS} values={v} onChange={setV} />
          <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
            <Link className="btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }} href="/recursos/embudo-inverso">◂ Mejorar la conversión</Link>
            <ShareButton tool="CPL máximo" params={() => v} />
            <SaveRun
              run={() => ({
                slug: 'cpl-maximo',
                inputs: v,
                metrics: { cpl_max: finite(o.cplMax), cac_max: finite(o.cacMax), cpc_max: finite(o.cpcMax), cpl_actual: finite(v.cpl) },
                summary,
              })}
            />
            <Link className="btn or" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }} href={`/recursos/presupuesto-marketing?ticket=${v.ticket}&conv=${v.conv}`}>Presupuesto ▸</Link>
          </div>
        </div>
      </div>

      <section className="te-print" aria-hidden="true">
        <span className="tag">soyroman.com · CPL máximo</span>
        <h2 className="pt">Lo máximo que puedes pagar por un lead: {money(o.cplMax)}</h2>
        <p>Ticket {money(v.ticket)} · margen {fmt(v.margin)}% · {fmt(v.share)}% del margen para adquirir · lead → cliente {fmt(v.conv, 2)}%</p>
        <table>
          <thead><tr><th>Eslabón</th><th>Máximo</th><th>Cómo se calcula</th></tr></thead>
          <tbody>
            <tr><td>CAC (cliente)</td><td>{money(o.cacMax)}</td><td>ticket × margen × % para adquirir − otros costos</td></tr>
            <tr><td>CPL (lead)</td><td>{money(o.cplMax)}</td><td>CAC máximo × conversión lead → cliente</td></tr>
            <tr><td>CPC (clic)</td><td>{money(o.cpcMax)}</td><td>CPL máximo × conversión visita → lead</td></tr>
          </tbody>
        </table>
        <p>Tu CPL actual: {money(v.cpl)}. {verdict}. Con ese CPL, cada cliente te cuesta {money(o.cacReal)}.</p>
        <h3>Siguientes pasos</h3>
        <ol>
          <li>Si pagas más del máximo, revisa primero la conversión del embudo: duplicarla duplica el CPL que puedes pagar.</li>
          <li>Usa el CPC máximo como techo de puja en tus campañas de búsqueda y redes.</li>
          <li>Sustituye los valores de ejemplo por los de tu CRM y tus campañas de los últimos 6–12 meses.</li>
        </ol>
        <p>¿Quieres revisarlo juntos? contacto@soyroman.com · soyroman.com/consultoria</p>
      </section>
    </>
  )
}
