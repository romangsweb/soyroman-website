'use client'

import React, { useCallback, useMemo, useState } from 'react'

import { Gate } from './Gate'
import { Knob } from './Knob'
import { Osc, OscLabel } from './Osc'
import { Scope } from './Scope'
import { useToolTracking } from './useToolTracking'

const LEVELS: [string, string][] = [
  ['No existe', 'No hay proceso ni dato; depende de cada persona.'],
  ['Informal', 'Se hace, pero sin reglas escritas ni dueño.'],
  ['Definido', 'Hay reglas escritas y la mayoría las sigue.'],
  ['Medido', 'Se mide y se revisa con regularidad.'],
  ['Optimizado', 'Se mejora con datos de forma continua.'],
]

const Q: [string, string][] = [
  ['Datos y CRM', '¿Qué tan confiable es la información de contactos y empresas en tu CRM?'],
  ['Datos y CRM', '¿Todas las oportunidades viven en el CRM con etapa, monto y fecha de cierre?'],
  ['Procesos', '¿Las etapas del pipeline tienen criterios de salida escritos?'],
  ['Procesos', '¿Marketing y ventas tienen una definición acordada de MQL y SQL?'],
  ['Alineación', '¿Existe un tiempo máximo de respuesta a leads y se cumple?'],
  ['Alineación', '¿Marketing y ventas revisan juntos el pipeline cada semana?'],
  ['Medición', '¿Puedes saber qué canal generó cada oportunidad y cuánto ingreso trajo?'],
  ['Medición', '¿El forecast se calcula con datos históricos y no solo con la opinión del vendedor?'],
  ['Tecnología', '¿CRM, automatización y formularios están integrados sin pasos manuales?'],
  ['Tecnología', '¿Hay una persona responsable de los datos y procesos de revenue?'],
]

const RECS: Record<string, string> = {
  'Datos y CRM': 'Audita duplicados y propiedades sin uso, define reglas de captura en formularios y nombra un dueño del dato.',
  Procesos: 'Escribe criterios de salida verificables por etapa y una definición de MQL y SQL firmada por marketing y ventas.',
  Alineación: 'Acuerda un SLA de respuesta a leads con tiempos y responsables, y una junta semanal de pipeline de 30 minutos.',
  Medición: 'Conecta campaña, oportunidad e ingreso en el CRM con UTMs consistentes y calcula probabilidades por etapa con tu histórico.',
  Tecnología: 'Elimina los pasos manuales entre formularios, automatización y CRM, y asigna a alguien la responsabilidad de RevOps.',
}

const AREAS = [...new Set(Q.map((q) => q[0]))]
const band = (s: number) => (s < 35 ? 'Inicial' : s < 65 ? 'En construcción' : s < 85 ? 'Estable' : 'Avanzada')

export function MaturityApp() {
  const [ans, setAns] = useState<number[]>(() => Array(Q.length).fill(1))
  const [qi, setQi] = useState(0)
  const [done, setDone] = useState(false)
  const [gain, setGain] = useState(6)
  const [freq, setFreq] = useState(4)
  const [gate, setGate] = useState(false)
  useToolTracking('Diagnóstico RevOps', ans, done)

  const per = useMemo(
    () =>
      AREAS.map((a) => {
        const vals = Q.map((q, i) => (q[0] === a ? ans[i] : 0)).filter(Boolean)
        return { area: a, score: Math.round(((vals.reduce((s, x) => s + x, 0) / vals.length - 1) / 4) * 100) }
      }),
    [ans],
  )
  const total = Math.round(per.reduce((s, x) => s + x.score, 0) / per.length)
  const weakest = [...per].sort((a, b) => a.score - b.score).slice(0, 3)

  const level = done ? ans.reduce((s, x) => s + x, 0) / ans.length : ans[qi]
  const clean = (level - 1) / 4
  const wave = { freq: 1 + freq * 0.35, amp: 0.4 + gain * 0.07, noise: (1 - clean) * 1.6, harm: [1, (1 - clean) * 0.7, (1 - clean) * 0.5, (1 - clean) * 0.35] }

  const v = ans[qi]
  const setV = (x: number) => setAns((a) => a.map((y, i) => (i === qi ? x : y)))
  const summary = [
    `Puntuación total: ${total}/100 (${band(total)})`,
    ...per.map((p) => `${p.area}: ${p.score}/100`),
    `Respuestas: ${ans.join(', ')}`,
  ].join('\n')
  const print = useCallback(() => {
    setGate(false)
    setTimeout(() => window.print(), 150)
  }, [])

  return (
    <>
      <OscLabel title="Madurez RevOps" sub="diagnóstico · 10 preguntas" />
      <Osc
        label="Diagnóstico de madurez RevOps"
        model="OSCILADOR R1"
        sub="diagnóstico de madurez"
        leds={Q.length}
        active={done ? -1 : qi}
        screen={
          <>
            <div className={done ? 'dim' : ''}><Scope wave={wave} /></div>
            {!done ? (
              <div className="scr" aria-live="polite">
                <div className="meta"><span>{Q[qi][0]}</span><b>{String(qi + 1).padStart(2, '0')} / {Q.length}</b></div>
                <p className="q">{Q[qi][1]}</p>
                <div className="lvl">
                  <span className="n">{v}</span>
                  <span className="t">{LEVELS[v - 1][0]}<small>{LEVELS[v - 1][1]}</small></span>
                </div>
              </div>
            ) : (
              <div className="scr" aria-live="polite">
                <div className="meta"><span>Resultado</span><b>{band(total).toUpperCase()}</b></div>
                <div className="score"><span>{total}</span><em>/ 100 · madurez</em></div>
                <div className="bars">
                  {per.map((p) => (
                    <div className="bar" key={p.area}>
                      <span>{p.area}</span>
                      <span className="tr"><i style={{ width: `${Math.max(3, p.score)}%` }} /></span>
                      <span>{p.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        }
        panel={
          <>
            <div className="ctl wide">
              <Knob value={v} min={1} max={5} onChange={setV} label="Nivel de madurez" valueText={`${v}: ${LEVELS[v - 1][0]}`}
                tone="or" size="big" ticks={5} />
              <span className="cap">Nivel · gira, arrastra o usa las flechas</span>
            </div>
            <div className="ctl"><Knob value={gain} min={0} max={10} onChange={setGain} label="Amplitud de la onda" tone="bk" /><span className="cap">Amplitud</span></div>
            <div className="ctl"><Knob value={freq} min={0} max={10} onChange={setFreq} label="Frecuencia de la onda" /><span className="cap">Frecuencia</span></div>
            <div className="btnrow">
              <button type="button" className="btn" disabled={qi === 0 && !done}
                onClick={() => (done ? setDone(false) : setQi(qi - 1))}>◂ Atrás</button>
              <button type="button" className="btn or"
                onClick={() => (done ? setGate(true) : qi < Q.length - 1 ? setQi(qi + 1) : setDone(true))}>
                {done ? 'Plan en PDF ▸' : qi === Q.length - 1 ? 'Ver resultado ▸' : 'Siguiente ▸'}
              </button>
            </div>
          </>
        }
      />

      {done && (
        <div className="osc-card">
          {gate ? (
            <Gate tool="Diagnóstico de madurez RevOps" summary={summary} meta={{ slug: 'madurez-revops', score: total, finding: summary.split('\n')[0] }} onDone={print} onCancel={() => setGate(false)} />
          ) : (
            <>
              <h3>Por dónde empezar</h3>
              <p className="lead">Tus tres áreas con más margen de mejora:</p>
              <ol>
                {weakest.map((w) => (
                  <li key={w.area}><b>{w.area} ({w.score}/100).</b> {RECS[w.area]}</li>
                ))}
              </ol>
              <button type="button" className="btn or" onClick={() => setGate(true)}>Descargar el diagnóstico en PDF ▸</button>
            </>
          )}
        </div>
      )}

      <section className="te-print" aria-hidden="true">
        <span className="tag">soyroman.com · Diagnóstico de madurez RevOps</span>
        <h1>Madurez RevOps: {total}/100 · {band(total)}</h1>
        <table>
          <thead><tr><th>Área</th><th>Puntuación</th><th>Recomendación</th></tr></thead>
          <tbody>
            {per.map((p) => (<tr key={p.area}><td>{p.area}</td><td>{p.score}/100</td><td>{RECS[p.area]}</td></tr>))}
          </tbody>
        </table>
        <h3>Tus respuestas</h3>
        <ol>{Q.map((q, i) => (<li key={i}>{q[1]} — <b>{ans[i]} · {LEVELS[ans[i] - 1][0]}</b></li>))}</ol>
        <p>¿Quieres revisarlo juntos? contacto@soyroman.com · soyroman.com/consultoria</p>
      </section>
    </>
  )
}
