import { cms } from '@/lib/cms'
import { SITE } from '@/lib/seo'

const esc = (s = '') =>
  s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!)

export async function GET() {
  const { docs } = await cms.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    sort: '-publishedAt',
    limit: 50,
    depth: 1,
  })

  const items = (docs as any[])
    .map((p) => {
      const url = `${SITE}/blog/${p.slug}`
      const cats = ((p.categories as any[]) || [])
        .filter((c) => typeof c === 'object' && c?.title)
        .map((c) => `<category>${esc(c.title)}</category>`)
        .join('')
      return [
        '<item>',
        `<title>${esc(p.title)}</title>`,
        `<link>${url}</link>`,
        `<guid isPermaLink="true">${url}</guid>`,
        p.publishedAt ? `<pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>` : '',
        `<description>${esc(p.excerpt || '')}</description>`,
        cats,
        '</item>',
      ].join('')
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>Román García — Blog de marketing B2B</title>
<link>${SITE}/blog</link>
<atom:link href="${SITE}/blog/rss.xml" rel="self" type="application/rss+xml"/>
<description>Generación de demanda, CRM y RevOps, SEO y AEO para empresas B2B.</description>
<language>es-MX</language>
${items}
</channel>
</rss>`

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } })
}
