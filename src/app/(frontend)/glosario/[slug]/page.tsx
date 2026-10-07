import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ResourceStrip } from '@/components/ResourceTeaser'
import { recursosFor } from '@/data/recursos'

import { cms } from '@/lib/cms'
import { ArrowUpRight } from '@/components/icons'
import { Reveal } from '@/components/motion/Reveal'
import { getServerSideURL } from '@/utilities/getURL'
import { canonical } from '@/lib/seo'

type Args = { params: Promise<{ slug: string }> }

async function getTerm(slug: string) {
  const res = await cms.find({ collection: 'glossary', where: { slug: { equals: slug } }, limit: 1, depth: 1 })
  return res.docs[0] as any
}

export default async function TermPage({ params }: Args) {
  const { slug } = await params
  const t = await getTerm(slug)
  if (!t) notFound()

  const cats = (t.categories || []).filter((c: any) => c && typeof c === 'object')
  const related = (t.relatedTerms || []).filter((r: any) => r && typeof r === 'object' && r.slug)
  const posts = cats.length
    ? (
        await cms.find({
          collection: 'posts',
          where: { and: [{ categories: { in: cats.map((c: any) => c.id) } }, { _status: { equals: 'published' } }] },
          sort: '-publishedAt',
          limit: 3,
          depth: 0,
        })
      ).docs
    : []

  const url = `${getServerSideURL()}/glosario/${t.slug}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    '@id': url,
    name: t.term,
    ...(t.fullName ? { alternateName: t.fullName } : {}),
    description: t.definition,
    url,
    inDefinedTermSet: { '@type': 'DefinedTermSet', name: 'Glosario de marketing B2B', url: `${getServerSideURL()}/glosario` },
  }

  return (
    <article className="bg-[#f4f4f4] text-black font-sans min-h-screen border-x border-black max-w-[1920px] mx-auto">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="border-b border-black bg-[#e5e5e5]">
        <div className="p-8 md:p-16">
          <Link
            href="/glosario"
            className="group inline-flex items-center gap-2 uppercase tracking-widest text-[10px] font-mono font-bold mb-12 hover:text-[#e85a2a] transition-colors border border-black px-4 py-2 bg-white"
          >
            <ArrowUpRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Volver al glosario
          </Link>
          <h1 className="text-[clamp(3rem,7vw,6rem)] leading-[0.95] tracking-tighter font-semibold">{t.term}</h1>
          {t.fullName && <p className="mt-4 font-mono text-sm md:text-base opacity-70">{t.fullName}</p>}
          {cats.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8">
              {cats.map((c: any) => (
                <Link
                  key={c.id}
                  href={`/blog/tag/${c.slug}`}
                  className="px-3 py-1 border border-black text-[10px] uppercase tracking-widest font-bold font-mono bg-white hover:bg-[#e85a2a] hover:border-[#e85a2a] hover:text-white transition-colors"
                >
                  {c.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-black bg-white">
        <div className="lg:col-span-8 p-8 md:p-16 space-y-12">
          <Reveal>
            <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-50 mb-4">// Definición</h2>
            <p className="text-xl md:text-2xl leading-relaxed">{t.definition}</p>
          </Reveal>
          {t.formula && (
            <Reveal>
              <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-50 mb-4">// Fórmula</h2>
              <div className="border border-black bg-[#f4f4f4] p-6 md:p-8 relative">
                <span className="absolute -top-px -right-px w-2 h-2 bg-[#e85a2a]" />
                <p className="font-mono text-base md:text-lg font-bold">{t.formula}</p>
              </div>
            </Reveal>
          )}
          {t.example && (
            <Reveal>
              <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-50 mb-4">// Ejemplo</h2>
              <p className="font-mono text-sm md:text-base leading-relaxed whitespace-pre-line">{t.example}</p>
            </Reveal>
          )}
          {t.whyItMatters && (
            <Reveal>
              <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-50 mb-4">// Por qué importa en B2B</h2>
              <p className="font-mono text-sm md:text-base leading-relaxed whitespace-pre-line">{t.whyItMatters}</p>
            </Reveal>
          )}
        </div>

        <aside className="lg:col-span-4 p-8 md:p-16 bg-[#f4f4f4] space-y-12">
          {related.length > 0 && (
            <div>
              <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-50 mb-4">// Términos relacionados</h2>
              <ul className="divide-y divide-black/10 border-y border-black/10">
                {related.map((r: any) => (
                  <li key={r.slug}>
                    <Link href={`/glosario/${r.slug}`} className="flex items-center justify-between py-3 font-semibold hover:text-[#e85a2a]">
                      {r.term} <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {posts.length > 0 && (
            <div>
              <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-50 mb-4">// En el blog</h2>
              <ul className="space-y-4">
                {posts.map((p: any) => (
                  <li key={p.id}>
                    <Link href={`/blog/${p.slug}`} className="block font-semibold leading-snug hover:text-[#e85a2a]">
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
      <ResourceStrip items={recursosFor('glossary', t.slug)} title={`Herramienta para ${t.term}`} />
    </article>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const t = await getTerm(slug)
  if (!t) return {}
  return {
    alternates: canonical(`/glosario/${slug}`),
    title: `Qué es ${t.term}${t.fullName ? ` (${t.fullName})` : ''}`,
    description: t.definition?.slice(0, 160),
  }
}

export async function generateStaticParams() {
  try {
    const res = await cms.find({ collection: 'glossary', limit: 500, depth: 0 })
    return res.docs.map((d: any) => ({ slug: d.slug }))
  } catch {
    return []
  }
}
