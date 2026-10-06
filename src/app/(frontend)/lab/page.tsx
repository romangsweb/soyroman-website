import React from 'react'
import Link from 'next/link'
import { cms } from '@/lib/cms'
import type { Metadata } from 'next'
import { PageTransition } from '@/components/motion/PageTransition'
import { Reveal } from '@/components/motion/Reveal'
import { SplitText } from '@/components/motion/SplitText'

export default async function LabPage() {
  const labs = await cms.find({ collection: 'lab', limit: 50, depth: 1 })

  const statusLabels: Record<string, string> = {
    idea: 'IDEA',
    'in-progress': 'WIP',
    published: 'LIVE',
  }

  const statusColors: Record<string, string> = {
    idea: '#FFB800', // Yellow
    'in-progress': '#0A32B8', // Blue
    published: '#0F9D58', // Green
  }

  return (
    <PageTransition>
      <div className="bg-[#f4f4f4] text-black font-sans selection:bg-[#ff3300] selection:text-white min-h-screen border-x border-black max-w-[1920px] mx-auto">
        
        {/* TE Header */}
        <section className="pt-32 border-b border-black relative bg-[#e5e5e5]">
          <div className="border-t border-black p-8 md:p-16 relative container mx-auto">
            <Reveal duration={1.2}>
              <div className="flex items-center gap-3 mb-16">
                <div className="w-3 h-3 bg-[#E12229]"></div>
                <p className="font-mono uppercase tracking-[0.2em] text-xs font-bold text-black/60">
                  SYS.05 // Laboratory
                </p>
              </div>
            </Reveal>
            <h1 className="text-[clamp(3rem,8vw,8rem)] leading-[0.9] tracking-tighter font-semibold mb-8">
              <SplitText text="Lab" delay={50} />
            </h1>
            <Reveal delay={0.2}>
              <p className="font-mono text-sm md:text-base leading-relaxed max-w-2xl opacity-80 border-l-2 border-[#0A32B8] pl-4 mb-8">
                Proyectos personales, experimentos técnicos y prototipos.
              </p>
            </Reveal>
            <div className="w-full h-8 border border-black/20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMjIyIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-20"></div>
          </div>
        </section>

        {/* Lab Grid */}
        <section className="bg-white">
          <div className="container mx-auto p-8 md:p-16 border-x border-black bg-white min-h-[50vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-black border border-black">
              {labs.docs.map((lab: any, index: number) => {
                const color = statusColors[lab.status] || '#ff3300'
                
                return (
                  <Reveal key={lab.id} delay={index * 0.1}>
                    <div className="bg-[#f4f4f4] p-6 h-full flex flex-col group hover:bg-black hover:text-white transition-colors duration-300 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-2 h-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: color }}></div>
                      
                      <div className="flex items-center justify-between mb-8 border-b border-black/10 pb-4 group-hover:border-white/20">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-2">
                          <span className="w-1.5 h-1.5" style={{ backgroundColor: color }}></span>
                          {statusLabels[lab.status] || lab.status}
                        </span>
                        <span className="text-[10px] font-mono opacity-50 uppercase">EXP_{(index + 1).toString().padStart(3, '0')}</span>
                      </div>
                      
                      <Link href={`/lab/${lab.slug}`} className="flex-1 group/link">
                        <h2 className="text-2xl font-semibold mb-4 tracking-tight group-hover/link:text-[#ff3300] transition-colors">
                          {lab.title}
                        </h2>
                      </Link>

                      {lab.stack && (lab.stack as any[]).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-auto pt-6">
                          {(lab.stack as any[]).map((tool: any) => (
                            <span
                              key={typeof tool === 'object' ? tool.id : tool}
                              className="px-2 py-1 text-[9px] border border-black uppercase font-mono font-bold tracking-widest group-hover:border-white/30"
                            >
                              {typeof tool === 'object' ? tool.name : tool}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {lab.links && lab.links.length > 0 && (
                        <div className="flex gap-3 mt-6 pt-4 border-t border-black/10 group-hover:border-white/20">
                          {lab.links.map((link: any, i: number) => (
                            <a
                              key={i}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-mono font-bold uppercase tracking-widest hover:text-[#ff3300] transition-colors"
                            >
                              [{link.label || link.type}]
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </section>

      </div>
    </PageTransition>
  )
}

export const metadata: Metadata = {
  title: 'Lab | Román García',
  description: 'Proyectos personales, experimentos y herramientas de Román García.',
}
