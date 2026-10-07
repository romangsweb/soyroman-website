import type { MetadataRoute } from 'next'
import type { Where } from 'payload'
import { cms } from '@/lib/cms'

/**
 * /sitemap.xml generado con lo publicado en el CMS. Se revalida con la
 * etiqueta `cms`, igual que el resto del sitio.
 */
const SITE = 'https://soyroman.com'
const published: Where = { _status: { equals: 'published' } }

const STATIC = [
  '',
  '/expertise',
  '/proyectos',
  '/consultoria',
  '/blog',
  '/glosario',
  '/notas',
  '/recursos',
  '/recursos/embudo-inverso',
  '/recursos/roas-romi-roi',
  '/recursos/madurez-revops',
  '/recursos/icp',
  '/recursos/presupuesto-marketing',
  '/recursos/auditor-aeo',
  '/recursos/brecha-pipeline',
  '/recursos/cpl-maximo',
  '/about',
  '/cv',
  '/uses',
  '/contacto',
  '/privacidad',
]

const entry = (path: string, updatedAt?: string | null, priority = 0.6) => ({
  url: `${SITE}${path}`,
  lastModified: updatedAt ? new Date(updatedAt) : undefined,
  priority,
})

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, glossary, notes, expertise, projects, lab] = await Promise.all([
    cms.find({ collection: 'posts', where: published, limit: 1000, depth: 0 }),
    cms.find({ collection: 'glossary', where: published, limit: 1000, depth: 0 }),
    cms.find({ collection: 'notes', where: published, limit: 1000, depth: 0 }),
    cms.find({ collection: 'expertise', limit: 100, depth: 0 }),
    cms.find({ collection: 'projects', limit: 100, depth: 0 }),
    cms.find({ collection: 'lab', limit: 100, depth: 0 }),
  ])

  // Páginas de tema: solo las que tienen artículos publicados (misma regla que /blog)
  const usedIds = new Set(
    posts.docs.flatMap((p: any) =>
      (p.categories || []).map((c: any) => (typeof c === 'object' ? c.id : c)),
    ),
  )
  const cats: any[] = usedIds.size
    ? (await cms.find({ collection: 'categories', limit: 50, depth: 0 })).docs
    : []

  const many = (base: string, docs: any[], priority: number) =>
    docs.filter((d) => d.slug).map((d) => entry(`${base}/${d.slug}`, d.updatedAt, priority))

  return [
    ...STATIC.map((p) => entry(p, undefined, p === '' ? 1 : 0.8)),
    ...many('/blog', posts.docs, 0.7),
    ...many('/glosario', glossary.docs, 0.6),
    ...many('/notas', notes.docs, 0.5),
    ...many('/expertise', expertise.docs, 0.7),
    ...many('/proyectos', projects.docs, 0.7),
    ...(lab.docs.length ? [entry('/lab'), ...many('/lab', lab.docs, 0.4)] : []),
    ...many('/blog/tag', cats.filter((c: any) => usedIds.has(c.id)), 0.4),
  ]
}
