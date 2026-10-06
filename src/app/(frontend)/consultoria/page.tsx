import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PageTransition } from '@/components/motion/PageTransition'
import { Reveal } from '@/components/motion/Reveal'
import { SplitText } from '@/components/motion/SplitText'
import { ArrowUpRight } from '@/components/icons'

export default function ConsultoriaPage() {
  const services = [
    {
      id: 'martech',
      title: 'Auditoría MarTech & RevOps',
      desc: 'Analizamos tu stack tecnológico actual (CRM, analítica, sitio web y automatizaciones) para detectar cuellos de botella en la alineación entre Marketing y Ventas. Entregamos un roadmap de optimización de datos y procesos.',
      color: '#E12229', // bauhaus red
      shape: 'square'
    },
    {
      id: 'growth',
      title: 'Diseño de Motores B2B',
      desc: 'Construimos desde cero (o reestructuramos) el sistema de captación y nutrición de leads para empresas con ciclos de venta largos. Implementación técnica y estratégica end-to-end.',
      color: '#0A32B8', // bauhaus blue
      shape: 'circle'
    },
    {
      id: 'advisory',
      title: 'Advisory & Liderazgo',
      desc: 'Acompañamiento directivo para equipos internos de marketing. Funciono como tu Director de Marketing fraccional para guiar la estrategia, contratar talento técnico y escalar operaciones.',
      color: '#FFB800', // bauhaus yellow
      shape: 'triangle'
    }
  ]

  return (
    <PageTransition>
      <div className="bg-[#f4f4f4] text-black font-sans selection:bg-[#ff3300] selection:text-white min-h-screen border-x border-black max-w-[1920px] mx-auto">
        
        {/* TE Header */}
        <section className="pt-32 border-b border-black relative bg-[#e5e5e5] overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full mix-blend-multiply opacity-20 pointer-events-none translate-x-1/3 -translate-y-1/3 bg-[#34A853]"></div>

          <div className="border-t border-black p-8 md:p-16 relative z-10 container mx-auto">
            <Reveal duration={1.2}>
              <div className="flex items-center gap-3 mb-16">
                <div className="w-3 h-3 rounded-full bg-[#0A32B8]"></div>
                <p className="font-mono uppercase tracking-[0.2em] text-xs font-bold text-black/60">
                  SYS.03 // Consulting Services
                </p>
              </div>
            </Reveal>
            <h1 className="text-[clamp(3rem,8vw,8rem)] leading-[0.9] tracking-tighter font-semibold mb-8 max-w-4xl">
              <SplitText text="Consultoría." delay={50} />
            </h1>
            <Reveal delay={0.3}>
              <p className="font-mono text-sm md:text-base leading-relaxed max-w-3xl opacity-80 border-l-2 border-[#E12229] pl-4 mb-8">
                Ayudo a empresas técnicas y B2B a escalar sus operaciones construyendo sistemas predecibles, en lugar de depender de tácticas aisladas.
              </p>
            </Reveal>
            <div className="w-full h-8 border border-black/20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMjIyIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-20"></div>
          </div>
        </section>

        {/* Services List */}
        <section className="bg-white">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 divide-y divide-black border-x border-black bg-[#f4f4f4]">
              {services.map((service, i) => (
                <Reveal delay={i * 0.1} key={service.id} className="group relative overflow-hidden bg-white">
                  <Link href={`/expertise/${service.id}`} className="block">
                    <div className="flex flex-col md:flex-row gap-8 md:gap-16 p-8 md:p-16 relative z-10 hover:bg-[#111] hover:text-white transition-colors duration-500">
                      
                      {/* Left: Number & Shape */}
                      <div className="w-full md:w-1/4 flex flex-col justify-between">
                        <span className="font-mono font-bold text-lg text-[#ff3300] mb-8">
                          {(i + 1).toString().padStart(2, '0')}
                        </span>
                        
                        {/* Geometric Shape */}
                        <div className="w-16 h-16 border-2 border-black group-hover:border-white transition-colors flex items-center justify-center">
                          {service.shape === 'square' && <div className="w-8 h-8" style={{ backgroundColor: service.color }}></div>}
                          {service.shape === 'circle' && <div className="w-8 h-8 rounded-full" style={{ backgroundColor: service.color }}></div>}
                          {service.shape === 'triangle' && (
                            <div 
                              className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-b-[28px]" 
                              style={{ borderBottomColor: service.color }}
                            ></div>
                          )}
                        </div>
                      </div>

                      {/* Right: Content */}
                      <div className="w-full md:w-3/4 flex flex-col justify-center">
                        <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-6 group-hover:-translate-y-1 transition-transform">
                          {service.title}
                        </h2>
                        <p className="font-mono text-sm leading-relaxed opacity-70 mb-8 max-w-2xl">
                          {service.desc}
                        </p>
                        
                        <div className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[#ff3300]">
                          <span className="group-hover:translate-x-2 transition-transform">Explorar_Servicio</span>
                          <ArrowUpRight className="w-3 h-3 group-hover:translate-x-3 transition-transform" />
                        </div>
                      </div>
                      
                      {/* Hover background lines */}
                      <div className="absolute inset-0 z-[-1] opacity-0 group-hover:opacity-10 transition-opacity bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMjIyIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')]"></div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-black text-white relative overflow-hidden border-b border-black">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB800] mix-blend-multiply opacity-50 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#E12229] mix-blend-multiply opacity-50 blur-2xl"></div>

          <div className="container mx-auto p-8 md:p-24 border-x border-white/20 relative z-10 text-center">
            <Reveal>
              <div className="inline-flex items-center gap-2 mb-8 border border-white/20 px-4 py-2 bg-white/5">
                <div className="w-2 h-2 bg-[#34A853] animate-pulse rounded-full"></div>
                <span className="font-mono text-[10px] uppercase font-bold tracking-widest">System_Check</span>
              </div>
              
              <h2 className="text-[clamp(3rem,6vw,5rem)] leading-none tracking-tighter font-bold mb-8">
                ¿Tu sistema está roto?
              </h2>
              <p className="font-mono text-sm opacity-70 leading-relaxed mb-12 max-w-xl mx-auto">
                Agenda una sesión de diagnóstico inicial de 30 minutos sin compromiso. Analizaremos tus procesos actuales.
              </p>
              
              <Link href="/contacto" className="inline-flex items-center gap-4 text-[10px] font-mono font-bold uppercase tracking-widest bg-white text-black border border-white px-8 py-4 hover:bg-[#ff3300] hover:text-white hover:border-[#ff3300] transition-colors">
                Agendar_Sesion <ArrowUpRight className="w-4 h-4" />
              </Link>
            </Reveal>
          </div>
        </section>

      </div>
    </PageTransition>
  )
}

export const metadata: Metadata = {
  title: 'Consultoría',
  description: 'Servicios de consultoría en Marketing B2B, RevOps y MarTech.',
}
