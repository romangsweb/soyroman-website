import { dotMatrixSvg } from '@/components/layout/dotFont'

/** Marquesina del pie de página como archivo estático (se genera al compilar y el navegador la guarda en caché). */
export const dynamic = 'force-static'

const MSG = 'SOY ROMAN · MARKETING B2B · CDMX · '

export function GET() {
  return new Response(dotMatrixSvg(MSG + MSG, '#f4f4f0', '#1d2023', 6), {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' },
  })
}
