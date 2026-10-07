import Link from 'next/link'
import React from 'react'

import { BrandTile } from '@/components/BrandIcon'
import { ProjectCover } from '@/components/ProjectCover'

export const SKILL_LEVELS = ['Básico', 'En desarrollo', 'Intermedio', 'Avanzado', 'Experto']
const TOOL_LEVELS: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 }
const TOOL_LABEL = ['Básico', 'Intermedio', 'Avanzado', 'Experto']

type Skill = { name?: string | null; level?: string | number | null }
export const skillList = (skills?: Skill[] | null) =>
  (skills || [])
    .filter((s) => s?.name)
    .map((s) => ({ name: s.name as string, level: Math.min(5, Math.max(1, Number(s.level) || 3)) }))

const H2 = ({ children, dark }: { children: React.ReactNode; dark?: boolean }) => (
  <h2 className={`font-mono font-bold text-[10px] uppercase tracking-widest mb-8 pb-4 border-b ${dark ? 'border-white/20 opacity-60' : 'border-black/15 opacity-50'}`}>
    {children}
  </h2>
)

/** Consola de mezcla: un canal por competencia; LED y fader marcan el nivel 1–5. */
export function SkillMixer({ title, skills }: { title: string; skills?: Skill[] | null }) {
  const list = skillList(skills)
  if (!list.length) return null
  return (
    <section className="border-b border-black bg-white p-8 md:p-16">
      <H2>// Panel de competencias</H2>
      <div className="bg-[#2a2d30] border-2 border-black rounded-[14px] px-4 pt-6 pb-5 md:px-6 text-[#e6e6e1] shadow-[0_8px_0_-2px_#c9c7bf,0_8px_0_0_#000] [font-family:var(--font-aldrich),ui-monospace,monospace]">
        <div className="flex justify-between text-[10px] tracking-[0.2em] uppercase text-[#a9aca7] mb-5">
          <span>Mezcla de competencias · {title}</span>
          <b className="font-normal text-[#e85a2a]">Nivel 1–5</b>
        </div>
        <ul className="grid grid-flow-col auto-cols-[minmax(84px,1fr)] gap-3 overflow-x-auto pb-2" aria-label={`Competencias en ${title}`}>
          {list.map((s, ci) => (
            <li key={s.name} className="flex flex-col items-center gap-3" aria-label={`${s.name}: ${SKILL_LEVELS[s.level - 1]}`}>
              <span aria-hidden="true" className="flex flex-col-reverse gap-1 p-2 bg-[#121416] border-[1.5px] border-black rounded-md">
                {Array.from({ length: 10 }).map((_, i) => {
                  const on = i < s.level * 2
                  const top = i === s.level * 2 - 1
                  return (
                    <i
                      key={i}
                      className={`block w-9 h-3.5 rounded-[2px] ${on ? (top ? 'bg-[#e85a2a] shadow-[0_0_8px_rgba(232,90,42,.6)]' : 'bg-[#e6e6e1]') : 'bg-[#33373a]'} ${on ? 'animate-[ledon_.35s_ease-out_both] motion-reduce:animate-none' : ''}`}
                      style={on ? { animationDelay: `${ci * 90 + i * 45}ms` } : undefined}
                    />
                  )
                })}
              </span>
              <span aria-hidden="true" className="relative w-2 h-[70px] bg-black rounded">
                <span className="absolute left-1/2 -ml-[15px] w-[30px] h-3.5 bg-[#e9e9e6] border-[1.5px] border-black rounded-[3px] shadow-[inset_0_-3px_0_#bbb]"
                  style={{ top: `${(1 - (s.level - 1) / 4) * 56}px` }} />
              </span>
              <span className="text-[10px] tracking-[0.12em] uppercase text-[#e85a2a]">{SKILL_LEVELS[s.level - 1]}</span>
              <span className="text-[10px] tracking-[0.06em] uppercase text-center leading-snug min-h-[3.9em]">{s.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** Medidor de 1–5 segmentos (tarjetas del listado). */
export function MiniMeter({ level, max = 5, dark }: { level: number; max?: number; dark?: boolean }) {
  return (
    <span className="flex gap-[3px]" aria-hidden="true">
      {Array.from({ length: max }).map((_, i) => (
        <i key={i} className={`block flex-1 h-[5px] ${i < level ? (level === max ? 'bg-[#e85a2a]' : dark ? 'bg-white' : 'bg-black') : dark ? 'bg-white/20' : 'bg-black/15'}`} />
      ))}
    </span>
  )
}

/** Herramientas del área con logo y nivel (el mismo de /uses). */
export function ToolMeters({ tools }: { tools?: any[] | null }) {
  const list = (tools || []).filter((t) => t && typeof t === 'object' && t.name)
  if (!list.length) return null
  const sorted = [...list].sort((a, b) => (TOOL_LEVELS[b.level] || 0) - (TOOL_LEVELS[a.level] || 0))
  return (
    <section className="border-b border-black bg-[#f4f4f4] p-8 md:p-16">
      <H2>// Herramientas que uso en esta área</H2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 border-t border-l border-black">
        {sorted.map((t) => {
          const lvl = TOOL_LEVELS[t.level] || 2
          return (
            <div key={t.id} className="flex items-center gap-4 p-4 bg-white border-r border-b border-black">
              <BrandTile name={t.name} />
              <span className="flex-1 min-w-0">
                <b className="block text-sm font-semibold tracking-tight truncate">{t.name}</b>
                <span className="block mt-1.5"><MiniMeter level={lvl} max={4} /></span>
              </span>
              <small className="font-mono text-[10px] uppercase tracking-widest opacity-55">{TOOL_LABEL[lvl - 1]}</small>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/** Entregables + casos del área. */
export function DeliverablesAndCases({ deliverables, projects }: { deliverables?: { item?: string | null }[] | null; projects: any[] }) {
  const items = (deliverables || []).map((d) => d?.item).filter(Boolean) as string[]
  if (!items.length && !projects.length) return null
  const headline = (p: any) => {
    const o = (p.outcomes || []).find((x: any) => x?.after && !String(x.after).includes('[COMPLETAR]') && !String(x.metric || '').includes('[COMPLETAR]'))
    if (o) return o.before ? `${o.before} → ${o.after}` : `${o.after} · ${o.metric}`
    const r = (p.results || [])[0]
    return r ? `${r.value} · ${r.metric}` : ''
  }
  return (
    <section className="border-b border-black grid grid-cols-1 lg:grid-cols-12">
      {items.length > 0 && (
        <div className={`p-8 md:p-16 bg-white ${projects.length ? 'lg:col-span-5 border-b lg:border-b-0 lg:border-r border-black' : 'lg:col-span-12'}`}>
          <H2>// Qué entrego</H2>
          <ol>
            {items.map((x, i) => (
              <li key={i} className="grid grid-cols-[40px_1fr] gap-3 py-4 border-b border-black/10 text-base">
                <span className="font-mono font-bold text-xs text-[#e85a2a] pt-1">{String(i + 1).padStart(2, '0')}</span>
                {x}
              </li>
            ))}
          </ol>
        </div>
      )}
      {projects.length > 0 && (
        <div className={`p-8 md:p-16 bg-black text-white ${items.length ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <H2 dark>// Casos en esta área</H2>
          <div className="grid gap-px bg-white/20 border border-white/20">
            {projects.map((p) => (
              <Link key={p.id} href={`/proyectos/${p.slug}`} className="group grid grid-cols-[120px_1fr] sm:grid-cols-[160px_1fr] bg-[#111] hover:bg-black transition-colors">
                <ProjectCover slug={p.slug} color={p.color} label={false} className="h-full min-h-[96px]" />
                <span className="p-4 block">
                  <small className="font-mono font-bold text-[10px] tracking-[0.15em] bg-white text-black px-1.5 py-0.5 group-hover:bg-[#e85a2a] group-hover:text-white">{p.year}</small>
                  <b className="block mt-2 text-base md:text-lg font-semibold tracking-tight leading-snug">{p.title}</b>
                  {headline(p) && <em className="block not-italic font-mono text-xs text-[#e85a2a] mt-1.5">{headline(p)}</em>}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
