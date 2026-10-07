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
          label: 'Caso de uso',
          description:
            'Lo que hace que el caso venda: resumen de negocio, resultados antes/después, arquitectura y fases. Lo que contenga [COMPLETAR] no se muestra en el sitio.',
          fields: [
            {
              name: 'summary',
              type: 'textarea',
              localized: true,
              admin: { description: 'El caso en 1–2 líneas, dicho como resultado de negocio.' },
            },
            {
              type: 'row',
              fields: [
                { name: 'role', type: 'text', localized: true, admin: { width: '34%', description: 'Mi rol' } },
                { name: 'duration', type: 'text', localized: true, admin: { width: '33%', description: 'Duración (ej. 4 meses)' } },
                { name: 'team', type: 'text', localized: true, admin: { width: '33%', description: 'Equipo (ej. 3 personas)' } },
              ],
            },
            {
              name: 'outcomes',
              label: 'Resultados de negocio',
              type: 'array',
              localized: true,
              admin: { description: 'Métrica con su antes y después. Se muestra grande, con el antes tachado.' },
              fields: [
                { name: 'metric', type: 'text', required: true },
                {
                  type: 'row',
                  fields: [
                    { name: 'before', type: 'text', admin: { width: '50%' } },
                    { name: 'after', type: 'text', required: true, admin: { width: '50%' } },
                  ],
                },
                { name: 'impact', type: 'text', admin: { description: 'Qué significó para el negocio' } },
              ],
            },
            {
              name: 'highlights',
              label: 'Puntos clave',
              type: 'array',
              localized: true,
              maxRows: 6,
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'text', type: 'textarea' },
              ],
            },
            {
              name: 'phases',
              label: 'Fases',
              type: 'array',
              localized: true,
              fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'duration', type: 'text' },
                { name: 'text', type: 'textarea' },
              ],
            },
            {
              name: 'architecture',
              label: 'Arquitectura',
              type: 'group',
              admin: { description: 'Columnas de izquierda a derecha (fuentes → procesamiento → destinos). Se dibuja como diagrama animado.' },
              fields: [
                { name: 'caption', type: 'text', localized: true },
                {
                  name: 'columns',
                  type: 'array',
                  localized: true,
                  maxRows: 5,
                  fields: [
                    { name: 'label', type: 'text', required: true },
                    {
                      name: 'nodes',
                      type: 'array',
                      maxRows: 5,
                      fields: [
                        { name: 'name', type: 'text', required: true, admin: { description: 'Si coincide con una marca (HubSpot, GA4…) se dibuja su logo' } },
                        { name: 'note', type: 'text' },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
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
