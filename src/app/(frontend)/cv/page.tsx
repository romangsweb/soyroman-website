import React from 'react'
import Link from 'next/link'
import { cms } from '@/lib/cms'
import type { Metadata } from 'next'
import { PageTransition } from '@/components/motion/PageTransition'
import { Reveal } from '@/components/motion/Reveal'
import { SplitText } from '@/components/motion/SplitText'
import { ArrowUpRight } from '@/components/icons'
import { CvDownload } from '@/components/cv/CvDownload'
import { CERTS, CV_SUMMARY, LINKS, TOOLS, UNIVERSITY, cleanAchievements, yearRange } from '@/data/cv'
import { PERSON_ID, SITE, canonical, ld } from '@/lib/seo'

export default async function CVPage() {
  const profile = await cms.findGlobal({ slug: 'profile' })
  const experiences = await cms.find({
    collection: 'experience',
    sort: 'order',
    limit: 50,
    depth: 1,
  })

  return (
    <PageTransition>
      <div className="bg-[#f4f4f4] text-black font-sans selection:bg-[#e85a2a] selection:text-white min-h-screen border-x border-black max-w-[1920px] mx-auto">
        
        {/* TE Header */}
        <section className="border-b border-black relative bg-[#e5e5e5]">
          <div className="p-8 md:p-16 relative">
            <Reveal duration={1.2}>
              <div className="flex items-center justify-between mb-16">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-[#e85a2a]"></div>
                  <p className="font-mono uppercase tracking-[0.2em] text-xs font-bold text-black/60">
                    SYS.05 // Trayectoria
                  </p>
                </div>
                {profile?.cvFile && typeof profile.cvFile === 'object' && (profile.cvFile as any).url && (
                  <div className="hidden md:block"><CvDownload url={(profile.cvFile as any).url} /></div>
                )}
              </div>
            </Reveal>

            <h1 className="text-[clamp(3rem,8vw,8rem)] leading-[0.9] tracking-tighter font-semibold mb-8 max-w-4xl">
              <SplitText text="Trayectoria" delay={50} />
            </h1>
            <Reveal delay={0.3}>
              <p className="font-mono text-sm md:text-base opacity-70 leading-relaxed max-w-2xl mt-8">
                {CV_SUMMARY}
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                {LINKS.map((l) => (
                  <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-black bg-white px-4 py-2 hover:bg-black hover:text-white transition-colors font-mono uppercase tracking-widest text-[10px] font-bold">
                    {l.label} <ArrowUpRight className="w-3 h-3" />
                  </a>
                ))}
                <Link href="/contacto" className="inline-flex items-center gap-2 border border-black bg-black text-white px-4 py-2 hover:bg-[#e85a2a] hover:border-[#e85a2a] transition-colors font-mono uppercase tracking-widest text-[10px] font-bold">
                  Contacto
                </Link>
              </div>
              {profile?.cvFile && typeof profile.cvFile === 'object' && (profile.cvFile as any).url && (
                <div className="md:hidden mt-6"><CvDownload url={(profile.cvFile as any).url} /></div>
              )}
            </Reveal>
            <div className="absolute right-8 bottom-8 w-16 h-16 border-2 border-black flex items-center justify-center opacity-20">
              <div className="w-4 h-4 bg-black"></div>
            </div>
          </div>
        </section>

        {/* TE Timeline Log */}
        <section className="bg-white">
          <div className="flex flex-col divide-y divide-black">
            {experiences.docs.map((exp: any, index: number) => {
              return (
                <Reveal key={exp.id} className="group hover:bg-[#f4f4f4] transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-black relative">
                    
                    {/* Left: Dates & Status */}
                    <div className="md:col-span-3 p-8 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-16">
                        <p className="font-mono text-xs uppercase tracking-widest font-bold bg-black text-white px-2 py-1 inline-block">
                          {yearRange(exp.startDate, exp.endDate)}
                        </p>
                        <div className={`w-3 h-3 border border-black ${!exp.endDate ? 'bg-[#e85a2a] animate-pulse' : 'bg-transparent'}`}></div>
                      </div>
                      <span className="font-mono text-[10px] uppercase font-bold text-black/40">Registro {String(index + 1).padStart(3, '0')}</span>
                    </div>

                    {/* Right: Info */}
                    <div className="md:col-span-9 p-8 md:p-12 relative z-10">
                      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                        <h2 className="text-3xl md:text-5xl font-semibold tracking-tight group-hover:text-[#e85a2a] transition-colors">
                          {exp.position}
                        </h2>
                        <span className="font-mono uppercase tracking-widest text-sm font-bold opacity-60 bg-white border border-black px-3 py-1 self-start md:self-auto">
                          {exp.type === 'education' ? UNIVERSITY : exp.company}
                        </span>
                      </div>

                      {cleanAchievements(exp.achievements).length > 0 && (
                        <div className="mt-8 border-t border-black/10 pt-8">
                          <ul className="space-y-4">
                            {cleanAchievements(exp.achievements).map((a: string, i: number) => (
                              <li key={i} className="text-base md:text-lg leading-relaxed flex gap-4 font-light text-black/80">
                                <span className="font-mono text-[#e85a2a] shrink-0 font-bold mt-1">{'>'}</span>
                                {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </section>

        {/* Certificaciones y herramientas */}
        <section className="border-t border-black bg-[#f4f4f4]">
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-black">
            <div className="lg:col-span-7 p-8 md:p-12">
              <h2 className="font-mono font-bold uppercase tracking-widest text-[10px] mb-8 text-black/50">// Certificaciones</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CERTS.map((c) => (
                  <div key={c.org} className="border border-black bg-white p-5">
                    <p className="font-mono text-[10px] uppercase tracking-widest font-bold text-[#e85a2a] mb-2">{c.org}</p>
                    <p className="font-mono text-sm leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-5 p-8 md:p-12">
              <h2 className="font-mono font-bold uppercase tracking-widest text-[10px] mb-8 text-black/50">// Herramientas</h2>
              <div className="flex flex-wrap gap-2">
                {TOOLS.map((t) => (
                  <span key={t} className="font-mono text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 border border-black bg-white">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: ld({
              '@type': 'ProfilePage',
              '@id': `${SITE}/cv#page`,
              url: `${SITE}/cv`,
              mainEntity: {
                '@id': PERSON_ID,
                '@type': 'Person',
                name: 'Román García',
                jobTitle: 'Director de marketing B2B',
                alumniOf: { '@type': 'CollegeOrUniversity', name: UNIVERSITY },
                hasCredential: CERTS.flatMap((c) =>
                  c.items.map((name) => ({ '@type': 'EducationalOccupationalCredential', name, recognizedBy: { '@type': 'Organization', name: c.org } })),
                ),
                knowsAbout: TOOLS,
              },
            }),
          }}
        />
      </div>
    </PageTransition>
  )
}

export const metadata: Metadata = {
  alternates: canonical('/cv'),
  title: 'Trayectoria y CV',
  description: 'Trayectoria de Román García, director de marketing B2B desde 2017: demanda, CRM, SEO/AEO, certificaciones y herramientas.',
}
