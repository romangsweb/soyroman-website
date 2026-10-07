import React from 'react'
import Link from 'next/link'
import { cms } from '@/lib/cms'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { PageTransition } from '@/components/motion/PageTransition'
import { Reveal } from '@/components/motion/Reveal'
import { SplitText } from '@/components/motion/SplitText'
import { ArrowUpRight } from '@/components/icons'
import { canonical } from '@/lib/seo'

type Args = { params: Promise<{ slug: string }> }

export default async function LabDetailPage({ params }: Args) {
  const { slug } = await params
  const result = await cms.find({
    collection: 'lab',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  const lab = result.docs[0]
  if (!lab) notFound()

  return (
    <PageTransition>
      <div className="bg-[#f4f4f4] text-black font-sans selection:bg-[#e85a2a] selection:text-white min-h-screen border-x border-black max-w-[1920px] mx-auto">
        
        {/* TE Header */}
        <section className="border-b border-black relative bg-[#e5e5e5]">
          <div className="p-8 md:p-16 relative container mx-auto">
            <Reveal duration={1.2}>
              <Link
                href="/lab"
                className="group inline-flex items-center gap-2 uppercase tracking-widest text-[10px] font-mono font-bold mb-16 hover:text-[#e85a2a] transition-colors border border-black px-4 py-2 bg-white"
              >
                <ArrowUpRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
                Volver al laboratorio
              </Link>
            </Reveal>

            <h1 className="text-[clamp(3rem,6vw,6rem)] leading-[0.9] tracking-tighter font-semibold mb-8 max-w-4xl">
              <SplitText text={lab.title} delay={50} />
            </h1>
            <Reveal delay={0.2}>
              <div className="flex flex-wrap gap-4 mt-8 pt-8 border-t border-black/10">
                <span className="font-mono text-[10px] uppercase font-bold tracking-widest px-3 py-1 bg-black text-white">
                  STATUS: {lab.status}
                </span>
              </div>
            </Reveal>
            <div className="w-full h-8 border border-black/20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMjIyIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-20 mt-16"></div>
          </div>
        </section>

        {/* Content Section */}
        <section className="bg-white">
          <div className="container mx-auto p-8 md:p-16 border-x border-black bg-white min-h-screen">
            <Reveal delay={0.3}>
              <div className="max-w-4xl">
                {lab.description && (
                  <div className="prose prose-lg text-black prose-p:font-mono prose-p:text-sm prose-p:leading-relaxed prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-[#e85a2a] prose-a:font-bold prose-a:border-b prose-a:border-[#e85a2a] prose-a:no-underline hover:prose-a:bg-[#e85a2a] hover:prose-a:text-white max-w-none">
                    <RichText data={lab.description} />
                  </div>
                )}
                {lab.links && lab.links.length > 0 && (
                  <div className="flex gap-4 mt-16 pt-8 border-t border-black/20">
                    {lab.links.map((link: any, i: number) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 border border-black text-[10px] uppercase font-mono font-bold tracking-widest hover:bg-[#e85a2a] hover:border-[#e85a2a] hover:text-white transition-colors bg-[#f4f4f4]"
                      >
                        {link.label || link.type} <ArrowUpRight className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </section>

      </div>
    </PageTransition>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const result = await cms.find({
    collection: 'lab',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const lab = result.docs[0]
  if (!lab) return {}
  return { title: lab.title, alternates: canonical(`/lab/${slug}`) }
}
