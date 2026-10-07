import { lexicalToMarkdown } from './lexicalToMarkdown'
import { SITE } from './seo'

/** Artículo completo en Markdown: cabecera con metadatos y cuerpo. */
export function postMarkdown(post: any, author = 'Román García'): string {
  const url = `${SITE}/blog/${post.slug}`
  const cats = ((post.categories as any[]) || []).filter((c) => typeof c === 'object' && c?.title).map((c) => c.title)
  const date = post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 10) : ''
  const head = [
    `# ${post.title}`,
    '',
    [`Autor: ${author}`, date && `Publicado: ${date}`, cats.length && `Tema: ${cats.join(', ')}`, `URL: ${url}`]
      .filter(Boolean)
      .join(' · '),
    post.excerpt ? `\n> ${String(post.excerpt).replace(/\s+/g, ' ')}` : '',
  ].join('\n')
  return `${head}\n\n${lexicalToMarkdown(post.content)}\n`
}
