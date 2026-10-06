import React from 'react'
import Link from 'next/link'
import { cms } from '@/lib/cms'
import type { Metadata } from 'next'
import { ArrowUpRight } from '@/components/icons'
import { PageTransition, Morph } from '@/components/motion/PageTransition'
import { Reveal } from '@/components/motion/Reveal'
import { SplitText } from '@/components/motion/SplitText'
import { PostCover } from '@/components/PostCover'

export default async function HomePage() {
  const profile = await cms.findGlobal({ slug: 'profile' })

  const expertises = await cms.find({
    collection: 'expertise',
    sort: 'order',
    limit: 5,
  })

  const featuredProjects = await cms.find({
    collection: 'projects',
    where: { featured: { equals: true } },
    limit: 4,
  })

  const latestPosts = await cms.find({
    collection: 'posts',
    sort: '-publishedAt',
    limit: 3,
    where: { _status: { equals: 'published' } },
  })

  return (
    <PageTransition>
      <div className="bg-[#f4f4f4] text-black font-sans selection:bg-[#ff3300] selection:text-white overflow-hidden min-h-screen border-x border-black max-w-[1920px] mx-auto">
        
        {/* TE Hero */}
        <section className="pt-32 border-b border-black relative bg-[#e5e5e5]">
          <div className="grid grid-cols-1 md:grid-cols-12 border-t border-black">
            
            {/* Main Title Area */}
            <div className="md:col-span-8 p-8 md:p-16 border-b md:border-b-0 md:border-r border-black bg-[#f4f4f4] relative">
              <Reveal duration={1.2}>
                <div className="flex items-center gap-3 mb-16">
                  <div className="w-3 h-3 bg-[#ff3300]"></div>
                  <p className="font-mono uppercase tracking-[0.2em] text-xs font-bold text-black/60">
                    {profile?.role || 'Director de Marketing B2B'}
                  </p>
                </div>
              </Reveal>
              
              <h1 className="text-[clamp(2.5rem,6vw,6rem)] leading-[1.05] tracking-tight font-semibold max-w-[15ch] mb-8 text-black">
                <SplitText 
                  text={profile?.tagline || 'Sistemas de crecimiento que combinan datos, estrategia y diseño.'} 
                  delay={30}
                />
              </h1>

              <Reveal delay={0.4}>
                <p className="text-xl text-black/80 leading-relaxed font-light max-w-2xl font-mono">
                  {profile?.shortBio || 'Dirijo campañas de generación de demanda en medios digitales y construyo lo que las hace funcionar: sitios, analítica, CRM y posicionamiento SEO y AEO.'}
                </p>
              </Reveal>
            </div>

            {/* Right Action Area */}
            <div className="md:col-span-4 flex flex-col bg-white">
              <Reveal className="flex-1 flex flex-col" delay={0.5}>
                <div className="p-8 border-b border-black flex-1 flex flex-col justify-center items-center text-center">
                  <span className="font-mono uppercase tracking-widest text-xs font-bold text-black/50 mb-6 block">Status</span>
                  <div className="w-16 h-16 bg-[#ff3300] border border-black mb-6 animate-pulse"></div>
                  <p className="font-mono text-sm uppercase tracking-widest font-bold">Aceptando Proyectos</p>
                </div>
                <div className="grid grid-cols-2 divide-x divide-black border-b border-black">
                  <Link href="/contacto" className="p-6 text-center hover:bg-[#ff3300] hover:text-white transition-colors group flex flex-col items-center justify-center gap-2">
                    <span className="font-mono uppercase tracking-widest text-[10px] font-bold">Contact</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Link>
                  <Link href="/cv" className="p-6 text-center hover:bg-black hover:text-white transition-colors group flex flex-col items-center justify-center gap-2">
                    <span className="font-mono uppercase tracking-widest text-[10px] font-bold">Download CV</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* TE Metrics */}
        {profile?.metrics && profile.metrics.length > 0 && (
          <section className="border-b border-black bg-white">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-black">
              {profile.metrics.map((metric: any, i: number) => {
                return (
                  <Reveal delay={i * 0.1} key={i} className="p-8 md:p-12 flex flex-col justify-between aspect-square group hover:bg-[#f4f4f4] transition-colors duration-300 relative">
                    <div className="absolute top-4 right-4 font-mono text-[10px] opacity-40 uppercase">M-{i+1}</div>
                    <div className="mt-auto">
                      <p className="text-5xl md:text-7xl font-semibold tracking-tighter mb-4 text-black group-hover:text-[#ff3300] transition-colors">{metric.value}</p>
                      <p className="font-mono uppercase tracking-[0.1em] text-xs font-bold opacity-60">{metric.label}</p>
                    </div>
                  </Reveal>
                )
              })}
            </div>
          </section>
        )}

        {/* TE Expertise (Modules) */}
        <section className="border-b border-black bg-[#f4f4f4]">
          <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-black">
            
            <div className="md:col-span-4 p-8 md:p-16 bg-[#e5e5e5]">
              <Reveal>
                <h2 className="font-mono uppercase tracking-widest text-xs font-bold text-black/50 mb-16">
                  SYS.01 // Modules
                </h2>
                <h3 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
                  Líneas de Actuación
                </h3>
              </Reveal>
            </div>

            <div className="md:col-span-8 bg-white grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:border-b sm:divide-x divide-black border-black [&>*:nth-child(n+3)]:border-t">
              {expertises.docs.map((exp: any, i: number) => (
                <Reveal delay={i * 0.1} key={exp.id} className="group">
                  <Morph name={`expertise-${exp.slug}`}>
                    <Link href={`/expertise/${exp.slug}`} className="block p-10 h-full hover:bg-black hover:text-white transition-colors duration-300 relative">
                      <div className="flex justify-between items-start mb-16">
                        <span className="font-mono text-sm opacity-50 block">{(i + 1).toString().padStart(2, '0')}</span>
                        <div className="w-3 h-3 bg-black group-hover:bg-[#ff3300] transition-colors"></div>
                      </div>
                      <h4 className="text-2xl font-semibold mb-4 tracking-tight">
                        {exp.title}
                      </h4>
                      {exp.thesis && (
                        <p className="font-mono text-sm opacity-70 leading-relaxed">{exp.thesis}</p>
                      )}
                    </Link>
                  </Morph>
                </Reveal>
              ))}
            </div>

          </div>
        </section>

        {/* TE Projects (Cases) */}
        <section className="border-b border-black bg-black text-white">
          <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-white/20">
            
            <div className="md:col-span-4 p-8 md:p-16">
              <Reveal>
                <div className="flex justify-between items-start mb-16">
                  <h2 className="font-mono uppercase tracking-widest text-xs font-bold text-white/50">
                    SYS.02 // Cases
                  </h2>
                  <Link href="/proyectos" className="font-mono uppercase tracking-widest text-[10px] text-white hover:text-[#ff3300] transition-colors border border-white/20 px-3 py-1">
                    View All
                  </Link>
                </div>
                <h3 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight mb-8">
                  Casos de Estudio
                </h3>
                <div className="w-full h-32 border border-white/20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMjIyIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-50"></div>
              </Reveal>
            </div>

            <div className="md:col-span-8 flex flex-col divide-y divide-white/20">
              {featuredProjects.docs.map((project: any, i: number) => (
                <Reveal delay={i * 0.1} key={project.id}>
                  <Morph name={`project-${project.slug}`}>
                    <Link href={`/proyectos/${project.slug}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-8 md:p-12 hover:bg-white hover:text-black transition-colors duration-300 group relative">
                      <div className="flex flex-col gap-2 mb-6 sm:mb-0">
                        <div className="flex items-center gap-4">
                          <span className="font-mono uppercase tracking-widest text-xs font-bold bg-white text-black group-hover:bg-[#ff3300] group-hover:text-white px-2 py-0.5 transition-colors">
                            {project.year || '2024'}
                          </span>
                          <span className="font-mono text-xs opacity-60 uppercase tracking-widest">
                            {project.client}
                          </span>
                        </div>
                        <h4 className="text-3xl font-semibold tracking-tight mt-2">
                          {project.title}
                        </h4>
                      </div>
                      
                      <div className="flex items-center gap-8 shrink-0">
                        {project.results && project.results.slice(0, 1).map((r: any, idx: number) => (
                          <div key={idx} className="text-right hidden sm:block">
                            <p className="text-2xl font-mono font-bold group-hover:text-[#ff3300] transition-colors">{r.value}</p>
                            <p className="font-mono text-[10px] uppercase tracking-widest opacity-60">{r.metric}</p>
                          </div>
                        ))}
                        <div className="w-12 h-12 border border-white/20 flex items-center justify-center group-hover:border-black group-hover:bg-black group-hover:text-white transition-all">
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                      </div>
                    </Link>
                  </Morph>
                </Reveal>
              ))}
            </div>

          </div>
        </section>

        {/* TE Thoughts (Index) */}
        <section className="border-b border-black bg-white">
          <div className="p-8 md:p-16 border-b border-black bg-[#f4f4f4] flex flex-col md:flex-row md:items-end justify-between gap-8">
            <Reveal>
              <h2 className="font-mono uppercase tracking-widest text-xs font-bold text-black/50 mb-4">
                SYS.03 // Index
              </h2>
              <h3 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
                Reflexiones
              </h3>
            </Reveal>
            <Reveal delay={0.2}>
              <Link href="/blog" className="font-mono uppercase tracking-widest text-[10px] text-black border border-black hover:bg-black hover:text-white transition-colors px-4 py-2">
                View Archive
              </Link>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black">
            {latestPosts.docs.map((post: any, i: number) => (
              <Reveal delay={i * 0.1} key={post.id} className="group">
                <Morph name={`post-${post.slug}`}>
                  <Link href={`/blog/${post.slug}`} className="flex flex-col h-full p-8 hover:bg-[#f4f4f4] transition-colors">
                    <PostCover
                      cover={post.cover}
                      className="aspect-[16/9] w-full border border-black mb-8"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="flex justify-between items-start mb-12">
                      <div className="w-12 h-12 border border-black flex items-center justify-center font-mono text-sm group-hover:bg-[#ff3300] group-hover:text-white group-hover:border-[#ff3300] transition-colors">
                        P{i+1}
                      </div>
                      <div className="text-right">
                        {post.readingTime && (
                          <span className="font-mono uppercase tracking-widest text-[10px] block opacity-50 mb-1">{post.readingTime} min</span>
                        )}
                        {post.publishedAt && (
                          <time className="font-mono uppercase tracking-widest text-[10px] font-bold">
                            {new Date(post.publishedAt).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                          </time>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-auto">
                      <h4 className="text-xl font-semibold tracking-tight leading-snug mb-4 group-hover:text-[#ff3300] transition-colors">
                        {post.title}
                      </h4>
                      {post.excerpt && (
                        <p className="font-mono text-sm opacity-70 leading-relaxed line-clamp-3">{post.excerpt}</p>
                      )}
                    </div>
                  </Link>
                </Morph>
              </Reveal>
            ))}
          </div>
        </section>

        {/* TE Footer / CTA */}
        <section className="bg-[#ff3300] text-white">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black border-b border-black">
            <div className="p-16 md:p-32 flex flex-col justify-center items-center text-center">
              <Reveal>
                <div className="w-24 h-24 border-2 border-white flex items-center justify-center mb-12 animate-spin-slow">
                  <div className="w-8 h-8 bg-white"></div>
                </div>
                <h2 className="text-5xl md:text-7xl font-semibold tracking-tighter mb-6">
                  Hablemos
                </h2>
                <p className="font-mono text-sm uppercase tracking-widest opacity-80 mb-12 max-w-sm">
                  Diseñando los motores b2b de la próxima década
                </p>
                <Link href="/contacto" className="font-mono text-sm font-bold uppercase tracking-widest bg-white text-black px-8 py-4 border border-black hover:bg-black hover:text-white hover:border-black transition-all flex items-center gap-4">
                  Init_Comm <ArrowUpRight className="w-4 h-4" />
                </Link>
              </Reveal>
            </div>
            
            <div className="bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2ZmMzMwMCI+PC9yZWN0Pgo8Y2lyY2xlIGN4PSIyIiBjeT0iMiIgcj0iMiIgZmlsbD0iI2ZmNzc1NSI+PC9jaXJjbGU+Cjwvc3ZnPg==')] opacity-50 min-h-[300px]"></div>
          </div>
        </section>
      </div>
    </PageTransition>
  )
}

export const metadata: Metadata = {
  title: { absolute: 'Román García — Director de marketing B2B' },
  description:
    'Director de marketing B2B: generación de demanda digital, CRM y RevOps, SEO y AEO, y la infraestructura técnica que los sostiene.',
}
