'use client'

import { useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'

import { saveProfile, type ProfileRecord } from '@/actions/tallerProfile'
import { FEEDS, GROUPS, SIZES, completeness, type FieldDef, type ProfileData } from '@/lib/taller/profile'

type Draft = Record<string, string>

const toDraft = (p: ProfileData): Draft => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, String(v)]))

/** dominio limpio: sin protocolo, www, ruta ni mayúsculas */
const cleanDomain = (s: string) => s.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[/?#]/)[0]

function toData(d: Draft): ProfileData {
  const out: Record<string, unknown> = {}
  for (const g of GROUPS)
    for (const f of g.fields) {
      const raw = (d[f.id] ?? '').trim()
      if (!raw) continue
      if (f.kind === 'text') out[f.id] = f.id === 'domain' ? cleanDomain(raw) : raw
      else if (f.kind === 'select' || f.kind === 'model') out[f.id] = raw
      else {
        const n = Number(raw.replace(/,/g, ''))
        if (!Number.isFinite(n)) continue
        if (f.kind === 'size') out[f.id] = n
        else out[f.id] = Math.min(f.max, Math.max(f.min, n))
      }
    }
  return out as ProfileData
}

export function ProfileForm({ initial }: { initial: ProfileRecord | null }) {
  const router = useRouter()
  const [d, setD] = useState<Draft>(() => toDraft(initial?.data ?? {}))
  const [bench, setBench] = useState(initial?.consentBenchmarks ?? false)
  const [alerts, setAlerts] = useState(initial?.consentAlerts ?? true)
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const data = useMemo(() => toData(d), [d])
  const pct = completeness(data)
  const set = (id: string, v: string) => {
    setD((x) => ({ ...x, [id]: v }))
    setState('idle')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('saving')
    const r = await saveProfile({ data, consentBenchmarks: bench, consentAlerts: alerts }).catch(() => ({ ok: false }))
    setState(r.ok ? 'saved' : 'error')
    if (r.ok) router.refresh()
  }

  const field = (f: FieldDef) => {
    const id = `pf-${f.id}`
    const missing = !(d[f.id] ?? '').trim()
    const head = (
      <span className="tl-f-head">
        <label htmlFor={id}>{f.label}</label>
        <span className={missing ? 'tl-miss' : 'tl-ok'}>{missing ? 'falta' : '✓'}</span>
      </span>
    )
    let input: React.ReactNode
    if (f.kind === 'select') {
      input = (
        <select id={id} value={d[f.id] ?? ''} onChange={(e) => set(f.id, e.target.value)}>
          <option value="">Elige…</option>
          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      )
    } else if (f.kind === 'size') {
      input = (
        <select id={id} value={d[f.id] ?? ''} onChange={(e) => set(f.id, e.target.value)}>
          <option value="">Elige…</option>
          {SIZES.map((s, i) => <option key={s} value={i}>{s}</option>)}
        </select>
      )
    } else if (f.kind === 'model') {
      input = (
        <select id={id} value={d[f.id] ?? ''} onChange={(e) => set(f.id, e.target.value)}>
          <option value="">Elige…</option>
          <option value="rec">Suscripción o servicio recurrente</option>
          <option value="prj">Proyecto + recurrente</option>
        </select>
      )
    } else if (f.kind === 'text') {
      input = <input id={id} type="text" maxLength={f.max} placeholder={f.ph} value={d[f.id] ?? ''} onChange={(e) => set(f.id, e.target.value)} />
    } else {
      input = (
        <span className="tl-num">
          {f.unit === '$' && <i aria-hidden="true">$</i>}
          <input id={id} type="number" inputMode="decimal" min={f.min} max={f.max} step={f.step} value={d[f.id] ?? ''} onChange={(e) => set(f.id, e.target.value)} />
          {f.unit && f.unit !== '$' && <i aria-hidden="true">{f.unit}</i>}
        </span>
      )
    }
    return (
      <div key={f.id} className="tl-f">
        {head}
        {input}
        {f.hint && <small>{f.hint}</small>}
      </div>
    )
  }

  return (
    <div className="tl-profile">
      <form className="tl-form" onSubmit={submit}>
        <div className="tl-meter">
          <span>Perfil completo</span>
          <b>{pct}%</b>
          <span className="tl-bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
        </div>
        {GROUPS.map((g) => (
          <fieldset key={g.title}>
            <legend>{g.title}</legend>
            <div className="tl-fields">{g.fields.map(field)}</div>
          </fieldset>
        ))}
        <fieldset>
          <legend>TUS DATOS</legend>
          <label className="tl-check">
            <input type="checkbox" checked={bench} onChange={(e) => { setBench(e.target.checked); setState('idle') }} />
            <span>Usar mis resultados de forma anónima para calcular medianas por industria y tamaño. Nunca se muestran resultados individuales.</span>
          </label>
          <label className="tl-check">
            <input type="checkbox" checked={alerts} onChange={(e) => { setAlerts(e.target.checked); setState('idle') }} />
            <span>Avisarme por correo de cambios en mis herramientas (por ejemplo, el radar de IA cuando llegue).</span>
          </label>
        </fieldset>
        <div className="tl-links">
          <button type="submit" className="btn or" disabled={state === 'saving'}>{state === 'saving' ? 'Guardando…' : 'Guardar perfil ▸'}</button>
          {state === 'saved' && <span className="tl-ok-msg" role="status">Guardado ✓ · las herramientas ya se precargan</span>}
          {state === 'error' && <span className="tl-err" role="alert">No se pudo guardar. Revisa los valores.</span>}
        </div>
      </form>
      <aside className="tl-lcd tl-feeds">
        <span>QUÉ PRECARGA</span>
        {FEEDS.map(([a, b]) => (
          <p key={a}><b>{a}</b><small>{b}</small></p>
        ))}
      </aside>
    </div>
  )
}
