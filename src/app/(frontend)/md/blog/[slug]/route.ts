import { cms } from '@/lib/cms'
import { postMarkdown } from '@/lib/postMarkdown'

/** /blog/<slug>.md (reescrito en next.config) → el artículo en Markdown. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { docs } = await cms.find({
    collection: 'posts',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 1,
  })
  const post = docs[0]
  if (!post) return new Response('No encontrado', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  return new Response(postMarkdown(post), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      Link: `<https://soyroman.com/blog/${slug}>; rel="canonical"`,
    },
  })
}
