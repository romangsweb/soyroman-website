import React from 'react'
import { cms } from '@/lib/cms'
import type { Metadata } from 'next'
import { PageTransition } from '@/components/motion/PageTransition'
import { Reveal } from '@/components/motion/Reveal'
import { SplitText } from '@/components/motion/SplitText'

export default async function UsesPage() {
  const tools = await cms.find({
    collection: 'tools',
    limit: 100,
    depth: 1,
  })

  // Group by category
  const grouped = tools.docs.reduce<Record<string, any[]>>((acc, tool: any) => {
    const cat = tool.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(tool)
    return acc
  }, {})

  const categoryLabels: Record<string, string> = {
    crm: 'CRM & RevOps',
    ads: 'Advertising',
    analytics: 'Analytics',
    seo: 'SEO',
    dev: 'Development',
    ia: 'AI_Systems',
    design: 'Design',
    automation: 'Automation',
    other: 'Misc',
  }

  const categoryColors: Record<string, string> = {
    crm: '#E12229',
    ads: '#FFB800',
    analytics: '#0F9D58',
    seo: '#0A32B8',
    dev: '#ff3300',
    ia: '#E12229',
    design: '#FFB800',
    automation: '#0F9D58',
    other: '#000000',
  }

  return (
    <PageTransition>
      <div className="bg-[#f4f4f4] text-black font-sans selection:bg-[#ff3300] selection:text-white min-h-screen border-x border-black max-w-[1920px] mx-auto">
        
        {/* TE Header */}
        <section className="pt-32 border-b border-black relative bg-[#e5e5e5]">
          <div className="border-t border-black p-8 md:p-16 relative container mx-auto">
            <Reveal duration={1.2}>
              <div className="flex items-center gap-3 mb-16">
                <div className="w-3 h-3 bg-[#FFB800]"></div>
                <p className="font-mono uppercase tracking-[0.2em] text-xs font-bold text-black/60">
                  SYS.06 // Stack Inventory
                </p>
              </div>
            </Reveal>
            <h1 className="text-[clamp(3rem,8vw,8rem)] leading-[0.9] tracking-tighter font-semibold mb-8">
              <SplitText text="/uses" delay={50} />
            </h1>
            <Reveal delay={0.2}>
              <p className="font-mono text-sm md:text-base leading-relaxed max-w-2xl opacity-80 border-l-2 border-[#ff3300] pl-4 mb-8">
                Inventario de herramientas, software y hardware de uso continuo.
              </p>
            </Reveal>
            <div className="w-full h-8 border border-black/20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMjIyIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-20"></div>
          </div>
        </section>

        {/* Content Section */}
        <section className="bg-white">
          <div className="container mx-auto p-8 md:p-16 border-x border-black bg-white min-h-[50vh]">
            <div className="space-y-16">
              {Object.entries(grouped).map(([category, categoryTools], i) => (
                <Reveal key={category} delay={i * 0.1}>
                  <div className="border border-black bg-[#f4f4f4] relative">
                    <div className="bg-white border-b border-black p-4 flex items-center justify-between">
                      <h2 className="font-mono text-xs uppercase tracking-widest font-bold flex items-center gap-2">
                        <span className="w-2 h-2" style={{ backgroundColor: categoryColors[category] || '#000' }}></span>
                        {categoryLabels[category] || category}
                      </h2>
                      <span className="font-mono text-[10px] opacity-50 uppercase">[{categoryTools.length} ITEMS]</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-black">
                      {categoryTools.map((tool: any) => (
                        <div
                          key={tool.id}
                          className="flex items-center justify-between gap-3 p-4 bg-white hover:bg-black hover:text-white transition-colors group"
                        >
                          <span className="font-semibold text-sm tracking-tight">{tool.name}</span>
                          {tool.level && (
                            <span className="text-[9px] font-mono border border-black/20 px-2 py-0.5 uppercase tracking-widest group-hover:border-white/30 group-hover:text-white">
                              {tool.level}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
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
  title: 'Herramientas (/uses)',
  description: 'Herramientas, software y hardware que uso — Román García.',
}
