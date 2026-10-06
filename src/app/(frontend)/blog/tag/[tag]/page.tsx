import React from 'react'
import Link from 'next/link'
import { cms } from '@/lib/cms'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

type Args = { params: Promise<{ tag: string }> }

export default async function TagPage({ params }: Args) {
  const { tag } = await params

  // Find the category
  const catResult = await cms.find({
    collection: 'categories',
    where: { slug: { equals: tag } },
    limit: 1,
  })
  const category = catResult.docs[0]
  if (!category) notFound()

  // Find posts with this category
  const posts = await cms.find({
    collection: 'posts',
    where: {
      categories: { contains: category.id },
      _status: { equals: 'published' },
    },
    sort: '-publishedAt',
    limit: 50,
  })

  return (
    <div className="container py-24">
      <div className="max-w-2xl mb-16">
        <Link
          href="/blog"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors font-mono mb-4 inline-block"
        >
          ← Blog
        </Link>
        <h1 className="text-4xl font-semibold mb-4">#{category.title}</h1>
        <p className="text-lg text-muted-foreground">
          {posts.totalDocs} artículo{posts.totalDocs !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-6">
        {posts.docs.map((post: any) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group flex flex-col md:flex-row md:items-center gap-4 p-6 border border-border rounded-lg hover:border-[var(--accent)]/30 transition-colors"
          >
            <div className="flex-1">
              <h2 className="text-lg font-semibold group-hover:text-[var(--accent)] transition-colors">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>
              )}
            </div>
            <div className="flex items-center gap-4 shrink-0 font-mono text-xs text-muted-foreground">
              {post.publishedAt && (
                <time>
                  {new Date(post.publishedAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                  })}
                </time>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { tag } = await params
  const result = await cms.find({
    collection: 'categories',
    where: { slug: { equals: tag } },
    limit: 1,
  })
  const category = result.docs[0]
  if (!category) return {}
  return {
    title: `${category.title} — Blog`,
    description: `Artículos sobre ${category.title}`,
  }
}
