import React from 'react'
import type { Metadata } from 'next'

import { cms } from '@/lib/cms'
import { GlossaryIndex, type GlossaryItem } from '@/components/GlossaryIndex'
import { Reveal } from '@/components/motion/Reveal'
import { SplitText } from '@/components/motion/SplitText'
import { getServerSideURL } from '@/utilities/getURL'
import { canonical } from '@/lib/seo'

export default async function GlosarioPage() {
  const res = await cms.find({ collection: 'glossary', limit: 500, depth: 1, sort: 'term' })

  const items: GlossaryItem[] = res.docs.map((d: any) => ({
    slug: d.slug,
    term: d.term,
    fullName: d.fullName,
    definition: d.definition,
    categories: (d.categories || [])
      .filter((c: any) => c && typeof c === 'object')
      .map((c: any) => ({ slug: c.slug, title: c.title })),
  }))
  const topics = [...new Map(items.flatMap((i) => i.categories).map((c) => [c.slug, c])).values()].sort((a, b) =>
    a.title.localeCompare(b.title, 'es'),
  )

  const url = `${getServerSideURL()}/glosario`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    '@id': url,
    name: 'Glosario de marketing B2B',
    url,
    hasDefinedTerm: items.map((i) => ({
      '@type': 'DefinedTerm',
      name: i.term,
      description: i.definition,
      url: `${url}/${i.slug}`,
    })),
  }

  return (
    <div className="bg-[#f4f4f4] text-black font-sans min-h-screen border-x border-black max-w-[1920px] mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="border-b border-black bg-[#e5e5e5]">
        <div className="p-8 md:p-16">
          <Reveal duration={1.2}>
            <div className="flex items-center gap-3 mb-16">
              <div className="w-3 h-3 bg-[#e85a2a]" />
              <p className="font-mono uppercase tracking-[0.2em] text-xs font-bold text-black/60">SYS.09 // Glosario</p>
            </div>
          </Reveal>
          <h1 className="text-[clamp(3rem,8vw,8rem)] leading-[0.9] tracking-tighter font-semibold mb-8">
            <SplitText text="Glosario" delay={50} />
          </h1>
          <Reveal delay={0.3}>
            <p className="font-mono text-sm md:text-base leading-relaxed max-w-2xl opacity-80 border-l-2 border-[#e85a2a] pl-4">
              Los términos de marketing B2B, explicados con su fórmula y un ejemplo: KPIs, siglas del embudo, SEO, AEO y
              medición. {items.length > 0 && `${items.length} términos.`}
            </p>
          </Reveal>
        </div>
      </section>
      <GlossaryIndex items={items} topics={topics} />
    </div>
  )
}

export const metadata: Metadata = {
  alternates: canonical('/glosario'),
  title: 'Glosario de marketing B2B',
  description:
    'Qué es ROAS, ROMI, MQL, CAC, CTR y más: glosario de marketing B2B con definiciones claras, fórmulas y ejemplos.',
}
