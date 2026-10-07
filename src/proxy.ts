import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server'

import { matchAiBot } from '@/lib/aiBots'

const CMS_URL = (process.env.CMS_URL || '').replace(/\/$/, '')

/**
 * Registra visitas de bots de IA en la colección `ai-visits` del CMS.
 * Solo en el frontend público (Vercel): en Hall (CMS_ROLE=cms) no hace nada.
 * El registro corre después de responder; la página nunca espera a Hall.
 */
export function proxy(req: NextRequest, event: NextFetchEvent) {
  const ua = req.headers.get('user-agent') || ''
  const bot = matchAiBot(ua)
  if (bot && CMS_URL && process.env.INGEST_SECRET && process.env.CMS_ROLE !== 'cms') {
    event.waitUntil(
      fetch(`${CMS_URL}/api/ai-visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-ingest-secret': process.env.INGEST_SECRET },
        body: JSON.stringify({
          bot: bot.name,
          company: bot.company,
          kind: bot.kind,
          path: req.nextUrl.pathname.slice(0, 300),
          userAgent: ua.slice(0, 300),
        }),
        signal: AbortSignal.timeout(4000),
      }).catch(() => {}),
    )
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/|api/|admin|next/|favicon|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|css|js|map|woff2?)$).*)'],
}
