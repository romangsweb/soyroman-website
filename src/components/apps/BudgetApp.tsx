'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { fmt } from './Device'
import { AppHeader } from './Panels'
import { Benchmarks } from './Benchmarks'
import { Gate } from './Gate'
import { BUDGET_REF, SOURCES } from '@/data/benchmarks'
import { CHANNELS, DEFAULTS, FIELDS, budget, type BudgetIn } from './budget'
import { ShareButton } from './share'
import { useToolTracking } from './useToolTracking'
import { PrefillNote, useProfilePrefill } from '@/components/taller/useProfilePrefill'
import { fit } from '@/lib/taller/profile'
import { SaveRun } from '@/components/taller/SaveRun'
import { finite } from '@/lib/taller/tools'

const usd = (x: number) => `$${fmt(Math.round(x))}`
const kUsd = (x: number) => (x >= 1e6 ? `$${fmt(x / 1e6, 2)}M` : x >= 1e4 ? `$${fmt(x / 1e3, 0)}k` : usd(x))

/** Valores iniciales: los defaults, o los que manda el Embudo inverso por la URL (?goal=&ticket=&conv=). */
function useInitial(): BudgetIn {
  const sp = useSearchParams()
  return useMemo(() => {
    const out = { ...DEFAULTS }
    for (const f of FIELDS) {
      if (!sp.has(f.id)) continue
      const n = Number(sp.get(f.id))
      if (Number.isFinite(n) && n >= f.min && n <= f.max) (out as Record<string, number>)[f.id] = n
    }
    return out
  }, [sp])
}

function Vu({ pct, dark = false }: { pct: number; dark?: boolean }) {
  const on = Math.round(pct * 12)
  return (
    <div className={`m-vu${dark ? ' dk' : ''}`} aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => <i key={i} className={i < on ? 'on' : ''} />)}
    </div>
  )
}

export function BudgetApp() {
  const initial = useInitial()
  const [v, setV] = useState<BudgetIn>(initial)
  const [mix, setMix] = useState<number[]>(() => CHANNELS.map((c) => c.mix))
  const [gate, setGate] = useState(false)
  const fromFunnel = initial !== DEFAULTS && (initial.goal !== DEFAULTS.goal || initial.ticket !== DEFAULTS.ticket || initial.conv !== DEFAULTS.conv)
  const inputs = useRef<Record<string, HTMLInputElement | null>>({})

  useToolTracking('Presupuesto', { v, mix }, gate)
  const pre = useProfilePrefill('presupuesto-marketing', (x) => setV((c) => ({ ...c, ...fit(FIELDS, x) })))
  const o = useMemo(() => budget(v, mix), [v, mix])
  const set = (id: keyof BudgetIn, raw: string) => {
    const f = FIELDS.find((x) => x.id === id)!
    if (raw.trim() === '' || !Number.isFinite(Number(raw))) return // mientras escribe: no recalcula con un campo vacío
    const n = Math.min(f.max, Math.max(f.min, Number(raw)))
    setV((x) => ({ ...x, [id]: n }))
  }

  // Teclas A–J: saltan a su variable (fuera de un campo de texto)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.metaKey || e.ctrlKey || e.altKey || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return
      const f = FIELDS.find((x) => x.key === e.key.toUpperCase())
      if (f) {
        e.preventDefault()
        inputs.current[f.id]?.focus()
        inputs.current[f.id]?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const print = useCallback(() => {
    setGate(false)
    setTimeout(() => window.print(), 150)
  }, [])

  const cacPct = o.cac / Math.max(v.ticket, 1)
  const summary = [
    `Meta anual: ${usd(v.goal)} · Ticket: ${usd(v.ticket)} · Lead→cliente: ${fmt(v.conv, 2)}%`,
    `Presupuesto anual: ${usd(o.total)} (${fmt(o.share * 100, 1)}% de la meta) · Medios ${usd(o.media)} · Fijos ${usd(o.fixed)}`,
    `CAC ${usd(o.cac)} · ROMI ${fmt(o.romi * 100, 0)}% · Adelanto de caja ${usd(o.cash)} (${v.cycle} meses)`,
    `Medios por mes: ${o.channels.map((c) => `${c.name} ${usd(c.monthly)}`).join(', ')}`,
  ].join('\n')

  return (
    <>
      <PrefillNote on={pre} />
      <AppHeader
        top="BUDGET"
        bottom="MIX"
        cable={fromFunnel ? 'DESDE EL EMBUDO' : 'DATOS DE EJEMPLO'}
        message={gate
          ? 'Ingresa tu correo para descargar el plan'
          : o.romi < 0
            ? `${kUsd(o.total)} al año: con tu margen el plan no se paga`
            : `${kUsd(o.total)} al año · cada cliente te cuesta ${usd(o.cac)}`}
      />

      <div className="m-dev">
        <div>
          <div className="m-brand"><span><b>MIX·01</b> planificador de presupuesto</span><i className="m-led" aria-hidden="true" /></div>
          <div className="m-lcd" aria-live="polite">
            <div className="t">Presupuesto anual</div>
            <div className="v">{usd(o.total)}</div>
            <dl className="r">
              <div><dt>Por mes</dt><dd>{usd(o.total / 12)}</dd></div>
              <div><dt>% de la meta</dt><dd>{fmt(o.share * 100, 1)}%</dd></div>
              <div><dt>CAC</dt><dd>{usd(o.cac)}</dd></div>
              <div><dt>ROMI esperado</dt><dd className={o.romi < 0 ? 'neg' : ''}>{fmt(o.romi * 100, 0)}%</dd></div>
              <div><dt>Leads / mes</dt><dd>{fmt(Math.ceil(o.leadsY / 12))}</dd></div>
              <div><dt>Adelanto de caja</dt><dd>{usd(o.cash)}</dd></div>
            </dl>
          </div>
          <div className="m-params">
            {FIELDS.map((f) => (
              <label key={f.id} className="m-p">
                <span className="k">{f.key}</span>
                <span className="l">{f.label}<small>{f.unit}</small></span>
                <input
                  ref={(el) => { inputs.current[f.id] = el }}
                  type="number"
                  inputMode="decimal"
                  min={f.min}
                  max={f.max}
                  step={f.step}
                  defaultValue={v[f.id]}
                  onChange={(e) => set(f.id, e.target.value)}
                  onBlur={(e) => { e.target.value = String(v[f.id]) }}
                />
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="m-mix">
            <h3>Mezcla de medios</h3>
            <p className="sub">Reparte la inversión en medios · el master es el total de medios ({usd(o.media / 12)}/mes)</p>
            <div className="m-strips">
              {o.channels.map((c, k) => (
                <div key={c.id} className="m-strip">
                  <span className="nm">{c.name}</span>
                  <Vu pct={c.pct} />
                  <input
                    className="m-fader"
                    type="range"
                    min={0}
                    max={100}
                    value={mix[k]}
                    aria-label={`Peso de ${c.name} en medios`}
                    aria-valuetext={`${fmt(c.pct * 100, 0)} por ciento, ${usd(c.monthly)} al mes`}
                    onChange={(e) => setMix((m) => m.map((x, i) => (i === k ? Number(e.target.value) : x)))}
                  />
                  <span className="pct">{fmt(c.pct * 100, 0)}%</span>
                  <span className="amt">{usd(c.monthly)}/mes</span>
                </div>
              ))}
              <div className="m-strip master" aria-hidden="true">
                <span className="nm">Master<br />medios</span>
                <Vu pct={1} dark />
                <span className="m-cap" />
                <span className="pct">100%</span>
                <span className="amt">{usd(o.media / 12)}/mes</span>
              </div>
            </div>
            <div className="m-split" role="img" aria-label={o.parts.map((p) => `${p.name} ${fmt((p.value / Math.max(o.total, 1)) * 100, 0)}%`).join(', ')}>
              {o.parts.map((p) => (
                <div key={p.name} style={{ width: `${(p.value / Math.max(o.total, 1)) * 100}%`, background: p.color }}>
                  {p.value / Math.max(o.total, 1) > 0.09 ? `${fmt((p.value / o.total) * 100, 0)}%` : ''}
                </div>
              ))}
            </div>
            <div className="m-legend">
              {o.parts.map((p) => <span key={p.name} style={{ ['--c' as string]: p.color }}>{p.name} {usd(p.value)}</span>)}
            </div>
          </div>

          <p className="m-insight">
            Cada cliente nuevo te cuesta <b>{usd(o.cac)}</b> ({fmt(cacPct * 100, 0)}% del ticket) y necesitas <b>{usd(o.cash)}</b> invertidos
            antes del primer ingreso, porque la venta tarda {v.cycle} meses.{' '}
            {o.romi < 0
              ? <><b>El plan no se paga con tu margen:</b> sube la conversión del embudo o baja el costo por lead antes de subir el presupuesto.</>
              : <>Con un margen de {fmt(v.margin)}%, el plan devuelve <b>{fmt(o.romi * 100, 0)}%</b> sobre lo invertido en el año.</>}
          </p>

          <Benchmarks
            title="Tu presupuesto contra lo que invierten los CMOs"
            rows={[
              {
                label: 'Presupuesto / meta',
                note: 'Gartner lo mide contra los ingresos totales de la empresa; aquí es contra tu meta.',
                yours: `${fmt(o.share * 100, 1)}%`,
                ref: `${fmt(BUDGET_REF.revenueShare, 1)}% de los ingresos`,
                status: o.share * 100 < BUDGET_REF.revenueShare * 0.75 ? 'low' : o.share * 100 > BUDGET_REF.revenueShare * 1.25 ? 'high' : 'ok',
              },
              {
                label: 'Medios / presupuesto',
                yours: `${fmt((o.media / Math.max(o.total, 1)) * 100, 0)}%`,
                ref: `${fmt(BUDGET_REF.paidShare, 1)}%`,
                status: 'none',
              },
            ]}
            sources={[SOURCES.gartner]}
            caveat="Son empresas grandes de EE. UU. y Europa: una pyme en crecimiento suele invertir proporcionalmente más para ganar mercado."
          />

          {gate ? (
            <div className="m-gate">
              <Gate tool="Presupuesto" summary={summary} meta={{ slug: 'presupuesto-marketing', finding: summary.split('\n')[1], items: summary.split('\n').slice(0, 3).map((t) => ({ t })) }} onDone={print} onCancel={() => setGate(false)} />
            </div>
          ) : (
            <div className="m-keys">
              <button type="button" className="btn or" onClick={() => setGate(true)}>Plan en PDF ▸</button>
              <ShareButton tool="Presupuesto" params={() => Object.fromEntries(FIELDS.map((f) => [f.id, (v as Record<string, number>)[f.id]]))} />
              <SaveRun
                run={() => ({
                  slug: 'presupuesto-marketing',
                  inputs: { ...v, mix },
                  metrics: { total: finite(o.total), cac: finite(o.cac), romi: finite(o.romi * 100), adelanto: finite(o.cash) },
                  summary,
                })}
              />
              <Link className="btn" href="/recursos/embudo-inverso">◂ Embudo inverso</Link>
            </div>
          )}
        </div>
      </div>

      <section className="te-print" aria-hidden="true">
        <span className="tag">soyroman.com · Planificador de presupuesto</span>
        <h2 className="pt">Presupuesto de marketing para {usd(v.goal)} al año</h2>
        <p>Ticket {usd(v.ticket)} · {fmt(o.customers, 0)} clientes nuevos · lead → cliente {fmt(v.conv, 2)}% · ciclo de {v.cycle} meses</p>
        <table>
          <thead><tr><th>Concepto</th><th>Por mes</th><th>Por año</th><th>% del total</th></tr></thead>
          <tbody>
            {o.parts.map((p) => (
              <tr key={p.name}><td>{p.name}</td><td>{usd(p.value / 12)}</td><td>{usd(p.value)}</td><td>{fmt((p.value / Math.max(o.total, 1)) * 100, 0)}%</td></tr>
            ))}
            <tr><td><b>Total</b></td><td><b>{usd(o.total / 12)}</b></td><td><b>{usd(o.total)}</b></td><td>100%</td></tr>
          </tbody>
        </table>
        <table>
          <thead><tr><th>Canal de medios</th><th>Peso</th><th>Por mes</th><th>Por año</th></tr></thead>
          <tbody>
            {o.channels.map((c) => (
              <tr key={c.id}><td>{c.name}</td><td>{fmt(c.pct * 100, 0)}%</td><td>{usd(c.monthly)}</td><td>{usd(c.monthly * 12)}</td></tr>
            ))}
          </tbody>
        </table>
        <p>CAC: {usd(o.cac)} ({fmt(cacPct * 100, 0)}% del ticket) · ROMI esperado con {fmt(v.margin)}% de margen: {fmt(o.romi * 100, 0)}% · Presupuesto = {fmt(o.share * 100, 1)}% de la meta.</p>
        <p>Adelanto de caja: {usd(o.cash)} invertidos antes del primer ingreso ({v.cycle} meses de ciclo).</p>
        <h3>Siguientes pasos</h3>
        <ol>
          <li>Sustituye la conversión y el costo por lead de ejemplo por los de tu CRM y tus campañas de los últimos 6–12 meses.</li>
          <li>Si el ROMI es bajo, mejora primero la conversión del embudo: suele ser más barato que comprar más leads.</li>
          <li>Planea el adelanto de caja: el presupuesto de los primeros {v.cycle} meses se paga antes de que lleguen los ingresos.</li>
        </ol>
        <p>¿Quieres revisarlo juntos? contacto@soyroman.com · soyroman.com/consultoria</p>
      </section>
    </>
  )
}
