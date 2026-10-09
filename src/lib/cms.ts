import type {
  CollectionSlug,
  DataFromCollectionSlug,
  DataFromGlobalSlug,
  GlobalSlug,
  PaginatedDocs,
  Where,
} from 'payload'

import { unstable_cache } from 'next/cache'

/**
 * Cliente del CMS con dos modos:
 * - LOCAL (Vercel con DATABASE_URI): Payload vive en la misma app y se lee la base (Neon) con la API local.
 * - REST (sin DATABASE_URI): se pide a la API de un CMS externo (CMS_URL, p. ej. Hall). Sirve de respaldo:
 *   quitar DATABASE_URI y apuntar CMS_URL a cms.soyroman.com regresa al esquema anterior.
 *
 * En ambos modos se cachea con la etiqueta "cms", que Payload invalida al publicar (/next/revalidate).
 * La API local corre con overrideAccess: false para ver lo mismo que un visitante anónimo (solo publicado).
 * Imita la forma de payload.find / payload.findGlobal para que las páginas casi no cambien.
 */

const LOCAL = Boolean(process.env.DATABASE_URI) && process.env.CMS_ROLE !== 'cms'

async function payloadLocal() {
  const [{ getPayload }, { default: config }] = await Promise.all([import('payload'), import('@payload-config')])
  return getPayload({ config })
}

const CMS_URL = (process.env.CMS_URL || 'http://localhost:3000').replace(/\/$/, '')
const REVALIDATE_SECONDS = Number(process.env.CMS_REVALIDATE_SECONDS || 3600)

// En Hall (CMS_ROLE=cms) el frontend no es público: si el CMS no responde
// durante el build devolvemos vacío en lugar de romperlo. En Vercel el error
// se propaga a propósito: mejor un build fallido que publicar el sitio vacío.
const TOLERATE_ERRORS = process.env.CMS_ROLE === 'cms'

export const CMS_TAG = 'cms'

/** Serializa objetos anidados al formato qs que entiende Payload: where[slug][equals]=x */
function toQuery(params: Record<string, unknown>): string {
  const out = new URLSearchParams()
  const walk = (value: unknown, key: string) => {
    if (value === undefined || value === null) return
    if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${key}[${i}]`))
    else if (typeof value === 'object')
      Object.entries(value as Record<string, unknown>).forEach(([k, v]) => walk(v, `${key}[${k}]`))
    else out.append(key, String(value))
  }
  Object.entries(params).forEach(([k, v]) => walk(v, k))
  const qs = out.toString()
  return qs ? `?${qs}` : ''
}

async function request<T>(path: string, tags: string[], fallback: T): Promise<T> {
  try {
    const res = await fetch(`${CMS_URL}/api${path}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: REVALIDATE_SECONDS, tags: [CMS_TAG, ...tags] },
    })
    if (!res.ok) throw new Error(`CMS respondió ${res.status} en ${path}`)
    return (await res.json()) as T
  } catch (err) {
    if (TOLERATE_ERRORS) {
      console.warn(`[cms] ${path}: ${(err as Error).message} — usando vacío`)
      return fallback
    }
    throw err
  }
}

type FindArgs<C extends CollectionSlug> = {
  collection: C
  where?: Where
  sort?: string
  limit?: number
  page?: number
  depth?: number
  locale?: string
}

const emptyPage = <T>(): PaginatedDocs<T> => ({
  docs: [],
  totalDocs: 0,
  limit: 0,
  totalPages: 0,
  page: 1,
  pagingCounter: 0,
  hasPrevPage: false,
  hasNextPage: false,
  prevPage: null,
  nextPage: null,
})

export const cms = {
  find<C extends CollectionSlug>({ collection, ...query }: FindArgs<C>) {
    if (LOCAL) {
      return unstable_cache(
        async () => (await payloadLocal()).find({ collection, ...query, overrideAccess: false } as never) as unknown as Promise<PaginatedDocs<DataFromCollectionSlug<C>>>,
        ['cms', collection, JSON.stringify(query)],
        { revalidate: REVALIDATE_SECONDS, tags: [CMS_TAG, `${CMS_TAG}:${collection}`] },
      )()
    }
    const qs = toQuery(query)
    return request<PaginatedDocs<DataFromCollectionSlug<C>>>(
      `/${collection}${qs}`,
      [`${CMS_TAG}:${collection}`],
      emptyPage<DataFromCollectionSlug<C>>(),
    )
  },

  findGlobal<G extends GlobalSlug>({ slug, ...query }: { slug: G; depth?: number; locale?: string }) {
    if (LOCAL) {
      return unstable_cache(
        async () => (await payloadLocal()).findGlobal({ slug, ...query, overrideAccess: false } as never) as unknown as Promise<DataFromGlobalSlug<G>>,
        ['cms', 'global', slug, JSON.stringify(query)],
        { revalidate: REVALIDATE_SECONDS, tags: [CMS_TAG, `${CMS_TAG}:global:${slug}`] },
      )()
    }
    const qs = toQuery(query)
    return request<DataFromGlobalSlug<G>>(
      `/globals/${slug}${qs}`,
      [`${CMS_TAG}:global:${slug}`],
      {} as DataFromGlobalSlug<G>,
    )
  },
}
