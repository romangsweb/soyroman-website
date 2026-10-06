import { ImageResponse } from 'next/og'

// Imagen por defecto al compartir cualquier página del sitio.
// Los artículos con portada usan su propia imagen (generateMetadata del post).
export const alt = 'Román García — Director de marketing B2B'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 64,
          background: '#f4f4f4',
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.16) 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
          border: '2px solid #000',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 20, height: 20, background: '#ff3300' }} />
          <div style={{ fontSize: 24, letterSpacing: 4, fontWeight: 700, color: 'rgba(0,0,0,0.6)' }}>SOY_ROMAN</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2, color: '#000' }}>Román García</div>
          <div style={{ fontSize: 36, color: '#111', maxWidth: 900 }}>
            Director de marketing B2B · Generación de demanda, CRM, SEO y AEO
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 24, letterSpacing: 3, fontWeight: 700 }}>SOYROMAN.COM</div>
          <div style={{ display: 'flex', width: 96, height: 96, border: '3px solid #000', background: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 32, height: 32, background: '#ff3300' }} />
          </div>
        </div>
      </div>
    ),
    size,
  )
}
