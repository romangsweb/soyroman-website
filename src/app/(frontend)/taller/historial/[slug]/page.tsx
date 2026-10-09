import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import React from 'react'

import { DeleteRun } from '@/components/taller/DeleteRun'
import { currentUser } from '@/lib/auth'
import { fecha } from '@/lib/taller/dates'
import { runsFor } from '@/lib/taller/queries'
import { fmtMetric, tallerTool } from '@/lib/taller/tools'

export default async function HistorialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tool = tallerTool(slug)
  if (!tool) notFound()
  const user = await currentUser()
  if (!user) redirect('/entrar')
  const runs = await runsFor(user.id, slug)
  const [a, b] = runs // a = la más reciente, b = la anterior

  return (
    <>
      <div className="tl-head">
        <div>
          <span className="tl-kicker"><Link href="/taller">MI TALLER</Link> / HISTORIAL · {tool.code}</span>
          <h1>{tool.name}</h1>
        </div>
        <Link className="btn or" href={`/recursos/${slug}`}>Nueva corrida ▸</Link>
      </div>

      {a && b && (
        <section className="tl-lcd tl-delta" aria-label="Cambio contra la corrida anterior">
          <span>ÚLTIMA CONTRA LA ANTERIOR ({fecha(b.createdAt)} → {fecha(a.createdAt)})</span>
          <div>
            {tool.metrics.map((m) => {
              const x = a.metrics[m.key]
              const y = b.metrics[m.key]
              const d = x != null && y != null ? x - y : null
              return (
                <p key={m.key}>
                  <small>{m.label}</small>
                  <b>{fmtMetric(tool, m.key, x)}</b>
                  <em>{d == null || d === 0 ? 'igual' : `${d > 0 ? '+' : '−'}${fmtMetric(tool, m.key, Math.abs(d))}`}</em>
                </p>
              )
            })}
          </div>
        </section>
      )}

      {runs.length ? (
        <div className="tl-table">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                {tool.metrics.map((m) => <th key={m.key}>{m.label}</th>)}
                <th><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id}>
                  <td>{fecha(r.createdAt)}{r.label ? <small> · {r.label}</small> : null}</td>
                  {tool.metrics.map((m) => <td key={m.key}>{fmtMetric(tool, m.key, r.metrics[m.key])}</td>)}
                  <td className="tl-actions">
                    <Link href={tool.open(r.inputs)}>Abrir</Link>
                    <DeleteRun id={r.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="tl-empty">No hay corridas guardadas de esta herramienta.</p>
      )}
    </>
  )
}
