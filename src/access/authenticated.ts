import type { Access, AccessArgs } from 'payload'

import type { User } from '@/payload-types'

/**
 * "authenticated" = una persona con acceso al panel (rol admin).
 * El usuario `bot` (generador de contenido) NO cuenta: solo puede lo que
 * se le habilita explícitamente con `adminOrBot`.
 */
type isAuthenticated = (args: AccessArgs<User>) => boolean
// `role` se agrega a payload-types al correr `payload generate:types`
type WithRole = { role?: string | null }

export const authenticated: isAuthenticated = ({ req: { user } }) => {
  return Boolean(user) && (user as WithRole).role !== 'bot'
}

export const isBot = (user: unknown): boolean => (user as WithRole | null)?.role === 'bot'

/** Admin o bot (p. ej. crear borradores de posts o subir portadas). */
export const adminOrBot: Access = ({ req: { user } }) => Boolean(user)
