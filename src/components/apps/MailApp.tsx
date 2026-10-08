'use client'

import React, { useCallback, useState } from 'react'

import type { MailResult } from '@/lib/mailHealth'
import { AppHeader } from './Panels'
import { Gate } from './Gate'
import { useToolTracking } from './useToolTracking'

const IDLE = ['MX', 'SPF', 'DKIM', 'DMARC', 'MTA-STS', 'TLS-RPT', 'BIMI', 'LISTAS']
const DKIM_TXT = { si: 'con DKIM', no: 'sin DKIM detectado', 'no-verificable': 'DKIM no verificable' } as const

export function MailApp() {
  const [domain, setDomain] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [res, setRes] = useState<MailResult | null>(null)
  const [gate, setGate] = useState(false)
  useToolTracking('Salud del correo', res?.domain || null, gate)

  const scan = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!domain.trim() || busy) return
    setBusy(true)
    setError('')
    setRes(null)
    try {
      const r = await fetch('/next/mail-health', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ domain }) })
      const d = await r.json()
      if (!r.ok) setError(d.error || 'No pude revisar ese dominio.')
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

  const bulkOk = res ? [res.bulk.spf, res.bulk.dkim, res.bulk.dmarc].filter(Boolean).length : 0
  const bulkTxt = !res ? '' : bulkOk === 3 ? 'CUMPLE LO QUE SE PUEDE VERIFICAR POR DNS' : !res.bulk.dkim && res.bulk.spf && res.bulk.dmarc ? 'NO CONFIRMADO: DKIM NO DETECTADO' : `NO CUMPLE (${bulkOk} DE 3)`
  const summary = res
    ? [`Dominio: ${res.domain}`, ...res.lights.map((l) => `${l.label}: ${l.short}`), `Requisitos Gmail/Yahoo: ${bulkTxt.toLowerCase()}`, '', ...res.findings.map((f, i) => `${i + 1}. ${f.title}`)].join('\n')
    : ''

  return (
    <>
      <AppHeader
        top="MAIL"
        bottom="HEALTH"
        cable="GRATIS"
        message={gate ? 'Ingresa tu correo para descargar la guía'
          : busy ? 'Consultando DNS…'
            : res ? `${res.domain}: ${res.lights.filter((l) => l.status === 'bad').length} luces en rojo · ${res.findings.length} hallazgos`
              : '¿Tus correos llegan a la bandeja o a spam?'}
      />

      <div className="x-dev">
        <div className="x-brand"><span><b>MAIL·01</b> salud del correo</span><span>8 luces · DNS público</span></div>
        <form className="s-in" onSubmit={scan}>
          <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="tu-dominio.com" aria-label="Dominio a revisar"
            inputMode="url" autoCapitalize="off" spellCheck={false} />
          <button type="submit" disabled={busy || !domain.trim()}>{busy ? '···' : 'REVISAR'}</button>
        </form>
        {error && <p className="s-err" role="alert">{error}</p>}

        <div className={`e-lcd${busy ? ' busy' : ''}`}>
          <div className="e-leds">
            {(res?.lights || IDLE.map((l) => ({ id: l, label: l, status: 'off' as const, short: busy ? '···' : '—' }))).map((l) => (
              <div key={l.id} className={`e-cell ${l.status}`}>
                <i aria-hidden="true" />
                <span>{l.label}</span>
                <small>{l.short}</small>
              </div>
            ))}
          </div>
          {res && <div className="e-verdict">REQUISITOS GMAIL / YAHOO PARA ENVÍOS MASIVOS: <b className={bulkOk === 3 ? 'ok' : ''}>{bulkTxt}</b></div>}
        </div>
        <p className="s-help">Solo consulta registros DNS públicos: no envía correos ni guarda el dominio.</p>

        {res && (
          <>
            <div className="x-grid">
              <div className="x-card">
                <h3><i className={`s-led ${res.senders.length ? 'ok' : 'warn'}`} aria-hidden="true" />Quién envía en nombre de este dominio</h3>
                {res.senders.length ? res.senders.map((s) => (
                  <div key={s.name} className="v-row"><span>{s.name}</span><small>{s.via} · {DKIM_TXT[s.dkim]}</small></div>
                )) : <span className="x-none">No identifiqué plataformas de envío conocidas en MX ni SPF.</span>}
              </div>
              <div className="x-card">
                <h3><i className={`s-led ${res.lights.find((l) => l.id === 'spf')?.status || ''}`} aria-hidden="true" />Registros</h3>
                <div className="v-row"><span>SPF</span><small>{res.spf ? `${res.spf.lookups} de 10 consultas` : 'no existe'}</small></div>
                {res.spf && <code className="e-rec">{res.spf.record}</code>}
                <div className="v-row"><span>DMARC</span><small>{res.dmarc ? `p=${res.dmarc.policy}${res.dmarc.reports ? ' · con reportes' : ' · sin reportes'}` : 'no existe'}</small></div>
                {res.dmarc && <code className="e-rec">{res.dmarc.record}</code>}
                <div className="v-row"><span>Listas negras</span><small>{res.lists.map((l) => `${l.name}: ${l.result}`).join(' · ')}</small></div>
              </div>
            </div>
            {res.findings.length > 0 && (
              <div className="x-dx">
                <h3>Diagnóstico · lo que significa</h3>
                <ol>{res.findings.map((f) => <li key={f.title}><b>{f.title}.</b> {f.detail}</li>)}</ol>
              </div>
            )}
            {gate ? (
              <div className="s-gate"><Gate tool="Salud del correo" summary={summary} meta={res ? { slug: 'salud-correo', domain: res.domain, score: (res.lights.filter((l) => l.status === 'ok').length / res.lights.length) * 100, finding: res.findings[0]?.title, items: res.findings.slice(0, 3).map((f) => ({ t: f.title, fix: `Qué hacer: ${f.fix}` })) } : undefined} onDone={print} onCancel={() => setGate(false)} /></div>
            ) : (
              <div className="s-keys">
                <button type="button" className="btn or" onClick={() => setGate(true)}>Guía de configuración en PDF ▸</button>
                <a className="btn" href="/recursos/radiografia-stack" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>Ver todo su stack ▸</a>
              </div>
            )}
          </>
        )}
      </div>

      {res && (
        <section className="te-print" aria-hidden="true">
          <span className="tag">soyroman.com · Salud del correo</span>
          <h1>Salud del correo de {res.domain}</h1>
          <p>Revisado el {new Date(res.at).toLocaleDateString('es-MX')} con registros DNS públicos.</p>
          <table>
            <thead><tr><th>Control</th><th>Estado</th></tr></thead>
            <tbody>{res.lights.map((l) => <tr key={l.id}><td>{l.label}</td><td>{l.short}</td></tr>)}</tbody>
          </table>
          {res.spf && <p><b>SPF:</b> {res.spf.record}</p>}
          {res.dmarc && <p><b>DMARC:</b> {res.dmarc.record}</p>}
          <h3>Qué corregir, en orden de impacto</h3>
          <ol>{res.findings.map((f) => <li key={f.title}><b>{f.title}.</b> {f.detail} <i>Qué hacer:</i> {f.fix}</li>)}</ol>
          <p>DKIM se busca en los selectores más comunes; si tu plataforma usa uno propio, puede existir aunque no aparezca aquí.</p>
          <p>¿Quieres revisarlo juntos? contacto@soyroman.com · soyroman.com/consultoria</p>
        </section>
      )}
    </>
  )
}
