'use client'

import React, { useCallback, useState } from 'react'

import { track } from '@/lib/analytics'
import type { AiResult, Market } from '@/lib/aiRecommend'
import { AppHeader } from './Panels'
import { saveSharedDomain, useSharedDomain } from './sharedDomain'
import { useToolTracking } from './useToolTracking'

const MARKETS: Market[] = ['México', 'Latinoamérica', 'España']

export function AiApp() {
  const [f, setF] = useState({ domain: '', brand: '', service: '', market: 'México' as Market, email: '', sr_trap: '' })
  useSharedDomain((d) => setF((x) => (x.domain ? x : { ...x, domain: d })))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [res, setRes] = useState<AiResult | null>(null)
  const [open, setOpen] = useState<number | null>(null)
  useToolTracking('¿Te recomienda la IA?', res?.domain || null, !!res)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })
  const ready = f.domain.trim() && f.service.trim().length >= 4 && f.email.includes('@')

  const run = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!ready || busy) return
    setBusy(true)
    setError('')
    setRes(null)
    try {
      const r = await fetch('/next/ai-recommend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) })
      const d = await r.json()
      if (!r.ok) setError(d.error || 'No pude completar el diagnóstico.')
      else {
        setRes(d)
        saveSharedDomain(d.domain)
        track('generate_lead', { form: 'recurso', tool: '¿Te recomienda la IA?' })
      }
    } catch {
      setError('No pude conectar. Intenta de nuevo.')
    } finally {
      setBusy(false)
    }
  }, [f, ready, busy])

  const max = res ? Math.max(res.mentions, ...res.rivals.map((r) => r.count), 1) : 1
  const answered = res ? res.answers.filter((a) => !a.failed).length : 5

  return (
    <>
      <AppHeader
        top="AI·REC"
        bottom="IA·05"
        cable="GRATIS"
        message={busy ? 'Preguntando a Gemini (5 preguntas)…'
          : res ? `${res.domain}: aparece en ${res.mentions} de ${answered} respuestas`
            : 'Cuando alguien le pregunta a la IA por tu servicio, ¿te recomienda?'}
      />

      <div className="x-dev">
        <div className="x-brand"><span><b>IA·05</b> ¿te recomienda la IA?</span><span>5 preguntas de compra</span></div>
        <form className="s-in c-in" onSubmit={run}>
          <input value={f.domain} onChange={set('domain')} placeholder="tu-dominio.com" aria-label="Tu dominio" inputMode="url" autoCapitalize="off" spellCheck={false} />
          <input value={f.brand} onChange={set('brand')} placeholder="Nombre de tu marca (opcional)" aria-label="Nombre de tu marca" />
          <input value={f.service} onChange={set('service')} placeholder="Tu servicio, ej. consultoría de CRM" aria-label="Tu servicio" maxLength={80} />
          <select value={f.market} onChange={set('market')} aria-label="Mercado" className="i-sel">{MARKETS.map((m) => <option key={m}>{m}</option>)}</select>
          <input value={f.email} onChange={set('email')} type="email" placeholder="Tu correo de trabajo" aria-label="Tu correo" autoComplete="email" />
          <div className="hidden" aria-hidden="true"><input name="sr_trap" tabIndex={-1} autoComplete="off" value={f.sr_trap} onChange={set('sr_trap')} /></div>
          <button type="submit" disabled={busy || !ready}>{busy ? '···' : 'PREGUNTAR'}</button>
        </form>
        <p className="s-help">Un diagnóstico gratis al día por correo. Uso tu correo para enviarte el resultado y, si quieres, dar seguimiento. <a href="/privacidad">Aviso de privacidad</a>.</p>
        {error && <p className="s-err" role="alert">{error}</p>}

        <div className={`e-lcd${busy ? ' busy' : ''}`}>
          {res ? (
            <>
              <div className="i-big"><b>{res.mentions} / {answered}</b><span>respuestas que te mencionan{answered < 5 ? ` · ${5 - answered} sin respuesta (IA saturada)` : ''}</span></div>
              <div className="i-qs">
                {res.answers.map((a, i) => (
                  <button key={a.q} type="button" disabled={a.failed} className={`i-q ${a.mentioned ? 'y' : 'n'}${open === i ? ' on' : ''}`} onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                    P{i + 1} · {a.q}
                    <b>{a.failed ? '—' : a.mentioned ? 'SÍ' : 'NO'}</b>
                    <small>{a.failed ? 'sin respuesta' : a.position ? `lugar ${a.position} de ${a.of}` : a.mentioned ? 'solo como fuente' : 'no apareces'}</small>
                  </button>
                ))}
              </div>
              {open !== null && <div className="i-ans"><b>Respuesta de Gemini a P{open + 1}:</b>{'\n'}{res.answers[open].text}</div>}
              <div className="i-sov">
                {[{ domain: res.domain, count: res.mentions, you: true }, ...res.rivals.map((r) => ({ ...r, you: false }))]
                  .sort((a, b) => b.count - a.count)
                  .map((r) => (
                    <div key={r.domain} className={r.you ? 'you' : ''}>
                      <span>{r.domain}{r.you ? ' · TÚ' : ''}</span>
                      <div className="b"><i style={{ width: `${(r.count / max) * 100}%` }} /></div>
                      <span>{r.count}/5</span>
                    </div>
                  ))}
              </div>
            </>
          ) : <p className="c-idle">{busy ? 'Gemini está respondiendo cada pregunta…' : 'Escribe tu dominio, tu servicio y tu correo.'}</p>}
        </div>

        {res && (
          <>
            <div className="x-grid">
              {res.grounded ? (
                <div className="x-card">
                  <h3><i className={`s-led ${res.sources.length ? 'warn' : ''}`} aria-hidden="true" />Fuentes que consultó la IA</h3>
                  {res.sources.length ? <div className="x-chips">{res.sources.map((s) => <span key={s.domain} className="x-chip">{s.domain}<small>{s.count}</small></span>)}</div>
                    : <span className="x-none">Gemini no reportó fuentes.</span>}
                </div>
              ) : (
                <div className="x-card">
                  <h3><i className="s-led warn" aria-hidden="true" />De dónde sale esta respuesta</h3>
                  <p className="i-quote">Gemini respondió con lo que aprendió en su entrenamiento, sin buscar en vivo. Mide si tu marca ya forma parte de lo que la IA “sabe” de tu categoría, igual que cuando alguien usa un chat sin búsqueda.</p>
                </div>
              )}
              <div className="x-card">
                <h3><i className={`s-led ${res.quote ? 'ok' : 'bad'}`} aria-hidden="true" />Cómo te describe</h3>
                {res.quote ? <p className="i-quote">“{res.quote}”</p> : <span className="x-none">No te menciona, así que no hay descripción.</span>}
              </div>
            </div>
            {res.findings.length > 0 && (
              <div className="x-dx">
                <h3>Diagnóstico · lo que significa</h3>
                <ol>{res.findings.map((x) => <li key={x.title}><b>{x.title}.</b> {x.detail}</li>)}</ol>
              </div>
            )}
            <div className="s-keys">
              <button type="button" className="btn or" onClick={() => window.print()}>Guardar diagnóstico en PDF ▸</button>
              <a className="btn" href="/recursos/auditor-aeo" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>¿Pueden leer tu sitio los bots? ▸</a>
            </div>
          </>
        )}
      </div>

      {res && (
        <section className="te-print" aria-hidden="true">
          <span className="tag">soyroman.com · ¿Te recomienda la IA?</span>
          <h2 className="pt">{res.domain}: {res.mentions} de {answered} respuestas</h2>
          <p>Servicio: {res.service} · {res.market}. Preguntado a Gemini ({res.model}){res.grounded ? ' con búsqueda en Google' : ', sin búsqueda en vivo,'} el {new Date(res.at).toLocaleDateString('es-MX')}.</p>
          <table>
            <thead><tr><th>Pregunta</th><th>¿Te menciona?</th><th>Lugar</th></tr></thead>
            <tbody>{res.answers.map((a) => <tr key={a.q}><td>{a.q}</td><td>{a.failed ? 'Sin respuesta' : a.mentioned ? 'Sí' : 'No'}</td><td>{a.position ? `${a.position} de ${a.of}` : '—'}</td></tr>)}</tbody>
          </table>
          <h3>Competidores que menciona</h3>
          <p>{res.rivals.map((r) => `${r.domain} (${r.count}/5)`).join(' · ') || '—'}</p>
          {res.grounded && <><h3>Fuentes que consultó</h3><p>{res.sources.map((s) => s.domain).join(' · ') || '—'}</p></>}
          <h3>Diagnóstico</h3>
          <ol>{res.findings.map((x) => <li key={x.title}><b>{x.title}.</b> {x.detail}</li>)}</ol>
          <p>Las respuestas de la IA cambian con el tiempo y entre motores (ChatGPT, Perplexity, Gemini); esto es una foto de hoy en Gemini.</p>
          <p>¿Quieres revisarlo juntos? contacto@soyroman.com · soyroman.com/consultoria</p>
        </section>
      )}
    </>
  )
}
