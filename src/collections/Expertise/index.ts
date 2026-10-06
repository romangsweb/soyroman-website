import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { authenticated } from '../../access/authenticated'

export const Expertise: CollectionConfig = {
  slug: 'expertise',
  access: {
    create: authenticated,
    delete: authenticated,
    read: () => true,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['title', 'order', 'updatedAt'],
    useAsTitle: 'title',
    group: 'Contenido',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'order',
      type: 'number',
      admin: {
        position: 'sidebar',
      },
      defaultValue: 0,
    },
    {
      name: 'thesis',
      type: 'text',
      localized: true,
      admin: {
        description: 'Una frase que resume esta expertise',
      },
    },
    {
      name: 'level',
      type: 'select',
      options: [
        { label: 'Básico', value: 'basic' },
        { label: 'Intermedio', value: 'intermediate' },
        { label: 'Avanzado', value: 'advanced' },
      ],
      defaultValue: 'advanced',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'framework',
      type: 'array',
      localized: true,
      admin: {
        description: 'Pasos del framework / metodología',
      },
      fields: [
        {
          name: 'step',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
        },
      ],
    },
    {
      name: 'metrics',
      type: 'array',
      localized: true,
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'value',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'text',
        },
      ],
    },
    {
      name: 'tools',
      type: 'relationship',
      relationTo: 'tools',
      hasMany: true,
    },
    {
      name: 'content',
      type: 'richText',
      localized: true,
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
          ]
        },
      }),
    },
  ],
}
