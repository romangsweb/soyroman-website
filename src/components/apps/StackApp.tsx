'use client'

import React, { useCallback, useState } from 'react'

import { BrandIcon } from '@/components/BrandIcon'
import type { StackResult } from '@/lib/stackScan'
import { AppHeader } from './Panels'
import { Gate } from './Gate'
import { useToolTracking } from './useToolTracking'

const STATUS_TXT = { ok: 'cubierto', warn: 'revisar', bad: 'falta' } as const

export function StackApp() {
  const [domain, setDomain] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [res, setRes] = useState<StackResult | null>(null)
  const [gate, setGate] = useState(false)
  useToolTracking('Radiografía de stack', res?.domain || null, gate)

  const scan = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!domain.trim() || busy) return
    setBusy(true)
    setError('')
    setRes(null)
    try {
      const r = await fetch('/next/stack-scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain }) })
      const d = await r.json()
      if (!r.ok) setError(d.error || 'No pude revisar ese sitio.')
      else setRes(d)
    } catch {
      setError('No pude conectar. Intenta de nuevo.')
    } finally {
      setBusy(false)
    }
  }, [domain, busy])

  const print = useCallback(() => {
    setGate(false)
    setTimeout(() => window.print(), 150)
  }, [])

  const missing = res ? res.bands.filter((b) => b.status === 'bad').length : 0
  const summary = res
    ? [`Dominio: ${res.domain}`, ...res.bands.map((b) => `${b.label} (${STATUS_TXT[b.status]}): ${b.hits.map((h) => h.name).join(', ') || '—'}`), '', ...res.findings.map((f, i) => `${i + 1}. ${f.title}`)].join('\n')
    : ''

  return (
    <>
      <AppHeader
        top="STACK"
        bottom="SCAN"
        cable="GRATIS"
        message={gate ? 'Ingresa tu correo para descargar el diagnóstico'
          : busy ? 'Analizando…'
            : res ? `${res.domain}: ${res.findings.length} hallazgos · ${missing} bandas en falta`
              : '¿Con qué herramientas atrae, mide y convierte un sitio?'}
      />

      <div className="x-dev">
        <div className="x-brand"><span><b>SPEC·01</b> radiografía de stack</span><span>8 bandas</span></div>
        <form className="s-in" onSubmit={scan}>
          <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="tu-dominio.com" aria-label="Dominio a analizar"
            inputMode="url" autoCapitalize="off" spellCheck={false} />
          <button type="submit" disabled={busy || !domain.trim()}>{busy ? '···' : 'ANALIZAR'}</button>
        </form>
        {error && <p className="s-err" role="alert">{error}</p>}

        <div className={`x-spec${busy ? ' busy' : ''}`} role="img"
          aria-label={res ? res.bands.map((b) => `${b.label}: ${STATUS_TXT[b.status]}`).join(', ') : 'Analizador en espera'}>
          <div className="x-bands">
            {(res?.bands || Array.from({ length: 8 }, (_, i) => ({ id: String(i), label: '', status: 'warn' as const, level: busy ? 4 + ((i * 5) % 7) : 0 }))).map((b) => (
              <div key={b.id} className={`x-band ${b.status}`}>
                {Array.from({ length: 12 }, (_, i) => <i key={i} className={i < b.level ? 'on' : ''} />)}
              </div>
            ))}
          </div>
          <div className="x-lab">{['CMS', 'Analítica', 'CRM', 'Publicidad', 'Conversión', 'Privacidad', 'Infraestructura', 'Correo'].map((l) => <span key={l}>{l}</span>)}</div>
        </div>
        <p className="s-help">Solo lee información pública: el HTML de la portada, sus encabezados y los registros DNS del dominio. No guarda el dominio.</p>

        {res && (
          <>
            <div className="x-grid">
              {res.bands.map((b) => (
                <div key={b.id} className="x-card">
                  <h3><i className={`s-led ${b.status}`} aria-hidden="true" />{b.label} · {STATUS_TXT[b.status]}</h3>
                  {b.hits.length ? (
                    <div className="x-chips">
                      {b.hits.map((h) => (
                        <span key={h.name} className="x-chip"><BrandIcon name={h.name} className="w-3.5 h-3.5" />{h.name}{h.note && <small>{h.note}</small>}</span>
                      ))}
                    </div>
                  ) : <span className="x-none">No se detectó nada.</span>}
                </div>
              ))}
            </div>
            {res.findings.length > 0 && (
              <div className="x-dx">
                <h3>Diagnóstico · lo que significa</h3>
                <ol>{res.findings.map((f) => <li key={f.title}><b>{f.title}.</b> {f.detail}</li>)}</ol>
              </div>
            )}
            {gate ? (
              <div className="s-gate"><Gate tool="Radiografía de stack" summary={summary} meta={res ? { slug: 'radiografia-stack', domain: res.domain, score: (res.bands.filter((b) => b.status === 'ok').length / res.bands.length) * 100, finding: res.findings[0]?.title } : undefined} onDone={print} onCancel={() => setGate(false)} /></div>
            ) : (
              <div className="s-keys">
                <button type="button" className="btn or" onClick={() => setGate(true)}>Diagnóstico completo en PDF ▸</button>
                <a className="btn" href="/recursos/salud-correo" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>Revisar su correo ▸</a>
              </div>
            )}
          </>
        )}
      </div>

      {res && (
        <section className="te-print" aria-hidden="true">
          <span className="tag">soyroman.com · Radiografía de stack</span>
          <h1>Stack de marketing de {res.domain}</h1>
          <p>Revisado el {new Date(res.at).toLocaleDateString('es-MX')} con información pública (HTML, encabezados y DNS).</p>
          <table>
            <thead><tr><th>Banda</th><th>Estado</th><th>Detectado</th></tr></thead>
            <tbody>{res.bands.map((b) => <tr key={b.id}><td>{b.label}</td><td>{STATUS_TXT[b.status]}</td><td>{b.hits.map((h) => h.name + (h.note ? ` (${h.note})` : '')).join(', ') || '—'}</td></tr>)}</tbody>
          </table>
          <h3>Diagnóstico y qué hacer, en orden de impacto</h3>
          <ol>{res.findings.map((f) => <li key={f.title}><b>{f.title}.</b> {f.detail} <i>Qué hacer:</i> {f.fix}</li>)}</ol>
          <p>La detección se basa en señales públicas y puede no ver herramientas que se cargan desde Tag Manager.</p>
          <p>¿Quieres revisarlo juntos? contacto@soyroman.com · soyroman.com/consultoria</p>
        </section>
      )}
    </>
  )
}
