'use client'

import React, { useEffect, useState } from 'react'

import { dotMatrix } from './dotFont'

/** Mini pantalla del logo: alterna mensajes en matriz de puntos naranja. */
export function LogoScreen({ messages = ['SOY ROMAN', 'MKT B2B', 'CDMX'] }: { messages?: string[] }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setI((x) => (x + 1) % messages.length), 2600)
    return () => clearInterval(t)
  }, [messages.length])
  const width = Math.max(...messages.map((m) => m.length))
  const { dots, w, h } = dotMatrix(messages[i].padEnd(width, ' '), '#e85a2a', '#2a1a14')
  return (
    <span className="relative flex items-center h-9 w-[140px] px-2 bg-[#07090a] border-2 border-black rounded-md shadow-[inset_0_0_0_3px_#1b1e20] overflow-hidden" aria-hidden="true">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-5 w-auto">{dots}</svg>
      <i className="absolute top-1 right-1.5 w-[5px] h-[5px] rounded-full bg-[#e85a2a] animate-[ledrec_1.4s_steps(1)_infinite] motion-reduce:animate-none" />
    </span>
  )
}

const SEG: Record<string, string> = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcfgd' }
const SG: Record<string, number[]> = { a: [4, 0, 24, 5], b: [28, 4, 5, 26], c: [28, 34, 5, 26], d: [4, 59, 24, 5], e: [0, 34, 5, 26], f: [0, 4, 5, 26], g: [4, 30, 24, 5] }

/** Reloj de CDMX en dígitos de 7 segmentos. */
export function CdmxClock() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    const tick = () => setNow(new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' })))
    tick()
    const t = setInterval(tick, 20000)
    return () => clearInterval(t)
  }, [])
  const hhmm = now ? `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}` : '8888'
  const rects: React.ReactNode[] = []
  let cx = 0
  ;[...hhmm].forEach((ch, i) => {
    if (i === 2) {
      rects.push(<rect key="c1" x={cx + 2} y={18} width={6} height={6} fill="#e85a2a" />, <rect key="c2" x={cx + 2} y={40} width={6} height={6} fill="#e85a2a" />)
      cx += 16
    }
    for (const [k, [a, b, c, d]] of Object.entries(SG))
      rects.push(<rect key={`${i}${k}`} x={cx + a} y={b} width={c} height={d} rx={2} fill={now && SEG[ch].includes(k) ? '#f4f4f0' : '#22262a'} />)
    cx += 42
  })
  return (
    <span className="flex items-end gap-4">
      <svg viewBox="0 0 230 64" className="h-8 w-auto" role="img" aria-label={now ? `Hora en CDMX ${hhmm.slice(0, 2)}:${hhmm.slice(2)}` : 'Hora en CDMX'}>{rects}</svg>
      <span className="flex flex-col gap-1 text-[9px] tracking-[0.2em] uppercase text-[#eceeea]/50">
        <span>CDMX</span>
        <span>{now ? now.toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' }) : '—'}</span>
      </span>
    </span>
  )
}
