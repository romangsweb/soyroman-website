import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { magicLink } from 'better-auth/plugins/magic-link'
import { headers } from 'next/headers'

import { getDb, schema } from '@/db'
import { sendMagicLinkEmail } from './authEmail'

const SITE = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://soyroman.com').replace(/\/$/, '')

/**
 * Cuentas de Mi taller: enlace por correo (Resend) y, si hay credenciales, Google.
 * Rutas en /next/auth/* (las de /api/* son de Payload). Se crea al primer uso.
 */
function make() {
  const gId = process.env.GOOGLE_CLIENT_ID
  const gSecret = process.env.GOOGLE_CLIENT_SECRET
  return betterAuth({
    appName: 'soyroman.com',
    baseURL: SITE,
    basePath: '/next/auth',
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [SITE],
    database: drizzleAdapter(getDb(), { provider: 'pg', schema }),
    user: { additionalFields: { role: { type: 'string', defaultValue: 'member', input: false } } },
    session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
    rateLimit: { enabled: true, storage: 'database', modelName: 'rateLimit' },
    socialProviders: gId && gSecret ? { google: { clientId: gId, clientSecret: gSecret, prompt: 'select_account' } } : {},
    plugins: [
      magicLink({ expiresIn: 600, sendMagicLink: async ({ email, url }) => sendMagicLinkEmail(email, url) }),
      nextCookies(),
    ],
  })
}

let _auth: ReturnType<typeof make> | null = null
export const getAuth = () => (_auth ??= make())

/** Usuario de la sesión actual (solo servidor) o null. */
export async function currentUser() {
  if (!process.env.TALLER_DATABASE_URL) return null
  const s = await getAuth().api.getSession({ headers: await headers() })
  return s?.user ?? null
}
