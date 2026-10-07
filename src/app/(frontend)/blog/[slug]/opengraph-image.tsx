import { ImageResponse } from 'next/og'

import { cms } from '@/lib/cms'
import { SCREEN_CODES, screenSvg } from '@/components/ScreenCover/screen'

/** Imagen para redes de cada artículo: la pantalla del artículo congelada + título. */
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Artículo de soyroman.com'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const res = await cms.find({ collection: 'posts', where: { slug: { equals: slug } }, limit: 1, depth: 1 })
  const post: any = res.docs[0]
  const cat = (post?.categories || []).find((c: any) => c && typeof c === 'object' && c.slug)?.slug || null
  const svg = screenSvg({ slug, category: cat, minutes: post?.readingTime, still: true, noText: true })
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  const code = (cat && SCREEN_CODES[cat]) || 'BLOG'
  const title: string = post?.title || 'soyroman.com'

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: '#050607', position: 'relative' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={1200} height={675} style={{ position: 'absolute', top: -22, left: 0 }} alt="" />
        <div
          style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, height: 300, display: 'flex', flexDirection: 'column',
            justifyContent: 'flex-end', padding: '0 56px 44px',
            backgroundImage: 'linear-gradient(to bottom, rgba(5,6,7,0), rgba(5,6,7,.92) 45%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
            <span style={{ background: '#f4f4f0', color: '#111', fontSize: 22, padding: '4px 12px', letterSpacing: 2 }}>{code}</span>
            <span style={{ color: '#e85a2a', fontSize: 22, letterSpacing: 2 }}>SOYROMAN.COM</span>
          </div>
          <div style={{ color: '#f4f4f0', fontSize: title.length > 70 ? 46 : 56, lineHeight: 1.1, letterSpacing: -1, maxWidth: 1050 }}>
            {title}
          </div>
        </div>
      </div>
    ),
    size,
  )
}
