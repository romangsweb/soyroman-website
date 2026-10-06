import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidatePath } from 'next/cache'

export const Header: GlobalConfig = {
  slug: 'header',
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
