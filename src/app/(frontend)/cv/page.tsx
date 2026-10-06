import React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { Metadata } from 'next'
import { PageTransition } from '@/components/motion/PageTransition'
import { Reveal } from '@/components/motion/Reveal'
import { SplitText } from '@/components/motion/SplitText'
import { ArrowUpRight } from '@/components/icons'

export default async function CVPage() {
  const payload = await getPayload({ config: configPromise })
  const profile = await payload.findGlobal({ slug: 'profile' })
  const experiences = await payload.find({
    collection: 'experience',
    sort: 'order',
    limit: 50,
    depth: 1,
  })

  return (
    <PageTransition>
      <div className="bg-[#f4f4f4] text-black font-sans selection:bg-[#ff3300] selection:text-white min-h-screen border-x border-black max-w-[1920px] mx-auto">
        
        {/* TE Header */}
        <section className="pt-32 border-b border-black relative bg-[#e5e5e5]">
          <div className="border-t border-black p-8 md:p-16 relative">
            <Reveal duration={1.2}>
              <div className="flex items-center justify-between mb-16">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-[#ff3300]"></div>
                  <p className="font-mono uppercase tracking-[0.2em] text-xs font-bold text-black/60">
                    SYS.05 // Work Log
                  </p>
                </div>
                {profile?.cvFile && (
                  <a
                    href={typeof profile.cvFile === 'object' ? (profile.cvFile as any).url : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 border border-black bg-white px-4 py-2 hover:bg-black hover:text-white transition-colors font-mono uppercase tracking-widest text-[10px] font-bold"
                  >
                    Download_PDF
                    <ArrowUpRight className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </a>
                )}
              </div>
            </Reveal>

            <h1 className="text-[clamp(3rem,8vw,8rem)] leading-[0.9] tracking-tighter font-semibold mb-8 max-w-4xl">
              <SplitText text="Trayectoria" delay={50} />
            </h1>
            <Reveal delay={0.3}>
              <p className="font-mono text-sm md:text-base opacity-70 leading-relaxed max-w-2xl mt-8">
                Años de experiencia diseñando y liderando sistemas de crecimiento B2B escalables.
              </p>
            </Reveal>
            <div className="absolute right-8 bottom-8 w-16 h-16 border-2 border-black flex items-center justify-center opacity-20">
              <div className="w-4 h-4 bg-black"></div>
            </div>
          </div>
        </section>

        {/* TE Timeline Log */}
        <section className="bg-white">
          <div className="flex flex-col divide-y divide-black">
            {experiences.docs.map((exp: any, index: number) => {
              return (
                <Reveal key={exp.id} className="group hover:bg-[#f4f4f4] transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-black relative">
                    
                    {/* Left: Dates & Status */}
                    <div className="md:col-span-3 p-8 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-16">
                        <p className="font-mono text-xs uppercase tracking-widest font-bold bg-black text-white px-2 py-1 inline-block">
                          {exp.startDate && new Date(exp.startDate).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit' })}
                          {' // '}
                          {exp.endDate
                            ? new Date(exp.endDate).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit' })
                            : 'ACT'}
                        </p>
                        <div className={`w-3 h-3 border border-black ${!exp.endDate ? 'bg-[#ff3300] animate-pulse' : 'bg-transparent'}`}></div>
                      </div>
                      <span className="font-mono text-[10px] uppercase font-bold text-black/40">Log_Entry: {String(index + 1).padStart(3, '0')}</span>
                    </div>

                    {/* Right: Info */}
                    <div className="md:col-span-9 p-8 md:p-12 relative z-10">
                      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                        <h2 className="text-3xl md:text-5xl font-semibold tracking-tight group-hover:text-[#ff3300] transition-colors">
                          {exp.position}
                        </h2>
                        <span className="font-mono uppercase tracking-widest text-sm font-bold opacity-60 bg-white border border-black px-3 py-1 self-start md:self-auto">
                          {exp.company}
                        </span>
                      </div>

                      {exp.achievements && exp.achievements.length > 0 && (
                        <div className="mt-8 border-t border-black/10 pt-8">
                          <ul className="space-y-4">
                            {exp.achievements.map((a: any, i: number) => (
                              <li key={i} className="text-base md:text-lg leading-relaxed flex gap-4 font-light text-black/80">
                                <span className="font-mono text-[#ff3300] shrink-0 font-bold mt-1">{'>'}</span>
                                {a.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </section>

      </div>
    </PageTransition>
  )
}

export const metadata: Metadata = {
  title: 'Trayectoria | Román García',
  description: 'Trayectoria profesional de Román García — Director de Marketing B2B.',
}
