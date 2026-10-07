import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { cms } from '@/lib/cms'
import { ArrowUpRight } from '@/components/icons'
import { PostCover } from '@/components/PostCover'
import { Reveal } from '@/components/motion/Reveal'

type Args = { params: Promise<{ tag: string }> }

async function getCategory(tag: string) {
  const res = await cms.find({ collection: 'categories', where: { slug: { equals: tag } }, limit: 1 })
  return res.docs[0] as any
}

export default async function TagPage({ params }: Args) {
  const { tag } = await params
  const category = await getCategory(tag)
  if (!category) notFound()

  const [posts, terms] = await Promise.all([
    cms.find({
      collection: 'posts',
      where: { and: [{ categories: { contains: category.id } }, { _status: { equals: 'published' } }] },
      sort: '-publishedAt',
      limit: 50,
      depth: 1,
    }),
    cms.find({
      collection: 'glossary',
      where: { categories: { contains: category.id } },
      sort: 'term',
      limit: 30,
      depth: 0,
    }),
  ])

  return (
    <div className="bg-[#f4f4f4] text-black font-sans min-h-screen border-x border-black max-w-[1920px] mx-auto">
      <section className="border-b border-black bg-[#e5e5e5]">
        <div className="p-8 md:p-16">
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 uppercase tracking-widest text-[10px] font-mono font-bold mb-12 hover:text-[#e85a2a] transition-colors border border-black px-4 py-2 bg-white"
          >
            <ArrowUpRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Volver al blog
          </Link>
          <p className="font-mono uppercase tracking-[0.2em] text-xs font-bold text-black/60 mb-6">// Tema</p>
          <h1 className="text-[clamp(2.5rem,6vw,6rem)] leading-[0.95] tracking-tighter font-semibold">{category.title}</h1>
          <p className="mt-6 font-mono text-sm opacity-70">
            {posts.totalDocs} artículo{posts.totalDocs !== 1 ? 's' : ''}
          </p>
        </div>
      </section>

      <section className="bg-white">
        {posts.docs.length === 0 ? (
          <p className="p-8 md:p-16 font-mono text-sm opacity-70">Todavía no hay artículos publicados en este tema.</p>
        ) : (
          <div className="flex flex-col divide-y divide-black">
            {posts.docs.map((post: any, index: number) => (
              <Reveal key={post.id} delay={0.05}>
                <Link
                  href={`/blog/${post.slug}`}
                  className={`group p-8 md:p-16 hover:bg-[#111] hover:text-white transition-colors duration-300 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,360px)] md:items-center`}
                >
                  <div>
                    {post.publishedAt && (
                      <time className="inline-block font-mono text-[10px] uppercase tracking-widest font-bold bg-black text-white px-2 py-1 mb-6 group-hover:bg-[#e85a2a]">
                        {new Date(post.publishedAt).toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                      </time>
                    )}
                    <h2 className="text-3xl md:text-4xl font-semibold tracking-tight group-hover:text-[#e85a2a] mb-4">{post.title}</h2>
                    {post.excerpt && <p className="font-mono text-sm leading-relaxed opacity-80 max-w-3xl">{post.excerpt}</p>}
                  </div>
                  <PostCover
                    cover={post.cover}
                    seed={post.slug}
                    className="aspect-[16/9] w-full border border-black group-hover:border-white transition-colors"
                    sizes="(max-width: 768px) 100vw, 360px"
                    priority={index === 0}
                  />
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {terms.docs.length > 0 && (
        <section className="border-t border-black bg-[#f4f4f4] p-8 md:p-16">
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-50 mb-6">// Términos del glosario</h2>
          <div className="flex flex-wrap gap-2">
            {terms.docs.map((t: any) => (
              <Link
                key={t.id}
                href={`/glosario/${t.slug}`}
                className="px-3 py-1.5 border border-black bg-white font-mono text-xs font-bold hover:bg-[#e85a2a] hover:text-white hover:border-[#e85a2a]"
              >
                {t.term}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { tag } = await params
  const category = await getCategory(tag)
  if (!category) return {}
  return {
    title: `${category.title} — Blog`,
    description: `Artículos y términos de marketing B2B sobre ${category.title.toLowerCase()}.`,
  }
}
