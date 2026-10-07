'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'

import { AREAS, KINDS, type Area, type Kind, type Recurso } from '@/data/recursos'

type F = { area: Area | 'all'; kind: Kind | 'all' }
const AREA_IDS = Object.keys(AREAS) as Area[]
const KIND_IDS = Object.keys(KINDS) as Kind[]
const match = (r: Recurso, f: F) => (f.area === 'all' || r.areas.includes(f.area)) && (f.kind === 'all' || r.kind === f.kind)

const ROUTES: { title: string; desc: string; steps: [string, string][] }[] = [
  { title: 'Revisa tu sitio completo', desc: 'Para cuando tu web no genera leads y no sabes por qué.', steps: [['Stack', 'radiografia-stack'], ['Velocidad', 'velocidad-real'], ['Correo', 'salud-correo'], ['Comparador', 'comparador-competidores']] },
  { title: 'Aparece en Google y en la IA', desc: 'Para posicionar tu marca en buscadores y asistentes.', steps: [['Explorador', 'explorador-busquedas'], ['Auditor AEO', 'auditor-aeo'], ['¿Te recomienda la IA?', 'te-recomienda-la-ia']] },
  { title: 'Planea el año comercial', desc: 'De la meta de ventas al presupuesto y el pipeline.', steps: [['Embudo inverso', 'embudo-inverso'], ['Presupuesto', 'presupuesto-marketing'], ['CPL máximo', 'cpl-maximo'], ['Brecha', 'brecha-pipeline']] },
]

/** Consola de filtros + tarjetas. El filtro vive en la URL (?area=seo&tipo=sitio) para poder enlazarlo. */
export function RecursosGrid({ items }: { items: Recurso[] }) {
  const [f, setF] = useState<F>({ area: 'all', kind: 'all' })

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const area = p.get('area') as Area | null
    const kind = p.get('tipo') as Kind | null
    setF({ area: area && AREA_IDS.includes(area) ? area : 'all', kind: kind && KIND_IDS.includes(kind) ? kind : 'all' })
  }, [])

  const update = (next: F) => {
    setF(next)
    const p = new URLSearchParams()
    if (next.area !== 'all') p.set('area', next.area)
    if (next.kind !== 'all') p.set('tipo', next.kind)
    const qs = p.toString()
    window.history.replaceState(null, '', qs ? `/recursos?${qs}` : '/recursos')
  }

  const shown = items.filter((r) => match(r, f))
  const href = (slug: string) => items.find((r) => r.slug === slug)?.href

  return (
    <>
      <div className="r-console" role="group" aria-label="Filtrar herramientas">
        <div className="r-row">
          <span className="r-lab">Especialidad</span>
          <div className="r-keys">
            {(['all', ...AREA_IDS] as const).map((a) => (
              <button key={a} type="button" className={`r-key${f.area === a ? ' on' : ''}`} aria-pressed={f.area === a} data-area={a} onClick={() => update({ ...f, area: a })}>
                {a !== 'all' && <i className="r-led" aria-hidden="true" />}
                {a === 'all' ? 'Todas' : AREAS[a]} <small>{items.filter((r) => match(r, { ...f, area: a })).length}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="r-row">
          <span className="r-lab">Tipo</span>
          <div className="r-keys">
            {(['all', ...KIND_IDS] as const).map((k) => (
              <button key={k} type="button" className={`r-key${f.kind === k ? ' on' : ''}`} aria-pressed={f.kind === k} title={k === 'all' ? undefined : KINDS[k].hint} onClick={() => update({ ...f, kind: k })}>
                {k === 'all' ? 'Todos' : KINDS[k].label} <small>{items.filter((r) => match(r, { ...f, kind: k })).length}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="r-lcd" aria-live="polite">
          {shown.length} DE {items.length} HERRAMIENTAS{' '}
          <span>· {f.area === 'all' ? 'TODAS LAS ÁREAS' : AREAS[f.area].toUpperCase()} · {f.kind === 'all' ? 'TODOS LOS TIPOS' : `${KINDS[f.kind].label} · ${KINDS[f.kind].hint}`.toUpperCase()}</span>
        </div>
      </div>

      <div className="cards">
        {items.map((a, i) => {
          if (!match(a, f)) return null
          const tags = (
            <div className="r-tags">
              {a.areas.map((x) => <span key={x} className="r-tg" data-area={x}><i aria-hidden="true" />{AREAS[x]}</span>)}
              <span className="r-tg k">{KINDS[a.kind].label}</span>
            </div>
          )
          return a.href ? (
            <Link key={a.code} href={a.href} className={`card${a.isNew ? ' new' : ''}`}>
              <div className="ct"><span>{String(i + 1).padStart(2, '0')} · {a.name}</span><span>{a.isNew ? 'NUEVO ▸' : '▸'}</span></div>
              <div className="cm">{a.code}</div>
              <p className="cd">{a.desc}</p>
              {tags}
              <div className="cg" aria-hidden="true" />
            </Link>
          ) : (
            <div key={a.code} className="card soon" aria-disabled="true">
              <div className="ct"><span>{String(i + 1).padStart(2, '0')} · {a.name}</span><span>Pronto</span></div>
              <div className="cm" style={{ opacity: 0.45 }}>{a.code}</div>
              <p className="cd">{a.desc}</p>
              {tags}
              <div className="cg" aria-hidden="true" />
            </div>
          )
        })}
      </div>
      {!shown.length && <p className="r-empty">No hay herramientas con esa combinación. <button type="button" onClick={() => update({ area: 'all', kind: 'all' })}>Ver todas</button></p>}

      <h2 className="r-h2">Recorridos · por dónde empezar</h2>
      <div className="r-routes">
        {ROUTES.map((r) => (
          <div key={r.title} className="r-route">
            <h3>{r.title}</h3>
            <p>{r.desc}</p>
            <div className="r-steps">
              {r.steps.map(([label, slug], j) => (
                <React.Fragment key={slug}>
                  {j > 0 && <b aria-hidden="true">▸</b>}
                  {href(slug) ? <Link href={href(slug)!}>{label}</Link> : <span>{label}</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
