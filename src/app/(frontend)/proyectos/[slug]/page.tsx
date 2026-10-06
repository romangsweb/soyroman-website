import React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { PageTransition } from '@/components/motion/PageTransition'
import { Reveal } from '@/components/motion/Reveal'
import { SplitText } from '@/components/motion/SplitText'
import { ArrowUpRight } from '@/components/icons'

type Args = { params: Promise<{ slug: string }> }

export default async function ProjectDetailPage({ params }: Args) {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'projects',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const project = result.docs[0]
  if (!project) notFound()

  return (
    <PageTransition>
      <div className="bg-black text-white font-sans selection:bg-[#ff3300] selection:text-white min-h-screen border-x border-white/20 max-w-[1920px] mx-auto">
        
        {/* Navigation & Header */}
        <section className="pt-32 border-b border-white/20 relative bg-[#111]">
          <div className="border-t border-white/20 p-8 md:p-16 relative">
            <Reveal duration={1.2}>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8">
                <Link
                  href="/proyectos"
                  className="group inline-flex items-center gap-2 uppercase tracking-widest text-[10px] font-mono font-bold hover:text-[#ff3300] transition-colors border border-white/20 px-4 py-2 self-start"
                >
                  <ArrowUpRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
                  Return_To_Archive
                </Link>
                
                <div className="flex items-center gap-4">
                  <span className="font-mono uppercase tracking-widest text-xs font-bold bg-[#ff3300] text-white px-3 py-1">
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

        {/* Content Area */}
        <section className="border-b border-white/20 bg-black">
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-white/20">
            
            {/* Left Column: Context & Problem */}
            <div className="lg:col-span-5 p-8 md:p-16 flex flex-col gap-16 bg-[#0a0a0a]">
              <Reveal delay={0.2}>
                {project.context && (
                  <div className="relative">
                    <h2 className="font-mono font-bold text-[10px] uppercase tracking-widest opacity-50 mb-6 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#ff3300]"></span>
                      // Operation_Context
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
                      // Core_Challenge
                    </h2>
                    <p className="font-mono text-sm leading-relaxed opacity-90 text-[#ff3300]">
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
                      // Strategy_&_Execution
                    </h2>
                    <div className="prose prose-lg prose-invert prose-p:font-mono prose-p:text-sm prose-p:leading-relaxed prose-a:text-[#ff3300] prose-a:border-b prose-a:border-[#ff3300] prose-a:no-underline hover:prose-a:bg-[#ff3300] hover:prose-a:text-white max-w-none">
                      <RichText data={project.approach} />
                    </div>
                  </div>
                )}

                {project.results && project.results.length > 0 && (
                  <div className="mt-16">
                    <h2 className="font-mono font-bold text-[10px] uppercase tracking-widest opacity-50 mb-8 border-b border-white/20 pb-4">
                      // Impact_Metrics
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/20 border border-white/20">
                      {project.results.map((r: any, i: number) => {
                        return (
                          <div key={i} className="p-8 bg-black hover:bg-[#111] transition-colors relative group">
                            <p className="text-5xl font-mono font-bold mb-4 text-[#ff3300]">
                              {r.value}
                            </p>
                            <p className="font-mono text-sm font-bold uppercase tracking-widest mb-2">{r.metric}</p>
                            {r.description && (
                              <p className="font-mono text-[10px] uppercase tracking-widest opacity-50">{r.description}</p>
                            )}
                            <div className="absolute top-4 right-4 w-2 h-2 border border-white/20 group-hover:border-[#ff3300]"></div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Stack */}
                {project.stack && (project.stack as any[]).length > 0 && (
                  <div className="pt-16 mt-16 border-t border-white/20">
                    <h2 className="font-mono font-bold text-[10px] uppercase tracking-widest opacity-50 mb-8">
                      // Applied_Technologies
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {(project.stack as any[]).map((tool: any) => (
                        <span
                          key={typeof tool === 'object' ? tool.id : tool}
                          className="px-3 py-1 text-[10px] font-mono border border-white/20 uppercase tracking-widest font-bold hover:bg-[#ff3300] hover:border-[#ff3300] transition-colors"
                        >
                          {typeof tool === 'object' ? tool.name : tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Reveal>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'projects',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const project = result.docs[0]
  if (!project) return {}
  return {
    title: `${project.title} | Román García`,
    description: project.context || undefined,
  }
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const projects = await payload.find({ collection: 'projects', limit: 100 })
  return projects.docs.map((p: any) => ({ slug: p.slug }))
}
