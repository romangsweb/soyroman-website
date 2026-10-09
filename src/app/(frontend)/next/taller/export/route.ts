import { desc, eq } from 'drizzle-orm'

import { getDb } from '@/db'
import { companyProfile, toolRun } from '@/db/schema'
import { currentUser } from '@/lib/auth'

/** Descarga de todo lo que el taller guarda de la persona (derecho de acceso). */
export async function GET() {
  const u = await currentUser().catch(() => null)
  if (!u) return new Response('Sin sesión', { status: 401 })
  const db = getDb()
  const [profile] = await db.select().from(companyProfile).where(eq(companyProfile.userId, u.id)).limit(1)
  const runs = await db.select().from(toolRun).where(eq(toolRun.userId, u.id)).orderBy(desc(toolRun.createdAt))
  const body = {
    exportado: new Date().toISOString(),
    cuenta: { correo: u.email, nombre: u.name, creada: u.createdAt },
    perfil: profile ? { datos: profile.data, consentimientoMedianas: profile.consentBenchmarks, avisos: profile.consentAlerts, actualizado: profile.updatedAt } : null,
    corridas: runs.map((r) => ({ herramienta: r.toolSlug, fecha: r.createdAt, etiqueta: r.label, datos: r.inputs, metricas: r.metrics, resumen: r.summary })),
  }
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="mi-taller-soyroman.json"',
      'Cache-Control': 'no-store',
    },
  })
}
