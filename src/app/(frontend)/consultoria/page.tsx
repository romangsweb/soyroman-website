import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PageTransition } from '@/components/motion/PageTransition'
import { Reveal } from '@/components/motion/Reveal'
import { SplitText } from '@/components/motion/SplitText'
import { ArrowUpRight } from '@/components/icons'
import { ContactForm } from '@/components/ContactForm'
import { IconTile } from '@/components/IconTile'
import { RECURSOS } from '@/data/recursos'
import { AUDIENCE, FAQ, FIT, GETS, NEEDS, NOT_FIT, PRICE_FACTORS, SERVICES, STEPS } from '@/data/services'
import { PERSON_ID, SITE, canonical, ld } from '@/lib/seo'

// Enlace de HubSpot Meetings (Vercel: NEXT_PUBLIC_MEETINGS_URL). Sin él, "Agendar" baja al formulario.
const MEETINGS = process.env.NEXT_PUBLIC_MEETINGS_URL || 'https://meetings.hubspot.com/roman-garcia-solis'
const tool = (slug: string) => RECURSOS.find((r) => r.slug === slug && r.href)
const FREE_TOOLS = ['radiografia-stack', 'auditor-aeo', 'embudo-inverso', 'madurez-revops'].map(tool).filter(Boolean) as typeof RECURSOS
const TOOL_COUNT = RECURSOS.filter((r) => r.href).length

const btnDark =
  'group inline-flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-widest bg-black text-white px-6 py-3 border border-black hover:bg-[#e85a2a] hover:border-[#e85a2a] transition-colors'
const btnOr =
  'group inline-flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-widest bg-[#e85a2a] text-white px-6 py-3 border border-black hover:bg-black transition-colors'
const btnLine =
  'inline-flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-widest bg-white text-black px-6 py-3 border border-black hover:bg-black hover:text-white transition-colors'
const label = 'font-mono text-[10px] font-bold uppercase tracking-widest opacity-50'

function Agendar({ className, children }: { className: string; children: React.ReactNode }) {
  return MEETINGS ? (
    <a href={MEETINGS} target="_blank" rel="noopener noreferrer" className={className} data-cta="agendar">{children}</a>
  ) : (
    <a href="#cotizar" className={className}>{children}</a>
  )
}

export default function ConsultoriaPage() {
  const jsonLd = ld(
    ...SERVICES.map((s) => ({
      '@type': 'Service',
      '@id': `${SITE}/consultoria#${s.id}`,
      name: s.title,
      description: s.summary,
      provider: { '@id': PERSON_ID },
      areaServed: 'MX',
    })),
    {
      '@type': 'FAQPage',
      '@id': `${SITE}/consultoria#faq`,
      mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  )

  return (
    <PageTransition>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
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
              <div className="flex flex-wrap gap-4 mt-10">
                <Agendar className={btnOr}>
                  Agendar 30 minutos
                  <ArrowUpRight className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Agendar>
                <a href="#cotizar" className={btnLine}>Escribirme</a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Para quién */}
        <section className="border-b border-black bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black">
            {[
              { t: 'Es para ti si', items: FIT, c: 'bg-[#3ddc84]' },
              { t: 'No es para ti si', items: NOT_FIT, c: 'bg-[#e85a2a]' },
            ].map((b) => (
              <div key={b.t} className="p-8 md:p-16">
                <h2 className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-widest mb-6">
                  <span className={`w-3 h-3 rounded-full border border-black ${b.c}`} />
                  {b.t}
                </h2>
                <ul className="divide-y divide-black/10 border-y border-black/10">
                  {b.items.map((x) => (
                    <li key={x} className="flex gap-4 py-3 font-mono text-sm leading-relaxed">
                      <span className="mt-2 w-1.5 h-1.5 shrink-0 bg-black" />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Empieza gratis */}
        <section className="border-b border-black bg-[#0b0d0c] text-[#cfd]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-8 md:p-16 items-center">
            <p className="lg:col-span-4 font-mono text-sm leading-relaxed">
              <span className="text-[#3ddc84] font-bold uppercase tracking-widest text-xs block mb-3">Empieza gratis</span>
              Antes de la llamada, corre un diagnóstico con mis herramientas y llega con datos. Uso los resultados para no empezar de cero.
            </p>
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FREE_TOOLS.map((r) => (
                <Link key={r.slug} href={r.href!} className="border border-white/20 p-4 font-mono text-sm hover:border-[#3ddc84] hover:text-white transition-colors">
                  {r.name} <span className="text-[#3ddc84]">▸</span>
                  <span className="block text-[10px] uppercase tracking-widest text-[#6c7] mt-1">{r.sub}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Proceso */}
        <section className="border-b border-black bg-[#f4f4f4]">
          <div className="p-8 md:p-16 pb-8 md:pb-10">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Cómo trabajamos</h2>
          </div>
          <ol className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 border-t border-black divide-y md:divide-y-0 xl:divide-x divide-black">
            {STEPS.map((s, i) => (
              <li key={s.title} className="p-8 md:p-10 bg-white md:[&:nth-child(2)]:border-l md:[&:nth-child(3)]:border-t md:[&:nth-child(4)]:border-t md:[&:nth-child(4)]:border-l xl:!border-t-0 border-black">
                <span className="font-mono text-4xl text-[#e85a2a]">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="text-lg font-semibold mt-3 mb-2">{s.title}</h3>
                <p className="font-mono text-sm leading-relaxed opacity-80">{s.text}</p>
                <p className={`${label} mt-4`}>{s.note}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Servicios */}
        <section className="bg-white">
          <div className="p-8 md:p-16 pb-0 md:pb-0">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Servicios</h2>
          </div>
          <div className="grid grid-cols-1 divide-y divide-black">
            {SERVICES.map((s, i) => {
              const t = tool(s.toolSlug)
              return (
                <Reveal delay={i * 0.08} key={s.id}>
                  <article id={s.id} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 p-8 md:p-16 scroll-mt-16">
                    <div className="lg:col-span-4 flex flex-col gap-6">
                      <div className="flex items-center gap-4">
                        <IconTile name={s.id} size="lg" />
                        <span className="font-mono font-bold text-lg text-[#e85a2a]">{String(i + 1).padStart(2, '0')}</span>
                      </div>
                      <h3 className="text-3xl md:text-4xl font-semibold tracking-tight">{s.title}</h3>
                      <span className="self-start font-mono text-[10px] font-bold uppercase tracking-widest border border-black px-3 py-1">
                        {s.duration}
                      </span>
                    </div>
                    <div className="lg:col-span-8">
                      <p className="font-mono text-sm md:text-base leading-relaxed opacity-80 mb-8 max-w-2xl">{s.summary}</p>
                      <h4 className={`${label} mb-4`}>Qué entrego</h4>
                      <ul className="divide-y divide-black/10 border-y border-black/10 mb-8">
                        {s.deliverables.map((d) => (
                          <li key={d} className="flex gap-4 py-3 font-mono text-sm leading-relaxed">
                            <span className="mt-2 w-1.5 h-1.5 shrink-0 bg-black" />
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex flex-wrap gap-3">
                        <a href="#cotizar" className={btnDark}>
                          Cotizar
                          <ArrowUpRight className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </a>
                        {s.caseSlug && <Link href={`/proyectos/${s.caseSlug}`} className={btnLine}>Caso: {s.caseLabel} ▸</Link>}
                        {t && <Link href={t.href!} className={btnLine}>Empieza con: {t.name}</Link>}
                      </div>
                    </div>
                  </article>
                </Reveal>
              )
            })}
          </div>
        </section>

        {/* Precio */}
        <section className="border-t border-black bg-[#e5e5e5]">
          <div className="p-8 md:p-16">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">De qué depende el precio</h2>
            <p className="font-mono text-sm leading-relaxed opacity-80 max-w-3xl mb-10">
              Cotizo cada proyecto porque dos empresas con el mismo servicio pueden necesitar trabajos muy distintos. Esto es lo que más mueve el costo:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              {PRICE_FACTORS.map((f) => (
                <div key={f.title} className="bg-white border border-black p-5">
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="font-mono text-xs leading-relaxed opacity-80">{f.text}</p>
                  <p className={`${label} mt-4`}>{f.tag}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Lo que necesito / lo que te llevas */}
        <section className="border-t border-black bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black">
            {[{ t: 'Lo que necesito de ti', items: NEEDS }, { t: 'Lo que te llevas siempre', items: GETS }].map((b) => (
              <div key={b.t} className="p-8 md:p-16">
                <h2 className="font-mono text-xs font-bold uppercase tracking-widest mb-6">{b.t}</h2>
                <ul className="divide-y divide-black/10 border-y border-black/10">
                  {b.items.map((x) => (
                    <li key={x} className="flex gap-4 py-3 font-mono text-sm leading-relaxed">
                      <span className="mt-2 w-1.5 h-1.5 shrink-0 bg-[#e85a2a]" />
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Por qué conmigo */}
        <section className="border-t border-black bg-[#f4f4f4]">
          <div className="p-8 md:p-16">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-10">Por qué conmigo</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 border border-black divide-x divide-y lg:divide-y-0 divide-black bg-white">
              {[
                ['Desde 2017', 'en generación de demanda B2B en empresas de tecnología'],
                ['120+', 'leads al mes en la operación que dirijo'],
                ['15+', 'sitios web lanzados'],
                [String(TOOL_COUNT), 'herramientas en este sitio, construidas por mí: así trabajo cuando implemento'],
              ].map(([n, t]) => (
                <div key={t} className="p-6">
                  <p className="text-3xl md:text-4xl font-semibold text-[#e85a2a]">{n}</p>
                  <p className="font-mono text-xs leading-relaxed opacity-80 mt-2">{t}</p>
                </div>
              ))}
            </div>
            <p className="font-mono text-sm mt-6">
              Lee los casos completos, con el problema, lo que hice y los resultados:{' '}
              <Link href="/proyectos" className="underline decoration-[#e85a2a] underline-offset-4 hover:text-[#e85a2a]">ver casos ▸</Link>
            </p>
          </div>
        </section>

        {/* Preguntas frecuentes */}
        <section id="faq" className="border-t border-black bg-white">
          <div className="p-8 md:p-16">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-10">Preguntas frecuentes</h2>
            <div className="border-t border-black">
              {FAQ.map((f, i) => (
                <details key={f.q} open={i === 0} className="border-b border-black group">
                  <summary className="cursor-pointer list-none flex justify-between gap-6 py-5 text-lg font-medium">
                    {f.q}
                    <span className="font-mono text-[#e85a2a] group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <p className="font-mono text-sm leading-relaxed opacity-80 pb-6 max-w-3xl">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Cotizar */}
        <section id="cotizar" className="border-t border-black scroll-mt-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-black">
            <div className="lg:col-span-5 p-8 md:p-16 bg-[#e5e5e5]">
              <h2 className="text-3xl lg:text-5xl font-medium tracking-tight mb-8 leading-tight">Cuéntame dónde estás hoy</h2>
              <p className="font-mono text-sm leading-relaxed opacity-80 max-w-md">
                Una llamada de 30 minutos, sin compromiso. Si prefieres escribir, el formulario me llega directo y te respondo
                con una propuesta en 3 días hábiles.
              </p>
              {MEETINGS && (
                <div className="mt-8">
                  <Agendar className={btnOr}>
                    Agendar en mi calendario
                    <ArrowUpRight className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Agendar>
                </div>
              )}
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
  alternates: canonical('/consultoria'),
  title: 'Consultoría de generación de demanda, CRM y SEO/AEO',
  description:
    'Consultoría para pymes B2B en crecimiento: generación de demanda, CRM, SEO y AEO, implementación y mentoría. Proceso, entregables y de qué depende el precio.',
}
