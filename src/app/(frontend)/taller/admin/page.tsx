import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import React from 'react'

import { TallerNav } from '@/components/taller/TallerNav'
import { RECURSOS } from '@/data/recursos'
import { currentUser } from '@/lib/auth'
import { adminStats } from '@/lib/taller/admin'
import { fecha, hace } from '@/lib/taller/dates'
import { SIZES } from '@/lib/taller/profile'

const PERIODS = [30, 90, 365]
const nf = (x: number) => x.toLocaleString('es-MX')
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—')
const toolName = (slug: string) => RECURSOS.find((r) => r.slug === slug)?.name ?? slug

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const user = await currentUser()
  if (!user) redirect('/entrar')
  if (user.role !== 'admin') notFound()
  const d = Number((await searchParams).d)
  const days = PERIODS.includes(d) ? d : 30
  const s = await adminStats(days)

  const funnel = [
    { label: 'Vistas de herramientas', n: s.views, note: 'eventos' },
    { label: 'Usos (empezaron a mover datos)', n: s.starts, note: pct(s.starts, s.views) + ' de las vistas' },
    { label: 'Pidieron el PDF o plan', n: s.leads, note: pct(s.leads, s.starts) + ' de los usos' },
    { label: 'Cuentas nuevas', n: s.newUsers, note: `${nf(s.totalUsers)} en total` },
    { label: 'Volvieron (2+ días)', n: s.returning, note: pct(s.returning, s.activeUsers) + ' de las activas' },
    { label: 'Clics en agendar', n: s.agendas, note: 'en todo el sitio' },
  ]
  const top = Math.max(...funnel.map((f) => f.n), 1)

  return (
    <>
      <div className="tl-head">
        <div>
          <span className="tl-kicker">MI TALLER · ADMIN</span>
          <h1>Uso del sitio</h1>
          <p>Últimos {days} días. No incluye tu actividad con sesión abierta.</p>
        </div>
        <nav className="tl-links" aria-label="Periodo">
          {PERIODS.map((p) => (
            <Link key={p} href={`/taller/admin?d=${p}`} className={`btn${p === days ? ' or' : ''}`} aria-current={p === days ? 'page' : undefined}>
              {p} días
            </Link>
          ))}
        </nav>
      </div>
      <TallerNav active="admin" admin />

      <section className="tl-kpis" aria-label="Indicadores">
        {[
          ['USOS DE HERRAMIENTAS', nf(s.starts), `${nf(s.completes)} llegaron al resultado`],
          ['PERSONAS', nf(s.people), 'únicas, solo quienes aceptaron cookies'],
          ['CUENTAS NUEVAS', nf(s.newUsers), `${nf(s.totalUsers)} en total`],
          ['ACTIVAS', nf(s.activeUsers), `${nf(s.returning)} volvieron 2+ días`],
          ['RESULTADOS GUARDADOS', nf(s.saves), `por ${nf(s.savers)} cuentas`],
          ['AGENDAS', nf(s.agendas), 'clics en agendar'],
        ].map(([k, v, sub]) => (
          <div key={k} className="tl-lcd tl-kpi">
            <span>{k}</span>
            <b>{v}</b>
            <small>{sub}</small>
          </div>
        ))}
      </section>

      <section aria-labelledby="tl-fun">
        <h2 id="tl-fun" className="tl-h2">Embudo del taller</h2>
        <div className="tl-funnel">
          {funnel.map((f, i) => (
            <div key={f.label}>
              <span className="tl-funnel-bar"><span style={{ height: `${Math.max(4, (f.n / top) * 100)}%` }} className={i === funnel.length - 1 ? 'or' : ''} /></span>
              <b>{nf(f.n)}</b>
              <span>{f.label}</span>
              <small>{f.note}</small>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="tl-tools">
        <h2 id="tl-tools" className="tl-h2">Uso por herramienta</h2>
        {s.tools.length ? (
          <div className="tl-table">
            <table>
              <thead>
                <tr><th>Herramienta</th><th>Vistas</th><th>Usos</th><th>Resultado</th><th>PDF</th><th>Guardados</th><th>Compartidos</th><th>Agendas</th><th>Personas</th></tr>
              </thead>
              <tbody>
                {s.tools.map((t) => (
                  <tr key={t.slug}>
                    <td><Link href={`/recursos/${t.slug}`}>{toolName(t.slug)}</Link></td>
                    <td>{nf(t.views)}</td>
                    <td>{nf(t.starts)}</td>
                    <td>{nf(t.completes)}</td>
                    <td>{nf(t.leads)}</td>
                    <td>{nf(t.saves)}</td>
                    <td>{nf(t.shares)}</td>
                    <td>{nf(t.agendas)}</td>
                    <td>{nf(t.people)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="tl-empty">Todavía no hay eventos en este periodo. El registro empezó con este despliegue.</p>
        )}
      </section>

      <div className="tl-row">
        <section aria-labelledby="tl-int" className="tl-read">
          <h2 id="tl-int" className="tl-h2">Cuentas con más actividad</h2>
          {s.intent.length ? (
            <ul className="tl-list">
              {s.intent.map((a) => (
                <li key={a.email}>
                  <span className="tl-list-k">{[a.industry, a.size != null ? `${SIZES[a.size] ?? ''} personas` : null].filter(Boolean).join(' · ') || 'SIN PERFIL'}</span>
                  <span>{a.email}</span>
                  <small>
                    {a.runs} resultados en {a.tools} herramientas{a.lastRun ? ` · último ${hace(a.lastRun)}` : ''} · cuenta desde {fecha(a.createdAt)}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p className="tl-empty">Aún no hay cuentas además de la tuya.</p>
          )}
        </section>
        <div className="tl-card tl-lib">
          <span className="tl-card-top"><span>MEDIANAS</span><span>M5</span></span>
          <span className="tl-lib-n">
            <span className="tl-lcd"><span>PERFILES</span><b>{nf(s.profiles)}</b></span>
            <span className="tl-lcd"><span>CON PERMISO</span><b>{nf(s.consented)}</b></span>
          </span>
          <span className="tl-card-when">Las medianas por segmento se publican con 30 empresas con permiso por segmento.</span>
        </div>
      </div>
    </>
  )
}
