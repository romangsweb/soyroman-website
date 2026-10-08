'use client'

import React, { useCallback, useState } from 'react'

import type { Country, ExploreResult, Intent } from '@/lib/keywordExplore'
import { AppHeader } from './Panels'
import { Gate } from './Gate'
import { useToolTracking } from './useToolTracking'

const COUNTRY_LABEL: Record<Country, string> = { mx: 'México', co: 'Colombia', ar: 'Argentina', es: 'España' }
const INTENTS: { id: Intent; label: string; col: string }[] = [
  { id: 'inf', label: 'Informativa', col: 'Preguntas y aprendizaje' },
  { id: 'com', label: 'Comercial', col: 'Comparar y elegir' },
  { id: 'tra', label: 'Transaccional', col: 'Precio y compra' },
  { id: 'nav', label: 'Marca', col: 'Marcas que aparecen' },
]

export function KeywordApp() {
  const [seed, setSeed] = useState('')
  const [country, setCountry] = useState<Country>('mx')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [res, setRes] = useState<ExploreResult | null>(null)
  const [gate, setGate] = useState(false)
  useToolTracking('Explorador de búsquedas', res?.seed || null, gate)

  const run = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (seed.trim().length < 2 || busy) return
    setBusy(true)
    setError('')
    setRes(null)
    try {
      const r = await fetch('/next/keyword-explore', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seed, country }) })
      const d = await r.json()
      if (!r.ok) setError(d.error || 'No pude completar la exploración.')
      else setRes(d)
    } catch {
      setError('No pude conectar. Intenta de nuevo.')
    } finally {
      setBusy(false)
    }
  }, [seed, country, busy])

  const print = useCallback(() => {
    setGate(false)
    setTimeout(() => window.print(), 150)
  }, [])

  const total = res ? res.terms.length : 0
  const pct = (k: Intent) => (res && total ? Math.round((res.mix[k] / total) * 100) : 0)
  const summary = res
    ? [`Palabra: ${res.seed} (${COUNTRY_LABEL[res.country]})`, `${total} búsquedas · ${res.questions.length} preguntas`, '', ...res.clusters.map((c) => `${c.type}: ${c.title} (${c.count})`), '', ...res.questions.slice(0, 8)].join('\n')
    : ''

  return (
    <>
      <AppHeader
        top="SEARCH"
        bottom="KW·01"
        cable="GRATIS"
        message={gate ? 'Ingresa tu correo para descargar el mapa'
          : busy ? 'Leyendo el autocompletado de Google…'
            : res ? `"${res.seed}": ${total} búsquedas reales · ${res.questions.length} preguntas`
              : '¿Qué busca la gente alrededor de tu tema?'}
      />

      <div className="x-dev">
        <div className="x-brand"><span><b>KW·01</b> explorador de búsquedas</span><span>autocompletado de Google · {COUNTRY_LABEL[country]}</span></div>
        <form className="s-in c-in" onSubmit={run}>
          <input value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="ej. software de nómina" aria-label="Palabra a explorar" maxLength={60} />
          <select className="i-sel" value={country} onChange={(e) => setCountry(e.target.value as Country)} aria-label="País">
            {(Object.keys(COUNTRY_LABEL) as Country[]).map((c) => <option key={c} value={c}>{COUNTRY_LABEL[c]}</option>)}
          </select>
          <button type="submit" disabled={busy || seed.trim().length < 2}>{busy ? '···' : 'EXPLORAR'}</button>
        </form>
        {error && <p className="s-err" role="alert">{error}</p>}

        <div className={`e-lcd${busy ? ' busy' : ''}`}>
          {res ? (
            <>
              <div className="k-top">
                <div><b>{total}</b>búsquedas encontradas</div>
                <div><b>{res.questions.length}</b>preguntas</div>
                <div><b>{res.clusters.length || '—'}</b>temas</div>
              </div>
              <div className="k-mix" role="img" aria-label={INTENTS.map((i) => `${i.label} ${pct(i.id)}%`).join(', ')}>
                {INTENTS.map((i) => <i key={i.id} className={i.id} style={{ width: `${pct(i.id)}%` }} />)}
              </div>
              <div className="k-lg">{INTENTS.map((i) => <span key={i.id} className={i.id}>{i.label} {pct(i.id)}%</span>)}</div>
              <div className="k-cols">
                {INTENTS.map((i) => {
                  const list = res.terms.filter((t) => t.intent === i.id).slice(0, 8)
                  return (
                    <div key={i.id} className={`k-col ${i.id}`}>
                      <h4>{i.col}</h4>
                      {list.length ? (
                        <ul>{list.map((t) => (
                          <li key={t.q}>
                            <span className="k-sig" aria-label={`señal ${t.signal} de 10`}>{Array.from({ length: 10 }, (_, j) => <i key={j} className={j < t.signal ? 'on' : ''} />)}</span>
                            {t.q}
                          </li>
                        ))}</ul>
                      ) : <p className="k-none">—</p>}
                    </div>
                  )
                })}
              </div>
            </>
          ) : <p className="c-idle">{busy ? 'Consultando unas 30 variantes de tu palabra…' : 'Escribe una palabra o frase y elige el país.'}</p>}
        </div>
        <p className="s-help">La barrita es una señal de popularidad (qué tan arriba la sugiere Google y en cuántas variantes aparece), no búsquedas al mes. No guarda lo que escribes.</p>

        {res && (
          <>
            <div className="x-grid">
              <div className="x-card">
                <h3><i className={`s-led ${res.grouped ? 'ok' : 'warn'}`} aria-hidden="true" />Temas y qué escribir</h3>
                {res.clusters.length ? res.clusters.map((c) => (
                  <div key={c.name} className="v-row k-plan"><span><em className="k-ty">{c.type}</em>{c.title}</span><small>{c.count} búsquedas</small></div>
                )) : <span className="x-none">La IA estaba saturada y no pudo agrupar los temas; las búsquedas se clasificaron con reglas. Intenta de nuevo en unos minutos para ver el plan.</span>}
              </div>
              <div className="x-card">
                <h3><i className={`s-led ${res.questions.length ? 'ok' : ''}`} aria-hidden="true" />Preguntas para responder (AEO)</h3>
                {res.questions.length ? res.questions.map((q) => <div key={q} className="v-row"><span>{q}</span></div>)
                  : <span className="x-none">No aparecieron preguntas para esta palabra.</span>}
                <p className="k-tip">Úsalas como subtítulos (H2) y responde en la primera frase: es lo que leen los buscadores con IA.</p>
              </div>
            </div>
            {gate ? (
              <div className="s-gate"><Gate tool="Explorador de búsquedas" summary={summary} meta={res ? { slug: 'explorador-busquedas', finding: `${res.seed}: ${res.terms.length} búsquedas`, items: res.clusters.slice(0, 3).map((c) => ({ t: c.title, fix: `${c.type} · ${c.count} búsquedas relacionadas` })) } : undefined} onDone={print} onCancel={() => setGate(false)} /></div>
            ) : (
              <div className="s-keys">
                <button type="button" className="btn or" onClick={() => setGate(true)}>Mapa de contenido en PDF ▸</button>
                <a className="btn" href="/recursos/te-recomienda-la-ia" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>¿Te recomienda la IA? ▸</a>
              </div>
            )}
          </>
        )}
      </div>

      {res && (
        <section className="te-print" aria-hidden="true">
          <span className="tag">soyroman.com · Explorador de búsquedas</span>
          <h2 className="pt">Mapa de búsquedas: {res.seed}</h2>
          <p>{COUNTRY_LABEL[res.country]} · autocompletado de Google, {new Date(res.at).toLocaleDateString('es-MX')}. {total} búsquedas reales; la señal indica popularidad relativa, no volumen.</p>
          {res.clusters.length > 0 && (
            <table>
              <thead><tr><th>Tema</th><th>Pieza</th><th>Título sugerido</th><th>Búsquedas</th></tr></thead>
              <tbody>{res.clusters.map((c) => <tr key={c.name}><td>{c.name}</td><td>{c.type}</td><td>{c.title}</td><td>{c.count}</td></tr>)}</tbody>
            </table>
          )}
          <h3>Preguntas para responder</h3>
          <ol>{res.questions.map((q) => <li key={q}>{q}</li>)}</ol>
          <h3>Búsquedas por intención</h3>
          {INTENTS.map((i) => <p key={i.id}><b>{i.label}:</b> {res.terms.filter((t) => t.intent === i.id).slice(0, 15).map((t) => t.q).join(' · ') || '—'}</p>)}
          <p>¿Quieres armar el plan juntos? contacto@soyroman.com · soyroman.com/consultoria</p>
        </section>
      )}
    </>
  )
}
