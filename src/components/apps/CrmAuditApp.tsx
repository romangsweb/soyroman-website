'use client'

import React, { useCallback, useState } from 'react'

import { FIELD_LABEL, auditRows, demoRows, parseCSV, readCsvFile, type CrmAudit } from '@/lib/crmAudit'
import { AppHeader } from './Panels'
import { Gate } from './Gate'
import { useToolTracking } from './useToolTracking'

const pct = (x: number, n: number) => (n ? `${((x / n) * 100).toFixed(x / n < 0.1 ? 1 : 0)}%` : '—')
const tone = (share: number, warn: number, bad: number) => (share >= bad ? 'bad' : share >= warn ? 'warn' : 'ok')

export function CrmAuditApp() {
  const [res, setRes] = useState<CrmAudit | null>(null)
  const [source, setSource] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [over, setOver] = useState(false)
  const [gate, setGate] = useState(false)
  useToolTracking('Auditoría de CRM', res ? res.total : null, gate)

  const run = useCallback(async (getRows: () => Promise<string[][]>, label: string) => {
    setBusy(true)
    setError('')
    setRes(null)
    try {
      await new Promise((r) => setTimeout(r, 30)) // deja pintar el estado "analizando"
      setRes(auditRows(await getRows()))
      setSource(label)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pude leer el archivo.')
    } finally {
      setBusy(false)
    }
  }, [])

  const onFile = (f?: File | null) => {
    if (!f) return
    if (f.size > 40 * 1024 * 1024) return setError('El archivo pesa más de 40 MB. Exporta solo las columnas principales.')
    run(async () => parseCSV(await readCsvFile(f)), f.name)
  }

  const print = useCallback(() => {
    setGate(false)
    setTimeout(() => window.print(), 150)
  }, [])

  const n = res?.total || 0
  const staleShare = res && res.withDate ? res.stale / res.withDate : 0
  const tiles = res
    ? [
        { v: n.toLocaleString('es-MX'), l: 'contactos', t: 'ok' },
        { v: pct(res.dupEmail, n), l: 'duplicados por correo', t: tone(res.dupEmail / n, 0.02, 0.08) },
        { v: pct(res.dupName, n), l: 'duplicados probables', t: tone(res.dupName / n, 0.02, 0.06) },
        { v: pct(res.invalid, n), l: 'correos inválidos', t: tone(res.invalid / n, 0.01, 0.04) },
        { v: res.noOwner == null ? '—' : pct(res.noOwner, n), l: 'sin propietario', t: res.noOwner == null ? 'off' : tone(res.noOwner / n, 0.1, 0.3) },
        { v: res.withDate ? `${(staleShare * 100).toFixed(0)}%` : '—', l: 'sin actividad en 12 meses', t: res.withDate ? tone(staleShare, 0.3, 0.5) : 'off' },
      ]
    : []
  const maxStage = res ? Math.max(1, ...res.stages.map((s) => s[1])) : 1
  const summary = res
    ? [
        `Contactos: ${n} · Salud: ${res.score}/100`,
        `Duplicados por correo ${pct(res.dupEmail, n)} · probables ${pct(res.dupName, n)} · inválidos ${pct(res.invalid, n)} · sin propietario ${res.noOwner == null ? '—' : pct(res.noOwner, n)} · sin actividad 12m ${res.withDate ? `${(staleShare * 100).toFixed(0)}%` : '—'}`,
        ...res.findings.map((f, i) => `${i + 1}. ${f.title}`),
      ].join('\n')
    : ''

  return (
    <>
      <AppHeader
        top="CRM"
        bottom="AUDIT"
        cable="PRIVADO"
        message={gate ? 'Ingresa tu correo para recibir el plan (solo cifras, nunca tus contactos)'
          : busy ? 'Analizando en tu navegador…'
            : res ? `${n.toLocaleString('es-MX')} contactos · salud ${res.score}/100 · ${res.findings.length} hallazgos`
              : '¿Qué tan sana está tu base de contactos?'}
      />

      <div className="x-dev">
        <div className="x-brand"><span><b>CRM·01</b> auditoría de base de contactos</span><span>HubSpot · Salesforce · Pipedrive · Zoho</span></div>
        <label
          className={`ca-drop${over ? ' over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setOver(true) }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); onFile(e.dataTransfer.files?.[0]) }}
        >
          <input type="file" accept=".csv,text/csv" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          <span className="ca-ico" aria-hidden="true">⇪</span>
          <span className="ca-txt">
            Arrastra aquí la exportación CSV de tus contactos o haz clic para elegirla.
            <small>Detecta solas las columnas: correo, nombre, empresa, propietario, etapa del ciclo de vida, última actividad</small>
          </span>
        </label>
        <div className="ca-row">
          <span className="ca-priv"><i aria-hidden="true" />Se procesa en tu navegador: el archivo no se sube a ningún servidor</span>
          <button type="button" className="btn" disabled={busy} onClick={() => run(async () => demoRows(), 'datos de ejemplo')}>Usar datos de ejemplo</button>
        </div>
        {error && <p className="s-err" role="alert">{error}</p>}

        {(res || busy) && (
          <div className={`e-lcd${busy ? ' busy' : ''}`}>
            {res ? (
              <>
                <div className="ca-top">
                  <div className={`ca-score ${res.score >= 75 ? 'ok' : res.score >= 50 ? 'warn' : 'bad'}`}>
                    <b>{res.score}</b>
                    <span>salud de la base / 100</span>
                  </div>
                  <div className="ca-tiles">
                    {tiles.map((t) => <div key={t.l} className={`ca-tile ${t.t}`}><b>{t.v}</b><span>{t.l}</span></div>)}
                  </div>
                </div>
                <p className="ca-src">Fuente: {source}{res.truncated ? ' · analizadas las primeras 100,000 filas' : ''} · columnas detectadas: {res.columns.join(', ')}</p>
              </>
            ) : <p className="c-idle">Analizando en tu navegador…</p>}
          </div>
        )}
        <p className="s-help">La salud es una calificación de soyroman que pondera duplicados, completitud, propietario y actividad; no es un estándar de la industria.</p>

        {res && (
          <>
            <div className="x-grid">
              <div className="x-card">
                <h3>Completitud por campo</h3>
                {Object.entries(res.completeness).map(([k, v]) => (
                  <div key={k} className="ca-bar"><span>{FIELD_LABEL[k]}</span><i><em style={{ width: `${v * 100}%`, background: v > 0.8 ? '#3ddc84' : v > 0.5 ? '#f2c14e' : '#e85a2a' }} /></i><small>{(v * 100).toFixed(0)}%</small></div>
                ))}
              </div>
              <div className="x-card">
                <h3>Distribución por etapa</h3>
                {res.stages.length ? res.stages.map(([s, c]) => (
                  <div key={s} className="ca-bar"><span>{s}</span><i><em style={{ width: `${(c / maxStage) * 100}%`, background: '#e85a2a' }} /></i><small>{pct(c, n)}</small></div>
                )) : <span className="x-none">No encontré la columna de etapa del ciclo de vida.</span>}
              </div>
            </div>
            <div className="x-dx">
              <h3>Diagnóstico · por dónde empezar</h3>
              <ol>{res.findings.length ? res.findings.map((f) => <li key={f.title}><b>{f.title}.</b> {f.fix}</li>) : <li>La base está en buen estado en los indicadores revisados.</li>}</ol>
            </div>
            {gate ? (
              <div className="s-gate">
                <Gate
                  tool="Auditoría de CRM"
                  summary={summary}
                  meta={{ slug: 'auditoria-crm', score: res.score, finding: res.findings[0]?.title, items: res.findings.slice(0, 3).map((f) => ({ t: f.title, fix: `Qué hacer: ${f.fix}` })) }}
                  onDone={print}
                  onCancel={() => setGate(false)}
                />
              </div>
            ) : (
              <div className="s-keys">
                <button type="button" className="btn or" onClick={() => setGate(true)}>Plan de depuración por correo ▸</button>
                <a className="btn" href="/consultoria#revops" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>¿Lo depuramos juntos? ▸</a>
              </div>
            )}
          </>
        )}
      </div>

      {res && (
        <section className="te-print" aria-hidden="true">
          <span className="tag">soyroman.com · Auditoría de CRM</span>
          <h2 className="pt">Salud de la base: {res.score}/100</h2>
          <p>{n.toLocaleString('es-MX')} contactos analizados en el navegador el {new Date().toLocaleDateString('es-MX')}. El archivo no se subió a ningún servidor.</p>
          <table>
            <thead><tr><th>Indicador</th><th>Resultado</th></tr></thead>
            <tbody>{tiles.map((t) => <tr key={t.l}><td>{t.l}</td><td>{t.v}</td></tr>)}</tbody>
          </table>
          <h3>Completitud por campo</h3>
          <p>{Object.entries(res.completeness).map(([k, v]) => `${FIELD_LABEL[k]} ${(v * 100).toFixed(0)}%`).join(' · ')}</p>
          <h3>Plan de depuración, en orden</h3>
          <ol>{res.findings.map((f) => <li key={f.title}><b>{f.title}.</b> {f.fix}</li>)}</ol>
          <p>La salud es una calificación de soyroman, no un estándar de la industria.</p>
          <p>¿Quieres depurarla juntos? contacto@soyroman.com · soyroman.com/consultoria</p>
        </section>
      )}
    </>
  )
}
