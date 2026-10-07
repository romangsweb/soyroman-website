import React from 'react'
import Link from 'next/link'
import { cms } from '@/lib/cms'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { PageTransition } from '@/components/motion/PageTransition'
import { Reveal } from '@/components/motion/Reveal'
import { SplitText } from '@/components/motion/SplitText'
import { ArrowUpRight } from '@/components/icons'
import { ProjectCover } from '@/components/ProjectCover'
import { BrandTile } from '@/components/BrandIcon'
import { Media } from '@/components/Media'
import { Architecture, CaseClose, CaseSummary, Highlights, Outcomes, Phases, filled } from '@/components/CaseStudy'

type Args = { params: Promise<{ slug: string }> }

export default async function ProjectDetailPage({ params }: Args) {
  const { slug } = await params
  const result = await cms.find({
    collection: 'projects',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const project = result.docs[0]
  if (!project) notFound()

  const stackNames: string[] = [
    ...new Set([
      ...((project.stack as any[]) || []).map((t: any) => (typeof t === 'object' ? t?.name : null)),
      ...((project.stackTags as any[]) || []).map((t: any) => t?.tag),
    ]),
  ].filter((x): x is string => Boolean(x))
  const hasOutcomes = ((project as any).outcomes || []).some((o: any) => filled(o?.metric) && filled(o?.after))
  const gallery = ((project.gallery as any[]) || []).filter((g: any) => g?.image && typeof g.image === 'object')

  return (
    <PageTransition>
      <div className="bg-black text-white font-sans selection:bg-[#e85a2a] selection:text-white min-h-screen border-x border-white/20 max-w-[1920px] mx-auto">
        
        {/* Navigation & Header */}
        <section className="border-b border-white/20 relative bg-[#111]">
          <div className="border-t border-white/20 p-8 md:p-16 relative">
            <Reveal duration={1.2}>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8">
                <Link
                  href="/proyectos"
                  className="group inline-flex items-center gap-2 uppercase tracking-widest text-[10px] font-mono font-bold hover:text-[#e85a2a] transition-colors border border-white/20 px-4 py-2 self-start"
                >
                  <ArrowUpRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
                  Volver a proyectos
                </Link>
                
                <div className="flex items-center gap-4">
                  <span className="font-mono uppercase tracking-widest text-xs font-bold bg-[#e85a2a] text-white px-3 py-1">
                    {project.year}
                  </span>
                  {project.client && (
                    <span className="font-mono text-xs uppercase tracking-widest opacity-60">CLIENT: {project.client}</span>
                  )}
                </div>
              </div>
            </Reveal>

            <h1 className="text-[clamp(2.5rem,6vw,6rem)] leading-[1] tracking-tighter font-semibold mb-8 max-w-5xl">
              <SplitText text={project.title} delay={30} />
            </h1>
            <div className="w-full h-8 border border-white/20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMjIyIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-20 invert mt-8"></div>
          </div>
        </section>

        {/* Portada */}
        <section className="border-b border-white/20">
          <ProjectCover slug={project.slug} color={project.color} className="w-full aspect-[16/9] md:aspect-[21/7]" />
        </section>

        {/* Resumen y ficha */}
        <CaseSummary
          summary={(project as any).summary}
          facts={[
            ['Mi rol', (project as any).role],
            ['Duración', (project as any).duration],
            ['Equipo', (project as any).team],
            ['Año', String(project.year || '')],
            ['Cliente', project.client],
          ]}
        />

        {/* Content Area */}
        <section className="border-b border-white/20 bg-black">
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-white/20">
            
            {/* Left Column: Context & Problem */}
            <div className="lg:col-span-5 p-8 md:p-16 flex flex-col gap-16 bg-[#0a0a0a]">
              <Reveal delay={0.2}>
                {project.context && (
                  <div className="relative">
                    <h2 className="font-mono font-bold text-[10px] uppercase tracking-widest opacity-50 mb-6 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#e85a2a]"></span>
                      // Contexto
                    </h2>
                    <p className="font-mono text-sm leading-relaxed opacity-90">
                      {project.context}
                    </p>
                  </div>
                )}

                {project.problem && (
                  <div className="relative mt-16">
                    <h2 className="font-mono font-bold text-[10px] uppercase tracking-widest opacity-50 mb-6 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-white"></span>
                      // Reto
                    </h2>
                    <p className="font-mono text-sm leading-relaxed opacity-90 text-[#e85a2a]">
                      {project.problem}
                    </p>
                  </div>
                )}
              </Reveal>
            </div>

            {/* Right Column: Approach & Results */}
            <div className="lg:col-span-7 p-8 md:p-16 flex flex-col gap-16">
              <Reveal delay={0.4}>
                {project.approach && (
                  <div>
                    <h2 className="font-mono font-bold text-[10px] uppercase tracking-widest opacity-50 mb-8 border-b border-white/20 pb-4">
                      // Estrategia y ejecución
                    </h2>
                    <div className="prose prose-lg prose-invert prose-p:font-mono prose-p:text-sm prose-p:leading-relaxed prose-a:text-[#e85a2a] prose-a:border-b prose-a:border-[#e85a2a] prose-a:no-underline hover:prose-a:bg-[#e85a2a] hover:prose-a:text-white max-w-none">
                      <RichText data={project.approach} />
                    </div>
                  </div>
                )}

                {!hasOutcomes && project.results && project.results.length > 0 && (
                  <div className="mt-16">
                    <h2 className="font-mono font-bold text-[10px] uppercase tracking-widest opacity-50 mb-8 border-b border-white/20 pb-4">
                      // Resultados
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/20 border border-white/20">
                      {project.results.map((r: any, i: number) => {
                        return (
                          <div key={i} className="p-8 bg-black hover:bg-[#111] transition-colors relative group">
                            <p className="text-5xl font-mono font-bold mb-4 text-[#e85a2a]">
                              {r.value}
                            </p>
                            <p className="font-mono text-sm font-bold uppercase tracking-widest mb-2">{r.metric}</p>
                            {r.description && (
                              <p className="font-mono text-[10px] uppercase tracking-widest opacity-50">{r.description}</p>
                            )}
                            <div className="absolute top-4 right-4 w-2 h-2 border border-white/20 group-hover:border-[#e85a2a]"></div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Stack */}
                {stackNames.length > 0 && (
                  <div className="pt-16 mt-16 border-t border-white/20">
                    <h2 className="font-mono font-bold text-[10px] uppercase tracking-widest opacity-50 mb-8">
                      // Tecnologías aplicadas
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      {stackNames.map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-3 pr-4 border border-white/20 font-mono text-[10px] uppercase tracking-widest font-bold hover:border-[#e85a2a] transition-colors"
                        >
                          <BrandTile name={name} size="sm" className="border-0 border-r border-white/20" />
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Reveal>
            </div>
          </div>
        </section>

        {/* Caso de uso */}
        <Outcomes items={(project as any).outcomes} />
        <Architecture id={`arch-${project.slug}`} caption={(project as any).architecture?.caption} columns={(project as any).architecture?.columns} />
        <Phases items={(project as any).phases} />
        <Highlights items={(project as any).highlights} />

        {/* Galería */}
        {gallery.length > 0 && (
          <section className="border-b border-white/20 bg-black">
            <div className="p-8 md:p-16 pb-0 md:pb-0">
              <h2 className="font-mono font-bold text-[10px] uppercase tracking-widest opacity-50 mb-8 border-b border-white/20 pb-4">
                // Galería
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/20 border-t border-white/20">
              {gallery.map((g: any, i: number) => (
                <figure key={g.id || i} className="bg-black">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Media resource={g.image} fill htmlElement={null} imgClassName="object-cover" size="(max-width: 768px) 100vw, 50vw" />
                  </div>
                  {g.caption && (
                    <figcaption className="p-4 font-mono text-[10px] uppercase tracking-widest opacity-60 border-t border-white/20">
                      FIG.{String(i + 1).padStart(2, '0')} // {g.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </section>
        )}
        <CaseClose learnings={project.learnings} />
      </div>
    </PageTransition>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const result = await cms.find({
    collection: 'projects',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const project = result.docs[0]
  if (!project) return {}
  return {
    title: project.title,
    description: project.context || undefined,
  }
}

export async function generateStaticParams() {
  try {
    const projects = await cms.find({ collection: 'projects', limit: 100 })
    return projects.docs.map((p: any) => ({ slug: p.slug }))
  } catch (error) {
    console.error('Failed to generate static params for projects:', error)
    return []
  }
}
