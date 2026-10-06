import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidatePath } from 'next/cache'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 8,
    },
    {
      name: 'copyright',
      type: 'text',
      localized: true,
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
