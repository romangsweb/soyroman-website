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

type Args = { params: Promise<{ slug: string }> }

export default async function BlogPostPage({ params }: Args) {
  const { slug } = await params
  const result = await cms.find({
    collection: 'posts',
    where: {
      slug: { equals: slug },
      _status: { equals: 'published' },
    },
    limit: 1,
    depth: 2,
  })
  const post = result.docs[0]
  if (!post) notFound()

  return (
    <PageTransition>
      <article className="bg-[#f4f4f4] text-black font-sans selection:bg-[#ff3300] selection:text-white min-h-screen border-x border-black max-w-[1920px] mx-auto">
        
        {/* TE Header */}
        <header className="pt-32 border-b border-black relative bg-[#e5e5e5]">
          <div className="border-t border-black p-8 md:p-16 relative">
            <Reveal duration={1.2}>
              <Link
                href="/blog"
                className="group inline-flex items-center gap-2 uppercase tracking-widest text-[10px] font-mono font-bold mb-16 hover:text-[#ff3300] transition-colors border border-black px-4 py-2 bg-white"
              >
                <ArrowUpRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
                Return_To_Stream
              </Link>
            </Reveal>

            <h1 className="text-[clamp(2.5rem,5vw,5rem)] leading-[1.1] tracking-tight font-semibold mb-8 max-w-4xl">
              <SplitText text={post.title} delay={30} />
            </h1>

            <Reveal delay={0.2}>
              <div className="flex flex-wrap items-center gap-6 font-mono text-[10px] uppercase tracking-widest font-bold">
                {post.publishedAt && (
                  <time className="px-3 py-1 bg-black text-white">
                    {new Date(post.publishedAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })}
                  </time>
                )}
                {post.readingTime && (
                  <span className="opacity-60 flex items-center gap-2 border border-black/20 px-3 py-1">
                    <span className="w-1.5 h-1.5 bg-[#ff3300] animate-pulse"></span>
                    {post.readingTime} MIN_READ
                  </span>
                )}
              </div>

              {/* Tags */}
              {post.categories && (post.categories as any[]).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-8">
                  {(post.categories as any[]).map((cat: any) => (
                    <Link
                      key={typeof cat === 'object' ? cat.id : cat}
                      href={`/blog/tag/${typeof cat === 'object' ? cat.slug : cat}`}
                      className="px-3 py-1 border border-black text-[10px] uppercase tracking-widest font-bold font-mono hover:bg-[#ff3300] hover:border-[#ff3300] hover:text-white transition-colors bg-white"
                    >
                      {typeof cat === 'object' ? cat.title : cat}
                    </Link>
                  ))}
                </div>
              )}
            </Reveal>
          </div>
        </header>

        {/* Content */}
        <section className="bg-white">
          <div className="container max-w-4xl p-8 md:p-16 border-x border-black bg-white min-h-screen">
            <Reveal delay={0.4}>
              <div className="prose prose-lg md:prose-xl text-black prose-p:font-mono prose-p:text-sm prose-p:leading-relaxed prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-[#ff3300] prose-a:font-bold prose-a:border-b prose-a:border-[#ff3300] prose-a:no-underline hover:prose-a:bg-[#ff3300] hover:prose-a:text-white max-w-none">
                {post.content && <RichText data={post.content} />}
              </div>
            </Reveal>
          </div>
        </section>

      </article>
    </PageTransition>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const result = await cms.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const post = result.docs[0]
  if (!post) return {}

  return {
    title: `${post.title} | Román García`,
    description: post.excerpt || (post.meta as any)?.description || undefined,
  }
}

export async function generateStaticParams() {
  try {
    const posts = await cms.find({ collection: 'posts', limit: 100 })
    return posts.docs.map((p: any) => ({ slug: p.slug }))
  } catch (error) {
    console.error('Failed to generate static params for posts:', error)
    return []
  }
}
