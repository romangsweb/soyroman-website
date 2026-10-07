import Link from 'next/link'
import React from 'react'

import type { Recurso } from '@/data/recursos'

/** Mini aparato que anuncia un recurso: panel claro, rejilla de bocina, pantalla negra con un resultado. */
export function ResourceTeaser({ r }: { r: Recurso }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-4 bg-[#dcdedb] border-b-2 border-black p-4">
        <div>
          <p className="text-2xl md:text-3xl leading-none tracking-tight">{r.code}</p>
          <p className="mt-2 font-mono text-[11px] lowercase text-[#e85a2a]">{r.sub}</p>
        </div>
        <span
          aria-hidden="true"
          className="w-20 h-12 shrink-0 border-2 border-black bg-[#3b4045] bg-[radial-gradient(circle,#111_3px,transparent_3.4px)] [background-size:10px_10px]"
        />
      </div>
      <div className="bg-[#050608] text-[#eceeea] px-4 py-3 font-mono bg-[linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:12px_12px]">
        <p className="text-[9px] uppercase tracking-widest opacity-50">{r.preview.label}</p>
        <p className="text-3xl md:text-4xl leading-tight tabular-nums">{r.preview.value}</p>
      </div>
      <div className="flex items-center justify-between gap-3 p-3 text-white">
        <span className="font-mono text-[10px] uppercase font-bold tracking-widest">{r.name}</span>
        <span
          className={`font-mono text-[10px] uppercase font-bold tracking-widest px-2 py-1 border border-black ${
            r.href ? 'bg-[#e85a2a] shadow-[2px_2px_0_#111]' : 'bg-[#7c868d]'
          }`}
        >
          {r.href ? 'Abrir ▸' : 'Pronto'}
        </span>
      </div>
    </>
  )
  const cls = 'block bg-[#aab3ba] border-2 border-black shadow-[6px_6px_0_#111] [font-family:var(--font-aldrich),ui-sans-serif]'
  if (!r.href) return <div className={`${cls} opacity-70`} aria-disabled="true">{body}</div>
  return (
    <Link
      href={r.href}
      className={`${cls} group transition-[transform,box-shadow] duration-75 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[3px_3px_0_#111]`}
      aria-label={`${r.name}: ${r.desc}`}
    >
      {body}
    </Link>
  )
}

/** Franja de recursos relacionados para glosario, expertise y blog. */
export function ResourceStrip({ items, title = 'Herramienta relacionada' }: { items: Recurso[]; title?: string }) {
  if (!items.length) return null
  return (
    <section className="border-b border-black bg-[#a8b1b8] bg-[linear-gradient(rgba(255,255,255,.28)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.28)_1px,transparent_1px)] [background-size:28px_28px]">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-8 md:p-16 items-center">
        <div className="md:col-span-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-black/60 mb-4">// {title}</p>
          <p className="text-2xl md:text-3xl font-semibold tracking-tight leading-tight">Hazlo con tus números</p>
          <p className="font-mono text-xs leading-relaxed mt-4 text-black/70">{items[0].desc}</p>
          <Link href="/recursos" className="inline-block mt-6 font-mono text-[10px] uppercase tracking-widest font-bold border border-black bg-white px-3 py-2 hover:bg-black hover:text-white transition-colors">
            Ver todos los recursos
          </Link>
        </div>
        <div className={`md:col-span-8 grid gap-8 ${items.length > 1 ? 'sm:grid-cols-2' : 'sm:max-w-sm'}`}>
          {items.slice(0, 2).map((r) => <ResourceTeaser key={r.slug} r={r} />)}
        </div>
      </div>
    </section>
  )
}
