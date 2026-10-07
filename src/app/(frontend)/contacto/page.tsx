import React from 'react'
import type { Metadata } from 'next'
import { PageTransition } from '@/components/motion/PageTransition'
import { Reveal } from '@/components/motion/Reveal'
import { SplitText } from '@/components/motion/SplitText'
import { ContactForm } from '@/components/ContactForm'

export default function ContactoPage() {
  return (
    <PageTransition>
      <div className="bg-[#f4f4f4] text-black font-sans selection:bg-[#e85a2a] selection:text-white min-h-screen border-x border-black max-w-[1920px] mx-auto">
        
        {/* TE Header */}
        <section className="border-b border-black relative bg-[#e5e5e5]">
          <div className="p-8 md:p-16 relative">
            <Reveal duration={1.2}>
              <div className="flex items-center gap-3 mb-16">
                <div className="w-3 h-3 bg-[#e85a2a] animate-pulse"></div>
                <p className="font-mono uppercase tracking-[0.2em] text-xs font-bold text-black/60">
                  SYS.06 // Contacto
                </p>
              </div>
            </Reveal>
            <h1 className="text-[clamp(3rem,8vw,8rem)] leading-[0.9] tracking-tighter font-semibold mb-8">
              <SplitText text="Contacto" delay={50} />
            </h1>
            <div className="w-full h-8 border border-black/20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMjIyIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-20"></div>
          </div>
        </section>

        {/* Form Layout */}
        <section className="border-b border-black">
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-black">
            
            {/* Left: Info */}
            <div className="lg:col-span-5 p-8 md:p-16 flex flex-col bg-[#e5e5e5]">
              <Reveal delay={0.2} className="flex-1 flex flex-col">
                <h2 className="text-3xl lg:text-5xl font-medium tracking-tight mb-8 leading-tight">
                  ¿Tienes un sistema B2B que reparar o construir?
                </h2>
                <p className="font-mono text-sm leading-relaxed mb-16 opacity-80 max-w-md">
                  Completa el formulario y reviso tu caso. Si puedo ayudarte, agendamos una llamada de 30 minutos sin compromiso.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-t border-black pt-16 mt-auto">
                  <div>
                    <h3 className="font-mono font-bold uppercase tracking-widest text-[10px] mb-4 opacity-50">Ubicación</h3>
                    <p className="font-mono text-sm font-bold uppercase tracking-widest">CDMX, México</p>
                  </div>
                  <div>
                    <h3 className="font-mono font-bold uppercase tracking-widest text-[10px] mb-4 opacity-50">Correo</h3>
                    <a
                      href="mailto:contacto@soyroman.com"
                      className="font-mono text-sm font-bold uppercase tracking-widest hover:text-[#e85a2a] transition-colors"
                    >
                      contacto@soyroman.com
                    </a>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Right: Form */}
            <div className="lg:col-span-7 bg-white p-8 md:p-16 relative">
              <Reveal delay={0.4}>
                <div className="relative group">
                  
                  {/* Decorative hardware elements */}
                  <div className="absolute top-0 right-0 flex gap-2">
                    <div className="w-2 h-2 border border-black rounded-full"></div>
                    <div className="w-2 h-2 border border-black rounded-full"></div>
                  </div>

                  <div className="mt-8">
                    <ContactForm origin="Contacto" />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  )
}

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Contacta con Román García para proyectos de marketing B2B.',
}
