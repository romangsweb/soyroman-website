/**
 * Convierte el JSON de Lexical (contenido de Payload) a Markdown legible para LLMs.
 * Cubre lo que produce el motor: encabezados, párrafos, formato, enlaces, listas, citas, código.
 */
type Node = { type?: string; children?: Node[]; [k: string]: any }

const FMT = { bold: 1, italic: 2, strike: 4, code: 16 }

function text(n: Node): string {
  let t = String(n.text ?? '')
  if (!t) return ''
  const f = Number(n.format || 0)
  // Los espacios van fuera de las marcas: "**RevOps** alinea", no "**RevOps **alinea"
  const [, lead, core, trail] = t.match(/^(\s*)([\s\S]*?)(\s*)$/) || ['', '', t, '']
  if (!core) return t
  let m = core
  if (f & FMT.code) return lead + '`' + m + '`' + trail
  if (f & FMT.bold) m = `**${m}**`
  if (f & FMT.italic) m = `*${m}*`
  if (f & FMT.strike) m = `~~${m}~~`
  return lead + m + trail
}

function inline(nodes: Node[] = []): string {
  return nodes
    .map((n) => {
      switch (n.type) {
        case 'text':
          return text(n)
        case 'linebreak':
          return '  \n'
        case 'link':
        case 'autolink': {
          const url = n.fields?.url || n.url || ''
          const label = inline(n.children)
          return url ? `[${label}](${url})` : label
        }
        default:
          return inline(n.children)
      }
    })
    .join('')
}

function list(n: Node, depth: number): string {
  const ordered = n.listType === 'number' || n.tag === 'ol'
  let i = Number(n.start || 1)
  return (n.children || [])
    .map((li) => {
      const nested = (li.children || []).filter((c) => c.type === 'list')
      const own = inline((li.children || []).filter((c) => c.type !== 'list'))
      const marker = ordered ? `${i++}.` : '-'
      const pad = '  '.repeat(depth)
      const check = li.checked === true ? '[x] ' : li.checked === false && n.listType === 'check' ? '[ ] ' : ''
      return `${pad}${marker} ${check}${own}` + nested.map((c) => '\n' + list(c, depth + 1)).join('')
    })
    .join('\n')
}

function block(n: Node): string {
  switch (n.type) {
    case 'heading': {
      const level = Number(String(n.tag || 'h2').replace('h', '')) || 2
      return `${'#'.repeat(Math.min(level, 6))} ${inline(n.children)}`
    }
    case 'paragraph':
      return inline(n.children)
    case 'quote':
      return inline(n.children)
        .split('\n')
        .map((l) => `> ${l}`)
        .join('\n')
    case 'list':
      return list(n, 0)
    case 'code':
      return '```' + (n.language || '') + '\n' + inline(n.children) + '\n```'
    case 'horizontalrule':
      return '---'
    default:
      return n.children ? n.children.map(block).filter(Boolean).join('\n\n') : ''
  }
}

export function lexicalToMarkdown(data: any): string {
  const root: Node | undefined = data?.root
  if (!root?.children) return ''
  return root.children
    .map(block)
    .filter((s) => s.trim())
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
