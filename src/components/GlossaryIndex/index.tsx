'use client'

import Link from 'next/link'
import React, { useMemo, useState } from 'react'

export type GlossaryItem = {
  slug: string
  term: string
  fullName?: string | null
  definition: string
  categories: { slug: string; title: string }[]
}

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

const letterOf = (term: string) => {
  const c = norm(term).charAt(0).toUpperCase()
  return /[A-Z]/.test(c) ? c : '#'
}

/** Índice A–Z con buscador y filtro por tema (todo en el navegador). */
export function GlossaryIndex({ items, topics }: { items: GlossaryItem[]; topics: { slug: string; title: string }[] }) {
  const [q, setQ] = useState('')
  const [topic, setTopic] = useState('')

  const filtered = useMemo(() => {
    const nq = norm(q.trim())
    return items.filter(
      (i) =>
        (!topic || i.categories.some((c) => c.slug === topic)) &&
        (!nq || norm(`${i.term} ${i.fullName ?? ''} ${i.definition}`).includes(nq)),
    )
  }, [items, q, topic])

  const groups = useMemo(() => {
    const map = new Map<string, GlossaryItem[]>()
    for (const i of filtered) {
      const l = letterOf(i.term)
      if (!map.has(l)) map.set(l, [])
      map.get(l)!.push(i)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  const letters = groups.map(([l]) => l)
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  return (
    <div>
      {/* Controles */}
      <div className="sticky top-12 z-20 bg-white border-b border-black p-4 md:px-16 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <label className="flex-1">
            <span className="sr-only">Buscar término</span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar: ROAS, embudo, atribución…"
              className="w-full px-4 py-3 bg-[#f4f4f4] border border-black font-mono text-sm focus:outline-none focus:bg-white focus:border-[#e85a2a]"
            />
          </label>
          <label>
            <span className="sr-only">Filtrar por tema</span>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full md:w-64 px-4 py-3 bg-[#f4f4f4] border border-black font-mono text-sm focus:outline-none focus:border-[#e85a2a]"
            >
              <option value="">Todos los temas</option>
              {topics.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <nav aria-label="Letras" className="flex flex-wrap gap-1 font-mono text-[11px] font-bold">
          {ALPHABET.map((l) =>
            letters.includes(l) ? (
              <a key={l} href={`#letra-${l}`} className="w-7 h-7 flex items-center justify-center border border-black hover:bg-[#e85a2a] hover:text-white hover:border-[#e85a2a]">
                {l}
              </a>
            ) : (
              <span key={l} className="w-7 h-7 flex items-center justify-center border border-black/10 text-black/25">
                {l}
              </span>
            ),
          )}
        </nav>
      </div>

      {/* Resultados */}
      {groups.length === 0 ? (
        <p className="p-8 md:p-16 font-mono text-sm opacity-70">Sin resultados para esa búsqueda.</p>
      ) : (
        groups.map(([letter, terms]) => (
          <section key={letter} id={`letra-${letter}`} className="scroll-mt-48 border-b border-black grid grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-2 p-8 md:p-16 bg-[#e5e5e5] border-b md:border-b-0 md:border-r border-black">
              <span className="text-6xl font-semibold tracking-tight">{letter}</span>
            </div>
            <ul className="md:col-span-10 divide-y divide-black bg-white">
              {terms.map((t) => (
                <li key={t.slug}>
                  <Link href={`/glosario/${t.slug}`} className="group block p-6 md:px-12 hover:bg-[#111] hover:text-white transition-colors">
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-2">
                      <h2 className="text-2xl font-semibold tracking-tight group-hover:text-[#e85a2a]">{t.term}</h2>
                      {t.fullName && <span className="font-mono text-xs opacity-60">{t.fullName}</span>}
                    </div>
                    <p className="font-mono text-sm leading-relaxed opacity-80 line-clamp-2 max-w-3xl">{t.definition}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
