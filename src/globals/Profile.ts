import type { GlobalConfig } from 'payload'

import { revalidatePath } from 'next/cache'

export const Profile: GlobalConfig = {
  slug: 'profile',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'text',
      localized: true,
    },
    {
      name: 'tagline',
      type: 'text',
      localized: true,
      admin: {
        description: 'Propuesta de valor en una frase (para el hero)',
      },
    },
    {
      name: 'shortBio',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'longBio',
      type: 'richText',
      localized: true,
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'metrics',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'value',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'socialLinks',
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'GitHub', value: 'github' },
            { label: 'Twitter / X', value: 'twitter' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'Website', value: 'website' },
          ],
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'email',
      type: 'email',
    },
    {
      name: 'buildationsUrl',
      type: 'text',
      admin: {
        description: 'URL de Buildations',
      },
    },
    {
      name: 'services',
      type: 'array',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'description',
          type: 'textarea',
          localized: true,
        },
        {
          name: 'engine',
          type: 'text',
          admin: {
            description: 'Motor asociado (Revenue Intelligence, Search & Presence, etc.)',
          },
        },
      ],
    },
    {
      name: 'cvFile',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'PDF del CV para descargar',
      },
    },
  ],
  hooks: {
    afterChange: [
      ({ context }) => {
        if (context?.disableRevalidate) return
        revalidatePath('/', 'layout')
      },
    ],
  },
}
