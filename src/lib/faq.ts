/**
 * Extrae las preguntas frecuentes del contenido de un post: el bloque bajo un H2
 * "Preguntas frecuentes", con cada pregunta en H3 y su respuesta en los párrafos o
 * listas siguientes. Omite respuestas que aún tengan [COMPLETAR].
 */
type Node = { type?: string; tag?: string; text?: string; children?: Node[] }

const plain = (n: Node): string =>
  (n?.text ?? '') + (n?.children || []).map(plain).join(n?.type === 'list' ? ' ' : '')

export function extractFaq(content: any): { q: string; a: string }[] {
  const nodes: Node[] = content?.root?.children || []
  const start = nodes.findIndex((n) => n.type === 'heading' && n.tag === 'h2' && /preguntas frecuentes/i.test(plain(n)))
  if (start < 0) return []
  const out: { q: string; a: string }[] = []
  for (const n of nodes.slice(start + 1)) {
    if (n.type === 'heading' && n.tag === 'h2') break
    if (n.type === 'heading' && n.tag === 'h3') out.push({ q: plain(n).trim(), a: '' })
    else if (out.length) out[out.length - 1].a = `${out[out.length - 1].a} ${plain(n)}`.replace(/\s+/g, ' ').trim()
  }
  return out.filter((f) => f.q && f.a && !f.a.includes('[COMPLETAR'))
}
