'use client'

import Link from 'next/link'
import React, { useCallback, useMemo, useState } from 'react'

import { fmt } from './Device'
import { AppHeader } from './Panels'
import { Gate } from './Gate'
import { DEFAULTS, pipeline, type PipelineIn } from './pipeline'
import { useToolTracking } from './useToolTracking'

const usd = (x: number) => `$${fmt(Math.round(x))}`
const TOP: { id: 'goal' | 'won' | 'ticket' | 'l2o'; key: string; label: string; step: number }[] = [
  { id: 'goal', key: 'A', label: 'Meta del trimestre (USD)', step: 10000 },
  { id: 'won', key: 'B', label: 'Ya ganado (USD)', step: 5000 },
  { id: 'ticket', key: 'C', label: 'Ticket promedio (USD)', step: 1000 },
  { id: 'l2o', key: 'D', label: 'Lead → oportunidad (%)', step: 0.5 },
]

export function PipelineApp() {
  const [v, setV] = useState<PipelineIn>(DEFAULTS)
  const [gate, setGate] = useState(false)
  useToolTracking('Brecha de pipeline', v, gate)
  const o = useMemo(() => pipeline(v), [v])

  const num = (raw: string) => (raw.trim() === '' || !Number.isFinite(Number(raw)) ? null : Math.max(0, Number(raw)))
  const setTop = (id: (typeof TOP)[number]['id'], raw: string) => {
    const n = num(raw)
    if (n !== null) setV((x) => ({ ...x, [id]: id === 'l2o' ? Math.min(100, n) : n }))
  }
  const setStage = (k: number, patch: Partial<PipelineIn['stages'][number]>) =>
    setV((x) => ({ ...x, stages: x.stages.map((s, i) => (i === k ? { ...s, ...patch } : s)) }))

  const print = useCallback(() => {
    setGate(false)
    setTimeout(() => window.print(), 150)
  }, [])

  const scale = Math.max(v.goal, v.won + o.open, 1) * 1.05
  const pct = (x: number) => `${Math.min(100, (x / scale) * 100)}%`
  const summary = [
    `Meta trimestre ${usd(v.goal)} · Ganado ${usd(v.won)} · Forecast ponderado ${usd(o.forecast)} · Brecha ${usd(o.gap)}`,
    `Cobertura ${fmt(o.coverage, 1)}x · Caso seguro ${usd(o.commit)} · Si todo cierra ${usd(o.best)}`,
    ...o.rows.map((r) => `${r.name}: ${usd(r.amount)} al ${fmt(r.prob)}% = ${usd(r.weighted)}`),
    o.gap ? `Para cerrar la brecha: ${usd(o.newPipe)} de pipeline nuevo, ${fmt(Math.ceil(o.opps))} oportunidades, ~${fmt(Math.ceil(o.leads))} leads` : 'Sin brecha',
  ].join('\n')

  return (
    <>
      <AppHeader
        top="PIPE"
        bottom="GAP"
        cable="DATOS DE EJEMPLO"
        message={gate
          ? 'Ingresa tu correo para descargar el plan'
          : o.gap
            ? `Te faltan ${usd(o.gap)} para la meta del trimestre`
            : `Tu forecast ponderado llega a la meta (${fmt(o.attainment * 100, 0)}%)`}
      />

      <div className="q-dev">
        <div className="q-brand"><span><b>SEQ·01</b> brecha de pipeline</span><span aria-hidden="true"><i className="q-rec" /> REC</span></div>

        <div className="q-lcd" aria-live="polite">
          <div className="t">Forecast ponderado del trimestre</div>
          <div className="v">{usd(o.forecast)} <span>/ {usd(v.goal)}</span></div>
          <div className="q-tape" role="img" aria-label={`Ganado ${usd(v.won)}, ponderado ${usd(o.weighted)}, meta ${usd(v.goal)}`}>
            <i className="won" style={{ left: 0, width: pct(v.won) }} />
            <i className="wt" style={{ left: pct(v.won), width: pct(o.weighted) }} />
            <i className="goal" style={{ left: pct(v.goal) }} />
          </div>
          <div className="q-lg" aria-hidden="true"><span>■ ganado</span><span>▨ ponderado</span><span>│ meta</span></div>
          <dl className="q-r">
            <div><dt>Brecha</dt><dd className={o.gap ? 'neg' : ''}>{o.gap ? usd(o.gap) : 'Sin brecha ✓'}</dd></div>
            <div><dt>Cobertura</dt><dd>{fmt(o.coverage, 1)}x</dd></div>
            <div><dt>Caso seguro</dt><dd>{usd(o.commit)}</dd></div>
            <div><dt>Si todo cierra</dt><dd>{usd(o.best)}</dd></div>
          </dl>
        </div>

        <div className="q-top">
          {TOP.map((f) => (
            <label key={f.id} className="q-f">
              <small><b>{f.key}</b> · {f.label}</small>
              <input type="number" inputMode="decimal" min={0} step={f.step} defaultValue={v[f.id]}
                onChange={(e) => setTop(f.id, e.target.value)} onBlur={(e) => { e.target.value = String(v[f.id]) }} />
            </label>
          ))}
        </div>

        <div className="q-seq">
          {o.rows.map((r, k) => (
            <div key={k} className="q-st">
              <div className="q-h">
                <span>{String(k + 1).padStart(2, '0')}</span>
                <input className="q-name" value={r.name} maxLength={24} aria-label={`Nombre de la etapa ${k + 1}`}
                  onChange={(e) => setStage(k, { name: e.target.value })} />
              </div>
              <div className="q-steps" aria-hidden="true">
                {Array.from({ length: 10 }, (_, i) => <i key={i} className={i < Math.round(r.prob / 10) ? 'on' : ''} />)}
              </div>
              <label>Monto abierto (USD)
                <input type="number" inputMode="decimal" min={0} step={5000} defaultValue={r.amount}
                  onChange={(e) => { const n = num(e.target.value); if (n !== null) setStage(k, { amount: n }) }}
                  onBlur={(e) => { e.target.value = String(v.stages[k].amount) }} />
              </label>
              <label>Prob. de ganar en el trimestre: <b>{fmt(r.prob)}%</b>
                <input type="range" min={0} max={100} value={r.prob}
                  aria-valuetext={`${fmt(r.prob)} por ciento`}
                  onChange={(e) => setStage(k, { prob: Number(e.target.value) })} />
              </label>
              <div className="q-w">Ponderado: {usd(r.weighted)}</div>
            </div>
          ))}
        </div>

        <p className="q-plan">
          {o.gap ? (
            <>
              Te faltan <b>{usd(o.gap)}</b>. Si lo cubres con pipeline nuevo que entra en {o.rows[0]?.name.toLowerCase() || 'la primera etapa'} ({fmt(o.earlyProb * 100, 0)}% de probabilidad),
              necesitas <b>{usd(o.newPipe)}</b> de pipeline nuevo: <b>{fmt(Math.ceil(o.opps))} oportunidades</b>, unos <b>{fmt(Math.ceil(o.leads))} leads</b> con tu conversión.
              Si no cabe en el tiempo que queda, la palanca más rápida es subir la probabilidad de las etapas avanzadas.{' '}
              <Link href="/recursos/embudo-inverso">Calcula tus leads con el embudo completo ▸</Link>
            </>
          ) : (
            <>Con lo que tienes abierto, el forecast ponderado alcanza la meta. Vigila el <b>caso seguro ({usd(o.commit)})</b>: es lo que depende solo de la última etapa.</>
          )}
        </p>

        {gate ? (
          <div className="q-gate"><Gate tool="Brecha de pipeline" summary={summary} meta={{ slug: 'brecha-pipeline', finding: summary.split('\n')[0], items: summary.split('\n').slice(0, 3).map((t) => ({ t })) }} onDone={print} onCancel={() => setGate(false)} /></div>
        ) : (
          <div className="q-keys"><button type="button" className="btn or" onClick={() => setGate(true)}>Plan para cerrar la brecha en PDF ▸</button></div>
        )}
      </div>

      <section className="te-print" aria-hidden="true">
        <span className="tag">soyroman.com · Brecha de pipeline</span>
        <h1>Forecast del trimestre: {usd(o.forecast)} de {usd(v.goal)}</h1>
        <p>Ganado {usd(v.won)} · brecha {o.gap ? usd(o.gap) : 'ninguna'} · cobertura {fmt(o.coverage, 1)}x</p>
        <table>
          <thead><tr><th>Etapa</th><th>Monto abierto</th><th>Prob. en el trimestre</th><th>Ponderado</th></tr></thead>
          <tbody>
            {o.rows.map((r, k) => <tr key={k}><td>{r.name}</td><td>{usd(r.amount)}</td><td>{fmt(r.prob)}%</td><td>{usd(r.weighted)}</td></tr>)}
            <tr><td><b>Total</b></td><td><b>{usd(o.open)}</b></td><td>—</td><td><b>{usd(o.weighted)}</b></td></tr>
          </tbody>
        </table>
        <table>
          <thead><tr><th>Escenario</th><th>Ingreso del trimestre</th><th>vs meta</th></tr></thead>
          <tbody>
            <tr><td>Caso seguro (ganado + última etapa)</td><td>{usd(o.commit)}</td><td>{fmt((o.commit / Math.max(v.goal, 1)) * 100, 0)}%</td></tr>
            <tr><td>Forecast ponderado</td><td>{usd(o.forecast)}</td><td>{fmt(o.attainment * 100, 0)}%</td></tr>
            <tr><td>Si todo cierra</td><td>{usd(o.best)}</td><td>{fmt((o.best / Math.max(v.goal, 1)) * 100, 0)}%</td></tr>
          </tbody>
        </table>
        {o.gap > 0 && <p>Para cerrar la brecha con pipeline nuevo: {usd(o.newPipe)} ({fmt(Math.ceil(o.opps))} oportunidades, ~{fmt(Math.ceil(o.leads))} leads).</p>}
        <h3>Siguientes pasos</h3>
        <ol>
          <li>Usa probabilidades de tu histórico: qué porcentaje de oportunidades en cada etapa se ganó dentro del mismo trimestre.</li>
          <li>Revisa las oportunidades en Propuesta y Negociación: ahí están las acciones que mueven el trimestre actual.</li>
          <li>El pipeline nuevo rara vez cierra en el mismo trimestre: si la brecha es grande, ajusta la meta o planea el siguiente trimestre desde hoy.</li>
        </ol>
        <p>¿Quieres revisarlo juntos? contacto@soyroman.com · soyroman.com/consultoria</p>
      </section>
    </>
  )
}
