import { RECURSOS } from '@/data/recursos'
import { cms } from '@/lib/cms'

export type Rec = { slug: string; title: string; minutes?: number | null; why: string }

/**
 * Posts recomendados para el panel: de las categorías ligadas a las herramientas que la persona usa
 * (mismo mapeo que recursos.ts), sin los que ya leyó. Si no hay suficientes, completa con los más recientes.
 */
export async function recommendPosts(toolSlugs: string[], read: Set<string>, limit = 3): Promise<Rec[]> {
  const tools = RECURSOS.filter((r) => toolSlugs.includes(r.slug))
  const catSlugs = [...new Set(tools.flatMap((r) => r.categories))]
  const cats = catSlugs.length
    ? (await cms.find({ collection: 'categories', where: { slug: { in: catSlugs } }, limit: 30, depth: 0 })).docs
    : []
  const slugById = new Map(cats.map((c) => [String(c.id), c.slug as string]))
  const published = { _status: { equals: 'published' } }
  const pick = async (where: Record<string, unknown>) =>
    (await cms.find({ collection: 'posts', where: where as never, sort: '-publishedAt', limit: 15, depth: 0 })).docs.filter((p) => p.slug && !read.has(p.slug))

  const out: Rec[] = []
  if (cats.length) {
    for (const p of await pick({ and: [{ categories: { in: cats.map((c) => c.id) } }, published] })) {
      const pc = ((p.categories as unknown[]) || []).map((c) => slugById.get(String(typeof c === 'object' && c ? (c as { id: unknown }).id : c)))
      const tool = tools.find((t) => t.categories.some((c) => pc.includes(c)))
      out.push({ slug: p.slug!, title: p.title, minutes: (p as { readingTime?: number | null }).readingTime, why: tool ? `Porque usaste ${tool.name}` : 'Relacionado con tus herramientas' })
      if (out.length >= limit) return out
    }
  }
  for (const p of await pick(published)) {
    if (out.some((x) => x.slug === p.slug)) continue
    out.push({ slug: p.slug!, title: p.title, minutes: (p as { readingTime?: number | null }).readingTime, why: 'Lo más reciente' })
    if (out.length >= limit) break
  }
  return out
}
