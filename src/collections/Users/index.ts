import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
  },
  auth: {
    // El generador de contenido se autentica con API key (revocable), no con contraseña
    useAPIKey: true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'admin',
      options: [
        { label: 'Administrador', value: 'admin' },
        { label: 'Bot (solo borradores)', value: 'bot' },
      ],
      access: {
        // Solo un admin asigna roles; el primer usuario recibe "admin" por defecto
        create: ({ req: { user } }) => !user || (user as { role?: string }).role === 'admin',
        update: ({ req: { user } }) => (user as { role?: string } | null)?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
        description: 'Bot: solo puede crear/editar borradores de Posts y subir medios. Nunca publica.',
      },
    },
  ],
  timestamps: true,
  versions: false,
}
