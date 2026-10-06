import React from 'react'
import { cms } from '@/lib/cms'
import type { Metadata } from 'next'
import { PageTransition } from '@/components/motion/PageTransition'
import { Reveal } from '@/components/motion/Reveal'
import { SplitText } from '@/components/motion/SplitText'
import { IconTile } from '@/components/IconTile'

export default async function UsesPage() {
  const tools = await cms.find({
    collection: 'tools',
    limit: 100,
    depth: 1,
  })

  // Orden y nombres en español de las categorías (claves = valores del campo `category`)
  const CATEGORIES: [string, string][] = [
    ['crm-revops', 'CRM y RevOps'],
    ['analytics', 'Analítica y SEO'],
    ['web', 'Web'],
    ['ia-data', 'IA y datos'],
    ['infrastructure', 'Infraestructura y seguridad'],
    ['ads', 'Paid media'],
    ['design', 'Diseño'],
    ['workspace', 'Entorno de trabajo'],
  ]
  const LEVELS: Record<string, string> = {
    beginner: 'Básico',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
    expert: 'Experto',
  }
  const RANK: Record<string, number> = { expert: 0, advanced: 1, intermediate: 2, beginner: 3 }
  const groups = CATEGORIES.map(([key, label]) => ({
    key,
    label,
    // Primero lo que más domino; dentro del mismo nivel, alfabético
    tools: tools.docs
      .filter((t: any) => t.category === key)
      .sort((a: any, b: any) => (RANK[a.level] ?? 9) - (RANK[b.level] ?? 9) || a.name.localeCompare(b.name, 'es')),
  })).filter((g) => g.tools.length > 0)

  return (
    <PageTransition>
      <div className="bg-[#f4f4f4] text-black font-sans selection:bg-[#ff3300] selection:text-white min-h-screen border-x border-black max-w-[1920px] mx-auto">
        
        {/* TE Header */}
        <section className="border-b border-black relative bg-[#e5e5e5]">
          <div className="p-8 md:p-16 relative container mx-auto">
            <Reveal duration={1.2}>
              <div className="flex items-center gap-3 mb-16">
                <div className="w-3 h-3 bg-[#ff3300]"></div>
                <p className="font-mono uppercase tracking-[0.2em] text-xs font-bold text-black/60">
                  SYS.06 // Herramientas
                </p>
              </div>
            </Reveal>
            <h1 className="text-[clamp(3rem,8vw,8rem)] leading-[0.9] tracking-tighter font-semibold mb-8">
              <SplitText text="Herramientas" delay={50} />
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
              {groups.map(({ key, label, tools: categoryTools }, i) => (
                <Reveal key={key} delay={i * 0.05}>
                  <div className="border border-black bg-white relative overflow-hidden">
                    <div className="bg-white border-b border-black p-4 flex items-center justify-between">
                      <h2 className="font-mono text-xs uppercase tracking-widest font-bold flex items-center gap-3">
                        <IconTile name={key} size="sm" />
                        {label}
                      </h2>
                      <span className="font-mono text-[10px] opacity-50 uppercase">[{categoryTools.length}]</span>
                    </div>

                    {/* Bordes por celda (no gap negro): las filas incompletas quedan en blanco */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 -mr-px -mb-px">
                      {categoryTools.map((tool: any) => (
                        <div
                          key={tool.id}
                          className="flex items-center justify-between gap-3 p-4 bg-white border-r border-b border-black hover:bg-black hover:text-white transition-colors group"
                        >
                          <span className="font-semibold text-sm tracking-tight">{tool.name}</span>
                          {tool.level && (
                            <span className="text-[9px] font-mono border border-black/20 px-2 py-0.5 uppercase tracking-widest group-hover:border-white/30 group-hover:text-white">
                              {LEVELS[tool.level] || tool.level}
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
