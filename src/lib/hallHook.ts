/**
 * Aviso a Hall (n8n) cuando entra un lead de /recursos: allá se arma el expediente del contacto en
 * HubSpot (nota con lo que capturó, primera herramienta, herramientas usadas). Es un extra: si Hall no
 * responde, el lead ya quedó en HubSpot por el formulario. Sin HALL_HOOK_URL y HALL_HOOK_KEY no hace nada.
 */
export type HallEvent = {
  event: 'tool_lead'
  email: string
  name?: string
  company?: string
  tool: string
  slug?: string
  domain?: string
  score?: number | null
  finding?: string
  summary?: string
  items?: { t: string; fix?: string }[]
  page?: string
}

export async function notifyHall(e: HallEvent) {
  const url = process.env.HALL_HOOK_URL
  const key = process.env.HALL_HOOK_KEY
  if (!url || !key) return
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-SR-Key': key },
      body: JSON.stringify({ v: 1, at: new Date().toISOString(), ...e }),
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) console.warn('[hall] aviso rechazado', res.status)
  } catch (err) {
    console.warn('[hall] sin respuesta', err instanceof Error ? err.message : err)
  }
}
