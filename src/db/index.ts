import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

import * as schema from './schema'

/**
 * Conexión a la base del taller (Neon, HTTP). Se crea al primer uso: si falta TALLER_DATABASE_URL
 * (por ejemplo en Hall, donde solo corre el CMS) nada truena al importar.
 */
let _db: ReturnType<typeof make> | null = null
const make = (url: string) => drizzle(neon(url), { schema })

export function getDb() {
  if (_db) return _db
  const url = process.env.TALLER_DATABASE_URL
  if (!url) throw new Error('Falta TALLER_DATABASE_URL')
  _db = make(url)
  return _db
}

export { schema }
