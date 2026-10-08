import React from 'react'

import { BOOKS, PLAYLIST } from '@/data/about'

const SPINES = ['#e85a2a', '#6ab0ff', '#f2c14e', '#3ddc84']
const service = (url: string) =>
  /music\.apple\.com/i.test(url) ? 'Apple Music' : /spotify\.com/i.test(url) ? 'Spotify' : /youtube\.com|youtu\.be/i.test(url) ? 'YouTube Music' : ''

/** Módulos personales de /about (Biblioteca y Radio). Cada uno aparece solo si tiene contenido. */
export function Passions() {
  const hasBooks = BOOKS.length > 0
  const hasRadio = Boolean(PLAYLIST.url)
  if (!hasBooks && !hasRadio) return null

  return (
    <section className="border-b border-black bg-[#e5e5e5]">
      <div className="container mx-auto p-8 md:p-16">
        <h2 className="font-mono font-bold uppercase tracking-widest text-[10px] mb-8 text-black/50">// Fuera de la oficina</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {hasBooks && (
            <div className="bg-[#ecebe6] border border-black rounded-2xl shadow-[6px_6px_0_0_#000] p-5 flex flex-col gap-4">
              <div className="flex justify-between font-mono text-[11px] uppercase tracking-widest">
                <b className="text-sm">Biblioteca</b>
                <span>leyendo ahora</span>
              </div>
              <ul className="bg-[#0b0d0c] text-[#cfd] border border-black rounded-lg p-4 font-mono text-sm divide-y divide-white/10">
                {BOOKS.map((b, i) => (
                  <li key={b.title} className="flex items-center gap-3 py-2">
                    <span className="w-2.5 h-9 border border-black shrink-0" style={{ background: SPINES[i % SPINES.length] }} aria-hidden="true" />
                    <span>
                      {b.title}
                      <span className="block text-[11px] text-[#6c7]">{b.author}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="font-mono text-sm leading-relaxed text-black/70">
                Teorías sociales, psicología y arquitectura: entender por qué la gente decide como decide.
              </p>
            </div>
          )}
          {hasRadio && (
            <div className="bg-[#ecebe6] border border-black rounded-2xl shadow-[6px_6px_0_0_#000] p-5 flex flex-col gap-4">
              <div className="flex justify-between font-mono text-[11px] uppercase tracking-widest">
                <b className="text-sm">Radio</b>
                <span>lo que suena mientras trabajo</span>
              </div>
              <div className="grid grid-cols-[110px_1fr] gap-5 items-center">
                <div
                  className="aspect-square rounded-full border-2 border-black"
                  style={{ background: 'radial-gradient(circle,#222 2px,transparent 2.5px) 0 0/9px 9px,#3b4045' }}
                  aria-hidden="true"
                />
                <div className="flex flex-col gap-3">
                  <div className="bg-[#0b0d0c] text-[#cfd] border border-black rounded-lg px-3 py-2 font-mono text-sm truncate">♫ {PLAYLIST.name || 'Playlist de trabajo'}</div>
                  <a
                    href={PLAYLIST.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start font-mono text-[11px] uppercase tracking-widest bg-[#e85a2a] text-white border-2 border-black px-4 py-2.5 shadow-[3px_3px_0_0_#000] hover:bg-black transition-colors"
                  >
                    {service(PLAYLIST.url) ? `Abrir en ${service(PLAYLIST.url)}` : 'Escuchar'} ▸
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
