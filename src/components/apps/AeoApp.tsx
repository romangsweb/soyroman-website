'use client'

import React, { useCallback, useState } from 'react'

import type { Audit, Check } from '@/lib/aeoAudit'
import { AppHeader } from './Panels'
import { Gate } from './Gate'
import { useToolTracking } from './useToolTracking'

const GROUPS: Check['group'][] = ['Acceso', 'Lectura', 'Estructura']
const verdict = (s: number) => (s >= 80 ? 'Listo para las IA' : s >= 55 ? 'Te pueden encontrar, con fricción' : 'Las IA casi no pueden leerte')

export function AeoApp() {
  const [domain, setDomain] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [audit, setAudit] = useState<Audit | null>(null)
  const [gate, setGate] = useState(false)
  useToolTracking('Auditor AEO', audit?.domain || null, gate)

  const scan = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!domain.trim() || busy) return
    setBusy(true)
    setError('')
    setAudit(null)
    try {
      const res = await fetch('/next/aeo-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error || 'No pude revisar ese sitio.')
      else setAudit(data)
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

  const fixes = audit ? audit.checks.filter((c) => c.fix).sort((a, b) => (b.max - b.points) - (a.max - a.points)) : []
  const summary = audit
    ? [`Dominio: ${audit.domain} · Calificación AEO: ${audit.score}/100`, ...audit.checks.map((c) => `${c.status.toUpperCase()} ${c.label} (${c.points}/${c.max})`)].join('\n')
    : ''

  return (
    <>
      <AppHeader
        top="SCAN"
        bottom="AEO"
        cable="GRATIS"
        message={gate
          ? 'Ingresa tu correo para descargar el plan'
          : busy ? 'Escaneando…'
            : audit ? `${audit.domain}: ${audit.score}/100 · ${verdict(audit.score)}`
              : '¿Tu sitio está listo para que las IA lo lean y lo citen?'}
      />

      <div className="s-dev">
        <div>
          <div className="s-brand"><span><b>SCAN·01</b> auditor AEO</span><span aria-hidden="true">● ● ●</span></div>
          <div className={`s-scope${busy ? ' busy' : ''}`} role="img" aria-label={audit ? `Calificación ${audit.score} de 100` : 'Radar en espera'}>
            <div className="s-sweep" aria-hidden="true" />
            {audit?.checks.map((c, i) => (
              <i key={c.id} className={`s-blip ${c.status}`} aria-hidden="true"
                style={{ left: `${50 + 34 * Math.cos((i / audit.checks.length) * 2 * Math.PI)}%`, top: `${50 + 34 * Math.sin((i / audit.checks.length) * 2 * Math.PI)}%` }} />
            ))}
            <div className="s-score">
              <b>{busy ? '···' : audit ? audit.score : '--'}</b>
              <span>/100 · PREPARACIÓN IA</span>
            </div>
          </div>
          <form className="s-in" onSubmit={scan}>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="tu-dominio.com"
              aria-label="Dominio a revisar"
              inputMode="url"
              autoCapitalize="off"
              spellCheck={false}
            />
            <button type="submit" disabled={busy || !domain.trim()}>{busy ? '···' : 'ESCANEAR'}</button>
          </form>
          {error && <p className="s-err" role="alert">{error}</p>}
          <p className="s-help">Solo revisa páginas públicas: la portada, robots.txt, llms.txt y el sitemap. No guarda el dominio.</p>
        </div>

        <div>
          <div className="s-rig">
            <h3>Banco de pruebas</h3>
            <p className="sub">9 pruebas · verde = listo · amarillo = mejorable · naranja = te frena</p>
            {!audit && <p className="s-empty">{busy ? 'Revisando acceso, lectura y estructura…' : 'Escribe un dominio y pulsa ESCANEAR.'}</p>}
            {audit && GROUPS.map((g, gi) => (
              <div key={g}>
                <div className="s-grp">{String(gi + 1).padStart(2, '0')} · {g}</div>
                {audit.checks.filter((c) => c.group === g).map((c) => (
                  <div key={c.id} className="s-chk">
                    <i className={`s-led ${c.status}`} aria-label={c.status === 'ok' ? 'listo' : c.status === 'warn' ? 'mejorable' : 'te frena'} />
                    <div>
                      {c.label}
                      {c.detail && <small>{c.detail}</small>}
                      {c.bots && (
                        <div className="s-bots">
                          {c.bots.map((b) => <span key={b.name} className={b.allowed ? '' : 'no'}>{b.name}</span>)}
                        </div>
                      )}
                    </div>
                    <span className="pts">{c.points}/{c.max}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          {audit && (gate ? (
            <div className="s-gate"><Gate tool="Auditor AEO" summary={summary} meta={audit ? { slug: 'auditor-aeo', domain: audit.domain, score: audit.score, finding: fixes[0]?.label, items: fixes.slice(0, 3).map((c) => ({ t: c.label, fix: c.fix ? `Qué hacer: ${c.fix}` : undefined })) } : undefined} onDone={print} onCancel={() => setGate(false)} /></div>
          ) : (
            <div className="s-keys">
              <button type="button" className="btn or" onClick={() => setGate(true)} disabled={!fixes.length}>
                {fixes.length ? `Plan de correcciones en PDF (${fixes.length}) ▸` : 'Sin correcciones pendientes ✓'}
              </button>
              <a className="btn" href="/recursos/radiografia-stack" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                Ver todo su stack ▸
              </a>
              <a className="btn" href="/recursos/comparador-competidores" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                Compárate con tu competencia ▸
              </a>
            </div>
          ))}
        </div>
      </div>

      {audit && (
        <section className="te-print" aria-hidden="true">
          <span className="tag">soyroman.com · Auditor AEO</span>
          <h1>{audit.domain}: {audit.score}/100</h1>
          <p>{verdict(audit.score)} · revisado el {new Date(audit.at).toLocaleDateString('es-MX')}</p>
          <table>
            <thead><tr><th>Prueba</th><th>Resultado</th><th>Puntos</th></tr></thead>
            <tbody>
              {audit.checks.map((c) => (
                <tr key={c.id}><td>{c.group}</td><td>{c.label}</td><td>{c.points}/{c.max}</td></tr>
              ))}
            </tbody>
          </table>
          <h3>Correcciones, en orden de impacto</h3>
          <ol>{fixes.map((c) => <li key={c.id}><b>{c.label}.</b> {c.fix}</li>)}</ol>
          <p>¿Quieres que lo revisemos juntos? contacto@soyroman.com · soyroman.com/consultoria</p>
        </section>
      )}
    </>
  )
}
