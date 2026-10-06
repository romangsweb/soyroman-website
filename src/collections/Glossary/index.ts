import type { CollectionConfig } from 'payload'

import { adminOrBot, authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { forceDraftForBot, updateDraftsOnlyForBot } from '../../access/draftsForBot'

/** Glosario de marketing B2B (/glosario). Cada término lleva datos estructurados DefinedTerm. */
export const Glossary: CollectionConfig = {
  slug: 'glossary',
  labels: { singular: 'Término', plural: 'Glosario' },
  access: {
    create: adminOrBot,
    read: authenticatedOrPublished,
    update: updateDraftsOnlyForBot,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'term',
    defaultColumns: ['term', 'fullName', '_status', 'updatedAt'],
    group: 'Contenido',
  },
  defaultSort: 'term',
  fields: [
    { name: 'term', label: 'Término', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true, admin: { position: 'sidebar' } },
    {
      name: 'fullName',
      label: 'Nombre completo',
      type: 'text',
      localized: true,
      admin: { description: 'Ej.: Return on Ad Spend (retorno de la inversión publicitaria)' },
    },
    {
      name: 'definition',
      label: 'Definición',
      type: 'textarea',
      required: true,
      localized: true,
      admin: { description: '2 o 3 frases claras, sin jerga.' },
    },
    {
      name: 'formula',
      label: 'Fórmula',
      type: 'text',
      localized: true,
      admin: { description: 'Opcional. Ej.: Ingresos atribuidos ÷ inversión en anuncios' },
    },
    { name: 'example', label: 'Ejemplo', type: 'textarea', localized: true, admin: { description: 'Con números cuando aplique.' } },
    { name: 'whyItMatters', label: 'Por qué importa en B2B', type: 'textarea', localized: true },
    {
      name: 'relatedTerms',
      label: 'Términos relacionados',
      type: 'relationship',
      relationTo: 'glossary',
      hasMany: true,
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
  hooks: { beforeChange: [forceDraftForBot] },
  versions: { drafts: true, maxPerDoc: 20 },
}
