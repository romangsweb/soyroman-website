import { cms } from '@/lib/cms'
import { postMarkdown } from '@/lib/postMarkdown'
import { SITE, filledText } from '@/lib/seo'

/** Texto completo de los artículos recientes para LLMs (complemento de /llms.txt). */
export async function GET() {
  const [profile, posts] = await Promise.all([
    cms.findGlobal({ slug: 'profile' }) as Promise<any>,
    cms.find({ collection: 'posts', where: { _status: { equals: 'published' } }, sort: '-publishedAt', limit: 30, depth: 1 }),
  ])
  const name = profile?.name || 'Román García'
  const intro =
    filledText(profile?.shortBio) ||
    'Director de marketing B2B en la Ciudad de México: generación de demanda, CRM y RevOps, SEO y AEO.'
  const body = [
    `# ${name} — artículos completos`,
    '',
    `> ${intro.replace(/\s+/g, ' ')}`,
    '',
    `Índice: ${SITE}/llms.txt · Blog: ${SITE}/blog`,
    '',
    ...(posts.docs as any[]).map((p) => `---\n\n${postMarkdown(p, name)}`),
  ].join('\n')
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
