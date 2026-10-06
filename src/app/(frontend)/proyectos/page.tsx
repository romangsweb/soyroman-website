import React from 'react'
import Link from 'next/link'
import { cms } from '@/lib/cms'
import type { Metadata } from 'next'
import { PageTransition } from '@/components/motion/PageTransition'
import { Reveal } from '@/components/motion/Reveal'
import { SplitText } from '@/components/motion/SplitText'
import { ArrowUpRight } from '@/components/icons'

export default async function ProjectsPage() {
  const projects = await cms.find({
    collection: 'projects',
    sort: '-year',
    limit: 50,
  })

  return (
    <PageTransition>
      <div className="bg-black text-white font-sans selection:bg-[#ff3300] selection:text-white min-h-screen border-x border-white/20 max-w-[1920px] mx-auto">
        
        {/* TE Header (Dark Mode) */}
        <section className="pt-32 border-b border-white/20 relative bg-[#111]">
          <div className="border-t border-white/20 p-8 md:p-16 relative">
            <Reveal duration={1.2}>
              <div className="flex items-center gap-3 mb-16">
                <div className="w-3 h-3 bg-[#ff3300] animate-pulse"></div>
                <p className="font-mono uppercase tracking-[0.2em] text-xs font-bold text-white/60">
                  SYS.07 // Case Archive
                </p>
              </div>
            </Reveal>
            <h1 className="text-[clamp(3rem,8vw,8rem)] leading-[0.9] tracking-tighter font-semibold mb-8">
              <SplitText text="Proyectos" delay={50} />
            </h1>
            <Reveal delay={0.3}>
              <p className="font-mono text-sm md:text-base opacity-70 leading-relaxed max-w-2xl mt-8 mb-8">
                Sistemas B2B escalados y operaciones optimizadas en el ecosistema técnico.
              </p>
            </Reveal>
            <div className="w-full h-8 border border-white/20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMjIyIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-20 invert"></div>
          </div>
        </section>

        {/* Projects Archive */}
        <section className="bg-black">
          <div className="flex flex-col divide-y divide-white/20">
            {projects.docs.map((project: any, index: number) => {
              return (
                <Reveal key={project.id} delay={0.1}>
                  <Link
                    href={`/proyectos/${project.slug}`}
                    className="block group hover:bg-[#111] transition-colors duration-300 relative"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-white/20">
                      
                      {/* Left: Year & Client */}
                      <div className="md:col-span-3 p-8 flex flex-col justify-between">
                        <div className="flex items-center gap-4 mb-8 md:mb-0">
                          <span className="font-mono text-xs uppercase tracking-widest font-bold bg-white text-black px-2 py-1 inline-block group-hover:bg-[#ff3300] group-hover:text-white transition-colors">
                            {project.year || '2024'}
                          </span>
                          {project.featured && (
                            <span className="font-mono text-[10px] uppercase tracking-widest border border-white/20 px-2 py-1 text-[#ff3300]">Featured</span>
                          )}
                        </div>
                        {project.client && (
                          <span className="font-mono text-sm uppercase tracking-widest opacity-80 mt-auto">{project.client}</span>
                        )}
                      </div>
                      
                      {/* Middle: Title & Context */}
                      <div className="md:col-span-6 p-8 md:p-12">
                        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6 group-hover:text-[#ff3300] transition-colors">
                          {project.title}
                        </h2>
                        {project.context && (
                          <p className="font-mono text-sm opacity-60 leading-relaxed line-clamp-2 max-w-xl">
                            {project.context}
                          </p>
                        )}
                      </div>

                      {/* Right: Results & Arrow */}
                      <div className="md:col-span-3 p-8 flex flex-col justify-between border-l border-white/20">
                        <div className="flex gap-8 mb-8 md:mb-0">
                          {project.results && project.results.slice(0, 2).map((r: any, idx: number) => (
                            <div key={idx}>
                              <p className="text-2xl font-mono font-bold">{r.value}</p>
                              <p className="font-mono text-[10px] uppercase tracking-widest opacity-50 mt-1">{r.metric}</p>
                            </div>
                          ))}
                        </div>
                        <div className="w-12 h-12 border border-white/20 flex items-center justify-center group-hover:border-[#ff3300] group-hover:bg-[#ff3300] group-hover:text-white transition-all mt-auto self-end">
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                      </div>

                    </div>
                  </Link>
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
  title: 'Proyectos | Román García',
  description: 'Proyectos de marketing B2B con resultados medibles en el ecosistema SAP.',
}
