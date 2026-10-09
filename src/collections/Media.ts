import type { CollectionConfig } from 'payload'

import { adminOrBot, authenticated } from '../access/authenticated'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    create: adminOrBot,
    read: () => true,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    group: 'Sistema',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
    },
  ],
  upload: {
    // Miniatura del panel: con R2 se toma de su dominio público; sin R2 (Hall o local), la sirve Payload
    adminThumbnail: ({ doc }) => {
      const thumb = (doc.sizes as { thumbnail?: { filename?: string | null } } | undefined)?.thumbnail?.filename
      if (!thumb) return null
      const base = (process.env.MEDIA_PUBLIC_URL || '').replace(/\/$/, '')
      return base ? `${base}/${encodeURIComponent(thumb)}` : `/api/media/file/${encodeURIComponent(thumb)}`
    },
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
        position: 'centre',
      },
      {
        name: 'hero',
        width: 1920,
        height: undefined,
        position: 'centre',
      },
    ],
    mimeTypes: ['image/*', 'application/pdf'],
  },
}
