import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

export const Tools: CollectionConfig = {
  slug: 'tools',
  access: {
    create: authenticated,
    delete: authenticated,
    read: () => true,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'category', 'level'],
    useAsTitle: 'name',
    group: 'Perfil',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'CRM y RevOps', value: 'crm-revops' },
        { label: 'Analítica', value: 'analytics' },
        { label: 'Web', value: 'web' },
        { label: 'IA y datos', value: 'ia-data' },
        { label: 'Infraestructura', value: 'infrastructure' },
        { label: 'Diseño', value: 'design' },
        { label: 'Ads', value: 'ads' },
        { label: 'Entorno de trabajo', value: 'workspace' },
      ],
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'level',
      type: 'select',
      options: [
        { label: 'Principiante', value: 'beginner' },
        { label: 'Intermedio', value: 'intermediate' },
        { label: 'Avanzado', value: 'advanced' },
        { label: 'Experto', value: 'expert' },
      ],
      defaultValue: 'intermediate',
    },
  ],
}
