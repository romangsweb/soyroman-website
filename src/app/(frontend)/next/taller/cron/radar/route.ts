import { runRadarBatch } from '@/lib/taller/radar'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Lote diario del radar de IA. Lo llama Vercel Cron con el encabezado Authorization: Bearer CRON_SECRET. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return new Response('No autorizado', { status: 401 })
  if (!process.env.TALLER_DATABASE_URL || !process.env.GEMINI_API_KEY) return Response.json({ skipped: true })
  const r = await runRadarBatch()
  console.info('[radar] lote', JSON.stringify({ due: r.due, done: r.done.map((d) => ({ mentions: d.mentions, changes: d.changes, error: d.error })) }))
  return Response.json({ due: r.due, done: r.done.length })
}
