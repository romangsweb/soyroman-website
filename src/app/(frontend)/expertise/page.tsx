import React from 'react'
import Link from 'next/link'
import { cms } from '@/lib/cms'
import type { Metadata } from 'next'
import { PageTransition } from '@/components/motion/PageTransition'
import { Reveal } from '@/components/motion/Reveal'
import { SplitText } from '@/components/motion/SplitText'
import { IconTile } from '@/components/IconTile'

export default async function ExpertisePage() {
  const expertises = await cms.find({
    collection: 'expertise',
    sort: 'order',
    limit: 20,
  })

  return (
    <PageTransition>
      <div className="bg-[#f4f4f4] text-black font-sans selection:bg-[#ff3300] selection:text-white min-h-screen border-x border-black max-w-[1920px] mx-auto">
        
        {/* TE Header */}
        <section className="border-b border-black relative bg-[#e5e5e5]">
          <div className="p-8 md:p-16 relative container mx-auto">
            <Reveal duration={1.2}>
              <div className="flex items-center gap-3 mb-16">
                <div className="w-3 h-3 bg-[#0A32B8]"></div>
                <p className="font-mono uppercase tracking-[0.2em] text-xs font-bold text-black/60">
                  SYS.02 // Especialidades
                </p>
              </div>
            </Reveal>
            <h1 className="text-[clamp(3rem,8vw,8rem)] leading-[0.9] tracking-tighter font-semibold mb-8">
              <SplitText text="Expertise" delay={50} />
            </h1>
            <Reveal delay={0.2}>
              <p className="font-mono text-sm md:text-base leading-relaxed max-w-2xl opacity-80 border-l-2 border-[#ff3300] pl-4 mb-8">
                Áreas de especialidad técnica y estratégica para operaciones B2B.
              </p>
            </Reveal>
            <div className="w-full h-8 border border-black/20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMjIyIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-20"></div>
          </div>
        </section>

        {/* Content Grid */}
        <section className="bg-white">
          <div className="container mx-auto p-8 md:p-16 border-x border-black bg-white min-h-[50vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-black border border-black">
              {expertises.docs.map((exp: any, index: number) => (
                <Reveal key={exp.id} delay={index * 0.1}>
                  <Link
                    href={`/expertise/${exp.slug}`}
                    className="block bg-[#f4f4f4] p-8 h-full group hover:bg-black hover:text-white transition-colors duration-300 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-2 h-full bg-[#ff3300] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex items-center justify-between mb-8 border-b border-black/10 pb-4 group-hover:border-white/20">
                      <IconTile name={exp.slug} />
                      <span className="text-[10px] font-mono opacity-50 uppercase">{String(index + 1).padStart(2, '0')} →</span>
                    </div>

                    <h2 className="text-3xl font-semibold mb-4 tracking-tight group-hover:text-[#ff3300] transition-colors">
                      {exp.title}
                    </h2>
                    
                    {exp.thesis && (
                      <p className="font-mono text-xs opacity-80 mb-8 leading-relaxed">
                        {exp.thesis}
                      </p>
                    )}
                    
                    {exp.metrics && exp.metrics.length > 0 && (
                      <div className="flex flex-wrap gap-4 mt-auto pt-6 border-t border-black/10 group-hover:border-white/20">
                        {exp.metrics.slice(0, 3).map((m: any, i: number) => (
                          <div key={i} className="flex flex-col">
                            <span className="font-mono text-lg font-bold text-[#ff3300]">{m.value}</span>
                            <span className="font-mono text-[9px] uppercase tracking-widest opacity-60">{m.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

      </div>
    </PageTransition>
  )
}

export const metadata: Metadata = {
  title: 'Expertise',
  description: 'Áreas de especialización: SEO, Paid Media, RevOps, MarTech, liderazgo B2B y más.',
}
