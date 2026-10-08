'use client'

import Link from 'next/link'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { fmt } from './Device'
import { AppHeader } from './Panels'
import { Gate } from './Gate'
import { useToolTracking } from './useToolTracking'
import {
  ACTUAL_ROWS, DISTS, EXAMPLE, LEVELS, MONTHS, QN, RATE_FIELDS, STAGES, STATUS, STRATEGY_FIELDS, TYPES,
  blankAct, blankUnit, budget, coverage, funnel, isPlan, monthly, monthlyTargets, monthsOfQ, pipeAct, plannedLeads, qOf, qSum, scenarios, sumRows,
  type Act, type ActualKey, type Plan, type Rates, type StageKey, type TypeKey,
} from './planner'

const KEY = 'sr-planeador-v1'
const OK_KEY = 'sr-planeador-ok'
const TABS = [
  ['meta', 'Meta comercial'], ['est', 'Estrategia'], ['act', 'Actividades'], ['cal', 'Calendario'],
  ['cob', 'Cobertura'], ['res', 'Presupuesto'], ['kpi', 'KPIs y riesgos'], ['seg', 'Seguimiento'],
] as const
type Tab = (typeof TABS)[number][0]
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)
const store = {
  get: (k: string) => { try { return window.localStorage.getItem(k) } catch { return null } },
  set: (k: string, v: string) => { try { window.localStorage.setItem(k, v) } catch { /* sin almacenamiento */ } },
}

/** Campo numérico que deja escribir libremente y guarda solo valores válidos. */
function Num({ v, on, w = 110, max, label }: { v: number | null; on: (n: number | null) => void; w?: number; max?: number; label: string }) {
  const [txt, setTxt] = useState<string | null>(null)
  return (
    <input
      type="number"
      inputMode="decimal"
      min={0}
      max={max}
      aria-label={label}
      style={{ width: w }}
      value={txt ?? (v == null ? '' : String(v))}
      onFocus={() => setTxt(v == null ? '' : String(v))}
      onBlur={() => setTxt(null)}
      onChange={(e) => {
        const t = e.target.value
        setTxt(t)
        if (t.trim() === '') return on(null)
        const x = Number(t)
        if (Number.isFinite(x) && x >= 0) on(max != null ? Math.min(max, x) : x)
      }}
    />
  )
}

export function PlannerApp() {
  const [p, setP] = useState<Plan>(EXAMPLE)
  const [tab, setTab] = useState<Tab>('meta')
  const [unitView, setUnitView] = useState('__all')
  const [gate, setGate] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState<'ejemplo' | 'guardado' | 'sin-guardar'>('ejemplo')
  const loaded = useRef(false)
  useToolTracking('Planeador de marketing', p, gate)

  // Cargar y guardar en este navegador
  useEffect(() => {
    const raw = store.get(KEY)
    try {
      const x = raw ? JSON.parse(raw) : null
      if (isPlan(x)) {
        setP(x)
        setSaved('guardado')
      } else {
        const d = new Date()
        setP((s) => ({ ...s, year: d.getFullYear() + (d.getMonth() >= 8 ? 1 : 0) }))
      }
    } catch { /* plan dañado: se queda el ejemplo */ }
    loaded.current = true
  }, [])
  useEffect(() => {
    if (!loaded.current) return
    const t = setTimeout(() => { store.set(KEY, JSON.stringify(p)); setSaved('guardado') }, 400)
    return () => clearTimeout(t)
  }, [p])

  const up = useCallback((fn: (d: Plan) => void) => setP((s) => { const d = structuredClone(s); fn(d); return d }), [])
  const money = useCallback((x: number) => `${p.cur === 'USD' ? 'US$' : '$'}${fmt(Math.round(x))}`, [p.cur])
  const num = (x: number) => fmt(Math.round(x))

  const cov = useMemo(() => coverage(p), [p])
  const bud = useMemo(() => budget(p), [p])
  const sce = useMemo(() => scenarios(p), [p])
  const covYear = sum(cov.total.need) ? sum(cov.total.planM) / sum(cov.total.need) : 0
  const quota = sum(p.units.map((u) => sum(u.quota)))

  // ───── Excel
  const download = useCallback(async () => {
    setBusy(true)
    try {
      const [mod, { buildWorkbook }] = await Promise.all([import('exceljs'), import('./plannerXlsx')])
      const ExcelJS = ('default' in mod ? mod.default : mod) as typeof import('exceljs')
      const wb = buildWorkbook(ExcelJS, p)
      const buf = await wb.xlsx.writeBuffer()
      const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${(p.name || 'Plan de marketing').replace(/[^\p{L}\p{N} _-]/gu, '').trim() || 'Plan'} ${p.year}.xlsx`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } finally {
      setBusy(false)
    }
  }, [p])
  const onGateDone = useCallback(() => {
    setGate(false)
    store.set(OK_KEY, '1')
    void download()
  }, [download])
  const ask = () => (store.get(OK_KEY) ? void download() : setGate(true))

  const summary = [
    `Plan ${p.year} · ${p.units.length} unidades · cuota ${money(quota)}`,
    `Leads necesarios en el año ${num(sum(cov.total.need))} · planeados ${num(sum(cov.total.planM))} · cobertura ${fmt(covYear * 100)}%`,
    `Presupuesto planeado ${money(bud.t.plan)} (${fmt((bud.t.plan / Math.max(quota, 1)) * 100, 1)}% de la cuota) · ${p.acts.length} actividades`,
  ]

  // ───── vistas
  const unitNames = p.units.map((u) => u.name)
  const setRate = (i: number, k: keyof Rates, x: number | null) => up((d) => { d.units[i].r[k] = x ?? 0 })
  const renameUnit = (i: number, name: string) => up((d) => {
    const old = d.units[i].name
    d.units[i].name = name
    d.acts.forEach((a) => { if (a.u === old) a.u = name })
  })

  const meta = () => {
    const us = unitView === '__all' ? p.units : p.units.filter((u) => u.name === unitView)
    const F = sumRows(us.map(funnel))
    const T = F.reduce((z, x) => ({ q: z.q + x.q, mq: z.mq + x.mq, pipe: z.pipe + x.pipe, opp: z.opp + x.opp, sql: z.sql + x.sql, mql: z.mql + x.mql, leads: z.leads + x.leads }))
    const cy = Math.max(...us.map((u) => u.r.cy), 0)
    const mlab = (i: number) => (i < 0 ? `${MONTHS[(i + 12) % 12]}*` : MONTHS[i])
    const genLab = (q: number) => { const a = q * 3 - cy; return `${mlab(a)}–${mlab(a + 2)}` }
    const R = (label: string, k: keyof (typeof F)[number], f: (x: number) => string, cls = '') => (
      <tr className={cls}><td>{label}</td>{F.map((x, i) => <td key={i}>{f(x[k])}</td>)}<td>{f(T[k])}</td></tr>
    )
    const lowCov = p.units.filter((u) => u.r.wr > 34)
    return (
      <>
        <h3 className="pl-h">Supuestos del embudo por unidad (de tu CRM)</h3>
        <div className="pl-tbl">
          <table className="pl-t">
            <thead><tr><th>Unidad</th>{RATE_FIELDS.map((f) => <th key={f.id}>{f.label}{f.pct ? ' %' : ''}</th>)}<th className="n">Cobertura</th><th /></tr></thead>
            <tbody>
              {p.units.map((u, i) => (
                <tr key={i}>
                  <td><input value={u.name} maxLength={40} aria-label="Nombre de la unidad" onChange={(e) => renameUnit(i, e.target.value)} style={{ width: 130 }} /></td>
                  {RATE_FIELDS.map((f) => <td key={f.id}><Num label={`${f.label} · ${u.name}`} v={u.r[f.id]} max={f.max} w={f.id === 'tk' ? 110 : 70} on={(x) => setRate(i, f.id, x)} /></td>)}
                  <td className="n">{u.r.wr ? `${fmt(100 / u.r.wr, 1)}x` : '—'}</td>
                  <td>{p.units.length > 1 && <button type="button" className="pl-x" aria-label={`Quitar ${u.name}`} onClick={() => up((d) => { const nm = d.units[i].name; d.units.splice(i, 1); d.acts = d.acts.filter((a) => a.u !== nm) })}>✕</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pl-row">
          <button type="button" className="btn" onClick={() => up((d) => { if (d.units.length < 8) d.units.push(blankUnit(`Unidad ${d.units.length + 1}`, d.units[0]?.r)) })}>+ Agregar unidad</button>
          <span className="pl-muted">hasta 8 · quitar una unidad borra sus actividades</span>
        </div>

        <h3 className="pl-h">Cuota de venta por trimestre</h3>
        <div className="pl-tbl">
          <table className="pl-t">
            <thead><tr><th>Unidad</th>{QN.map((q) => <th key={q}>{q}</th>)}<th className="n">Total</th><th>Pipeline abierto que cierra en Q1</th><th>Q1 del año siguiente</th></tr></thead>
            <tbody>
              {p.units.map((u, i) => (
                <tr key={i}>
                  <td>{u.name}</td>
                  {u.quota.map((x, q) => <td key={q}><Num label={`Cuota ${QN[q]} · ${u.name}`} v={x} on={(n) => up((d) => { d.units[i].quota[q] = n ?? 0 })} /></td>)}
                  <td className="n">{money(sum(u.quota))}</td>
                  <td><Num label={`Pipeline abierto · ${u.name}`} v={u.open} on={(n) => up((d) => { d.units[i].open = n ?? 0 })} /></td>
                  <td><Num label={`Cuota Q1 año siguiente · ${u.name}`} v={u.next} on={(n) => up((d) => { d.units[i].next = n ?? 0 })} /></td>
                </tr>
              ))}
              <tr className="sub"><td>Total</td>{QN.map((_, q) => <td key={q} className="n">{money(sum(p.units.map((u) => u.quota[q])))}</td>)}<td className="n">{money(quota)}</td><td className="n">{money(sum(p.units.map((u) => u.open)))}</td><td className="n">{money(sum(p.units.map((u) => u.next)))}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="pl-row">
          <span className="pl-muted">Ver embudo de</span>
          <select value={unitView} onChange={(e) => setUnitView(e.target.value)} aria-label="Unidad a mostrar">
            <option value="__all">Todas las unidades</option>
            {unitNames.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div className="pl-lcd">
          <table className="pl-lt">
            <thead><tr><th>Lo que marketing tiene que producir · por trimestre de cierre</th>{QN.map((q) => <th key={q}>{q}</th>)}<th>Año</th></tr></thead>
            <tbody>
              {R('Cuota de venta', 'q', money)}
              {R('Venta que origina marketing', 'mq', money, 'or')}
              {R('Pipeline a generar', 'pipe', money, 'hl')}
              <tr><td>Pipeline a generar por mes</td>{F.map((x, i) => <td key={i}>{money(x.pipe / 3)}</td>)}<td>{money(T.pipe / 12)}</td></tr>
              {R('Oportunidades', 'opp', num)}
              {R('SQL', 'sql', num)}
              {R('MQL', 'mql', num)}
              {R('Leads', 'leads', num, 'hl')}
              <tr><td>Leads por mes</td>{F.map((x, i) => <td key={i}>{num(x.leads / 3)}</td>)}<td>{num(T.leads / 12)}</td></tr>
              <tr className="or"><td>Hay que generarlos en{us.length > 1 ? ' (ciclo más largo)' : ''}</td>{F.map((_, q) => <td key={q}>{genLab(q)}</td>)}<td /></tr>
            </tbody>
          </table>
          <div className="pl-lg"><span>* = año anterior al plan</span><span>el pipeline abierto se descuenta de Q1</span></div>
        </div>
        {lowCov.length > 0 && (
          <div className="pl-alert y">Con tasas de cierre arriba de 34% ({lowCov.map((u) => u.name).join(', ')}) la cobertura implícita queda por debajo de 3x, la referencia común. Si tu tasa sale de pocos negocios, usa una más conservadora.</div>
        )}
        {cy > 0 && (
          <div className="pl-alert">Con ciclos de hasta {cy} meses, <b>la cuota de Q1 depende de leads que se generan en el año anterior ({num(cov.total.pre)} leads).</b> Si no se generaron, baja esa cuota o suma acciones de cierre sobre el pipeline abierto.</div>
        )}

        <h3 className="pl-h">Escenarios: ¿y si la conversión de lead a venta sale distinta?</h3>
        <div className="pl-tbl">
          <table className="pl-t">
            <thead><tr><th>Escenario</th><th>Conversión vs base</th><th className="n">Leads a generar en el año</th><th className="n">Cobertura del plan</th><th className="n">Venta esperada de lo planeado</th><th className="n">% de la meta de marketing</th></tr></thead>
            <tbody>
              {sce.map((s) => (
                <tr key={s.k}>
                  <td>{s.label}</td>
                  <td>{s.k === 'base' ? '100%' : <><Num label={`Factor ${s.label}`} v={s.f} w={70} max={300} on={(x) => up((d) => { d.scen[s.k as 'low' | 'high'] = x ?? 100 })} /> %</>}</td>
                  <td className="n">{num(s.needed)}</td>
                  <td className={`n ${s.cover < 0.8 ? 'bad' : s.cover < 1 ? 'warn' : 'ok'}`}>{fmt(s.cover * 100)}%</td>
                  <td className="n">{money(s.sales)}</td>
                  <td className={`n ${s.ofTarget < 0.8 ? 'bad' : s.ofTarget < 1 ? 'warn' : 'ok'}`}>{fmt(s.ofTarget * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )
  }

  const est = () => {
    const Field = ({ id }: { id: (typeof STRATEGY_FIELDS)[number]['id'] }) => {
      const f = STRATEGY_FIELDS.find((x) => x.id === id)!
      return (
        <label className="pl-fld">
          <span>{f.label}</span>
          <textarea value={p.str[id]} placeholder={f.ph} maxLength={2000} onChange={(e) => up((d) => { d.str[id] = e.target.value })} />
        </label>
      )
    }
    return (
      <>
        {Field({ id: 'exec' })}
        <h3 className="pl-h">Análisis de situación (FODA)</h3>
        <div className="pl-swot">{Field({ id: 'f' })}{Field({ id: 'd' })}{Field({ id: 'o' })}{Field({ id: 'a' })}</div>
        <h3 className="pl-h">Mercado y mensaje</h3>
        <div className="pl-two">{Field({ id: 'icp' })}{Field({ id: 'vp' })}{Field({ id: 'comp' })}{Field({ id: 'sup' })}</div>
      </>
    )
  }

  const setAct = (i: number, patch: Partial<Act>) => up((d) => {
    Object.assign(d.acts[i], patch)
    if (d.acts[i].e < d.acts[i].s) d.acts[i].e = d.acts[i].s
  })
  const act = () => (
    <>
      <div className="pl-tbl">
        <table className="pl-t">
          <thead><tr><th>Unidad</th><th>Actividad</th><th>Tipo</th><th>Etapa del embudo</th><th>Q</th><th>Inicio</th><th>Fin</th><th>Responsable</th><th>Presupuesto</th><th>Gasto real</th><th>Distribución</th><th>Meta leads</th><th className="n">Pipeline esperado</th><th>Estado</th><th /></tr></thead>
          <tbody>
            {p.acts.map((a, i) => {
              const q = qOf(a)
              const qs = ['Q1', 'Q2', 'Q3', 'Q4', 'Anual']
              return (
                <tr key={i}>
                  <td><select value={a.u} aria-label="Unidad" onChange={(e) => setAct(i, { u: e.target.value })}>{unitNames.map((u) => <option key={u}>{u}</option>)}</select></td>
                  <td><input value={a.n} maxLength={80} aria-label="Actividad" onChange={(e) => setAct(i, { n: e.target.value })} style={{ minWidth: 200 }} /></td>
                  <td><select value={a.t} aria-label="Tipo" onChange={(e) => setAct(i, { t: e.target.value as TypeKey })}>{Object.entries(TYPES).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select></td>
                  <td><select value={a.g} aria-label="Etapa del embudo" onChange={(e) => setAct(i, { g: e.target.value as StageKey })}>{Object.entries(STAGES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></td>
                  <td><select value={q} aria-label="Trimestre" style={{ width: 82 }} onChange={(e) => { const m = monthsOfQ(e.target.value); if (m) setAct(i, { s: m[0], e: m[1] }) }}>{(qs.includes(q) ? qs : [...qs, q]).map((x) => <option key={x}>{x}</option>)}</select></td>
                  <td><select value={a.s} aria-label="Mes de inicio" onChange={(e) => setAct(i, { s: +e.target.value })}>{MONTHS.map((m, j) => <option key={m} value={j}>{m}</option>)}</select></td>
                  <td><select value={a.e} aria-label="Mes de fin" onChange={(e) => setAct(i, { e: +e.target.value })}>{MONTHS.map((m, j) => <option key={m} value={j}>{m}</option>)}</select></td>
                  <td><input value={a.o} maxLength={40} aria-label="Responsable" onChange={(e) => setAct(i, { o: e.target.value })} style={{ width: 90 }} /></td>
                  <td><Num label="Presupuesto" v={a.b} on={(x) => setAct(i, { b: x ?? 0 })} /></td>
                  <td><Num label="Gasto real" v={a.real || null} on={(x) => setAct(i, { real: x ?? 0 })} /></td>
                  <td><select value={a.d} aria-label="Distribución del gasto" onChange={(e) => setAct(i, { d: e.target.value as Act['d'] })}>{Object.entries(DISTS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></td>
                  <td><Num label="Meta de leads" v={a.l} w={70} on={(x) => setAct(i, { l: x ?? 0 })} /></td>
                  <td className="n pl-ro">{a.l ? money(pipeAct(p, a)) : '—'}</td>
                  <td><select value={a.st} aria-label="Estado" onChange={(e) => setAct(i, { st: e.target.value as Act['st'] })}>{STATUS.map((s) => <option key={s}>{s}</option>)}</select></td>
                  <td><button type="button" className="pl-x" aria-label={`Quitar ${a.n}`} onClick={() => up((d) => { d.acts.splice(i, 1) })}>✕</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="pl-row">
        <button type="button" className="btn" onClick={() => up((d) => { if (d.acts.length < 200) d.acts.push(blankAct(d.units[0].name)) })}>+ Agregar actividad</button>
        <span className="pl-muted">{p.acts.length} actividades · elegir un Q ajusta inicio y fin · pipeline esperado = leads × tasas de su unidad × ticket</span>
      </div>
    </>
  )

  const cal = () => {
    const tot = Array<number>(12).fill(0)
    const lt = plannedLeads(p)
    return (
      <div className="pl-lcd" style={{ marginTop: 0 }}>
        <div className="pl-g">
          <div />{QN.map((q) => <div key={q} className="qh">{q}</div>)}<div />
          <div className="h" />{MONTHS.map((m) => <div key={m} className="h">{m}</div>)}<div className="h">Total</div>
          {p.acts.map((a, i) => {
            const m = monthly(a)
            m.forEach((x, j) => (tot[j] += x))
            return (
              <React.Fragment key={i}>
                <div className="lab" title={a.n}><span className="pl-dot" style={{ background: TYPES[a.t][1] }} />{a.n}</div>
                {m.map((x, j) => <div key={j} className="c" style={j >= a.s && j <= a.e ? { background: TYPES[a.t][1] } : undefined}>{x ? `${Math.round(x / 1000)}k` : ''}</div>)}
                <div className="tot">{money(a.b)}</div>
              </React.Fragment>
            )
          })}
          <div className="lab sum">Gasto por mes</div>{tot.map((x, j) => <div key={j} className="tot sum" style={{ textAlign: 'center' }}>{Math.round(x / 1000)}k</div>)}<div className="tot sum">{money(sum(tot))}</div>
          <div className="lab dim">Leads planeados</div>{lt.map((x, j) => <div key={j} className="tot dim" style={{ textAlign: 'center' }}>{num(x)}</div>)}<div className="tot dim">{num(sum(lt))}</div>
        </div>
        <div className="pl-lg">{Object.values(TYPES).map(([l, c]) => <span key={l}><span className="pl-dot" style={{ background: c }} />{l}</span>)}</div>
      </div>
    )
  }

  const cob = () => {
    const pctCell = (pl: number, nd: number) => (nd ? <td className={`n ${pl / nd < 0.8 ? 'bad' : pl / nd < 1 ? 'warn' : 'ok'}`}>{fmt((pl / nd) * 100)}%</td> : <td className="n">—</td>)
    const rows = [...cov.units, cov.total]
    const cyMax = Math.max(...p.units.map((u) => u.r.cy), 0)
    const off = 12 - cyMax
    const nd = cov.total.needM.slice(off)
    const pl = [...Array<number>(12 - off).fill(0), ...cov.total.planM]
    const mx = Math.max(...nd, ...pl, 1)
    const leadToPipe = (q: number) => sum(p.units.map((u) => cov.units.find((c) => c.name === u.name)!.need[q] * (u.r.lm / 100) * (u.r.ms / 100) * (u.r.so / 100) * u.r.tk)) / Math.max(cov.total.need[q], 1)
    const gaps = [0, 1, 2, 3].map((q) => ({ q, gap: cov.total.need[q] - cov.total.plan[q], r: cov.total.need[q] ? cov.total.plan[q] / cov.total.need[q] : 1 })).filter((x) => x.r < 0.8)
    return (
      <>
        <div className="pl-tbl">
          <table className="pl-t">
            <thead><tr><th>Unidad</th><th>Por trimestre en que se generan</th><th className="n">Año anterior</th>{QN.map((q) => <th key={q} className="n">{q}</th>)}<th className="n">Año</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const sub = r === cov.total ? 'sub' : ''
                return (
                  <React.Fragment key={r.name}>
                    <tr className={sub}><td rowSpan={3}>{r.name}</td><td>Leads necesarios</td><td className="n">{num(r.pre)}</td>{r.need.map((x, i) => <td key={i} className="n">{num(x)}</td>)}<td className="n">{num(sum(r.need))}</td></tr>
                    <tr className={sub}><td>Leads planeados</td><td className="n">—</td>{r.plan.map((x, i) => <td key={i} className="n">{num(x)}</td>)}<td className="n">{num(sum(r.plan))}</td></tr>
                    <tr className={sub}><td>Cobertura</td><td className="n">—</td>{r.plan.map((x, i) => <React.Fragment key={i}>{pctCell(x, r.need[i])}</React.Fragment>)}{pctCell(sum(r.plan), sum(r.need))}</tr>
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="pl-lcd">
          <div className="pl-bars" style={{ gridTemplateColumns: `repeat(${nd.length},minmax(0,1fr))` }} role="img" aria-label="Leads necesarios contra planeados por mes">
            {nd.map((x, i) => (
              <div key={i}>
                <div className="pair">
                  <i className="nd" style={{ height: `${(x / mx) * 100}%` }} title={`necesarios ${num(x)}`} />
                  <i className={`pl ${pl[i] >= x ? 'okb' : ''}`} style={{ height: `${(pl[i] / mx) * 100}%` }} title={`planeados ${num(pl[i])}`} />
                </div>
                {off + i < 12 ? `${MONTHS[off + i]}*` : MONTHS[off + i - 12]}
              </div>
            ))}
          </div>
          <div className="pl-lg"><span className="c-nd">■ leads necesarios</span><span className="c-pl">■ planeados (faltan)</span><span className="c-ok">■ planeados (cubren)</span><span>* año anterior</span></div>
        </div>
        {gaps.map((g) => (
          <div key={g.q} className="pl-alert"><b>{QN[g.q]}: faltan {num(g.gap)} leads</b> (≈ {money(g.gap * leadToPipe(g.q))} de pipeline). Cobertura de {fmt(g.r * 100)}%. Sube la meta de las actividades de ese trimestre, agrega una nueva o revisa si la cuota de ese periodo es alcanzable.</div>
        ))}
        {cov.total.pre > 0 && <div className="pl-alert y"><b>{num(cov.total.pre)} leads tenían que generarse el año anterior</b> para cubrir el arranque del año. Revisa cuántos hay hoy en el CRM.</div>}
        {!gaps.length && <div className="pl-alert g"><b>Todos los trimestres llegan al 80% o más de cobertura.</b></div>}
      </>
    )
  }

  const res = () => {
    const byType = (Object.keys(TYPES) as TypeKey[]).map((k) => [k, sum(p.acts.filter((a) => a.t === k).map((a) => a.b))] as const).filter((x) => x[1])
    const mx = Math.max(...byType.map((x) => x[1]), 1)
    const peak = bud.months.indexOf(Math.max(...bud.months))
    const t = bud.t
    return (
      <>
        <div className="pl-lcd" style={{ marginTop: 0 }}>
          <div className="pl-kpis">
            <div className="pl-kpi"><b>{money(t.assigned)}</b><span>presupuesto asignado</span></div>
            <div className="pl-kpi"><b>{money(t.plan)}</b><span>planeado</span></div>
            <div className={`pl-kpi ${t.free < 0 ? 'bad' : t.free / Math.max(t.assigned, 1) < 0.05 ? 'warn' : 'ok'}`}><b>{money(t.free)}</b><span>libre ({fmt((t.free / Math.max(t.assigned, 1)) * 100, 1)}%)</span></div>
            <div className="pl-kpi"><b>{money(t.real)}</b><span>gasto real ({fmt((t.real / Math.max(t.plan, 1)) * 100, 1)}% del planeado)</span></div>
            <div className="pl-kpi"><b>{fmt((t.plan / Math.max(quota, 1)) * 100, 1)}%</b><span>presupuesto vs cuota de venta</span></div>
            <div className={`pl-kpi ${bud.pipe / Math.max(t.plan, 1) < 3 ? 'warn' : 'ok'}`}><b>{fmt(bud.pipe / Math.max(t.plan, 1), 1)}x</b><span>pipeline esperado por peso</span></div>
            <div className="pl-kpi"><b>{bud.opps ? money(t.plan / bud.opps) : '—'}</b><span>costo por oportunidad</span></div>
          </div>
          <table className="pl-lt" style={{ marginBottom: 12 }}>
            <thead><tr><th>Gasto por trimestre</th>{QN.map((q) => <th key={q}>{q}</th>)}<th>Año</th></tr></thead>
            <tbody>
              <tr><td>Planeado</td>{bud.quarters.map((x, i) => <td key={i}>{money(x)}</td>)}<td>{money(t.plan)}</td></tr>
              <tr><td>% del año</td>{bud.quarters.map((x, i) => <td key={i}>{fmt((x / Math.max(t.plan, 1)) * 100)}%</td>)}<td>100%</td></tr>
            </tbody>
          </table>
          {byType.map(([k, x]) => (
            <div key={k} className="pl-type"><span><span className="pl-dot" style={{ background: TYPES[k][1] }} />{TYPES[k][0]}</span><i style={{ background: TYPES[k][1], width: `${(x / mx) * 100}%` }} /><span>{money(x)}</span></div>
          ))}
        </div>
        <div className="pl-tbl" style={{ marginTop: 12 }}>
          <table className="pl-t">
            <thead><tr><th>Unidad</th><th>Asignado</th><th>Cofinanciamiento (partners)</th><th className="n">Planeado</th><th className="n">Gasto real</th><th className="n">Libre</th><th className="n">% libre</th><th className="n">vs cuota</th></tr></thead>
            <tbody>
              {bud.per.map((x, i) => (
                <tr key={x.name}>
                  <td>{x.name}</td>
                  <td><Num label={`Presupuesto asignado · ${x.name}`} v={x.assigned} w={120} on={(n) => up((d) => { d.units[i].budget = n ?? 0 })} /></td>
                  <td><Num label={`Cofinanciamiento · ${x.name}`} v={x.fund} w={110} on={(n) => up((d) => { d.units[i].fund = n ?? 0 })} /></td>
                  <td className="n">{money(x.plan)}</td>
                  <td className="n">{money(x.real)}</td>
                  <td className={`n ${x.free < 0 ? 'bad' : ''}`}>{money(x.free)}</td>
                  <td className="n">{x.assigned ? `${fmt((x.free / x.assigned) * 100, 1)}%` : '—'}</td>
                  <td className="n">{fmt((x.plan / Math.max(x.quota, 1)) * 100, 1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {bud.per.filter((x) => x.free < 0).map((x) => <div key={x.name} className="pl-alert"><b>{x.name} se pasa por {money(-x.free)}.</b> Mueve actividades a otro trimestre o busca cofinanciamiento.</div>)}
        <div className="pl-alert y">El mes de mayor gasto es <b>{MONTHS[peak]}</b> ({money(bud.months[peak])}): revisa que el flujo de caja lo soporte.</div>
      </>
    )
  }

  const kpi = () => {
    const t = monthlyTargets(p)
    const plL = plannedLeads(p)
    const rows: [string, number[], boolean][] = [
      ['Leads', t.leads, false], ['MQL', t.mql, false], ['SQL', t.sql, false], ['Oportunidades creadas', t.opp, false], ['Pipeline creado', t.pipe, true],
    ]
    const cpl = [0, 1, 2, 3].map((q) => qSum(bud.months, q) / Math.max(qSum(plL, q), 1))
    return (
      <>
        <div className="pl-lcd" style={{ marginTop: 0 }}>
          <table className="pl-lt">
            <thead><tr><th>KPI · meta por trimestre en que se genera</th>{QN.map((q) => <th key={q}>{q}</th>)}<th>Año</th><th>Frecuencia</th><th>Fuente</th></tr></thead>
            <tbody>
              {rows.map(([l, a, m]) => (
                <tr key={l} className={l === 'Pipeline creado' ? 'hl' : ''}>
                  <td>{l}</td>{[0, 1, 2, 3].map((q) => <td key={q}>{m ? money(qSum(a, q)) : num(qSum(a, q))}</td>)}<td>{m ? money(sum(a)) : num(sum(a))}</td><td>Mensual</td><td>CRM</td>
                </tr>
              ))}
              <tr><td>Costo por lead planeado</td>{cpl.map((x, q) => <td key={q}>{money(x)}</td>)}<td>{money(sum(bud.months) / Math.max(sum(plL), 1))}</td><td>Trimestral</td><td>Finanzas + CRM</td></tr>
            </tbody>
          </table>
          <div className="pl-lg"><span>las metas salen de Meta comercial, ya movidas por el ciclo de venta de cada unidad</span></div>
        </div>
        <h3 className="pl-h">Riesgos y plan de contingencia</h3>
        <div className="pl-tbl">
          <table className="pl-t">
            <thead><tr><th>Riesgo</th><th>Probabilidad</th><th>Impacto</th><th>Qué haremos</th><th>Responsable</th><th /></tr></thead>
            <tbody>
              {p.risks.map((r, i) => (
                <tr key={i}>
                  <td><input value={r.r} maxLength={160} aria-label="Riesgo" style={{ minWidth: 240 }} onChange={(e) => up((d) => { d.risks[i].r = e.target.value })} /></td>
                  <td><select value={r.p} aria-label="Probabilidad" onChange={(e) => up((d) => { d.risks[i].p = e.target.value as Plan['risks'][number]['p'] })}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></td>
                  <td><select value={r.i} aria-label="Impacto" onChange={(e) => up((d) => { d.risks[i].i = e.target.value as Plan['risks'][number]['i'] })}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></td>
                  <td><input value={r.m} maxLength={240} aria-label="Qué haremos" style={{ minWidth: 280 }} onChange={(e) => up((d) => { d.risks[i].m = e.target.value })} /></td>
                  <td><input value={r.o} maxLength={40} aria-label="Responsable" style={{ width: 90 }} onChange={(e) => up((d) => { d.risks[i].o = e.target.value })} /></td>
                  <td><button type="button" className="pl-x" aria-label="Quitar riesgo" onClick={() => up((d) => { d.risks.splice(i, 1) })}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pl-row"><button type="button" className="btn" onClick={() => up((d) => { if (d.risks.length < 30) d.risks.push({ r: '', p: 'Media', i: 'Media', m: '', o: '' }) })}>+ Agregar riesgo</button></div>
      </>
    )
  }

  const seg = () => {
    const t = monthlyTargets(p)
    const plan: Record<ActualKey, number[]> = { spend: bud.months, leads: t.leads, mql: t.mql, sql: t.sql, opp: t.opp, pipe: t.pipe }
    const ytd = (k: ActualKey) => {
      const real = p.actual[k]
      const months = real.map((x, i) => (x == null ? -1 : i)).filter((i) => i >= 0)
      if (!months.length) return null
      const r = sum(months.map((i) => real[i] ?? 0))
      const pl = sum(months.map((i) => plan[k][i]))
      return { r, pl, pct: pl ? r / pl : 0 }
    }
    return (
      <>
        <p className="pl-intro">Captura lo real de cada mes y compáralo contra el plan. Las metas del embudo son las del mes en que hay que generar (ya movidas por el ciclo de venta). El avance se mide solo contra los meses que ya capturaste.</p>
        <div className="pl-tbl">
          <table className="pl-t pl-seg">
            <thead><tr><th>Concepto</th>{MONTHS.map((m) => <th key={m}>{m}</th>)}<th className="n">Avance</th></tr></thead>
            <tbody>
              {ACTUAL_ROWS.map((row) => {
                const y = ytd(row.id)
                const f = (x: number) => (row.money ? money(x) : num(x))
                return (
                  <React.Fragment key={row.id}>
                    <tr className="plan"><td>{row.label} · {row.id === 'spend' ? 'plan' : 'meta'}</td>{plan[row.id].map((x, i) => <td key={i} className="n">{f(x)}</td>)}<td /></tr>
                    <tr>
                      <td>{row.label} · real</td>
                      {MONTHS.map((m, i) => {
                        const x = p.actual[row.id][i]
                        const pl = plan[row.id][i]
                        const cls = x == null || !pl ? '' : row.id === 'spend' ? (x / pl > 1.1 ? 'bad' : 'ok') : x / pl < 0.8 ? 'bad' : x / pl < 1 ? 'warn' : 'ok'
                        return <td key={m} className={`in ${cls}`}><Num label={`${row.label} real · ${m}`} v={x} w={row.money ? 96 : 64} on={(n) => up((d) => { d.actual[row.id][i] = n })} /></td>
                      })}
                      <td className={`n ${y ? (row.id === 'spend' ? (y.pct > 1.1 ? 'bad' : 'ok') : y.pct < 0.8 ? 'bad' : y.pct < 1 ? 'warn' : 'ok') : ''}`}>{y ? `${fmt(y.pct * 100)}%` : '—'}</td>
                    </tr>
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </>
    )
  }

  const VIEWS: Record<Tab, () => React.ReactNode> = { meta, est, act, cal, cob, res, kpi, seg }

  return (
    <>
      <AppHeader
        top="PLAN"
        bottom="Q1-Q4"
        cable={saved === 'ejemplo' ? 'DATOS DE EJEMPLO' : 'GUARDADO EN ESTE NAVEGADOR'}
        message={gate ? 'Ingresa tu correo para descargar el Excel' : `Cobertura de leads del año: ${fmt(covYear * 100)}% · cuota ${money(quota)}`}
      />
      <div className="x-dev">
        <div className="x-brand"><span><b>PLAN·01</b> plan de marketing anual</span><span>meta comercial → leads → actividades</span></div>
        <div className="pl-cfg">
          <label>Nombre del plan<input value={p.name} maxLength={80} onChange={(e) => up((d) => { d.name = e.target.value })} /></label>
          <label>Año<Num label="Año" v={p.year} w={90} max={2100} on={(n) => up((d) => { d.year = Math.round(n ?? d.year) })} /></label>
          <label>Moneda<select value={p.cur} onChange={(e) => up((d) => { d.cur = e.target.value as Plan['cur'] })}><option>MXN</option><option>USD</option></select></label>
          <div className="pl-cfg-k">
            <button type="button" className="btn" onClick={() => { if (window.confirm('¿Volver al ejemplo? Se pierde lo que capturaste en este navegador.')) { setP(structuredClone(EXAMPLE)); setSaved('ejemplo') } }}>Volver al ejemplo</button>
          </div>
        </div>
        <div className="pl-tabs" role="tablist">
          {TABS.map(([k, l], i) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className={`pl-tab${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>
              <i>{String(i + 1).padStart(2, '0')}</i>{l}
            </button>
          ))}
        </div>
        <div role="tabpanel">{VIEWS[tab]()}</div>

        {gate ? (
          <div className="s-gate">
            <Gate
              tool="Planeador de marketing"
              intro="Te mando el resumen a tu correo y se descarga el Excel con todas las hojas y fórmulas."
              cta="Enviar y descargar Excel ▸"
              summary={summary.join('\n')}
              meta={{ slug: 'planeador-marketing', finding: summary[1], items: summary.map((t) => ({ t })) }}
              onDone={onGateDone}
              onCancel={() => setGate(false)}
            />
          </div>
        ) : (
          <div className="s-keys">
            <button type="button" className="btn or" disabled={busy} onClick={ask}>{busy ? 'Armando el Excel…' : 'Descargar Excel ▸'}</button>
            <Link className="btn" href="/recursos/brecha-pipeline" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>¿Llego a la meta del trimestre? ▸</Link>
          </div>
        )}
      </div>
    </>
  )
}
