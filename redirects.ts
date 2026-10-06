import type { NextConfig } from 'next'

/**
 * Mismo código, dos papeles:
 *  - Vercel (frontend): /admin se manda al CMS en Hall.
 *  - Hall (CMS_ROLE=cms): / abre /admin; lo demás que no sea admin/API va al frontend.
 */
export const redirects: NextConfig['redirects'] = async () => {
  const CMS_URL = process.env.CMS_URL?.replace(/\/$/, '')
  const FRONTEND_URL = process.env.FRONTEND_URL?.replace(/\/$/, '')

  if (process.env.CMS_ROLE === 'cms') {
    if (!FRONTEND_URL) return []
    return [
      // La raíz del CMS lleva directo al panel de Payload
      { source: '/', destination: '/admin', permanent: false },
      {
        source: '/:path((?!admin|api|next|_next|favicon).*)',
        destination: `${FRONTEND_URL}/:path`,
        permanent: false,
      },
    ]
  }

  if (!CMS_URL || CMS_URL.includes('localhost')) return []
  return [
    { source: '/admin', destination: `${CMS_URL}/admin`, permanent: false },
    { source: '/admin/:path*', destination: `${CMS_URL}/admin/:path*`, permanent: false },
  ]
}
