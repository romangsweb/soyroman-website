import React from 'react'
import Link from 'next/link'
import { cms } from '@/lib/cms'
import { ResourceStrip } from '@/components/ResourceTeaser'
import { recursosFor } from '@/data/recursos'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { Where } from 'payload'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { PageTransition } from '@/components/motion/PageTransition'
import { Reveal } from '@/components/motion/Reveal'
import { SplitText } from '@/components/motion/SplitText'
import { hasCover } from '@/components/PostCover'
import { ScreenCover, postCategory } from '@/components/ScreenCover'
import { ArrowUpRight } from '@/components/icons'
import { AuthorBox, RelatedPosts } from '@/components/PostExtras'
import { Subscribe } from '@/components/Subscribe'
import { SaveToLibrary } from '@/components/taller/SaveToLibrary'
import { SITE, PERSON_ID, ld } from '@/lib/seo'
import { extractFaq } from '@/lib/faq'

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

  const url = `${SITE}/blog/${post.slug}`
  const cats = ((post.categories as any[]) || []).filter((c) => typeof c === 'object' && c)
  const faq = extractFaq(post.content)
  const jsonLd = ld(
    {
      '@type': 'BlogPosting',
      '@id': `${url}#article`,
      mainEntityOfPage: url,
      headline: post.title,
      description: post.excerpt || undefined,
      datePublished: post.publishedAt || undefined,
      dateModified: post.updatedAt || undefined,
      inLanguage: 'es-MX',
      image: `${url}/opengraph-image`,
      author: { '@id': PERSON_ID },
      publisher: { '@id': PERSON_ID },
      ...(cats[0]?.title ? { articleSection: cats[0].title } : {}),
      ...(post.readingTime ? { timeRequired: `PT${post.readingTime}M` } : {}),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: url },
      ],
    },
    ...(faq.length >= 2
      ? [
          {
            '@type': 'FAQPage',
            '@id': `${url}#faq`,
            mainEntity: faq.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          },
        ]
      : []),
  )

  // Relacionados: misma categoría primero, luego los más recientes
  const base: Where[] = [{ id: { not_equals: post.id } }, { _status: { equals: 'published' } }]
  const catIds = cats.map((c: any) => c.id)
  const [sameCat, profile] = await Promise.all([
    catIds.length
      ? cms.find({ collection: 'posts', where: { and: [...base, { categories: { in: catIds } }] }, sort: '-publishedAt', limit: 3, depth: 1 })
      : Promise.resolve({ docs: [] as any[] }),
    cms.findGlobal({ slug: 'profile' }),
  ])
  let related: any[] = sameCat.docs
  if (related.length < 3) {
    const picked = related.map((p: any) => p.id)
    const recent = await cms.find({
      collection: 'posts',
      where: { and: [...base, ...(picked.length ? [{ id: { not_in: picked } }] : [])] },
      sort: '-publishedAt',
      limit: 3 - related.length,
      depth: 1,
    })
    related = [...related, ...recent.docs]
  }

  return (
    <PageTransition>
      <article className="bg-[#f4f4f4] text-black font-sans selection:bg-[#e85a2a] selection:text-white min-h-screen border-x border-black max-w-[1920px] mx-auto">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
        
        {/* TE Header */}
        <header className="border-b border-black relative bg-[#e5e5e5]">
          <div className="p-8 md:p-16 relative">
            <Reveal duration={1.2}>
              <Link
                href="/blog"
                className="group inline-flex items-center gap-2 uppercase tracking-widest text-[10px] font-mono font-bold mb-16 hover:text-[#e85a2a] transition-colors border border-black px-4 py-2 bg-white"
              >
                <ArrowUpRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
                Volver al blog
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
                    <span className="w-1.5 h-1.5 bg-[#e85a2a] animate-pulse"></span>
                    {post.readingTime} MIN DE LECTURA
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
                      className="px-3 py-1 border border-black text-[10px] uppercase tracking-widest font-bold font-mono hover:bg-[#e85a2a] hover:border-[#e85a2a] hover:text-white transition-colors bg-white"
                    >
                      {typeof cat === 'object' ? cat.title : cat}
                    </Link>
                  ))}
                </div>
              )}
              <div className="mt-6">
                <SaveToLibrary kind="post" slug={post.slug} title={post.title} />
              </div>
            </Reveal>
          </div>
        </header>

        {/* Portada */}
        <section className="border-b border-black bg-[#e5e5e5]">
          <ScreenCover
            slug={post.slug}
            category={postCategory(post)}
            minutes={post.readingTime}
            figure={post.screenFigure}
            tag={post.screenTag}
            title={post.title}
            className="aspect-[16/9] md:aspect-[21/7] w-full"
          />
        </section>

        {/* Content */}
        <section className="bg-white">
          <div className="container max-w-4xl p-8 md:p-16 border-x border-black bg-white min-h-screen">
            <div className="prose prose-lg md:prose-xl text-black prose-p:font-mono prose-p:text-sm prose-p:leading-relaxed prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-[#e85a2a] prose-a:font-bold prose-a:border-b prose-a:border-[#e85a2a] prose-a:no-underline hover:prose-a:bg-[#e85a2a] hover:prose-a:text-white max-w-none">
              {post.content && <RichText data={post.content} />}
            </div>
          </div>
        </section>

        <section className="bg-white border-t border-black">
          <div className="container max-w-4xl p-8 md:p-12 border-x border-black">
            <Subscribe where="articulo" />
          </div>
        </section>
        <AuthorBox profile={profile} />
        <RelatedPosts posts={related} />

        <ResourceStrip
          items={recursosFor('categories', ((post.categories as any[]) || []).map((c: any) => (typeof c === 'object' ? c?.slug : '')).filter(Boolean))}
        />
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

  const meta = (post.meta as any) || {}
  const image = hasCover(meta.image) ? meta.image : hasCover(post.cover) ? post.cover : null
  const description = meta.description || post.excerpt || undefined

  // El layout ya agrega " | Román García" con su plantilla de título
  return {
    title: meta.title || post.title,
    description,
    alternates: {
      canonical: `${SITE}/blog/${slug}`,
      types: { 'text/markdown': `${SITE}/blog/${slug}.md` },
    },
    openGraph: {
      type: 'article',
      url: `${SITE}/blog/${slug}`,
      title: meta.title || post.title,
      description,
      publishedTime: post.publishedAt || undefined,
      images: image ? [{ url: image.url!, width: image.width ?? undefined, height: image.height ?? undefined, alt: image.alt || post.title }] : undefined,
    },
    twitter: { card: 'summary_large_image' },
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
