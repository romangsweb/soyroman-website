import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import { getMyProfile } from '@/actions/tallerProfile'
import { RunRadar } from '@/components/taller/RunRadar'
import { TallerNav } from '@/components/taller/TallerNav'
import { currentUser } from '@/lib/auth'
import { fecha } from '@/lib/taller/dates'
import { completeness } from '@/lib/taller/profile'
import { RADAR_EVERY_DAYS, radarChanges, radarHistory, radarReady } from '@/lib/taller/radar'

export const maxDuration = 60

type Answer = { q: string; mentioned: boolean; position: number | null; failed?: boolean }
type Finding = { title: string; detail: string }

const mes = (d: Date) => d.toLocaleDateString('es-MX', { month: 'short', timeZone: 'America/Mexico_City' }).replace('.', '')

export default async function RadarPage() {
  const user = await currentUser()
  if (!user) redirect('/entrar')
  const [profile, hist] = await Promise.all([getMyProfile(), radarHistory(user.id, 12)])
  const ready = radarReady(profile?.data)
  const [last, prev] = hist
  const next = last ? new Date(last.createdAt.getTime() + RADAR_EVERY_DAYS * 86_400_000) : null
  const canRun = ready && (!next || next.getTime() <= Date.now())
  const changes = last ? radarChanges(last, prev) : []
  const answers = ((last?.result as { answers?: Answer[] } | undefined)?.answers ?? []).filter((a) => !a.failed)
  const findings = ((last?.result as { findings?: Finding[] } | undefined)?.findings ?? []).slice(0, 3)
  const before = new Set(prev?.rivals.map((r) => r.domain) ?? [])
  const series = [...hist].reverse()

  return (
    <>
      <div className="tl-head">
        <div>
          <span className="tl-kicker">MI TALLER · CADA {RADAR_EVERY_DAYS} DÍAS</span>
          <h1>Radar de IA</h1>
          <p>
            {ready
              ? <>Cada mes le preguntamos a Gemini por «{profile!.data.service}» y vemos si menciona a {profile!.data.domain}.</>
              : <>Para activarlo llena en tu perfil el dominio y qué vendes.</>}
          </p>
        </div>
        {ready ? <RunRadar disabled={!canRun} label={last ? 'Correr ahora ▸' : 'Correr el primero ▸'} /> : <Link className="btn or" href="/taller/perfil">Ir a mi perfil ▸</Link>}
      </div>
      <TallerNav active="radar" profilePct={completeness(profile?.data ?? {})} admin={user.role === 'admin'} />

      {last ? (
        <>
          <section className="tl-lcd tl-radar" aria-label="Menciones por corrida">
            <span>MENCIONES EN {last.answered} PREGUNTAS · {series.length === 1 ? 'PRIMERA CORRIDA' : `ÚLTIMAS ${series.length} CORRIDAS`}</span>
            <div className="tl-radar-bars">
              {series.map((s) => (
                <div key={s.id}>
                  <b>{s.mentions}</b>
                  <span style={{ height: `${Math.max(4, (s.mentions / Math.max(s.answered, 1)) * 100)}%` }} className={s.mentions ? 'on' : ''} />
                  <small>{mes(s.createdAt)}</small>
                </div>
              ))}
            </div>
          </section>
          <p className="tl-fine">
            Última corrida: {fecha(last.createdAt)}{next ? ` · siguiente: ${fecha(next)}` : ''} · {last.market}
            {profile?.consentAlerts ? ' · te avisamos por correo si algo cambia' : ' · avisos por correo apagados (actívalos en tu perfil)'}
          </p>

          {changes.length > 0 && (
            <ul className="tl-list" aria-label="Cambios">
              {changes.map((c) => (
                <li key={c.text}><span className="tl-list-k">CAMBIO</span><span>{c.text}</span></li>
              ))}
            </ul>
          )}

          <div className="tl-row">
            <section className="tl-read" aria-labelledby="tl-ans">
              <h2 id="tl-ans" className="tl-h2">Respuestas</h2>
              <ul className="tl-list">
                {answers.map((a) => (
                  <li key={a.q}>
                    <span className="tl-list-k">{a.mentioned ? `TE MENCIONA${a.position ? ` · LUGAR ${a.position}` : ''}` : 'NO TE MENCIONA'}</span>
                    <span>{a.q}</span>
                  </li>
                ))}
              </ul>
              {findings.length > 0 && (
                <>
                  <h2 className="tl-h2">Qué haría</h2>
                  <ul className="tl-list">
                    {findings.map((f) => (
                      <li key={f.title}><span className="tl-list-k">{f.title.toUpperCase()}</span><small>{f.detail}</small></li>
                    ))}
                  </ul>
                </>
              )}
            </section>
            <section className="tl-card tl-lib" aria-labelledby="tl-riv">
              <span className="tl-card-top"><span id="tl-riv">COMPETIDORES QUE MENCIONA</span><span>{last.rivals.length}</span></span>
              {last.rivals.length ? (
                <ul className="tl-rivals">
                  {last.rivals.map((r) => (
                    <li key={r.domain}><span>{r.domain}{prev && !before.has(r.domain) ? <em> ▲ nuevo</em> : null}</span><small>{r.count} resp.</small></li>
                  ))}
                </ul>
              ) : (
                <span className="tl-card-when">Ninguno con sitio identificable.</span>
              )}
              <span className="tl-card-when">Mide Gemini sin búsqueda en vivo: sirve para ver la tendencia, no lo que responde cada motor.</span>
            </section>
          </div>
        </>
      ) : (
        <p className="tl-empty">
          {ready
            ? 'Aún no hay corridas. Corre la primera ahora; después se repite sola cada mes.'
            : 'Sin dominio y servicio en tu perfil, el radar no sabe por qué preguntar.'}
        </p>
      )}
    </>
  )
}
