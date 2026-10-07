import Link from 'next/link'
import React from 'react'

import { brandFor } from '@/data/brandIcons'
import { BrandIcon } from '@/components/BrandIcon'

/** Lo que contenga [COMPLETAR] es un borrador pendiente: no se publica. */
export const filled = (s?: string | null): s is string => Boolean(s && s.trim() && !s.includes('[COMPLETAR]'))

const H2 = ({ children, dark }: { children: React.ReactNode; dark?: boolean }) => (
  <h2 className={`font-mono font-bold text-[10px] uppercase tracking-widest mb-10 pb-4 border-b ${dark ? 'border-white/20 opacity-60' : 'border-black/15 opacity-50'}`}>
    {children}
  </h2>
)

/* ───────────── Resumen + ficha ───────────── */
export function CaseSummary({ summary, facts }: { summary?: string | null; facts: [string, string | null | undefined][] }) {
  const f = facts.filter(([, v]) => filled(v)) as [string, string][]
  if (!filled(summary) && !f.length) return null
  return (
    <section className="border-b border-white/20 bg-[#f4f4f4] text-black">
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-black">
        <div className="lg:col-span-8 p-8 md:p-16">
          <p className="font-mono text-[10px] uppercase tracking-widest font-bold opacity-50 mb-6">// En una línea</p>
          {filled(summary) && <p className="text-2xl md:text-4xl font-semibold tracking-tight leading-tight max-w-4xl">{summary}</p>}
        </div>
        {f.length > 0 && (
          <dl className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 divide-y divide-black/15 bg-white">
            {f.map(([k, v]) => (
              <div key={k} className="p-6 md:px-10">
                <dt className="font-mono text-[9px] uppercase tracking-widest opacity-50 mb-1">{k}</dt>
                <dd className="font-mono text-sm font-bold uppercase tracking-wide">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  )
}

/* ───────────── Resultados de negocio ───────────── */
type Outcome = { metric?: string | null; before?: string | null; after?: string | null; impact?: string | null }
export function Outcomes({ items }: { items?: Outcome[] | null }) {
  const list = (items || []).filter((o) => filled(o.metric) && filled(o.after) && (!o.before || filled(o.before)))
  if (!list.length) return null
  return (
    <section className="border-b border-white/20 bg-black p-8 md:p-16">
      <H2 dark>// Resultados de negocio</H2>
      <div className={`grid grid-cols-1 gap-px bg-white/20 border border-white/20 ${list.length > 1 ? 'md:grid-cols-2' : ''} ${list.length > 2 ? 'xl:grid-cols-3' : ''}`}>
        {list.map((o, i) => (
          <div key={i} className="bg-black p-8 md:p-10 flex flex-col gap-6 relative">
            <span className="absolute top-4 right-4 font-mono text-[10px] opacity-40">R-{String(i + 1).padStart(2, '0')}</span>
            <p className="font-mono text-xs font-bold uppercase tracking-widest">{o.metric}</p>
            <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
              {filled(o.before) && (
                <>
                  <span className="font-mono text-2xl md:text-3xl line-through decoration-[#e85a2a] decoration-2 opacity-40">{o.before}</span>
                  <span className="font-mono text-xl text-white/40 pb-1">→</span>
                </>
              )}
              <span className="font-mono text-5xl md:text-6xl font-bold text-[#e85a2a] leading-none">{o.after}</span>
            </div>
            {filled(o.impact) && <p className="font-mono text-xs leading-relaxed opacity-70 border-t border-white/15 pt-4">{o.impact}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}

/* ───────────── Arquitectura animada ───────────── */
type ArchNode = { name?: string | null; note?: string | null }
type ArchCol = { label?: string | null; nodes?: ArchNode[] | null }
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

export function Architecture({ id, caption, columns }: { id: string; caption?: string | null; columns?: ArchCol[] | null }) {
  const cols = (columns || [])
    .map((c) => ({ label: c.label || '', nodes: (c.nodes || []).filter((n) => filled(n.name)) as { name: string; note?: string | null }[] }))
    .filter((c) => filled(c.label) && c.nodes.length)
  if (cols.length < 2) return null

  const W = 1100, PAD = 24, GAP = 76, NH = 58, NG = 14, TOP = 64
  const n = cols.length
  const cw = (W - PAD * 2 - GAP * (n - 1)) / n
  const maxN = Math.max(...cols.map((c) => c.nodes.length))
  const H = TOP + maxN * (NH + NG) + 40
  const colX = (i: number) => PAD + i * (cw + GAP)
  const nodeY = (c: number, k: number) => {
    const len = cols[c].nodes.length
    const block = len * NH + (len - 1) * NG
    return TOP + ((maxN * (NH + NG) - NG) - block) / 2 + k * (NH + NG)
  }
  const chars = Math.floor((cw - 50) / 7.6)
  const paths: { d: string; key: string }[] = []
  for (let c = 0; c < n - 1; c++) {
    const bx = colX(c) + cw + GAP / 2
    const src = cols[c].nodes, dst = cols[c + 1].nodes
    const pairs = Math.max(src.length, dst.length)
    for (let p = 0; p < pairs; p++) {
      const s = Math.min(p, src.length - 1), t = Math.min(p, dst.length - 1)
      const y1 = nodeY(c, s) + NH / 2, y2 = nodeY(c + 1, t) + NH / 2
      paths.push({ key: `${id}-c${c}-${p}`, d: `M${colX(c) + cw} ${y1} H${bx} V${y2} H${colX(c + 1)}` })
    }
  }

  return (
    <section className="border-b border-black bg-[#f4f4f4] text-black p-8 md:p-16">
      <H2>// Arquitectura</H2>

      {/* Escritorio: diagrama SVG con puntos que fluyen */}
      <svg viewBox={`0 0 ${W} ${H}`} className="hidden md:block w-full h-auto" role="img" aria-label={`Arquitectura: ${cols.map((c) => `${c.label} (${c.nodes.map((x) => x.name).join(', ')})`).join(' → ')}`}>
        <defs>
          <pattern id={`${id}-dots`} width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="rgba(0,0,0,.12)" /></pattern>
          <marker id={`${id}-arrow`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
            <path d="M0 0 L8 4 L0 8" fill="none" stroke="#111" strokeWidth="1.4" />
          </marker>
        </defs>
        <rect width={W} height={H} fill={`url(#${id}-dots)`} />
        <g fill="none" stroke="#111" strokeWidth="1.2">
          {paths.map((p) => <path key={p.key} id={p.key} d={p.d} markerEnd={`url(#${id}-arrow)`} />)}
        </g>
        <g fill="#e85a2a" className="motion-reduce:hidden">
          {paths.map((p, i) => (
            <circle key={p.key} r="3.5">
              <animateMotion dur={`${2.4 + (i % 3) * 0.5}s`} begin={`-${(i * 0.7) % 2.4}s`} repeatCount="indefinite">
                <mpath href={`#${p.key}`} />
              </animateMotion>
            </circle>
          ))}
        </g>
        <g fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
          {cols.map((c, ci) => {
            const last = ci === n - 1
            return (
              <g key={ci}>
                <text x={colX(ci)} y={32} fontSize="10" fontWeight="700" letterSpacing="2" fill="rgba(0,0,0,.5)">
                  {String(ci + 1).padStart(2, '0')} // {c.label.toUpperCase()}
                </text>
                {c.nodes.map((node, k) => {
                  const x = colX(ci), y = nodeY(ci, k), brand = brandFor(node.name)
                  const tx = brand ? x + 40 : x + 14
                  return (
                    <g key={k}>
                      <rect x={x} y={y} width={cw} height={NH} fill={last ? '#e85a2a' : '#fff'} stroke="#111" strokeWidth={last ? 0 : 1.2} />
                      {!last && k === 0 && <rect x={x + cw - 7} y={y - 1} width="8" height="8" fill="#e85a2a" />}
                      {brand && (
                        <svg x={x + 12} y={y + NH / 2 - 9} width="18" height="18" viewBox="0 0 24 24">
                          <path d={brand.path} fill={last ? '#fff' : '#111'} />
                        </svg>
                      )}
                      <text x={tx} y={node.note ? y + 25 : y + NH / 2 + 4} fontSize="12" fontWeight="700" letterSpacing="1" fill={last ? '#fff' : '#111'}>
                        {clip(node.name.toUpperCase(), chars)}
                      </text>
                      {filled(node.note) && (
                        <text x={tx} y={y + 42} fontSize="10" fill={last ? 'rgba(255,255,255,.8)' : 'rgba(0,0,0,.55)'}>
                          {clip(node.note, chars + 4)}
                        </text>
                      )}
                    </g>
                  )
                })}
              </g>
            )
          })}
        </g>
      </svg>

      {/* Móvil: columnas apiladas con conector animado */}
      <ol className="md:hidden flex flex-col">
        {cols.map((c, ci) => (
          <li key={ci} className="flex flex-col">
            <div className="border-2 border-black bg-white">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest px-4 py-2 border-b-2 border-black bg-[#dcdedb]">
                {String(ci + 1).padStart(2, '0')} // {c.label}
              </p>
              <ul className="divide-y divide-black/15">
                {c.nodes.map((node, k) => (
                  <li key={k} className={`flex items-center gap-3 px-4 py-3 ${ci === cols.length - 1 ? 'bg-[#e85a2a] text-white' : ''}`}>
                    <BrandIcon name={node.name} className="w-4 h-4 shrink-0" />
                    <span>
                      <span className="block font-mono text-xs font-bold uppercase tracking-wide">{node.name}</span>
                      {filled(node.note) && <span className="block font-mono text-[10px] opacity-60">{node.note}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {ci < cols.length - 1 && (
              <span aria-hidden="true" className="relative mx-auto w-px h-10 bg-black overflow-hidden">
                <span className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#e85a2a] animate-[flowdown_1.4s_linear_infinite] motion-reduce:hidden" />
              </span>
            )}
          </li>
        ))}
      </ol>
      {filled(caption) && <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] opacity-50">FIG // {caption}</p>}
    </section>
  )
}

/* ───────────── Fases ───────────── */
type Phase = { name?: string | null; duration?: string | null; text?: string | null }
export function Phases({ items }: { items?: Phase[] | null }) {
  const list = (items || []).filter((p) => filled(p.name))
  if (!list.length) return null
  return (
    <section className="border-b border-white/20 bg-black p-8 md:p-16">
      <H2 dark>// Fases</H2>
      <ol className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-none lg:grid-flow-col lg:auto-cols-fr lg:gap-0 lg:border-t-2 lg:border-[#e85a2a]">
        {list.map((p, i) => (
          <li key={i} className="relative border border-white/20 lg:border-0 lg:border-r lg:last:border-r-0 p-6 lg:pt-10">
            <span aria-hidden="true" className="hidden lg:block absolute -top-[7px] left-6 w-3 h-3 bg-[#e85a2a]" />
            <p className="font-mono text-[10px] font-bold tracking-widest text-[#e85a2a]">
              F{String(i + 1).padStart(2, '0')}{filled(p.duration) ? ` · ${p.duration}` : ''}
            </p>
            <p className="font-mono text-sm font-bold uppercase tracking-wide mt-4 leading-snug">{p.name}</p>
            {filled(p.text) && <p className="font-mono text-xs leading-relaxed opacity-60 mt-3">{p.text}</p>}
          </li>
        ))}
      </ol>
    </section>
  )
}

/* ───────────── Puntos clave ───────────── */
type Highlight = { title?: string | null; text?: string | null }
export function Highlights({ items }: { items?: Highlight[] | null }) {
  const list = (items || []).filter((h) => filled(h.title) && (!h.text || filled(h.text)))
  if (!list.length) return null
  return (
    <section className="border-b border-black bg-white text-black p-8 md:p-16">
      <H2>// Puntos clave</H2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-black border border-black">
        {list.map((h, i) => (
          <div key={i} className="bg-white p-8 flex gap-6">
            <span className="font-mono text-3xl font-bold text-[#e85a2a] leading-none">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <p className="text-xl font-semibold tracking-tight">{h.title}</p>
              {filled(h.text) && <p className="font-mono text-xs leading-relaxed opacity-70 mt-3">{h.text}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ───────────── Aprendizaje + llamado a la acción ───────────── */
export function CaseClose({ learnings }: { learnings?: string | null }) {
  return (
    <section className="border-b border-white/20 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/20">
      <div className="lg:col-span-7 p-8 md:p-16 bg-[#0a0a0a]">
        {filled(learnings) && (
          <>
            <p className="font-mono text-[10px] uppercase tracking-widest font-bold opacity-50 mb-6">// Lo que aprendí</p>
            <p className="text-2xl md:text-3xl font-semibold tracking-tight leading-snug">“{learnings}”</p>
          </>
        )}
      </div>
      <Link href="/consultoria" className="lg:col-span-5 group p-8 md:p-16 bg-[#e85a2a] text-white flex flex-col justify-between gap-10 hover:bg-white hover:text-black transition-colors">
        <span className="font-mono text-[10px] uppercase tracking-widest font-bold">// Siguiente paso</span>
        <span className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight">¿Tienes un reto parecido?</span>
        <span className="font-mono text-xs uppercase tracking-widest font-bold">Ver cómo trabajo ▸</span>
      </Link>
    </section>
  )
}
