import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { authenticated } from '../../access/authenticated'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

export const Projects: CollectionConfig = {
  slug: 'projects',
  access: {
    create: authenticated,
    delete: authenticated,
    read: () => true,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['title', 'client', 'year', 'featured', 'updatedAt'],
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
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'client',
      type: 'text',
      admin: {
        description: 'Nombre del cliente o "Confidencial"',
      },
    },
    {
      name: 'year',
      type: 'number',
      required: true,
    },
    {
      name: 'color',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Color hex del proyecto (ej: #2157a4)',
      },
    },
    {
      name: 'stackTags',
      type: 'array',
      admin: {
        description: 'Stack tecnológico como tags de texto',
      },
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Caso',
          fields: [
            {
              name: 'context',
              type: 'textarea',
              localized: true,
              admin: {
                description: 'Contexto del proyecto',
              },
            },
            {
              name: 'problem',
              type: 'textarea',
              localized: true,
              admin: {
                description: 'Problema a resolver',
              },
            },
            {
              name: 'approach',
              type: 'richText',
              localized: true,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h3', 'h4'] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                  ]
                },
              }),
              admin: {
                description: 'Enfoque / solución',
              },
            },
            {
              name: 'results',
              type: 'array',
              localized: true,
              fields: [
                {
                  name: 'metric',
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
              name: 'learnings',
              type: 'textarea',
              localized: true,
              admin: {
                description: 'Aprendizaje clave del proyecto',
              },
            },
          ],
        },
        {
          label: 'Relaciones',
          fields: [
            {
              name: 'stack',
              type: 'relationship',
              relationTo: 'tools',
              hasMany: true,
            },
            {
              name: 'expertises',
              type: 'relationship',
              relationTo: 'expertise',
              hasMany: true,
            },
          ],
        },
        {
          label: 'Galería',
          fields: [
            {
              name: 'gallery',
              type: 'array',
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                {
                  name: 'caption',
                  type: 'text',
                  localized: true,
                },
              ],
            },
          ],
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({ hasGenerateFn: true }),
            MetaImageField({ relationTo: 'media' }),
            MetaDescriptionField({}),
            PreviewField({
              hasGenerateFn: true,
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
  ],
}
