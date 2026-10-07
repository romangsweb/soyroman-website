import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'

import { cms } from '@/lib/cms'
import { Reveal } from '@/components/motion/Reveal'
import { SplitText } from '@/components/motion/SplitText'

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: '2-digit' }) : ''

export default async function NotasPage() {
  const notes = await cms.find({
    collection: 'notes',
    where: { _status: { equals: 'published' } },
    sort: '-date',
    limit: 100,
    depth: 1,
  })

  return (
    <div className="bg-[#f4f4f4] text-black font-sans min-h-screen border-x border-black max-w-[1920px] mx-auto">
      <section className="border-b border-black bg-[#e5e5e5]">
        <div className="p-8 md:p-16">
          <Reveal duration={1.2}>
            <div className="flex items-center gap-3 mb-16">
              <div className="w-3 h-3 bg-[#e85a2a]" />
              <p className="font-mono uppercase tracking-[0.2em] text-xs font-bold text-black/60">SYS.10 // Notas de campo</p>
            </div>
          </Reveal>
          <h1 className="text-[clamp(3rem,8vw,8rem)] leading-[0.9] tracking-tighter font-semibold mb-8">
            <SplitText text="Notas de campo" delay={50} />
          </h1>
          <Reveal delay={0.3}>
            <p className="font-mono text-sm md:text-base leading-relaxed max-w-2xl opacity-80 border-l-2 border-[#e85a2a] pl-4">
              Apuntes cortos de lo que voy encontrando en proyectos reales: errores, hallazgos y lo que cambiaría la
              próxima vez.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-white">
        {notes.docs.length === 0 ? (
          <p className="p-8 md:p-16 font-mono text-sm opacity-70">Pronto habrá notas aquí.</p>
        ) : (
          <ul className="divide-y divide-black">
            {notes.docs.map((n: any) => (
              <li key={n.id}>
                <Link
                  href={`/notas/${n.slug}`}
                  className="group grid grid-cols-1 md:grid-cols-12 gap-4 p-8 md:p-12 hover:bg-[#111] hover:text-white transition-colors"
                >
                  <time className="md:col-span-2 font-mono text-[10px] uppercase tracking-widest font-bold opacity-60">{fmt(n.date)}</time>
                  <div className="md:col-span-10">
                    <h2 className="text-2xl md:text-3xl font-semibold tracking-tight group-hover:text-[#e85a2a]">{n.title}</h2>
                    {(n.categories || []).filter((c: any) => typeof c === 'object').length > 0 && (
                      <p className="mt-3 font-mono text-[10px] uppercase tracking-widest opacity-60">
                        {(n.categories || []).filter((c: any) => typeof c === 'object').map((c: any) => c.title).join(' · ')}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export const metadata: Metadata = {
  title: 'Notas de campo',
  description: 'Apuntes cortos de proyectos reales de marketing B2B, CRM y operación digital.',
}
