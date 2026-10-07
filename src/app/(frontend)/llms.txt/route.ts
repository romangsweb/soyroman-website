import { cms } from '@/lib/cms'
import { RECURSOS } from '@/data/recursos'
import { SITE, filledText } from '@/lib/seo'

const line = (title: string, url: string, desc?: string) => `- [${title}](${url})${desc ? `: ${desc.replace(/\s+/g, ' ')}` : ''}`

export async function GET() {
  const [profile, posts, projects, expertise] = await Promise.all([
    cms.findGlobal({ slug: 'profile' }) as Promise<any>,
    cms.find({ collection: 'posts', where: { _status: { equals: 'published' } }, sort: '-publishedAt', limit: 50, depth: 0 }),
    cms.find({ collection: 'projects', sort: '-year', limit: 50, depth: 0 }),
    cms.find({ collection: 'expertise', limit: 50, depth: 0 }),
  ])

  const intro =
    filledText(profile?.shortBio) ||
    'Director de marketing B2B en la Ciudad de México: generación de demanda digital, CRM y RevOps, SEO y AEO, y la infraestructura técnica que los sostiene.'

  const body = [
    `# ${profile?.name || 'Román García'}`,
    '',
    `> ${intro.replace(/\s+/g, ' ')}`,
    '',
    '## Páginas',
    line('Sobre mí', `${SITE}/about`),
    line('CV', `${SITE}/cv`),
    line('Consultoría', `${SITE}/consultoria`),
    line('Contacto', `${SITE}/contacto`, 'contacto@soyroman.com'),
    '',
    '## Recursos (herramientas gratuitas)',
    ...RECURSOS.filter((r) => r.href).map((r) => line(r.name, `${SITE}${r.href}`, r.desc)),
    '',
    '## Proyectos',
    ...(projects.docs as any[]).map((p) => line(p.title, `${SITE}/proyectos/${p.slug}`, filledText(p.summary))),
    '',
    '## Expertise',
    ...(expertise.docs as any[]).map((e) => line(e.title, `${SITE}/expertise/${e.slug}`, filledText(e.summary))),
    '',
    '## Blog',
    ...(posts.docs as any[]).map((p) => line(p.title, `${SITE}/blog/${p.slug}`, p.excerpt)),
    '',
    '## Opcional',
    line('Glosario de marketing B2B', `${SITE}/glosario`),
    line('Artículos completos en texto', `${SITE}/llms-full.txt`),
    line('RSS del blog', `${SITE}/blog/rss.xml`),
    '',
  ].join('\n')

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
