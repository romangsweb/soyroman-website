import React from 'react'
import Link from 'next/link'
import { cms } from '@/lib/cms'
import type { Metadata } from 'next'
import { PageTransition } from '@/components/motion/PageTransition'
import { Reveal } from '@/components/motion/Reveal'
import { SplitText } from '@/components/motion/SplitText'
import { PostCover, hasCover } from '@/components/PostCover'

export default async function BlogPage() {
  const posts = await cms.find({
    collection: 'posts',
    sort: '-publishedAt',
    limit: 20,
    where: { _status: { equals: 'published' } },
    depth: 1,
  })

  const [allCategories, usage] = await Promise.all([
    cms.find({ collection: 'categories', limit: 50, sort: 'title' }),
    // Solo para saber qué temas tienen artículos publicados
    cms.find({ collection: 'posts', where: { _status: { equals: 'published' } }, limit: 500, depth: 0 }),
  ])
  const used = new Set(
    usage.docs.flatMap((p: any) => (p.categories || []).map((c: any) => (typeof c === 'object' ? c.id : c))),
  )
  const categories = { docs: allCategories.docs.filter((c: any) => used.has(c.id)) }

  return (
    <PageTransition>
      <div className="bg-[#f4f4f4] text-black font-sans selection:bg-[#e85a2a] selection:text-white min-h-screen border-x border-black max-w-[1920px] mx-auto">
        
        {/* TE Header */}
        <section className="border-b border-black relative bg-[#e5e5e5]">
          <div className="p-8 md:p-16 relative">
            <Reveal duration={1.2}>
              <div className="flex items-center gap-3 mb-16">
                <div className="w-3 h-3 bg-[#e85a2a] animate-pulse"></div>
                <p className="font-mono uppercase tracking-[0.2em] text-xs font-bold text-black/60">
                  SYS.08 // Blog
                </p>
              </div>
            </Reveal>
            <h1 className="text-[clamp(3rem,8vw,8rem)] leading-[0.9] tracking-tighter font-semibold mb-8 max-w-4xl">
              <SplitText text="Publicaciones" delay={50} />
            </h1>
            <Reveal delay={0.3}>
              <p className="font-mono text-sm md:text-base opacity-70 leading-relaxed max-w-2xl mt-8 mb-8">
                Ideas, frameworks y ensayos sobre marketing B2B, diseño y tecnología.
              </p>
            </Reveal>
            <div className="w-full h-8 border border-black/20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDAwIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMjIyIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] opacity-20"></div>
          </div>
        </section>

        {/* Blog Content Layout */}
        <section className="border-b border-black">
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-black bg-white">
            
            {/* Sidebar: Categories */}
            <div className="lg:col-span-3 bg-[#f4f4f4] p-8 md:p-16">
              <div className="sticky top-32">
                <h3 className="font-mono font-bold uppercase tracking-widest text-[10px] mb-8 opacity-50">
                  // Temas
                </h3>
                {categories.docs.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/blog"
                      className="group flex items-center justify-between py-2 border-b border-black/10 hover:border-black transition-colors"
                    >
                      <span className="font-mono text-sm uppercase font-bold group-hover:text-[#e85a2a] transition-colors">Todos</span>
                      <span className="w-1.5 h-1.5 bg-[#e85a2a] opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    </Link>
                    {categories.docs.map((cat: any) => (
                      <Link
                        key={cat.id}
                        href={`/blog/tag/${cat.slug}`}
                        className="group flex items-center justify-between py-2 border-b border-black/10 hover:border-black transition-colors"
                      >
                        <span className="font-mono text-sm uppercase font-bold group-hover:text-[#e85a2a] transition-colors">{cat.title}</span>
                        <span className="w-1.5 h-1.5 bg-black opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      </Link>
                    ))}
                  </div>
                )}
                <h3 className="font-mono font-bold uppercase tracking-widest text-[10px] mt-12 mb-4 opacity-50">// También</h3>
                <div className="flex flex-col gap-2">
                  <Link href="/glosario" className="group flex items-center justify-between py-2 border-b border-black/10 hover:border-black">
                    <span className="font-mono text-sm uppercase font-bold group-hover:text-[#e85a2a]">Glosario</span>
                  </Link>
                  <Link href="/notas" className="group flex items-center justify-between py-2 border-b border-black/10 hover:border-black">
                    <span className="font-mono text-sm uppercase font-bold group-hover:text-[#e85a2a]">Notas de campo</span>
                  </Link>
                  <Link href="/recursos" className="group flex items-center justify-between py-2 border-b border-black/10 hover:border-black">
                    <span className="font-mono text-sm uppercase font-bold text-[#e85a2a] group-hover:text-black">Recursos</span>
                    <span className="font-mono text-[9px] uppercase font-bold bg-[#e85a2a] text-white px-1.5 py-0.5">Calc</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Main Content: Posts */}
            <div className="lg:col-span-9 flex flex-col divide-y divide-black">
              {posts.docs.map((post: any, index: number) => {
                return (
                  <Reveal key={post.id} delay={0.1}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className={`group p-8 md:p-16 hover:bg-[#111] hover:text-white transition-colors duration-300 relative ${hasCover(post.cover) ? 'grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,360px)] md:items-center' : 'block'}`}
                    >
                      <div>
                      <div className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-widest font-bold opacity-60 mb-6 group-hover:text-white">
                        {post.publishedAt && (
                          <time className="bg-black text-white px-2 py-1 group-hover:bg-[#e85a2a] transition-colors">
                            {new Date(post.publishedAt).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })}
                          </time>
                        )}
                        {post.readingTime && (
                          <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-[#e85a2a]"></span>
                            {post.readingTime} MIN
                          </span>
                        )}
                      </div>

                      <h2 className="text-3xl md:text-5xl font-semibold tracking-tight group-hover:text-[#e85a2a] transition-colors mb-6">
                        {post.title}
                      </h2>
                      
                      {post.excerpt && (
                        <p className="font-mono text-sm leading-relaxed opacity-80 max-w-3xl">
                          {post.excerpt}
                        </p>
                      )}
                      </div>
                      <PostCover
                        cover={post.cover}
                        className="aspect-[16/9] w-full border border-black group-hover:border-white transition-colors"
                        sizes="(max-width: 768px) 100vw, 360px"
                        priority={index === 0}
                      />
                    </Link>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </section>

      </div>
    </PageTransition>
  )
}

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Artículos sobre marketing B2B, SEO, Paid Media, RevOps y tecnología.',
}
