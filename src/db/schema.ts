import { bigint, boolean, index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

/*
 * Base del taller (Neon). Las cuatro primeras tablas son las de Better Auth con sus nombres por defecto;
 * `role` es un campo adicional (member | admin).
 */

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: text('role').notNull().default('member'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  },
  (t) => [index('session_user_idx').on(t.userId)],
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('account_user_idx').on(t.userId)],
)

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('verification_identifier_idx').on(t.identifier)],
)

/** Límite de intentos de Better Auth (enlaces de acceso), guardado en la base para que funcione en serverless. */
export const rateLimit = pgTable('rate_limit', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  count: integer('count').notNull(),
  lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
})

/** Cada resultado guardado de una herramienta. `metrics` usa claves estándar para el historial y, más adelante, las medianas. */
export const toolRun = pgTable(
  'tool_run',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    toolSlug: text('tool_slug').notNull(),
    label: text('label'),
    inputs: jsonb('inputs').$type<Record<string, unknown>>().notNull(),
    metrics: jsonb('metrics').$type<Record<string, number | null>>().notNull(),
    summary: text('summary').notNull().default(''),
    schemaV: integer('schema_v').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('tool_run_user_tool_idx').on(t.userId, t.toolSlug, t.createdAt)],
)

export type ToolRun = typeof toolRun.$inferSelect

/** Perfil de empresa: precarga las herramientas. `data` sigue el tipo ProfileData de src/lib/taller/profile.ts. */
export const companyProfile = pgTable('company_profile', {
  userId: text('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  data: jsonb('data').$type<Record<string, unknown>>().notNull().default({}),
  consentBenchmarks: boolean('consent_benchmarks').notNull().default(false),
  consentAlerts: boolean('consent_alerts').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
