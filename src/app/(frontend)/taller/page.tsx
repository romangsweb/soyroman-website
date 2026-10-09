import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import { getMyProfile } from '@/actions/tallerProfile'
import { ClaimPending, SignOut } from '@/components/taller/ClaimPending'
import { TallerNav } from '@/components/taller/TallerNav'
import { currentUser } from '@/lib/auth'
import { hace } from '@/lib/taller/dates'
import { completeness } from '@/lib/taller/profile'
import { lastRunPerTool } from '@/lib/taller/queries'
import { TALLER_TOOLS, fmtMetric, tallerTool } from '@/lib/taller/tools'

export default async function TallerPage() {
  const user = await currentUser()
  if (!user) redirect('/entrar')
  const [last, profile] = await Promise.all([lastRunPerTool(user.id), getMyProfile()])
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
      <TallerNav active="panel" profilePct={pct} />
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
