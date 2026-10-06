import { timingSafeEqual } from 'crypto'
import { revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'

import { CMS_TAG } from '@/lib/cms'

/**
 * Webhook que llama Payload (Hall) al publicar/editar/borrar contenido.
 * POST /next/revalidate  · header x-revalidate-secret · body { tags: string[] }
 */
function validSecret(received: string | null) {
  const expected = process.env.REVALIDATE_SECRET
  if (!expected || !received) return false
  const a = Buffer.from(received)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  if (!validSecret(req.headers.get('x-revalidate-secret'))) {
    return Response.json({ ok: false }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const tags: string[] = Array.isArray(body?.tags)
    ? body.tags.filter((t: unknown): t is string => typeof t === 'string' && t.startsWith(CMS_TAG))
    : []

  if (tags.length === 0) {
    return Response.json({ ok: false, error: 'Sin tags válidos' }, { status: 400 })
  }

  // Webhook externo: updateTag no está disponible; expire: 0 invalida de inmediato.
  for (const tag of tags) revalidateTag(tag, { expire: 0 })

  return Response.json({ ok: true, tags, at: new Date().toISOString() })
}
