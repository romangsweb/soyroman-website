const TZ = 'America/Mexico_City'

export const fecha = (d: Date) => d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ })

/** "hoy", "ayer", "hace 5 días", o la fecha si pasó más de un mes. */
export function hace(d: Date, now = new Date()) {
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000)
  if (days <= 0) return 'hoy'
  if (days === 1) return 'ayer'
  if (days < 31) return `hace ${days} días`
  return fecha(d)
}
