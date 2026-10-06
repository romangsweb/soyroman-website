import type { CollectionConfig } from 'payload'

import {
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { adminOrBot, authenticated, isBot } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { revalidateDelete, revalidatePost } from './hooks/revalidatePost'
import { botDraftsOnly, markdownToContent, postContentFeatures } from './hooks/aiDrafts'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    create: adminOrBot,
    delete: authenticated,
    read: authenticatedOrPublished,
    // El bot solo puede tocar borradores; lo publicado es exclusivo del admin
    update: ({ req: { user } }) => {
      if (!user) return false
      if (isBot(user)) return { _status: { equals: 'draft' } }
      return true
    },
  },
  defaultPopulate: {
    title: true,
    slug: true,
    categories: true,
    excerpt: true,
    cover: true,
    publishedAt: true,
    readingTime: true,
    meta: {
      image: true,
      description: true,
    },
  },
  admin: {
    defaultColumns: ['title', 'slug', 'publishedAt', 'updatedAt'],
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
      type: 'tabs',
      tabs: [
        {
          label: 'Contenido',
          fields: [
            {
              name: 'excerpt',
              type: 'textarea',
              localized: true,
              maxLength: 200,
            },
            {
              name: 'markdownSource',
              type: 'textarea',
              virtual: true, // no se guarda: el hook lo convierte a `content`
              admin: {
                description:
                  'Para el generador de IA: Markdown que se convierte al contenido al guardar. Se descarta después.',
                condition: (_, __, { user }) => isBot(user),
              },
            },
            {
              name: 'cover',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'content',
              type: 'richText',
              localized: true,
              editor: lexicalEditor({ features: postContentFeatures }),
              label: false,
              required: true,
            },
          ],
        },
        {
          label: 'Relaciones',
          fields: [
            {
              name: 'expertises',
              type: 'relationship',
              relationTo: 'expertise',
              hasMany: true,
            },
            {
              name: 'categories',
              type: 'relationship',
              relationTo: 'categories',
              hasMany: true,
              admin: {
                position: 'sidebar',
              },
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
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),
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
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    {
      name: 'readingTime',
      type: 'number',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Tiempo de lectura estimado (minutos)',
      },
    },
  ],
  hooks: {
    beforeValidate: [markdownToContent],
    afterChange: [revalidatePost],
    afterDelete: [revalidateDelete],
    beforeChange: [
      botDraftsOnly,
      ({ data }) => {
        // Calculate reading time from content (rough estimate)
        if (data?.content) {
          const text = JSON.stringify(data.content)
          const wordCount = text.split(/\s+/).length
          data.readingTime = Math.max(1, Math.ceil(wordCount / 200))
        }
        return data
      },
    ],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}
