import type {
  BasePayload,
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
  GlobalAfterChangeHook,
  GlobalConfig,
} from 'payload'

/**
 * Avisa al frontend en Vercel que el contenido cambió.
 * Se invalida la etiqueta global "cms": el sitio es pequeño y así cualquier
 * relación poblada (categorías, media, expertise…) queda fresca sin rastrear
 * dependencias.
 */
function notifyFrontend(logger: BasePayload['logger'], source: string) {
  const url = process.env.FRONTEND_URL
  const secret = process.env.REVALIDATE_SECRET
  if (!url || !secret) return

  // Sin await: no bloquea el guardado en el admin.
  void fetch(`${url.replace(/\/$/, '')}/next/revalidate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-revalidate-secret': secret },
    body: JSON.stringify({ tags: ['cms'] }),
    signal: AbortSignal.timeout(8000),
  })
    .then((res) => {
      if (!res.ok) logger.warn(`[revalidate] ${source}: frontend respondió ${res.status}`)
      else logger.info(`[revalidate] ${source}: frontend invalidado`)
    })
    .catch((err) => logger.error({ err }, `[revalidate] ${source}: no se pudo avisar al frontend`))
}

const afterChange: CollectionAfterChangeHook = ({ doc, collection, req }) => {
  if (!req.context?.disableRevalidate) notifyFrontend(req.payload.logger, collection.slug)
  return doc
}

const afterDelete: CollectionAfterDeleteHook = ({ doc, collection, req }) => {
  if (!req.context?.disableRevalidate) notifyFrontend(req.payload.logger, collection.slug)
  return doc
}

const afterGlobalChange: GlobalAfterChangeHook = ({ doc, global, req }) => {
  if (!req.context?.disableRevalidate) notifyFrontend(req.payload.logger, `global:${global.slug}`)
  return doc
}

export const withFrontendRevalidation = (c: CollectionConfig): CollectionConfig => ({
  ...c,
  hooks: {
    ...c.hooks,
    afterChange: [...(c.hooks?.afterChange || []), afterChange],
    afterDelete: [...(c.hooks?.afterDelete || []), afterDelete],
  },
})

export const withGlobalRevalidation = (g: GlobalConfig): GlobalConfig => ({
  ...g,
  hooks: {
    ...g.hooks,
    afterChange: [...(g.hooks?.afterChange || []), afterGlobalChange],
  },
})
