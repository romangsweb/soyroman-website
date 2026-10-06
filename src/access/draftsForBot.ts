import type { Access, CollectionBeforeChangeHook } from 'payload'

import { isBot } from './authenticated'

/** Update: el admin todo; el bot solo documentos en borrador. */
export const updateDraftsOnlyForBot: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isBot(user)) return { _status: { equals: 'draft' } }
  return true
}

/** Lo que escribe el bot siempre queda como borrador (impuesto por el servidor). */
export const forceDraftForBot: CollectionBeforeChangeHook = ({ data, req }) => {
  if (isBot(req.user)) data._status = 'draft'
  return data
}
