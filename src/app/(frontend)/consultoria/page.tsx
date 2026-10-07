import React from 'react'
import type { Metadata } from 'next'
import { PageTransition } from '@/components/motion/PageTransition'
import { Reveal } from '@/components/motion/Reveal'
import { SplitText } from '@/components/motion/SplitText'
import { ArrowUpRight } from '@/components/icons'
import { ContactForm } from '@/components/ContactForm'
import { IconTile } from '@/components/IconTile'
import { AUDIENCE, SERVICES } from '@/data/services'

export default function ConsultoriaPage() {
  return (
    <PageTransition>
      <div className="bg-[#f4f4f4] text-black font-sans selection:bg-[#e85a2a] selection:text-white min-h-screen border-x border-black max-w-[1920px] mx-auto">
        {/* Encabezado */}
        <section className="border-b border-black relative bg-[#e5e5e5]">
          <div className="p-8 md:p-16 relative">
            <Reveal duration={1.2}>
              <div className="flex items-center gap-3 mb-16">
                <div className="w-3 h-3 bg-[#e85a2a]" />
                <p className="font-mono uppercase tracking-[0.2em] text-xs font-bold text-black/60">SYS.03 // Consultoría</p>
              </div>
            </Reveal>
            <h1 className="text-[clamp(3rem,8vw,8rem)] leading-[0.9] tracking-tighter font-semibold mb-8 max-w-4xl">
              <SplitText text="Consultoría" delay={50} />
            </h1>
            <Reveal delay={0.3}>
              <p className="font-mono text-sm md:text-base leading-relaxed max-w-3xl opacity-80 border-l-2 border-[#e85a2a] pl-4">
                {AUDIENCE}
              </p>
            </Reveal>
          </div>
        </section>

        {/* Servicios */}
        <section className="bg-white">
          <div className="grid grid-cols-1 divide-y divide-black">
            {SERVICES.map((s, i) => (
              <Reveal delay={i * 0.08} key={s.id}>
                <article id={s.id} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 p-8 md:p-16">
                  <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                      <IconTile name={s.id} size="lg" />
                      <span className="font-mono font-bold text-lg text-[#e85a2a]">{String(i + 1).padStart(2, '0')}</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">{s.title}</h2>
                    <span className="self-start font-mono text-[10px] font-bold uppercase tracking-widest border border-black px-3 py-1">
                      {s.duration}
                    </span>
                  </div>
                  <div className="lg:col-span-8">
                    <p className="font-mono text-sm md:text-base leading-relaxed opacity-80 mb-8 max-w-2xl">{s.summary}</p>
                    <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-50 mb-4">Qué entrego</h3>
                    <ul className="divide-y divide-black/10 border-y border-black/10 mb-8">
                      {s.deliverables.map((d) => (
                        <li key={d} className="flex gap-4 py-3 font-mono text-sm leading-relaxed">
                          <span className="mt-2 w-1.5 h-1.5 shrink-0 bg-black" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                    <a
                      href="#cotizar"
                      className="group inline-flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-widest bg-black text-white px-6 py-3 border border-black hover:bg-[#e85a2a] hover:border-[#e85a2a] transition-colors"
                    >
                      Cotizar
                      <ArrowUpRight className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </a>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Cotizar */}
        <section id="cotizar" className="border-t border-black scroll-mt-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-black">
            <div className="lg:col-span-5 p-8 md:p-16 bg-[#e5e5e5]">
              <h2 className="text-3xl lg:text-5xl font-medium tracking-tight mb-8 leading-tight">Cuéntame dónde estás hoy</h2>
              <p className="font-mono text-sm leading-relaxed opacity-80 max-w-md">
                Cada empresa parte de un punto distinto, por eso cotizo cada proyecto. Te respondo con una propuesta o con
                una llamada de 30 minutos para entender tu caso, sin compromiso.
              </p>
            </div>
            <div className="lg:col-span-7 bg-white p-8 md:p-16">
              <ContactForm origin="Consultoría" />
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  )
}

export const metadata: Metadata = {
  title: 'Consultoría',
  description:
    'Consultoría de generación de demanda, CRM, SEO y AEO para pymes en crecimiento: diagnóstico, implementación y mentoría.',
}
