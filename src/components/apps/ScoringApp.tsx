'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { parseCSV, readCsvFile } from '@/lib/crmAudit'
import { fmt } from './Device'
import { AppHeader } from './Panels'
import { Gate } from './Gate'
import { ModeKeys } from './Knobs'
import {
  DEFAULT_MODEL, MIN_N, SAMPLE_LEADS, calibrate, defaultSuccess, demoTable, detectOutcome, distinctValues, scoreLead,
  type Attr, type Calibration, type Crit, type Group, type Model,
} from './scoring'
import { ShareButton, decodeState, encodeState, query } from './share'
import { useToolTracking } from './useToolTracking'

type Tab = 'build' | 'cal' | 'test'
const LEVEL = { mql: ['hot', 'MQL: pasa a ventas'], nurture: ['warm', 'Nutrir'], cold: ['cold', 'Frío'] } as const
const GROUP: Record<Group, string> = { fit: 'Perfil (quién es)', eng: 'Interés (qué hace)' }
let seq = 0
const newId = () => `c${Date.now().toString(36)}${(seq++).toString(36)}`

/** Valida un modelo que llega por la URL. */
function validModel(x: unknown): Model | null {
  const m = x as Model
  if (!m || !Array.isArray(m.crit) || typeof m.mql !== 'number' || typeof m.fitMin !== 'number') return null
  const crit = m.crit.slice(0, 40).filter((c) => c && (c.g === 'fit' || c.g === 'eng') && typeof c.p === 'number' && Number.isFinite(c.p))
    .map((c) => ({ id: String(c.id || newId()).slice(0, 20), g: c.g, n: String(c.n || '').slice(0, 80), p: Math.max(-100, Math.min(100, Math.round(c.p))) }))
  return crit.length ? { crit, mql: Math.max(1, Math.min(300, m.mql)), fitMin: Math.max(0, Math.min(200, m.fitMin)) } : null
}

export function ScoringApp() {
  const [m, setM] = useState<Model>(DEFAULT_MODEL)
  const [tab, setTab] = useState<Tab>('build')
  const [gate, setGate] = useState(false)
  // calibración
  const [table, setTable] = useState<string[][] | null>(null)
  const [source, setSource] = useState('')
  const [outcome, setOutcome] = useState(0)
  const [success, setSuccess] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [over, setOver] = useState(false)
  const [custom, setCustom] = useState<string[]>([])
  useToolTracking('Lead scoring', m, gate)

  useEffect(() => {
    const s = validModel(decodeState(query().get('s')))
    if (s) setM(s)
  }, [])

  const up = (fn: (d: Model) => void) => setM((x) => { const d = structuredClone(x); fn(d); return d })
  const setCrit = (id: string, patch: Partial<Crit>) => up((d) => { const c = d.crit.find((x) => x.id === id); if (c) Object.assign(c, patch) })

  // ───── calibración
  const load = useCallback(async (get: () => Promise<string[][]>, label: string) => {
    setBusy(true)
    setError('')
    try {
      await new Promise((r) => setTimeout(r, 30))
      const t = await get()
      if (t.length < MIN_N + 1 || !t[0]?.length) throw new Error(`El archivo necesita al menos ${MIN_N} filas con encabezados.`)
      const o = detectOutcome(t[0])
      const vals = distinctValues(t.slice(1), o).map((x) => x[0])
      setTable(t)
      setSource(label)
      setOutcome(o)
      setSuccess(new Set(defaultSuccess(vals)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pude leer el archivo.')
      setTable(null)
    } finally {
      setBusy(false)
    }
  }, [])
  const onFile = (f?: File | null) => {
    if (!f) return
    if (f.size > 40 * 1024 * 1024) return setError('El archivo pesa más de 40 MB. Exporta solo las columnas que quieras probar.')
    load(async () => parseCSV(await readCsvFile(f)), f.name)
  }
  const cal: Calibration | null = useMemo(() => (table ? calibrate(table, outcome, success) : null), [table, outcome, success])
  const outcomeValues = table ? distinctValues(table.slice(1), outcome, 30) : []
  const addAttr = (a: Attr) => up((d) => { d.crit.push({ id: newId(), g: a.group, n: `${a.col}: ${a.value}`, p: a.pts }) })
  const usable = cal ? cal.attrs.filter((a) => !a.leak && a.pts !== 0) : []

  // ───── diagnóstico
  const tested = SAMPLE_LEADS.map((l) => ({ ...l, s: scoreLead(m, l.on) }))
  const maxPossible = m.crit.filter((c) => c.p > 0).reduce((s, c) => s + c.p, 0)
  const fitMax = m.crit.filter((c) => c.g === 'fit' && c.p > 0).reduce((s, c) => s + c.p, 0)
  const dx = [
    maxPossible < m.mql ? `Nadie puede llegar al umbral: la suma de todos los puntos positivos es ${maxPossible} y el umbral es ${m.mql}.` : `Un lead necesita ${m.mql} puntos y al menos ${m.fitMin} de perfil para pasar a ventas (máximo posible: ${maxPossible}).`,
    ...(fitMax < m.fitMin ? [`El perfil mínimo (${m.fitMin}) es mayor que todo el perfil posible (${fitMax}): ningún lead pasará.`] : []),
    ...(m.crit.some((c) => c.g === 'eng' && c.p < 0) ? [] : ['No hay puntos negativos por inactividad: un lead que interactuó hace un año vale lo mismo que uno de ayer. Agrega un criterio de decaimiento.']),
    `${tested.filter((t) => t.s.level === 'mql').length} de ${tested.length} leads de ejemplo pasan a ventas con este modelo.`,
    ...(cal && cal.attrs.length ? [`La calibración con ${fmt(cal.n)} contactos sugiere ${usable.length} criterios con datos suficientes.`] : []),
  ]
  const summary = [`Modelo de lead scoring: ${m.crit.length} criterios · umbral ${m.mql} · perfil mínimo ${m.fitMin}`, ...dx]
  const print = useCallback(() => {
    setGate(false)
    setTimeout(() => window.print(), 150)
  }, [])

  const group = (g: Group) => (
    <div>
      <h3 className="pl-h" style={{ marginTop: 0 }}>{GROUP[g]}</h3>
      <div className="pl-tbl">
        <table className="pl-t">
          <thead><tr><th>Criterio</th><th className="n">Puntos</th><th /></tr></thead>
          <tbody>
            {m.crit.filter((c) => c.g === g).map((c) => (
              <tr key={c.id}>
                <td><input value={c.n} maxLength={80} aria-label="Criterio" style={{ width: '100%' }} onChange={(e) => setCrit(c.id, { n: e.target.value })} /></td>
                <td><input type="number" value={c.p} min={-100} max={100} aria-label={`Puntos de ${c.n}`} style={{ width: 70 }} onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n)) setCrit(c.id, { p: Math.max(-100, Math.min(100, Math.round(n))) }) }} /></td>
                <td><button type="button" className="pl-x" aria-label={`Quitar ${c.n}`} onClick={() => up((d) => { d.crit = d.crit.filter((x) => x.id !== c.id) })}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pl-row" style={{ marginTop: 8 }}>
        <button type="button" className="btn" onClick={() => up((d) => { if (d.crit.length < 40) d.crit.push({ id: newId(), g, n: 'Nuevo criterio', p: 5 }) })}>+ Criterio</button>
      </div>
    </div>
  )

  return (
    <>
      <AppHeader
        top="SCORE"
        bottom="MQL"
        cable={cal ? 'CALIBRADO' : 'DATOS DE EJEMPLO'}
        message={gate ? 'Ingresa tu correo para recibir el modelo' : `${m.crit.length} criterios · umbral ${m.mql} · ${tested.filter((t) => t.s.level === 'mql').length} de ${tested.length} leads de ejemplo pasan a ventas`}
      />
      <div className="x-dev">
        <div className="x-brand"><span><b>SCORE·01</b> ¿qué lead le pasas a ventas?</span><span>perfil + interés · umbral de MQL</span></div>
        <ModeKeys label="Pasos" value={tab} onChange={setTab} options={[['build', '01 Armar el modelo'], ['cal', '02 Calibrar con tu CSV'], ['test', '03 Probar con leads']]} />

        {tab === 'build' && (
          <div className="cp-wrap">
            <div>
              <div className="cp-knobs">
                <label className="cp-k"><span className="cp-l">Umbral de MQL<b>{m.mql} pts</b></span><input type="range" min={10} max={200} value={m.mql} onChange={(e) => up((d) => { d.mql = +e.target.value })} aria-label="Umbral de MQL" /></label>
                <label className="cp-k"><span className="cp-l">Perfil mínimo para MQL<b>{m.fitMin} pts</b></span><input type="range" min={0} max={100} value={m.fitMin} onChange={(e) => up((d) => { d.fitMin = +e.target.value })} aria-label="Perfil mínimo" /><small>evita que alguien muy activo pero fuera de tu cliente ideal llegue a ventas</small></label>
              </div>
              <p className="s-help">Dos ejes, como en HubSpot: <b>perfil</b> (quién es) e <b>interés</b> (qué hace). Un lead pasa a ventas cuando suma el umbral <i>y</i> tiene el perfil mínimo. Los puntos negativos restan.</p>
            </div>
            <div className="sc-two">{group('fit')}{group('eng')}</div>
          </div>
        )}

        {tab === 'cal' && (
          <>
            <label className={`ca-drop${over ? ' over' : ''}`} onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); onFile(e.dataTransfer.files?.[0]) }}>
              <input type="file" accept=".csv,text/csv" hidden onChange={(e) => onFile(e.target.files?.[0])} />
              <span className="ca-ico" aria-hidden="true">⇪</span>
              <span className="ca-txt">
                Arrastra la exportación CSV de tus contactos con una columna que diga si se volvieron cliente (por ejemplo, la etapa del ciclo de vida).
                <small>Por cada atributo calculo cuánto más convierte que el promedio y te sugiero puntos: el doble = +10, la mitad = −10</small>
              </span>
            </label>
            <div className="ca-row">
              <span className="ca-priv"><i aria-hidden="true" />Se procesa en tu navegador: el archivo no se sube a ningún servidor</span>
              <button type="button" className="btn" disabled={busy} onClick={() => load(async () => demoTable(), 'datos de ejemplo')}>Usar datos de ejemplo</button>
            </div>
            {error && <p className="s-err" role="alert">{error}</p>}
            {table && (
              <div className="sc-cfg">
                <label>Columna que dice si se volvió cliente
                  <select value={outcome} onChange={(e) => { const o = +e.target.value; setOutcome(o); setSuccess(new Set(defaultSuccess(distinctValues(table.slice(1), o).map((x) => x[0])))) }}>
                    {table[0].map((h, i) => <option key={i} value={i}>{h || `Columna ${i + 1}`}</option>)}
                  </select>
                </label>
                <fieldset>
                  <legend>Valores que cuentan como éxito</legend>
                  {outcomeValues.map(([val, c]) => (
                    <label key={val} className="sc-chk"><input type="checkbox" checked={success.has(val)} onChange={(e) => { const s = new Set(success); if (e.target.checked) s.add(val); else s.delete(val); setSuccess(s) }} />{val} <small>({fmt(c)})</small></label>
                  ))}
                </fieldset>
              </div>
            )}
            {cal && (
              cal.wins === 0 || cal.wins === cal.n ? (
                <p className="s-err" role="alert">Elige qué valores cuentan como éxito: hoy {cal.wins === 0 ? 'ningún contacto' : 'todos los contactos'} cuentan.</p>
              ) : (
                <>
                  <p className="ca-src" style={{ color: 'var(--grey)' }}>Fuente: {source} · {fmt(cal.n)} contactos · {fmt(cal.wins)} éxitos · conversión promedio {fmt(cal.base * 100, 1)}%{cal.skipped.length ? ` · columnas omitidas (muy vacías o con demasiados valores distintos): ${cal.skipped.slice(0, 6).join(', ')}${cal.skipped.length > 6 ? '…' : ''}` : ''}</p>
                  <div className="pl-tbl">
                    <table className="pl-t">
                      <thead><tr><th>Atributo</th><th className="n">Contactos</th><th className="n">Éxitos</th><th className="n">Conversión</th><th className="n">Lift</th><th className="n">Puntos sugeridos</th><th /></tr></thead>
                      <tbody>
                        {cal.attrs.map((a) => (
                          <tr key={`${a.col}|${a.value}`}>
                            <td>{a.col}: <b>{a.value}</b>{a.leak && <small className="sc-leak"> · posible fuga: este dato suele llenarse después de la venta</small>}</td>
                            <td className="n">{fmt(a.n)}</td>
                            <td className="n">{fmt(a.wins)}</td>
                            <td className="n">{fmt(a.rate * 100, 1)}%</td>
                            <td className={`n ${a.lift >= 1.5 ? 'ok' : a.lift < 0.7 ? 'bad' : ''}`}>{fmt(a.lift, 1)}x</td>
                            <td className="n"><b>{a.pts > 0 ? '+' : ''}{a.pts}</b></td>
                            <td>{!a.leak && a.pts !== 0 && <button type="button" className="sc-add" onClick={() => addAttr(a)}>+ al modelo</button>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="pl-row">
                    <button type="button" className="btn or" disabled={!usable.length} onClick={() => { up((d) => { usable.slice(0, 8).forEach((a) => d.crit.push({ id: newId(), g: a.group, n: `${a.col}: ${a.value}`, p: a.pts })) }); setTab('build') }}>Agregar los {Math.min(8, usable.length)} más fuertes al modelo ▸</button>
                    <span className="pl-muted">valores con menos de {MIN_N} contactos no se sugieren · lift = conversión del grupo ÷ promedio</span>
                  </div>
                </>
              )
            )}
          </>
        )}

        {tab === 'test' && (
          <>
            <div className="pl-tbl">
              <table className="pl-t">
                <thead><tr><th>Lead de ejemplo</th><th className="n">Perfil</th><th className="n">Interés</th><th className="n">Total</th><th>Resultado</th></tr></thead>
                <tbody>
                  {tested.map((l) => (
                    <tr key={l.n}>
                      <td style={{ whiteSpace: 'normal' }}>{l.n}<small className="sc-sub">{l.on.map((id) => m.crit.find((c) => c.id === id)?.n).filter(Boolean).join(' · ') || 'sin criterios del modelo'}</small></td>
                      <td className="n">{l.s.f}</td><td className="n">{l.s.e}</td><td className="n"><b>{l.s.t}</b></td>
                      <td><span className={`sc-tag ${LEVEL[l.s.level][0]}`}>{LEVEL[l.s.level][1]}</span>{l.s.blockedByFit && <small className="sc-sub">suma el umbral, pero no tiene el perfil mínimo</small>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="pl-h">Arma tu propio lead</h3>
            <div className="sc-two">
              {(['fit', 'eng'] as Group[]).map((g) => (
                <div key={g} className="sc-pick">
                  {m.crit.filter((c) => c.g === g).map((c) => (
                    <label key={c.id} className="sc-chk"><input type="checkbox" checked={custom.includes(c.id)} onChange={(e) => setCustom((x) => (e.target.checked ? [...x, c.id] : x.filter((y) => y !== c.id)))} />{c.n} <small>({c.p > 0 ? '+' : ''}{c.p})</small></label>
                  ))}
                </div>
              ))}
            </div>
            {(() => {
              const s = scoreLead(m, custom)
              return <p className="sc-res">Perfil {s.f} · interés {s.e} · total <b>{s.t}</b> → <span className={`sc-tag ${LEVEL[s.level][0]}`}>{LEVEL[s.level][1]}</span>{s.blockedByFit ? ' (le falta perfil)' : ''}</p>
            })()}
          </>
        )}

        <div className="x-dx">
          <h3>Diagnóstico · lo que significa</h3>
          <ol>{dx.map((d) => <li key={d}>{d}</li>)}</ol>
        </div>
        {gate ? (
          <div className="s-gate"><Gate tool="Lead scoring" intro="Te envío el resumen a tu correo y descargas el modelo en PDF con los pasos para montarlo en HubSpot." summary={summary.join('\n')} meta={{ slug: 'lead-scoring', finding: summary[0], items: dx.slice(0, 3).map((t) => ({ t })) }} onDone={print} onCancel={() => setGate(false)} /></div>
        ) : (
          <div className="s-keys">
            <button type="button" className="btn or" onClick={() => setGate(true)}>Modelo en PDF ▸</button>
            <ShareButton tool="Lead scoring" params={() => ({ s: encodeState(m) })} />
            <button type="button" className="btn" onClick={() => setM(DEFAULT_MODEL)}>Volver al ejemplo</button>
          </div>
        )}
      </div>

      <section className="te-print" aria-hidden="true">
        <span className="tag">soyroman.com · Lead scoring</span>
        <h1>Modelo de lead scoring · umbral {m.mql} puntos</h1>
        <p>Pasa a ventas (MQL) cuando suma {m.mql} puntos y al menos {m.fitMin} de perfil.</p>
        {(['fit', 'eng'] as Group[]).map((g) => (
          <table key={g}>
            <thead><tr><th>{GROUP[g]}</th><th>Puntos</th></tr></thead>
            <tbody>{m.crit.filter((c) => c.g === g).map((c) => <tr key={c.id}><td>{c.n}</td><td>{c.p > 0 ? '+' : ''}{c.p}</td></tr>)}</tbody>
          </table>
        ))}
        <h3>Cómo montarlo en HubSpot</h3>
        <ol>
          <li>Crea una puntuación de perfil y otra de interés con la herramienta de lead scoring (Marketing Hub Professional o superior), con los criterios y puntos de esta tabla.</li>
          <li>Para el interés, pon una fecha de vencimiento o decaimiento: lo que pasó hace meses no debe pesar igual que lo de esta semana.</li>
          <li>Haz un flujo de trabajo que cambie la etapa del ciclo de vida a MQL cuando el total llegue a {m.mql} y el perfil a {m.fitMin}, y que avise al vendedor.</li>
          <li>Cada trimestre revisa cuántos MQL se volvieron oportunidad y ajusta los puntos con tus datos.</li>
        </ol>
        <h3>Diagnóstico</h3>
        <ol>{dx.map((d) => <li key={d}>{d}</li>)}</ol>
        <p>¿Quieres revisarlo juntos? contacto@soyroman.com · soyroman.com/consultoria</p>
      </section>
    </>
  )
}
