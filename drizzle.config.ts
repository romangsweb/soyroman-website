import { defineConfig } from 'drizzle-kit'

/** Base del taller (Neon). Separada de la base de Payload en Hall. */
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.TALLER_DATABASE_URL || '' },
})
