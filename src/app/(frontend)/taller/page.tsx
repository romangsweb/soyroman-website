import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import { getMyProfile } from '@/actions/tallerProfile'
import { ClaimPending, SignOut } from '@/components/taller/ClaimPending'
import { TallerNav } from '@/components/taller/TallerNav'
import { currentUser } from '@/lib/auth'
import { hace } from '@/lib/taller/dates'
import { completeness } from '@/lib/taller/profile'
import { lastRunPerTool, libraryFor } from '@/lib/taller/queries'
import { radarHistory } from '@/lib/taller/radar'
import { recommendPosts } from '@/lib/taller/recommend'
import { TALLER_TOOLS, fmtMetric, tallerTool } from '@/lib/taller/tools'

export default async function TallerPage() {
  const user = await currentUser()
  if (!user) redirect('/entrar')
  const [last, profile, lib, radar] = await Promise.all([lastRunPerTool(user.id), getMyProfile(), libraryFor(user.id), radarHistory(user.id, 6)])
  const recs = await recommendPosts(last.map((r) => r.slug), lib.readPosts).catch(() => [])
  const pct = completeness(profile?.data ?? {})
  const unused = TALLER_TOOLS.filter((t) => !last.some((r) => r.slug === t.slug))

  return (
    <>
      <div className="tl-head">
        <div>
          <span className="tl-kicker">MI TALLER</span>
          <h1>Tu taller</h1>
          <p>{user.email}</p>
        </div>
        <SignOut />
      </div>
      <TallerNav active="panel" profilePct={pct} admin={user.role === 'admin'} />
      <ClaimPending />
      {pct < 100 && (
        <Link href="/taller/perfil" className="tl-profile-cta">
          <span>
            <b>{pct === 0 ? 'Llena tu perfil de empresa' : 'Completa tu perfil de empresa'}</b>
            <small>Tu meta, ticket, ciclo y tasas precargan las herramientas: no vuelves a capturar lo mismo.</small>
          </span>
          <span className="tl-bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
          <em>{pct}% ▸</em>
        </Link>
      )}

      <section aria-labelledby="tl-apa">
        <h2 id="tl-apa" className="tl-h2">Mis aparatos</h2>
        {last.length ? (
          <div className="tl-grid">
            {last.map((r) => {
              const t = tallerTool(r.slug)
              if (!t) return null
              const head = t.metrics.find((m) => m.key === t.headline)
              return (
                <Link key={r.slug} href={`/taller/historial/${r.slug}`} className="tl-card">
                  <span className="tl-card-top"><span>{t.code}</span><span>{r.total === 1 ? '1 corrida' : `${r.total} corridas`}</span></span>
                  <span className="tl-lcd">
                    <span>{head?.label}</span>
                    <b>{fmtMetric(t, t.headline, r.metrics[t.headline])}</b>
                  </span>
                  <span className="tl-card-name">{t.name}</span>
                  <span className="tl-card-when">{r.label ? `${r.label} · ` : ''}{hace(r.createdAt)}</span>
                </Link>
              )
            })}
          </div>
        ) : (
          <p className="tl-empty">Aún no guardas resultados. Usa una herramienta y pulsa «Guardar en mi taller».</p>
        )}
      </section>

      <Link href="/taller/radar" className="tl-profile-cta tl-radar-cta">
        <span>
          <b>Radar de IA</b>
          <small>
            {radar[0]
              ? `${radar[0].mentions} de ${radar[0].answered} respuestas te mencionan · ${hace(radar[0].createdAt)}`
              : 'Cada mes revisamos si la IA recomienda tu empresa. Actívalo con tu dominio y qué vendes.'}
          </small>
        </span>
        <span className="tl-mini" aria-hidden="true">
          {[...radar].reverse().map((r) => <i key={r.id} style={{ height: `${Math.max(8, (r.mentions / Math.max(r.answered, 1)) * 100)}%` }} />)}
        </span>
        <em>ver ▸</em>
      </Link>

      <div className="tl-row">
        <section aria-labelledby="tl-leer" className="tl-read">
          <h2 id="tl-leer" className="tl-h2">Para leer</h2>
          {recs.length ? (
            <ul className="tl-list">
              {recs.map((p) => (
                <li key={p.slug}>
                  <span className="tl-list-k">{p.why.toUpperCase()}</span>
                  <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                  {p.minutes ? <small>{p.minutes} min de lectura</small> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="tl-empty">Pronto habrá lecturas para ti según las herramientas que uses.</p>
          )}
        </section>
        <Link href="/taller/biblioteca" className="tl-card tl-lib">
          <span className="tl-card-top"><span>BIBLIOTECA</span><span>ver ▸</span></span>
          <span className="tl-lib-n">
            <span className="tl-lcd"><span>GUARDADOS</span><b>{lib.saved.length}</b></span>
            <span className="tl-lcd"><span>LEÍDOS</span><b>{lib.read.length}</b></span>
          </span>
          <span className="tl-card-when">Guarda artículos y términos desde el blog y el glosario.</span>
        </Link>
      </div>

      {unused.length > 0 && (
        <section aria-labelledby="tl-more">
          <h2 id="tl-more" className="tl-h2">Para guardar en tu taller</h2>
          <div className="tl-links">
            {unused.map((t) => (
              <Link key={t.slug} href={`/recursos/${t.slug}`} className="btn">{t.name} ▸</Link>
            ))}
          </div>
          <p className="tl-fine">Los diagnósticos y analizadores se conectarán al taller más adelante.</p>
        </section>
      )}
    </>
  )
}
