import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

/** Visitas de bots de IA registradas por el proxy del frontend. Nunca pasan por GA4. */
export const AiVisits: CollectionConfig = {
  slug: 'ai-visits',
  labels: { singular: 'Visita IA', plural: 'Visitas IA' },
  admin: {
    group: 'Analítica',
    useAsTitle: 'path',
    defaultColumns: ['bot', 'kind', 'path', 'createdAt'],
  },
  access: {
    // Solo el frontend, con un secreto compartido (no usa la API key del bot de contenido)
    create: ({ req }) =>
      Boolean(process.env.INGEST_SECRET) && req.headers.get('x-ingest-secret') === process.env.INGEST_SECRET,
    read: authenticated,
    update: () => false,
    delete: authenticated,
  },
  fields: [
    { name: 'bot', type: 'text', required: true, index: true },
    { name: 'company', type: 'text' },
    {
      name: 'kind',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Entrenamiento', value: 'training' },
        { label: 'Búsqueda', value: 'search' },
        { label: 'Consulta en vivo', value: 'user' },
      ],
    },
    { name: 'path', type: 'text', required: true, index: true },
    { name: 'userAgent', type: 'text' },
  ],
}
