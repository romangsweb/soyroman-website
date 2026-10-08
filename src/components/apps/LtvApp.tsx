'use client'

import Link from 'next/link'
import React, { useCallback, useEffect, useState } from 'react'

import { LTV_RULE, PAYBACK_REF, SOURCES } from '@/data/benchmarks'
import { Benchmarks } from './Benchmarks'
import { fmt } from './Device'
import { AppHeader } from './Panels'
import { Gate } from './Gate'
import { KnobList, ModeKeys, knobDefaults, readKnobs, type Knob, type KnobValues } from './Knobs'
import { HORIZON, ltv, type LtvIn } from './ltv'
import { ShareButton, query } from './share'
import { useToolTracking } from './useToolTracking'

const CAC: Knob[] = [
  { id: 'mkt', label: 'Gasto de marketing en el periodo', unit: '$', val: 180000, min: 0, max: 20000000, step: 5000, hint: 'medios, herramientas, agencia y nómina de marketing' },
  { id: 'sales', label: 'Gasto de ventas en el periodo', unit: '$', val: 240000, min: 0, max: 20000000, step: 5000, hint: 'nómina y comisiones de ventas' },
  { id: 'newc', label: 'Clientes nuevos en el periodo', unit: '', val: 12, min: 1, max: 2000, step: 1 },
]
const PRJ: Knob[] = [
  { id: 'prj', label: 'Proyecto inicial (implementación)', unit: '$', val: 60000, min: 0, max: 5000000, step: 5000 },
  { id: 'pgm', label: 'Margen del proyecto', unit: '%', val: 35, min: 0, max: 90, step: 1, hint: 'después de las horas del equipo' },
]
const REC: Knob[] = [
  { id: 'arpa', label: 'Ingreso recurrente al mes por cliente', unit: '$', val: 1500, min: 0, max: 200000, step: 100 },
  { id: 'gm', label: 'Margen bruto de lo recurrente', unit: '%', val: 70, min: 1, max: 100, step: 1 },
  { id: 'churn', label: 'Clientes que se van al mes', unit: '%', val: 1.5, min: 0.1, max: 10, step: 0.1, hint: '12% al año ≈ 1% al mes' },
]
const ALL = [...CAC, ...PRJ, ...REC]
const usd = (x: number) => `$${fmt(Math.round(x))}`
const W = 560
const H = 160

export function LtvApp() {
  const [v, setV] = useState<KnobValues>(() => knobDefaults(ALL))
  const [mode, setMode] = useState<LtvIn['mode']>('rec')
  const [gate, setGate] = useState(false)
  useEffect(() => {
    setV((x) => ({ ...x, ...readKnobs(ALL) }))
    if (query().get('modo') === 'prj') setMode('prj')
  }, [])
  useToolTracking('LTV:CAC y payback', v, gate)
  const set = (id: string, n: number) => setV((x) => ({ ...x, [id]: n }))

  const o = ltv({ mode, mkt: v.mkt, sales: v.sales, newc: v.newc, prj: v.prj, pgm: v.pgm, arpa: v.arpa, gm: v.gm, churn: v.churn })
  const tone = o.ratio >= LTV_RULE ? 'ok' : o.ratio >= 1.5 ? 'warn' : 'bad'
  const mn = Math.min(...o.curve)
  const mx = Math.max(...o.curve, 1)
  const y = (x: number) => H - 10 - ((x - mn) / (mx - mn || 1)) * (H - 20)
  const pts = o.curve.map((x, i) => `${((i / HORIZON) * W).toFixed(1)},${y(x).toFixed(1)}`).join(' ')
  const pay = o.payback

  const dx = [
    o.ratio >= LTV_RULE
      ? `Cada cliente deja ${fmt(o.ratio, 1)} veces lo que cuesta conseguirlo: está en la referencia común de ${LTV_RULE}:1 o más.`
      : `Cada cliente deja ${fmt(o.ratio, 1)} veces lo que cuesta conseguirlo: debajo de la referencia común de ${LTV_RULE}:1.`,
    pay == null
      ? `No recuperas el costo de adquisición en ${HORIZON / 12} años: revisa margen, precio o costo de adquisición.`
      : pay <= PAYBACK_REF.smb
        ? `Recuperas lo invertido en ${pay} meses: dentro de los ${PAYBACK_REF.smb} que suelen pedirse en ventas a pymes.`
        : pay <= PAYBACK_REF.mid
          ? `Payback de ${pay} meses: aceptable en mercado medio (${PAYBACK_REF.smb}–${PAYBACK_REF.mid} es lo común).`
          : `Payback de ${pay} meses: largo. En empresas grandes se toleran hasta ${PAYBACK_REF.ent}, pero amarra mucha caja.`,
    ...(o.ratio > 5 ? ['Una razón muy alta también es una señal: podrías estar invirtiendo poco en crecer.'] : []),
    ...(mode === 'prj' ? [`El proyecto inicial aporta ${usd(o.upfront)} de margen (${fmt(o.upShare * 100)}% del LTV). Si el negocio depende del proyecto y no de lo recurrente, cuida que el soporte no se cancele.`] : []),
  ]
  const summary = [
    `LTV:CAC ${fmt(o.ratio, 1)}:1 · CAC ${usd(o.cac)} · LTV (margen) ${usd(o.ltv)} · payback ${pay == null ? `más de ${HORIZON} meses` : `${pay} meses`}`,
    ...dx,
  ]
  const print = useCallback(() => {
    setGate(false)
    setTimeout(() => window.print(), 150)
  }, [])

  return (
    <>
      <AppHeader
        top="LTV"
        bottom="CAC"
        cable="DATOS DE EJEMPLO"
        message={gate ? 'Ingresa tu correo para recibir el diagnóstico' : `LTV:CAC de ${fmt(o.ratio, 1)}:1 · recuperas el CAC ${pay == null ? `después de ${HORIZON} meses` : `en ${pay} meses`}`}
      />
      <div className="x-dev">
        <div className="x-brand"><span><b>LTV·01</b> ¿cuánto vale un cliente y en cuánto recuperas lo que costó?</span><span>LTV · CAC · payback</span></div>
        <ModeKeys label="Modelo de ingreso" value={mode} onChange={setMode} options={[['rec', 'Suscripción o servicio recurrente'], ['prj', 'Proyecto + recurrente']]} />
        <div className="cp-wrap">
          <div>
            <h3 className="pl-h" style={{ marginTop: 0 }}>Costo de adquirir (CAC)</h3>
            <KnobList knobs={CAC} v={v} set={set} />
            <h3 className="pl-h">Lo que deja un cliente</h3>
            <KnobList knobs={mode === 'prj' ? [...PRJ, ...REC] : REC} v={v} set={set} />
          </div>
          <div>
            <div className="e-lcd" style={{ marginTop: 0 }} aria-live="polite">
              <div className="vl-t">LTV : CAC</div>
              <div className={`vl-big ${tone}`}>{fmt(o.ratio, 1)} : 1</div>
              <div className="vl-tiles">
                <div><b>{usd(o.cac)}</b><span>CAC por cliente</span></div>
                <div><b>{usd(o.ltv)}</b><span>LTV (margen)</span></div>
                <div><b>{pay == null ? `+${HORIZON}` : pay} meses</b><span>payback</span></div>
                <div><b>{fmt(o.life / 12, 1)} años</b><span>vida promedio</span></div>
              </div>
              <div className="vl-t" style={{ marginTop: 14 }}>margen acumulado de un cliente contra lo que costó</div>
              <svg className="lt-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={pay == null ? 'No se recupera en 60 meses' : `Se recupera en el mes ${pay}`}>
                <line x1="0" x2={W} y1={y(0)} y2={y(0)} stroke="#8a9" strokeDasharray="3 3" />
                <polyline fill="none" stroke="#3ddc84" strokeWidth="2" points={pts} />
                {pay != null && (
                  <>
                    <line x1={(pay / HORIZON) * W} x2={(pay / HORIZON) * W} y1="0" y2={H} stroke="#ff7a3d" />
                    <text x={(pay / HORIZON) * W + 4} y="14" fill="#ff7a3d" fontSize="10">recuperado: mes {pay}</text>
                  </>
                )}
                <text x="2" y={y(0) - 4} fill="#8a9" fontSize="9">punto de equilibrio</text>
                <text x={W - 60} y={H - 2} fill="#8a9" fontSize="9">{HORIZON} meses</text>
              </svg>
            </div>
            <Benchmarks
              title="Economía del cliente"
              rows={[
                { label: 'LTV : CAC', note: 'Margen que deja un cliente en su vida contra lo que costó conseguirlo.', yours: `${fmt(o.ratio, 1)}:1`, ref: `${LTV_RULE}:1 o más`, status: o.ratio >= LTV_RULE ? 'ok' : 'low' },
                { label: 'Payback del CAC', note: `Pymes: hasta ${PAYBACK_REF.smb} meses · mercado medio: ${PAYBACK_REF.smb}–${PAYBACK_REF.mid} · empresas grandes: hasta ${PAYBACK_REF.ent}.`, yours: pay == null ? `+${HORIZON} meses` : `${pay} meses`, ref: `≤ ${PAYBACK_REF.mid} meses`, status: pay != null && pay <= PAYBACK_REF.mid ? 'ok' : 'high' },
              ]}
              sources={[SOURCES.skok, SOURCES.rule]}
              caveat="El LTV usa margen bruto y una vida máxima de 10 años. Son reglas de la industria, no estudios con muestra."
            />
            <div className="x-dx">
              <h3>Diagnóstico · lo que significa</h3>
              <ol>{dx.map((d) => <li key={d}>{d}</li>)}</ol>
            </div>
            {gate ? (
              <div className="s-gate"><Gate tool="LTV:CAC y payback" summary={summary.join('\n')} meta={{ slug: 'ltv-cac', finding: summary[0], items: dx.slice(0, 3).map((t) => ({ t })) }} onDone={print} onCancel={() => setGate(false)} /></div>
            ) : (
              <div className="s-keys">
                <button type="button" className="btn or" onClick={() => setGate(true)}>Diagnóstico en PDF ▸</button>
                <ShareButton tool="LTV:CAC y payback" params={() => ({ ...v, modo: mode })} />
                <Link className="btn" href="/recursos/roas-romi-roi" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>ROAS · ROMI · ROI ▸</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="te-print" aria-hidden="true">
        <span className="tag">soyroman.com · LTV:CAC y payback</span>
        <h2 className="pt">LTV:CAC de {fmt(o.ratio, 1)}:1 · payback {pay == null ? `de más de ${HORIZON} meses` : `de ${pay} meses`}</h2>
        <table>
          <thead><tr><th>Supuesto</th><th>Valor</th></tr></thead>
          <tbody>
            {(mode === 'prj' ? ALL : [...CAC, ...REC]).map((k) => <tr key={k.id}><td>{k.label}</td><td>{k.unit === '$' ? usd(v[k.id]) : k.unit === '%' ? `${fmt(v[k.id], 1)}%` : fmt(v[k.id])}</td></tr>)}
            <tr><td><b>CAC por cliente</b></td><td><b>{usd(o.cac)}</b></td></tr>
            <tr><td><b>LTV (margen)</b></td><td><b>{usd(o.ltv)}</b></td></tr>
          </tbody>
        </table>
        <h3>Diagnóstico</h3>
        <ol>{dx.map((d) => <li key={d}>{d}</li>)}</ol>
        <p>¿Quieres revisarlo juntos? contacto@soyroman.com · soyroman.com/consultoria</p>
      </section>
    </>
  )
}
