'use client'

import React, { useEffect, useRef } from 'react'

export type Wave = { freq: number; amp: number; noise: number; harm: number[] }

/** Osciloscopio en canvas. Lee los parámetros en cada cuadro, así que cambian sin reiniciar la animación. */
export function Scope({ wave }: { wave: Wave }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const params = useRef(wave)
  params.current = wave

  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let t = 0
    let raf = 0
    const frame = () => {
      const r = c.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      if (c.width !== Math.round(r.width * dpr)) {
        c.width = Math.round(r.width * dpr)
        c.height = Math.round(r.height * dpr)
      }
      const W = c.width, H = c.height, p = params.current
      ctx.clearRect(0, 0, W, H)
      ctx.strokeStyle = 'rgba(255,255,255,.06)'
      ctx.lineWidth = 1
      for (let x = 0; x < W; x += 24 * dpr) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
      for (let y = 0; y < H; y += 24 * dpr) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
      const draw = (color: string, width: number) => {
        ctx.strokeStyle = color
        ctx.lineWidth = width * dpr
        ctx.beginPath()
        for (let x = 0; x <= W; x += 2 * dpr) {
          const k = x / W
          let y = 0
          p.harm.forEach((a, i) => { y += a * Math.sin(k * p.freq * (i + 1) * Math.PI * 2 + t * (1 + i * 0.3)) })
          y += (Math.random() - 0.5) * p.noise
          const yy = H * 0.58 + y * H * 0.16 * p.amp
          if (x) ctx.lineTo(x, yy)
          else ctx.moveTo(x, yy)
        }
        ctx.stroke()
      }
      draw('rgba(232,90,42,.25)', 6)
      draw('#e85a2a', 2)
      if (!reduce) t += 0.04
      raf = requestAnimationFrame(frame)
    }
    frame()
    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas ref={canvas} aria-hidden="true" />
}
