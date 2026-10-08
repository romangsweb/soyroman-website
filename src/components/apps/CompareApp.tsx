'use client'

import React, { useCallback, useState } from 'react'

import type { Side } from '@/lib/compare'
import { AppHeader } from './Panels'
import { Gate } from './Gate'
import { NextTool, saveSharedDomain, useSharedDomain } from './sharedDomain'
import { useToolTracking } from './useToolTracking'

type Res = { sides: Side[]; at: string }
type Cell = { v: string; meter?: number; tone?: 'ok' | 'warn' | 'bad' }

const secs = (ms: number) => `${(ms / 1000).toFixed(1)} s`
const list = (x: string[] | null) => (x === null ? '?' : x.length ? x.join(', ') : '—')
const lcpTone = (ms: number) => (ms <= 2500 ? 'ok' : ms <= 4000 ? 'warn' : 'bad')
const aeoTone = (n: number) => (n >= 70 ? 'ok' : n >= 45 ? 'warn' : 'bad')

const ROWS: { label: string; cell: (s: Side) => Cell }[] = [
  { label: 'Velocidad móvil (LCP)', cell: (s) => (s.lcp === null ? { v: 'sin datos' } : { v: secs(s.lcp), meter: Math.min(1, s.lcp / 5000), tone: lcpTone(s.lcp) }) },
  { label: 'Core Web Vitals', cell: (s) => (s.cwv === null ? { v: 'sin datos' } : s.cwv ? { v: 'PASA', tone: 'ok' } : { v: 'NO PASA', tone: 'bad' }) },
  { label: 'Preparación para IA', cell: (s) => (s.aeo === null ? { v: '?' } : { v: `${s.aeo}/100`, meter: s.aeo / 100, tone: aeoTone(s.aeo) }) },
  { label: 'CRM', cell: (s) => ({ v: list(s.crm), tone: s.crm && !s.crm.length ? 'bad' : undefined }) },
  { label: 'Agenda de reuniones', cell: (s) => ({ v: list(s.scheduling) }) },
  { label: 'Publicidad (píxeles)', cell: (s) => ({ v: list(s.ads) }) },
  { label: 'Analítica', cell: (s) => ({ v: list(s.analytics) }) },
  { label: 'DMARC', cell: (s) => ({ v: s.dmarc ?? '?', tone: s.dmarc === 'aplicado' ? 'ok' : s.dmarc === 'no tiene' ? 'bad' : s.dmarc === 'p=none' ? 'warn' : undefined }) },
  { label: 'Herramientas detectadas', cell: (s) => ({ v: s.tools === null ? '?' : String(s.tools) }) },
]

function diagnose(sides: Side[]) {
  const [you, ...rest] = sides
  const others = rest.filter((s) => !s.error)
  const out: { t: string; d: string }[] = []
  if (!others.length) return out
  const withLcp = others.filter((s) => s.lcp !== null)
  if (you.lcp !== null && withLcp.length) {
    const best = withLcp.reduce((a, b) => (a.lcp! <= b.lcp! ? a : b))
    if (you.lcp > best.lcp! * 1.1) out.push({ t: 'Pierdes en velocidad móvil', d: `Tu contenido principal tarda ${secs(you.lcp)} contra ${withLcp.map((s) => `${secs(s.lcp!)} de ${s.domain}`).join(' y ')}, con visitas reales de Chrome.` })
    else if (withLcp.every((s) => you.lcp! <= s.lcp!)) out.push({ t: 'Ganas en velocidad móvil', d: `Cargas en ${secs(you.lcp)}, más rápido que ${withLcp.map((s) => s.domain).join(' y ')}.` })
  }
  const withAeo = others.filter((s) => s.aeo !== null)
  if (you.aeo !== null && withAeo.length) {
    const top = withAeo.reduce((a, b) => (a.aeo! >= b.aeo! ? a : b))
    if (top.aeo! - you.aeo >= 10) out.push({ t: 'Pierdes en preparación para IA', d: `${top.domain} tiene ${top.aeo}/100 y tú ${you.aeo}/100: los buscadores con IA leen y citan mejor su sitio.` })
    else if (withAeo.every((s) => you.aeo! - s.aeo! >= 10)) out.push({ t: 'Ganas en preparación para IA', d: `Tienes ${you.aeo}/100 contra ${withAeo.map((s) => `${s.aeo} de ${s.domain}`).join(' y ')}.` })
  }
  const crmComp = others.filter((s) => s.crm?.length)
  if (you.crm && !you.crm.length && crmComp.length) out.push({ t: `${crmComp.map((s) => s.domain).join(' y ')} ${crmComp.length > 1 ? 'tienen' : 'tiene'} CRM conectado al sitio`, d: `Usan ${crmComp.map((s) => s.crm!.join(', ')).join(' y ')}; en tu sitio no se ve uno, así que es difícil saber qué campañas traen clientes.` })
  const schedComp = others.filter((s) => s.scheduling?.length)
  if (you.scheduling && !you.scheduling.length && schedComp.length) out.push({ t: `${schedComp[0].domain} deja agendar una reunión directo`, d: `Usa ${schedComp[0].scheduling!.join(', ')}. En tu sitio el contacto depende de un formulario y el interés se enfría mientras esperan respuesta.` })
  const adsComp = others.filter((s) => s.ads?.length)
  if (adsComp.length) out.push({ t: `${adsComp.map((s) => s.domain).join(' y ')} ${adsComp.length > 1 ? 'invierten' : 'invierte'} en publicidad`, d: `Se detectan píxeles de ${[...new Set(adsComp.flatMap((s) => s.ads!))].join(', ')}: es probable que estén haciendo campañas o remarketing.` })
  if (you.dmarc && you.dmarc !== 'aplicado' && others.some((s) => s.dmarc === 'aplicado')) out.push({ t: 'Tu dominio de correo está menos protegido', d: `Tu DMARC: ${you.dmarc}. ${others.filter((s) => s.dmarc === 'aplicado').map((s) => s.domain).join(' y ')} ya bloquea la suplantación.` })
  return out.slice(0, 6)
}

export function CompareApp() {
  const [doms, setDoms] = useState(['', '', ''])
  useSharedDomain((d) => setDoms((x) => (x[0] ? x : [d, x[1], x[2]])))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [res, setRes] = useState<Res | null>(null)
  const [gate, setGate] = useState(false)
  useToolTracking('Comparador de competidores', res ? res.sides.map((s) => s.domain).join('|') : null, gate)
  const ready = doms[0].trim() && (doms[1].trim() || doms[2].trim())

  const run = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!ready || busy) return
    setBusy(true)
    setError('')
    setRes(null)
    try {
      const r = await fetch('/next/compare', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domains: doms.filter((d) => d.trim()) }) })
      const d = await r.json()
      if (!r.ok) setError(d.error || 'No pude comparar esos sitios.')
      else {
        setRes(d)
        saveSharedDomain(d.sides?.[0]?.domain)
      }
    } catch {
      setError('No pude conectar. Intenta de nuevo.')
    } finally {
      setBusy(false)
    }
  }, [doms, ready, busy])

  const print = useCallback(() => {
    setGate(false)
    setTimeout(() => window.print(), 150)
  }, [])

  const dx = res ? diagnose(res.sides) : []
  const summary = res
    ? [...ROWS.map((row) => `${row.label}: ${res.sides.map((s) => `${s.domain} ${s.error ? 'error' : row.cell(s).v}`).join(' | ')}`), '', ...dx.map((x, i) => `${i + 1}. ${x.t}`)].join('\n')
    : ''

  return (
    <>
      <AppHeader
        top="VERSUS"
        bottom="VS·03"
        cable="GRATIS"
        message={gate ? 'Ingresa tu correo para descargar la comparativa'
          : busy ? 'Auditando los sitios (hasta 30 s)…'
            : res ? `${dx.length} diferencias clave entre ${res.sides.length} sitios`
              : '¿Dónde le ganas y dónde pierdes contra tu competencia?'}
      />

      <div className="x-dev">
        <div className="x-brand"><span><b>VS·03</b> comparador</span><span>hasta 3 dominios</span></div>
        <form className="s-in c-in" onSubmit={run}>
          {['tu-dominio.com', 'competidor-1.com', 'competidor-2.com (opcional)'].map((ph, i) => (
            <input key={ph} value={doms[i]} onChange={(e) => setDoms(doms.map((d, j) => (j === i ? e.target.value : d)))} placeholder={ph}
              aria-label={i ? `Competidor ${i}` : 'Tu dominio'} inputMode="url" autoCapitalize="off" spellCheck={false} />
          ))}
          <button type="submit" disabled={busy || !ready}>{busy ? '···' : 'COMPARAR'}</button>
        </form>
        {error && <p className="s-err" role="alert">{error}</p>}

        <div className={`c-lcd${busy ? ' busy' : ''}`}>
          {res ? (
            <table className="c-tab">
              <thead><tr><th />{res.sides.map((s, i) => <th key={s.domain} className={i ? '' : 'you'}>{s.domain}{i ? '' : ' · TÚ'}</th>)}</tr></thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    {res.sides.map((s) => {
                      if (s.error) return <td key={s.domain} className="bad">{row.label === ROWS[0].label ? s.error : ''}</td>
                      const c = row.cell(s)
                      return (
                        <td key={s.domain} className={c.tone || ''}>
                          {c.meter !== undefined && <span className="c-meter"><i style={{ width: `${c.meter * 100}%` }} /></span>}
                          {c.v}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="c-idle">{busy ? 'Corriendo auditor AEO, radiografía de stack y datos de Chrome para cada sitio…' : 'Escribe tu dominio y uno o dos competidores.'}</p>}
        </div>
        <p className="s-help">Usa información pública: la portada y robots.txt de cada sitio, sus registros DNS y el informe de usuarios reales de Chrome. No guarda los dominios.</p>

        {res && (
          <>
            {dx.length > 0 && (
              <div className="x-dx">
                <h3>Diagnóstico · dónde ganas y dónde pierdes</h3>
                <ol>{dx.map((x) => <li key={x.t}><b>{x.t}.</b> {x.d}</li>)}</ol>
              </div>
            )}
            {gate ? (
              <div className="s-gate"><Gate tool="Comparador de competidores" summary={summary} meta={res ? { slug: 'comparador-competidores', domain: res.sides[0]?.domain, score: res.sides[0]?.aeo ?? null, finding: dx[0]?.t, items: dx.slice(0, 3).map((x) => ({ t: x.t, fix: x.d })) } : undefined} onDone={print} onCancel={() => setGate(false)} /></div>
            ) : (
              <div className="s-keys">
                <button type="button" className="btn or" onClick={() => setGate(true)}>Comparativa completa en PDF ▸</button>
                <NextTool current="comparador-competidores" domain={res.sides[0]?.domain} />
              </div>
            )}
          </>
        )}
      </div>

      {res && (
        <section className="te-print" aria-hidden="true">
          <span className="tag">soyroman.com · Comparador de competidores</span>
          <h1>{res.sides.map((s) => s.domain).join(' vs ')}</h1>
          <p>Revisado el {new Date(res.at).toLocaleDateString('es-MX')} con información pública.</p>
          <table>
            <thead><tr><th />{res.sides.map((s) => <th key={s.domain}>{s.domain}</th>)}</tr></thead>
            <tbody>{ROWS.map((row) => <tr key={row.label}><td>{row.label}</td>{res.sides.map((s) => <td key={s.domain}>{s.error ? '—' : row.cell(s).v}</td>)}</tr>)}</tbody>
          </table>
          <h3>Diagnóstico</h3>
          <ol>{dx.map((x) => <li key={x.t}><b>{x.t}.</b> {x.d}</li>)}</ol>
          <p>La detección se basa en señales públicas y puede no ver herramientas que se cargan desde Tag Manager.</p>
          <p>¿Quieres revisarlo juntos? contacto@soyroman.com · soyroman.com/consultoria</p>
        </section>
      )}
    </>
  )
}
