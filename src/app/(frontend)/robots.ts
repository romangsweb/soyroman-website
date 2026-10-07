import type { MetadataRoute } from 'next'

// Abierto a todos los rastreadores, incluidos los de IA (AEO).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/next'] }],
    sitemap: 'https://soyroman.com/sitemap.xml',
  }
}
