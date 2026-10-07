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
      name: 'skills',
      label: 'Competencias',
      type: 'array',
      localized: true,
      maxRows: 8,
      admin: { description: 'Subcompetencias del área con su nivel. Se dibujan como consola de mezcla.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'name', type: 'text', required: true, admin: { width: '70%' } },
            {
              name: 'level',
              type: 'select',
              required: true,
              defaultValue: '3',
              admin: { width: '30%' },
              options: [
                { label: '1 · Básico', value: '1' },
                { label: '2 · En desarrollo', value: '2' },
                { label: '3 · Intermedio', value: '3' },
                { label: '4 · Avanzado', value: '4' },
                { label: '5 · Experto', value: '5' },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'deliverables',
      label: 'Qué entrego',
      type: 'array',
      localized: true,
      maxRows: 6,
      fields: [{ name: 'item', type: 'text', required: true }],
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
