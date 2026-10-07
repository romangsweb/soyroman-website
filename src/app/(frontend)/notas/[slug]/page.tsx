import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'

import { cms } from '@/lib/cms'
import { ArrowUpRight } from '@/components/icons'

type Args = { params: Promise<{ slug: string }> }

async function getNote(slug: string) {
  const res = await cms.find({
    collection: 'notes',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 1,
  })
  return res.docs[0] as any
}

export default async function NotePage({ params }: Args) {
  const { slug } = await params
  const n = await getNote(slug)
  if (!n) notFound()
  const cats = (n.categories || []).filter((c: any) => c && typeof c === 'object')

  return (
    <article className="bg-[#f4f4f4] text-black font-sans min-h-screen border-x border-black max-w-[1920px] mx-auto">
      <header className="border-b border-black bg-[#e5e5e5]">
        <div className="p-8 md:p-16">
          <Link
            href="/notas"
            className="group inline-flex items-center gap-2 uppercase tracking-widest text-[10px] font-mono font-bold mb-12 hover:text-[#e85a2a] transition-colors border border-black px-4 py-2 bg-white"
          >
            <ArrowUpRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Volver a notas
          </Link>
          <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.05] tracking-tight font-semibold max-w-4xl">{n.title}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-8 font-mono text-[10px] uppercase tracking-widest font-bold">
            {n.date && (
              <time className="px-3 py-1 bg-black text-white">
                {new Date(n.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
              </time>
            )}
            {cats.map((c: any) => (
              <Link key={c.id} href={`/blog/tag/${c.slug}`} className="px-3 py-1 border border-black bg-white hover:bg-[#e85a2a] hover:text-white hover:border-[#e85a2a]">
                {c.title}
              </Link>
            ))}
          </div>
        </div>
      </header>
      <section className="bg-white">
        <div className="max-w-3xl p-8 md:p-16">
          <div className="prose prose-lg text-black prose-p:font-mono prose-p:text-sm prose-p:leading-relaxed prose-headings:font-semibold prose-a:text-[#e85a2a] max-w-none">
            {n.content && <RichText data={n.content} />}
          </div>
        </div>
      </section>
    </article>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const n = await getNote(slug)
  return n ? { title: n.title } : {}
}

export async function generateStaticParams() {
  try {
    const res = await cms.find({ collection: 'notes', where: { _status: { equals: 'published' } }, limit: 200, depth: 0 })
    return res.docs.map((d: any) => ({ slug: d.slug }))
  } catch {
    return []
  }
}
