import type { Metadata } from 'next'

// La imagen por defecto la genera app/(frontend)/opengraph-image.tsx
const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  locale: 'es_MX',
  siteName: 'Román García',
  title: 'Román García — Director de marketing B2B',
  description:
    'Director de marketing B2B: generación de demanda digital, CRM y RevOps, SEO y AEO, y la infraestructura técnica que los sostiene.',
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => ({
  ...defaultOpenGraph,
  ...og,
})
