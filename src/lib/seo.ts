export const SITE = 'https://soyroman.com'
export const PERSON_ID = `${SITE}/#person`

/** Grafo JSON-LD serializado y seguro para incrustar en <script>. */
export const ld = (...nodes: object[]) =>
  JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }).replace(/</g, '\\u003c')

export function personLd(p: any) {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    url: SITE,
    name: p?.name || 'Román García',
    jobTitle: p?.role || 'Director de marketing B2B',
    ...(p?.photo && typeof p.photo === 'object' && p.photo.url ? { image: p.photo.url } : {}),
    address: { '@type': 'PostalAddress', addressLocality: 'Ciudad de México', addressCountry: 'MX' },
    sameAs: (p?.socialLinks || []).map((s: any) => s?.url).filter(Boolean),
    knowsAbout: ['Marketing B2B', 'Generación de demanda', 'RevOps', 'HubSpot', 'SEO', 'AEO'],
  }
}

/** Texto con contenido real (oculta lo que sigue en [COMPLETAR]). */
export const filledText = (s?: string | null) => (s && !s.includes('[COMPLETAR]') ? s.trim() : '')
