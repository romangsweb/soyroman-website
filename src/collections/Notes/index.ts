import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

import { authenticated, isBot } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { forceDraftForBot, updateDraftsOnlyForBot } from '../../access/draftsForBot'
import { markdownToContent, postContentFeatures } from '../Posts/hooks/aiDrafts'

/**
 * Notas de campo (/notas). Flujo: Román crea la nota con título + apuntes (etapa "idea");
 * el motor redacta el borrador a partir de esos apuntes y la pasa a "redactada".
 * Publicar siempre lo hace Román.
 */
export const Notes: CollectionConfig = {
  slug: 'notes',
  labels: { singular: 'Nota de campo', plural: 'Notas de campo' },
  access: {
    create: authenticated, // las ideas las crea Román
    read: authenticatedOrPublished,
    update: updateDraftsOnlyForBot,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'stage', '_status', 'updatedAt'],
    group: 'Contenido',
  },
  defaultSort: '-date',
  fields: [
    { name: 'title', label: 'Título', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true, admin: { position: 'sidebar' } },
    {
      name: 'stage',
      label: 'Etapa',
      type: 'select',
      required: true,
      defaultValue: 'idea',
      options: [
        { label: 'Idea (la redacta el motor)', value: 'idea' },
        { label: 'Redactada', value: 'drafted' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'date',
      label: 'Fecha',
      type: 'date',
      defaultValue: () => new Date().toISOString(),
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'notes',
      label: 'Tus apuntes',
      type: 'textarea',
      access: { read: ({ req: { user } }) => Boolean(user) },
      admin: {
        description:
          'En bruto: qué pasó, qué aprendiste, un dato. El motor redacta la nota solo a partir de esto. No se publica.',
      },
    },
    {
      name: 'markdownSource',
      type: 'textarea',
      virtual: true,
      admin: { condition: (_, __, { user }) => isBot(user) },
    },
    {
      name: 'content',
      label: 'Nota',
      type: 'richText',
      localized: true,
      editor: lexicalEditor({ features: postContentFeatures }),
    },
    {
      name: 'categories',
      label: 'Temas',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: { position: 'sidebar' },
    },
  ],
  hooks: {
    beforeValidate: [markdownToContent],
    beforeChange: [forceDraftForBot],
  },
  versions: { drafts: true, maxPerDoc: 20 },
}
