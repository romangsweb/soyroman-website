import React from 'react'
import { cms } from '@/lib/cms'
import type { Metadata } from 'next'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { PageTransition } from '@/components/motion/PageTransition'
import { Reveal } from '@/components/motion/Reveal'
import { SplitText } from '@/components/motion/SplitText'

export default async function AboutPage() {
  const profile = await cms.findGlobal({ slug: 'profile' })

  return (
    <PageTransition>
      <div className="bg-[#f4f4f4] text-black font-sans selection:bg-[#ff3300] selection:text-white min-h-screen border-x border-black max-w-[1920px] mx-auto">
        
        {/* TE Header */}
        <section className="pt-32 border-b border-black relative bg-[#e5e5e5]">
          <div className="border-t border-black p-8 md:p-16 relative container mx-auto">
            <Reveal duration={1.2}>
              <div className="flex items-center gap-3 mb-16">
                <div className="w-3 h-3 bg-[#ff3300]"></div>
                <p className="font-mono uppercase tracking-[0.2em] text-xs font-bold text-black/60">
                  SYS.04 // Profile Data
                </p>
              </div>
            </Reveal>
            <h1 className="text-[clamp(3rem,8vw,8rem)] leading-[0.9] tracking-tighter font-semibold mb-8">
              <SplitText text="Sobre mí" delay={50} />
            </h1>
            <div className="w-full h-8 border border-black/20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMjIyIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-20"></div>
          </div>
        </section>

        {/* Content Section with Photo Layout */}
        <section className="border-b border-black bg-white">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-black border-x border-black bg-white">
              
              {/* Photo Area */}
              <div className="md:col-span-5 bg-[#f4f4f4] p-8 md:p-16 flex flex-col justify-center items-center">
                <Reveal className="w-full max-w-sm mx-auto">
                  <div className="aspect-[3/4] bg-[#e5e5e5] border border-black relative group flex flex-col shadow-[8px_8px_0_0_#000]">
                    {/* Top Bar of the photo frame */}
                    <div className="h-8 border-b border-black flex items-center px-4 justify-between bg-white">
                      <span className="font-mono text-[10px] uppercase font-bold">IMG_REC.01</span>
                      <div className="w-2 h-2 bg-[#ff3300] animate-pulse"></div>
                    </div>
                    {/* Photo content placeholder */}
                    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-white">
                       {/* This is where the actual photo will go if added */}
                       <div className="absolute inset-0 bg-[#e5e5e5] opacity-50"></div>
                       <div className="w-16 h-16 border-2 border-black flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative z-10 bg-white">
                          <div className="w-4 h-4 bg-black"></div>
                       </div>
                       <p className="font-mono uppercase tracking-widest text-black text-xs font-bold px-2 text-center relative z-10">
                         [ INSERT VISUAL DATA ]
                       </p>
                       
                       {/* Corner marks */}
                       <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-black/30"></div>
                       <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-black/30"></div>
                       <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-black/30"></div>
                       <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-black/30"></div>
                    </div>
                  </div>
                </Reveal>
              </div>

              {/* Text Area */}
              <div className="md:col-span-7 flex flex-col bg-white">
                <div className="p-8 md:p-16 flex-1">
                  <Reveal delay={0.2}>
                    <h2 className="font-mono text-xl md:text-2xl font-bold tracking-tight mb-12 max-w-2xl leading-relaxed">
                      "Operaciones, Estrategia y Diseño fusionados para escalar sistemas B2B."
                    </h2>
                    
                    {profile?.longBio && (
                      <div className="prose prose-lg text-black/80 prose-p:font-mono prose-p:text-sm prose-p:leading-relaxed prose-a:text-[#ff3300] prose-a:font-mono prose-a:text-sm prose-a:uppercase prose-a:font-bold prose-a:border-b prose-a:border-[#ff3300] prose-a:no-underline hover:prose-a:bg-[#ff3300] hover:prose-a:text-white mb-16 max-w-none">
                        <RichText data={profile.longBio} />
                      </div>
                    )}
                  </Reveal>
                </div>

                {/* Interests */}
                <div className="border-t border-black p-8 md:p-16 bg-[#f4f4f4]">
                  <Reveal delay={0.3}>
                    <h3 className="font-mono font-bold uppercase tracking-widest text-[10px] mb-8 text-black/50">
                      // Intereses_Y_Especialidades
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Programación',
                        'Diseño industrial',
                        'Impresión 3D',
                        'Acuarismo',
                        'Teoría social',
                        'Psicología',
                        'Arquitectura',
                      ].map((interest, i) => {
                        return (
                          <span
                            key={interest}
                            className="font-mono text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 border border-black bg-white hover:bg-[#ff3300] hover:text-white hover:border-[#ff3300] transition-colors cursor-default flex items-center gap-2"
                          >
                            <span className="w-1.5 h-1.5 bg-black"></span>
                            {interest}
                          </span>
                        )
                      })}
                    </div>
                  </Reveal>
                </div>
              </div>

            </div>
          </div>
        </section>

      </div>
    </PageTransition>
  )
}

export const metadata: Metadata = {
  title: 'Sobre mí | Román García',
  description: 'Conoce más sobre Román García — Director de Marketing B2B, programador y maker.',
}
