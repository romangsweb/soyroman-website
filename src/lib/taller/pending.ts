'use client'

import type { RunInput } from '@/actions/taller'

/** Resultados que alguien quiso guardar antes de tener cuenta; se suben a su taller al entrar. */
const KEY = 'sr-taller-pendientes'

export function readPending(): RunInput[] {
  try {
    const x = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(x) ? x.slice(0, 10) : []
  } catch {
    return []
  }
}

export function pushPending(run: RunInput) {
  try {
    const list = readPending().filter((r) => r.slug !== run.slug) // uno por herramienta: el más reciente
    localStorage.setItem(KEY, JSON.stringify([run, ...list].slice(0, 10)))
  } catch {}
}

export function clearPending() {
  try {
    localStorage.removeItem(KEY)
  } catch {}
}
