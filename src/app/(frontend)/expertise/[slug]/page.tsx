import React from 'react'
import Link from 'next/link'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { PageTransition } from '@/components/motion/PageTransition'
import { Reveal } from '@/components/motion/Reveal'
import { SplitText } from '@/components/motion/SplitText'
import { ArrowUpRight } from '@/components/icons'

type Args = {
  params: Promise<{ slug: string }>
}

export default async function ExpertiseDetailPage({ params }: Args) {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'expertise',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const expertise = result.docs[0]
  if (!expertise) notFound()

  // Related posts
  const relatedPosts = await payload.find({
    collection: 'posts',
    where: {
      expertises: { contains: expertise.id },
      _status: { equals: 'published' },
    },
    limit: 6,
    sort: '-publishedAt',
  })

  return (
    <PageTransition>
      <article className="bg-[#f4f4f4] text-black font-sans selection:bg-[#ff3300] selection:text-white min-h-screen border-x border-black max-w-[1920px] mx-auto">
        
        {/* TE Header */}
        <header className="pt-32 border-b border-black relative bg-[#e5e5e5]">
          <div className="border-t border-black p-8 md:p-16 relative">
            <Reveal duration={1.2}>
              <Link
                href="/consultoria"
                className="group inline-flex items-center gap-2 uppercase tracking-widest text-[10px] font-mono font-bold mb-16 hover:text-[#ff3300] transition-colors border border-black bg-white px-4 py-2"
              >
                <ArrowUpRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
                Return_To_Consulting
              </Link>
            </Reveal>

            <h1 className="text-[clamp(2.5rem,6vw,6rem)] leading-[1] tracking-tighter font-semibold mb-8 max-w-4xl">
              <SplitText text={expertise.title} delay={30} />
            </h1>

            {expertise.thesis && (
              <Reveal delay={0.2}>
                <p className="font-mono text-sm leading-relaxed max-w-3xl opacity-80 mb-8 border-l-2 border-[#ff3300] pl-4">
                  {expertise.thesis}
                </p>
              </Reveal>
            )}
            <div className="w-full h-8 border border-black/20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMjIyIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-20"></div>
          </div>
        </header>

        {/* Main Content Area */}
        <section className="border-b border-black bg-white">
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-black">
            
            {/* Left Column: Metrics & Framework */}
            <div className="lg:col-span-5 flex flex-col divide-y divide-black bg-[#f4f4f4]">
              <Reveal delay={0.3} className="flex-1 flex flex-col">
                
                {/* Metrics */}
                {expertise.metrics && expertise.metrics.length > 0 && (
                  <div className="p-8 md:p-16 bg-white">
                    <h2 className="font-mono font-bold text-[10px] uppercase tracking-widest opacity-50 mb-8 border-b border-black/10 pb-4">
                      // Expected_Impact
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-black border border-black">
                      {expertise.metrics.map((m: any, i: number) => (
                        <div key={i} className="bg-white p-6 relative group overflow-hidden hover:bg-[#111] hover:text-white transition-colors">
                          <p className="text-4xl font-mono font-bold mb-2 group-hover:text-[#ff3300] transition-colors">{m.value}</p>
                          <p className="text-[10px] font-mono font-bold uppercase tracking-widest">{m.label}</p>
                          {m.description && (
                            <p className="text-[10px] font-mono opacity-60 mt-2">{m.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tools */}
                {expertise.tools && (expertise.tools as any[]).length > 0 && (
                  <div className="p-8 md:p-16 border-t border-black bg-[#f4f4f4]">
                    <h2 className="font-mono font-bold text-[10px] uppercase tracking-widest opacity-50 mb-6">
                      // Tech_Stack
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {(expertise.tools as any[]).map((tool: any) => {
                        const name = typeof tool === 'object' ? tool.name : tool
                        return (
                          <span
                            key={typeof tool === 'object' ? tool.id : tool}
                            className="px-3 py-1 border border-black text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-[#ff3300] hover:text-white hover:border-[#ff3300] transition-colors bg-white"
                          >
                            {name}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Framework */}
                {expertise.framework && expertise.framework.length > 0 && (
                  <div className="p-8 md:p-16 border-t border-black bg-white flex-1">
                    <h2 className="font-mono font-bold text-[10px] uppercase tracking-widest opacity-50 mb-8 border-b border-black/10 pb-4">
                      // Implementation_Steps
                    </h2>
                    <div className="space-y-0 divide-y divide-black/10">
                      {expertise.framework.map((step: any, i: number) => (
                        <div key={i} className="flex gap-6 py-6 first:pt-0">
                          <span className="font-mono font-bold text-lg text-[#ff3300]">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <div>
                            <h3 className="font-mono font-bold text-sm tracking-tight mb-2 uppercase">{step.step}</h3>
                            {step.description && (
                              <p className="font-mono text-xs opacity-70 leading-relaxed">{step.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Reveal>
            </div>

            {/* Right Column: Content & Related Posts */}
            <div className="lg:col-span-7 p-8 md:p-16 flex flex-col gap-16">
              <Reveal delay={0.4}>
                
                {/* Summary */}
                {expertise.summary && (
                  <div className="font-mono text-sm leading-relaxed mb-16 opacity-80 max-w-2xl">
                    <p>{expertise.summary}</p>
                  </div>
                )}

                {/* Prose Content */}
                {expertise.content && (
                  <div className="prose prose-lg md:prose-xl text-black prose-p:font-mono prose-p:text-sm prose-p:leading-relaxed prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-[#ff3300] prose-a:font-bold prose-a:border-b prose-a:border-[#ff3300] prose-a:no-underline hover:prose-a:bg-[#ff3300] hover:prose-a:text-white max-w-none">
                    <RichText data={expertise.content} />
                  </div>
                )}

                {/* Related Posts */}
                {relatedPosts.docs.length > 0 && (
                  <div className="pt-16 mt-16 border-t border-black">
                    <h2 className="font-mono font-bold text-[10px] uppercase tracking-widest opacity-50 mb-8 border-b border-black/10 pb-4">
                      // Related_Reading
                    </h2>
                    <div className="grid grid-cols-1 divide-y divide-black border-y border-black">
                      {relatedPosts.docs.map((post: any) => (
                        <Link
                          key={post.id}
                          href={`/blog/${post.slug}`}
                          className="group flex flex-col gap-2 p-6 hover:bg-[#111] hover:text-white transition-colors duration-300 relative"
                        >
                          <div className="absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity bg-[#ff3300]"></div>
                          <h3 className="font-semibold text-2xl tracking-tight mb-2 group-hover:translate-x-2 transition-transform">{post.title}</h3>
                          {post.excerpt && (
                            <p className="font-mono text-xs opacity-60 line-clamp-2">{post.excerpt}</p>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </Reveal>
            </div>

          </div>
        </section>

      </article>
    </PageTransition>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'expertise',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const expertise = result.docs[0]
  if (!expertise) return {}

  return {
    title: `${expertise.title} | Román García`,
    description: expertise.thesis || expertise.summary || undefined,
  }
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const expertises = await payload.find({ collection: 'expertise', limit: 100 })
  return expertises.docs.map((e: any) => ({ slug: e.slug }))
}
