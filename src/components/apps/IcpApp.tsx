'use client'

import React, { useCallback, useState } from 'react'

import { Gate } from './Gate'
import { Knob } from './Knob'
import { Osc, OscLabel } from './Osc'
import { Scope } from './Scope'
import { useToolTracking } from './useToolTracking'

const SIZES = ['1–10', '11–50', '51–200', '201–1,000', '1,000+']
const INDUSTRIES = ['Software y SaaS', 'Servicios profesionales', 'Manufactura', 'Salud', 'Educación', 'Finanzas', 'Logística', 'Otra']
const ROLES = ['Dirección general', 'Finanzas', 'Marketing', 'Ventas', 'TI', 'Operaciones']
const TRIGGERS = ['Están creciendo rápido', 'Cambió la dirección', 'Recibieron inversión', 'Mala experiencia con proveedor', 'Nueva regulación']
const tFromK = (k: number) => Math.round((1000 * Math.pow(1000, k / 100)) / 500) * 500
const kFromT = (t: number) => Math.round((Math.log(t / 1000) / Math.log(1000)) * 100)

type Icp = { industria: string; tam: number; ticket: number; ciclo: number; decide: string; evalua: string; dolor: string; disparador: string }

const STEPS = [
  { q: '¿En qué industria están tus mejores clientes?', hint: 'Piensa en los que compran rápido, pagan bien y se quedan.' },
  { q: '¿De qué tamaño son esas empresas?', hint: 'Número de empleados. Gira la perilla.' },
  { q: '¿Cuál es el ticket promedio de un cliente así?', hint: 'USD por contrato o por año.' },
  { q: '¿Cuánto tarda su ciclo de compra?', hint: 'Del primer contacto a la firma, en meses.' },
  { q: '¿Quién firma la decisión y quién la evalúa?', hint: 'Primer clic: quién decide (✦). Segundo clic: quién evalúa (◇).' },
  { q: '¿Qué problema los hace buscarte, y qué lo dispara?', hint: 'Escríbelo con sus palabras, como lo dirían en una llamada.' },
]

function implications(i: Icp) {
  const canal =
    i.ticket >= 50000 ? 'ABM y outbound coordinado con contenido'
      : i.ticket >= 10000 ? 'contenido especializado, LinkedIn y eventos del sector'
        : 'SEO, paid media y automatización de nurturing'
  const comite = i.ciclo >= 6 || i.tam >= 3
    ? 'Compra un comité: prepara argumentos financieros para quien decide y técnicos para quien evalúa'
    : 'Deciden una o dos personas: prioriza velocidad y una prueba rápida de valor'
  return [
    `${comite}.`,
    `Canal principal sugerido: ${canal}.`,
    `Con un ciclo de ${i.ciclo} ${i.ciclo === 1 ? 'mes' : 'meses'}, lo que generes hoy se convierte en ventas dentro de ${i.ciclo <= 3 ? 'este trimestre' : 'dos trimestres o más'}: planea el pipeline con esa anticipación.`,
  ]
}

export function IcpApp() {
  const [s, setS] = useState(0)
  const [gate, setGate] = useState(false)
  const [icp, setIcp] = useState<Icp>({ industria: '', tam: 2, ticket: 25000, ciclo: 4, decide: '', evalua: '', dolor: '', disparador: '' })
  useToolTracking('Generador de ICP', icp, gate)
  const set = <K extends keyof Icp>(k: K, v: Icp[K]) => setIcp((x) => ({ ...x, [k]: v }))

  const valueText = [
    icp.industria || '—',
    `${SIZES[icp.tam]} empleados`,
    `USD ${icp.ticket.toLocaleString('es-MX')}`,
    `${icp.ciclo} ${icp.ciclo === 1 ? 'mes' : 'meses'}`,
    icp.decide ? `Decide: ${icp.decide}${icp.evalua ? ` · evalúa: ${icp.evalua}` : ''}` : '—',
    icp.dolor ? icp.dolor.slice(0, 60) + (icp.dolor.length > 60 ? '…' : '') : '—',
  ][s]

  const wave = {
    freq: 1.2 + icp.ciclo * 0.08,
    amp: 0.9,
    noise: 0.05,
    harm: [0.6 + (icp.tam / 4) * 0.6, Math.min(1, Math.log10(icp.ticket) / 6) * 0.8, (icp.ciclo / 18) * 0.7,
      (icp.industria ? 0.3 : 0) + (icp.decide ? 0.2 : 0) + (icp.dolor ? 0.25 : 0)],
  }

  const pickRole = (r: string) => {
    if (!icp.decide || icp.decide === r) set('decide', icp.decide === r ? '' : r)
    else set('evalua', icp.evalua === r ? '' : r)
  }
  const chip = (label: string, on: boolean, onClick: () => void, mark = '') => (
    <button key={label} type="button" className="chip" aria-pressed={on} onClick={onClick}>{mark}{label}</button>
  )
  const imp = implications(icp)
  const summary = [
    `Industria: ${icp.industria || '—'} · Tamaño: ${SIZES[icp.tam]} empleados`,
    `Ticket: USD ${icp.ticket.toLocaleString('es-MX')} · Ciclo: ${icp.ciclo} meses`,
    `Decide: ${icp.decide || '—'} · Evalúa: ${icp.evalua || '—'}`,
    `Dolor: ${icp.dolor || '—'} · Disparador: ${icp.disparador || '—'}`,
  ].join('\n')
  const print = useCallback(() => {
    setGate(false)
    setTimeout(() => window.print(), 150)
  }, [])

  const card = (
    <dl>
      <dt>Industria</dt><dd>{icp.industria || '—'}</dd>
      <dt>Tamaño</dt><dd>{SIZES[icp.tam]} empleados</dd>
      <dt>Ticket</dt><dd>USD {icp.ticket.toLocaleString('es-MX')}</dd>
      <dt>Ciclo</dt><dd>{icp.ciclo} {icp.ciclo === 1 ? 'mes' : 'meses'}</dd>
      <dt>Decide / evalúa</dt><dd>{icp.decide || '—'}{icp.evalua ? ` / ${icp.evalua}` : ''}</dd>
      <dt>Dolor</dt><dd>{icp.dolor || '—'}</dd>
      <dt>Disparador</dt><dd>{icp.disparador || '—'}</dd>
    </dl>
  )

  return (
    <>
      <OscLabel title="Generador de ICP" sub="perfil de cliente ideal · 6 pasos" />
      <Osc
        label="Generador de perfil de cliente ideal"
        model="SINTETIZADOR P6"
        sub="perfil de cliente ideal"
        leds={STEPS.length}
        active={s}
        screen={
          <>
            <Scope wave={wave} />
            <div className="scr" aria-live="polite">
              <div className="meta"><span>Señal del perfil</span><b>PASO {s + 1} / {STEPS.length}</b></div>
              <p className="q">{STEPS[s].q}</p>
              <div className="lvl"><span className="t"><span className="val">{valueText}</span><small>{STEPS[s].hint}</small></span></div>
              <div className="steps">{STEPS.map((_, i) => <i key={i} className={i <= s ? 'on' : ''} />)}</div>
            </div>
          </>
        }
        panel={
          <>
            {s === 0 && <div className="chips">{INDUSTRIES.map((o) => chip(o, icp.industria === o, () => set('industria', icp.industria === o ? '' : o)))}</div>}
            {s === 1 && (
              <div className="ctl wide">
                <Knob value={icp.tam} min={0} max={4} onChange={(v) => set('tam', v)} label="Tamaño de la empresa" valueText={`${SIZES[icp.tam]} empleados`} tone="or" size="big" ticks={5} />
                <span className="cap">Gira, arrastra o usa las flechas</span>
              </div>
            )}
            {s === 2 && (
              <div className="ctl wide">
                <Knob value={kFromT(icp.ticket)} min={0} max={100} onChange={(v) => set('ticket', tFromK(v))} label="Ticket promedio en USD"
                  valueText={`USD ${icp.ticket}`} tone="or" size="big" />
                <span className="cap">USD 1,000 a 1,000,000</span>
              </div>
            )}
            {s === 3 && (
              <div className="ctl wide">
                <Knob value={icp.ciclo} min={1} max={18} onChange={(v) => set('ciclo', v)} label="Ciclo de compra en meses" valueText={`${icp.ciclo} meses`} tone="or" size="big" />
                <span className="cap">1 a 18 meses</span>
              </div>
            )}
            {s === 4 && (
              <div className="chips">
                {ROLES.map((r) => chip(r, icp.decide === r || icp.evalua === r, () => pickRole(r), icp.decide === r ? '✦ ' : icp.evalua === r ? '◇ ' : ''))}
              </div>
            )}
            {s === 5 && (
              <>
                <label className="field">
                  <span className="cap">Dolor principal</span>
                  <textarea rows={4} value={icp.dolor} onChange={(e) => set('dolor', e.target.value.slice(0, 400))}
                    placeholder="Ej.: no saben qué campañas generan ventas y el CRM está lleno de duplicados" />
                </label>
                <div className="chips">{TRIGGERS.map((o) => chip(o, icp.disparador === o, () => set('disparador', icp.disparador === o ? '' : o)))}</div>
              </>
            )}
            <div className="btnrow">
              <button type="button" className="btn" disabled={s === 0} onClick={() => setS(s - 1)}>◂ Atrás</button>
              <button type="button" className="btn or" onClick={() => (s < STEPS.length - 1 ? setS(s + 1) : setGate(true))}>
                {s === STEPS.length - 1 ? 'Descargar PDF ▸' : 'Siguiente ▸'}
              </button>
            </div>
          </>
        }
      />

      <div className="osc-card">
        {gate ? (
          <Gate tool="Generador de ICP" summary={summary} onDone={print} onCancel={() => setGate(false)} />
        ) : (
          <>
            <h3>Tu cliente ideal {s < STEPS.length - 1 ? '(en construcción)' : ''}</h3>
            {card}
            <p className="lead">Implicaciones</p>
            <ul>{imp.map((x) => <li key={x}>{x}</li>)}</ul>
          </>
        )}
      </div>

      <section className="te-print" aria-hidden="true">
        <span className="tag">soyroman.com · Perfil de cliente ideal</span>
        <h1>Tu cliente ideal</h1>
        {card}
        <h3>Implicaciones</h3>
        <ul>{imp.map((x) => <li key={x}>{x}</li>)}</ul>
        <h3>Siguientes pasos</h3>
        <ol>
          <li>Valida el perfil con tus 10 mejores clientes actuales: ¿cuántos cumplen cada criterio?</li>
          <li>Convierte los criterios en propiedades del CRM para poder filtrar y puntuar leads.</li>
          <li>Escribe el dolor y el disparador con las palabras del cliente y úsalos en anuncios, landing y correos.</li>
        </ol>
        <p>¿Quieres revisarlo juntos? contacto@soyroman.com · soyroman.com/consultoria</p>
      </section>
    </>
  )
}
