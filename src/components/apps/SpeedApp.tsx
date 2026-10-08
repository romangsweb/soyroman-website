'use client'

import React, { useCallback, useState } from 'react'

import type { Field, FieldMetric, Lab, Strategy } from '@/lib/speedScan'
import { AppHeader } from './Panels'
import { Gate } from './Gate'
import { useToolTracking } from './useToolTracking'

const STATUS_TXT = { ok: 'BUENO', warn: 'MEJORABLE', bad: 'LENTO' } as const
const COLOR = { ok: '#3ddc84', warn: '#f2c14e', bad: '#e85a2a' } as const
const POOR: Record<FieldMetric['id'], number> = { lcp: 4000, inp: 500, cls: 0.25, fcp: 3000, ttfb: 1800 }
const GOOD: Record<FieldMetric['id'], string> = { lcp: '2.5 s', inp: '200 ms', cls: '0.1', fcp: '1.8 s', ttfb: '0.8 s' }

const fmt = (m: FieldMetric) => (m.unit === '' ? m.p75.toFixed(2) : m.p75 >= 1000 ? `${(m.p75 / 1000).toFixed(1)} s` : `${Math.round(m.p75)} ms`)
const secs = (ms: number) => `${(ms / 1000).toFixed(1)} s`

type G = { v: string; status: 'ok' | 'warn' | 'bad'; p: number } | null

/** Valor de campo (usuarios reales) para un velocímetro. */
const fieldG = (m?: FieldMetric): G => (m ? { v: fmt(m), status: m.status, p: Math.min(1, m.p75 / (POOR[m.id] * 1.25)) } : null)
/** Valor de laboratorio (simulado) cuando el sitio no tiene datos de campo. TBT sustituye a INP, que no se mide en laboratorio. */
const labG = (v: number | null, good: number, poor: number, kind: 'ms' | 'cls'): G =>
  v === null ? null : {
    v: kind === 'cls' ? v.toFixed(2) : v >= 1000 ? `${(v / 1000).toFixed(1)} s` : `${Math.round(v)} ms`,
    status: v <= good ? 'ok' : v <= poor ? 'warn' : 'bad',
    p: Math.min(1, v / (poor * 1.25)),
  }

function Gauge({ g, label, sim }: { g: G; label: string; sim?: boolean }) {
  const L = Math.PI * 50
  return (
    <div className={`v-g ${g?.status || 'off'}`}>
      <svg viewBox="0 0 120 70" aria-hidden="true">
        <path d="M10 62 A50 50 0 0 1 110 62" fill="none" stroke="#1c2024" strokeWidth="10" />
        {g && <path d="M10 62 A50 50 0 0 1 110 62" fill="none" stroke={COLOR[g.status]} strokeWidth="10" strokeDasharray={`${L * g.p} ${L}`} />}
      </svg>
      <div className="v">{g ? g.v : '—'}</div>
      <div className="l">{label}</div>
      <div className="t">{g ? `${STATUS_TXT[g.status]}${sim ? ' · SIMULADO' : ''}` : 'SIN DATOS'}</div>
    </div>
  )
}

export function SpeedApp() {
  const [domain, setDomain] = useState('')
  const [strategy, setStrategy] = useState<Strategy>('mobile')
  const [busy, setBusy] = useState<'field' | 'lab' | null>(null)
  const [error, setError] = useState('')
  const [labError, setLabError] = useState('')
  const [site, setSite] = useState('')
  const [field, setField] = useState<Field | null | undefined>(undefined) // undefined = sin medir, null = sin datos de campo
  const [lab, setLab] = useState<Lab | null>(null)
  const [gate, setGate] = useState(false)
  useToolTracking('Velocidad real', site || null, gate)

  const call = async (part: 'field' | 'lab', d: string, s: Strategy) => {
    const r = await fetch('/next/speed-scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain: d, strategy: s, part }) })
    const data = await r.json()
    if (!r.ok) throw new Error(data.error || 'No pude medir ese sitio.')
    return data
  }

  const measure = useCallback(async (s: Strategy, e?: React.FormEvent) => {
    e?.preventDefault()
    if (!domain.trim() || busy) return
    setError('')
    setLabError('')
    setField(undefined)
    setLab(null)
    setBusy('field')
    try {
      const f = await call('field', domain, s)
      setSite(f.domain)
      setField(f.field)
      setBusy('lab')
      try {
        const l = await call('lab', f.domain, s)
        setLab(l.lab)
      } catch (err) {
        setLabError(err instanceof Error ? err.message : 'La prueba de laboratorio falló.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pude conectar. Intenta de nuevo.')
    } finally {
      setBusy(null)
    }
  }, [domain, busy])

  const switchTo = (s: Strategy) => {
    if (s === strategy || busy) return
    setStrategy(s)
    if (site) measure(s)
  }

  const print = useCallback(() => {
    setGate(false)
    setTimeout(() => window.print(), 150)
  }, [])

  const get = (id: FieldMetric['id']) => field?.metrics.find((m) => m.id === id)
  const lcp = get('lcp'), inp = get('inp'), cls = get('cls')
  const device = strategy === 'mobile' ? 'móviles' : 'de escritorio'

  // Diagnóstico en lenguaje de negocio
  const dx: { t: string; d: string }[] = []
  if (field === null) dx.push({ t: 'Sin datos de usuarios reales', d: 'Este sitio no tiene suficientes visitas en Chrome para que Google publique datos de campo. Abajo está la prueba de laboratorio, que simula una visita.' })
  if (field) {
    dx.push(field.passes === false
      ? { t: 'No pasa las Core Web Vitals', d: `Google usa estas métricas como señal para posicionar. Con las visitas ${device} de los últimos 28 días, al menos una está fuera del rango bueno.` }
      : field.passes ? { t: 'Pasa las Core Web Vitals', d: `Las tres métricas están en rango bueno para las visitas ${device} reales.` }
        : { t: 'Datos incompletos', d: 'Google no publicó las tres métricas para este sitio.' })
    if (lcp && lcp.status !== 'ok') dx.push({ t: `El ${100 - lcp.dist[0]}% de las visitas ${device} esperan más de 2.5 s`, d: `Es el tiempo para ver el contenido principal. En el 75% de las visitas tarda hasta ${fmt(lcp)}; lo recomendado es menos de 2.5 s.` })
    if (inp) dx.push(inp.status === 'ok' ? { t: `La interacción es buena (${fmt(inp)})`, d: 'Los botones y menús responden rápido: el problema, si lo hay, está en la carga.' } : { t: `Los clics tardan en responder (${fmt(inp)})`, d: 'Suele ser JavaScript pesado: chats, píxeles o el constructor de páginas.' })
    if (cls && cls.status !== 'ok') dx.push({ t: 'La página se mueve mientras carga', d: `Saltos de ${fmt(cls)}: botones que cambian de lugar provocan clics equivocados. Suele deberse a imágenes sin tamaño o anuncios que entran tarde.` })
  }
  if (lab?.fixes[0]) dx.push({ t: `El mayor ahorro estimado: ${lab.fixes[0].title.toLowerCase()} (−${secs(lab.fixes[0].ms)})`, d: 'Según la prueba de laboratorio. Los ahorros no se suman entre sí, pero empezar por el mayor da el mejor retorno.' })

  const has = field !== undefined
  const summary = has
    ? [`Dominio: ${site} (${strategy === 'mobile' ? 'móvil' : 'escritorio'})`, ...(field?.metrics.map((m) => `${m.label}: ${fmt(m)} (${STATUS_TXT[m.status]})`) || ['Sin datos de campo']), lab ? `Laboratorio: ${lab.score}/100` : '', '', ...dx.map((x, i) => `${i + 1}. ${x.t}`)].join('\n')
    : ''

  return (
    <>
      <AppHeader
        top="SPEED"
        bottom="VEL·01"
        cable="GRATIS"
        message={gate ? 'Ingresa tu correo para descargar el plan'
          : busy === 'field' ? 'Consultando datos de usuarios reales…'
            : busy === 'lab' ? 'Corriendo la prueba de laboratorio (hasta 40 s)…'
              : has ? `${site}: ${field?.passes ? 'pasa' : field?.passes === false ? 'no pasa' : 'sin veredicto de'} Core Web Vitals`
                : '¿Qué tan rápido carga un sitio para sus visitas reales?'}
      />

      <div className="x-dev">
        <div className="x-brand"><span><b>VEL·01</b> velocidad real</span><span>usuarios reales · Chrome</span></div>
        <form className="s-in v-in" onSubmit={(e) => measure(strategy, e)}>
          <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="tu-dominio.com" aria-label="Dominio a medir"
            inputMode="url" autoCapitalize="off" spellCheck={false} />
          <div className="v-seg" role="group" aria-label="Dispositivo">
            <button type="button" className={strategy === 'mobile' ? 'on' : ''} aria-pressed={strategy === 'mobile'} onClick={() => switchTo('mobile')}>MÓVIL</button>
            <button type="button" className={strategy === 'desktop' ? 'on' : ''} aria-pressed={strategy === 'desktop'} onClick={() => switchTo('desktop')}>ESCRITORIO</button>
          </div>
          <button type="submit" disabled={!!busy || !domain.trim()}>{busy ? '···' : 'MEDIR'}</button>
        </form>
        {error && <p className="s-err" role="alert">{error}</p>}

        <div className={`v-lcd${busy === 'field' ? ' busy' : ''}`}>
          <div className="v-gauges">
            {field === null && lab ? (
              <>
                <Gauge g={labG(lab.core.lcp, 2500, 4000, 'ms')} label="LCP · carga" sim />
                <Gauge g={labG(lab.core.tbt, 200, 600, 'ms')} label="TBT · bloqueo" sim />
                <Gauge g={labG(lab.core.cls, 0.1, 0.25, 'cls')} label="CLS · estabilidad" sim />
              </>
            ) : (
              <>
                <Gauge g={fieldG(lcp)} label="LCP · carga" />
                <Gauge g={fieldG(inp)} label="INP · interacción" />
                <Gauge g={fieldG(cls)} label="CLS · estabilidad" />
              </>
            )}
          </div>
          {field && (
            <div className="v-dist">
              {field.metrics.map((m) => (
                <div key={m.id}>
                  <span>{m.id.toUpperCase()}</span>
                  <div className="v-bar" role="img" aria-label={`${m.label}: ${m.dist[0]}% bueno, ${m.dist[1]}% mejorable, ${m.dist[2]}% lento`}>
                    <i className="a" style={{ width: `${m.dist[0]}%` }} /><i className="b" style={{ width: `${m.dist[1]}%` }} /><i className="c" style={{ width: `${m.dist[2]}%` }} />
                  </div>
                  <small>{fmt(m)}</small>
                </div>
              ))}
              {field.period && <p className="v-per">Periodo: {field.period} · bueno = menos de {GOOD.lcp} (LCP), {GOOD.inp} (INP), {GOOD.cls} (CLS)</p>}
            </div>
          )}
          {field === null && (
            <p className="v-per">
              {lab ? 'Sin datos de usuarios reales: los velocímetros muestran la prueba de laboratorio (TBT sustituye a INP, que solo se mide con visitas reales).'
                : busy === 'lab' ? 'Sin datos de usuarios reales: esperando la prueba de laboratorio…' : 'Sin datos de usuarios reales para este sitio.'}
            </p>
          )}
        </div>
        <p className="s-help">Los datos de campo vienen del informe público de Chrome (CrUX); la prueba de laboratorio la corre Google con PageSpeed Insights. No guarda el dominio.</p>

        {has && (
          <>
            <div className="x-grid">
              <div className="x-card">
                <h3><i className={`s-led ${lab ? (lab.score >= 90 ? 'ok' : lab.score >= 50 ? 'warn' : 'bad') : ''}`} aria-hidden="true" />
                  Laboratorio{lab ? ` · ${lab.score}/100` : busy === 'lab' ? ' · midiendo…' : ''}</h3>
                {lab ? (
                  <>
                    {lab.metrics.map((m) => <div key={m.label} className="v-row"><span>{m.label}</span><small>{m.value}</small></div>)}
                  </>
                ) : <span className="x-none">{labError || (busy === 'lab' ? 'Google está cargando el sitio en un dispositivo simulado…' : '—')}</span>}
              </div>
              <div className="x-card">
                <h3><i className={`s-led ${lab?.fixes.length ? 'warn' : ''}`} aria-hidden="true" />Qué arreglar primero</h3>
                {lab?.fixes.length ? lab.fixes.map((f) => <div key={f.title} className="v-row"><span>{f.title}</span><small>−{secs(f.ms)}</small></div>)
                  : <span className="x-none">{lab ? 'La prueba no encontró ahorros importantes.' : busy === 'lab' ? 'Esperando la prueba…' : '—'}</span>}
              </div>
            </div>
            {dx.length > 0 && (
              <div className="x-dx">
                <h3>Diagnóstico · lo que significa</h3>
                <ol>{dx.map((x) => <li key={x.t}><b>{x.t}.</b> {x.d}</li>)}</ol>
              </div>
            )}
            {gate ? (
              <div className="s-gate"><Gate tool="Velocidad real" summary={summary} meta={{ slug: 'velocidad-real', domain: site, score: lab?.score ?? null, finding: dx[0]?.t }} onDone={print} onCancel={() => setGate(false)} /></div>
            ) : (
              <div className="s-keys">
                <button type="button" className="btn or" disabled={!!busy} onClick={() => setGate(true)}>Plan de mejora en PDF ▸</button>
                <a className="btn" href="/recursos/comparador-competidores" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>Compárate con tu competencia ▸</a>
              </div>
            )}
          </>
        )}
      </div>

      {has && (
        <section className="te-print" aria-hidden="true">
          <span className="tag">soyroman.com · Velocidad real</span>
          <h1>Velocidad de {site} ({strategy === 'mobile' ? 'móvil' : 'escritorio'})</h1>
          <p>Medido el {new Date().toLocaleDateString('es-MX')}. Datos de campo: Chrome UX Report{field?.period ? ` (${field.period})` : ''}. Laboratorio: PageSpeed Insights.</p>
          {field && (
            <table>
              <thead><tr><th>Métrica</th><th>Percentil 75</th><th>Estado</th><th>Bueno / mejorable / lento</th></tr></thead>
              <tbody>{field.metrics.map((m) => <tr key={m.id}><td>{m.label}</td><td>{fmt(m)}</td><td>{STATUS_TXT[m.status]}</td><td>{m.dist.join('% / ')}%</td></tr>)}</tbody>
            </table>
          )}
          {lab && (
            <>
              <h3>Prueba de laboratorio · {lab.score}/100</h3>
              <ol>{lab.fixes.map((f) => <li key={f.title}>{f.title} (ahorro estimado {secs(f.ms)})</li>)}</ol>
            </>
          )}
          <h3>Diagnóstico</h3>
          <ol>{dx.map((x) => <li key={x.t}><b>{x.t}.</b> {x.d}</li>)}</ol>
          <p>¿Quieres revisarlo juntos? contacto@soyroman.com · soyroman.com/consultoria</p>
        </section>
      )}
    </>
  )
}
