import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

export const Experience: CollectionConfig = {
  slug: 'experience',
  access: {
    create: authenticated,
    delete: authenticated,
    read: () => true,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['company', 'position', 'startDate', 'order'],
    useAsTitle: 'company',
    group: 'Perfil',
  },
  fields: [
    {
      name: 'company',
      type: 'text',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'work',
      options: [
        { label: 'Trabajo', value: 'work' },
        { label: 'Formación', value: 'education' },
        { label: 'Certificación', value: 'certification' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'position',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'startDate',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'MMM yyyy',
        },
      },
    },
    {
      name: 'endDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'MMM yyyy',
        },
        description: 'Dejar vacío si es el puesto actual',
      },
    },
    {
      name: 'achievements',
      type: 'array',
      localized: true,
      fields: [
        {
          name: 'text',
          type: 'textarea',
          required: true,
        },
      ],
    },
    {
      name: 'expertises',
      type: 'relationship',
      relationTo: 'expertise',
      hasMany: true,
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
