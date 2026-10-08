'use client'

import React, { useEffect, useRef, useState } from 'react'

import { track } from '@/lib/analytics'

/**
 * LEAD·BOY: minijuego de /about. Atrapa leads con el embudo, evita bots.
 * 5 MQL = 1 SQL, 3 SQL = 1 venta; cada venta acelera el juego. Récord en el navegador del visitante.
 */
const W = 480
const H = 360
const HI_KEY = 'sr_leadboy_hi'

type Item = { x: number; y: number; k: 'lead' | 'bot' | 'gold'; v: number; done?: boolean }
type State = { on: boolean; px: number; items: Item[]; t: number; spd: number; mql: number; sql: number; won: number; lives: number; flash: number; msg: string }

const readHi = () => {
  try {
    return Number(localStorage.getItem(HI_KEY) || 0)
  } catch {
    return 0
  }
}
const saveHi = (n: number) => {
  try {
    localStorage.setItem(HI_KEY, String(n))
  } catch {
    /* sin almacenamiento: el récord solo dura la visita */
  }
}

export function LeadBoy() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const st = useRef<State | null>(null)
  const keys = useRef({ L: false, R: false })
  const touchX = useRef<number | null>(null)
  const [hi, setHi] = useState(0)

  const score = (s: State) => s.won * 100 + s.sql * 20 + s.mql * 3
  const start = () => {
    st.current = { on: true, px: W / 2, items: [], t: 0, spd: 1.6, mql: 0, sql: 0, won: 0, lives: 3, flash: 0, msg: '' }
    track('game_start', { game: 'lead_boy' })
    canvas.current?.focus()
  }

  useEffect(() => {
    setHi(readHi())
    const c = canvas.current!
    const x = c.getContext('2d')!
    const font = getComputedStyle(document.body).fontFamily || 'monospace'
    let raf = 0

    const end = (s: State) => {
      s.on = false
      const sc = score(s)
      track('game_over', { game: 'lead_boy', score: sc, sales: s.won })
      if (sc > readHi()) {
        saveHi(sc)
        setHi(sc)
      }
    }

    const step = () => {
      const s = st.current
      if (!s || !s.on) return
      s.t++
      if (keys.current.L) s.px -= 6
      if (keys.current.R) s.px += 6
      if (touchX.current !== null) s.px += (touchX.current - s.px) * 0.25
      s.px = Math.max(40, Math.min(W - 40, s.px))
      if (s.t % Math.max(14, 40 - s.won * 4) === 0) {
        const r = Math.random()
        s.items.push({ x: 20 + Math.random() * (W - 40), y: -10, k: r < 0.68 ? 'lead' : r < 0.88 ? 'bot' : 'gold', v: s.spd * (0.8 + Math.random() * 0.5) })
      }
      for (const it of s.items) {
        it.y += it.v
        if (!it.done && it.y > H - 46 && it.y < H - 24 && Math.abs(it.x - s.px) < 42) {
          it.done = true
          if (it.k === 'bot') {
            s.lives--
            s.flash = 12
            s.msg = 'BOT ✕'
            if (s.lives <= 0) end(s)
          } else {
            s.mql += it.k === 'gold' ? 3 : 1
            s.msg = it.k === 'gold' ? '+3 MQL' : '+1 MQL'
            while (s.mql >= 5) { s.mql -= 5; s.sql++; s.msg = 'SQL ▲' }
            while (s.sql >= 3) { s.sql -= 3; s.won++; s.spd += 0.35; s.msg = '¡VENTA!'; s.flash = -14 }
          }
        }
      }
      s.items = s.items.filter((i) => !i.done && i.y < H + 12)
      if (s.flash > 0) s.flash--
      if (s.flash < 0) s.flash++
    }

    const draw = () => {
      const s = st.current
      x.fillStyle = '#0b0d0c'
      x.fillRect(0, 0, W, H)
      x.strokeStyle = '#14201a'
      for (let i = 0; i < W; i += 24) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke() }
      x.font = `14px ${font}`
      x.textAlign = 'left'
      if (!s) {
        x.textAlign = 'center'
        x.fillStyle = '#3ddc84'
        x.fillText('LEAD·BOY', W / 2, H / 2 - 20)
        x.fillStyle = '#6c7'
        x.font = `12px ${font}`
        x.fillText('PRESIONA START', W / 2, H / 2 + 8)
        return
      }
      x.fillStyle = '#3ddc84'
      x.fillText(`MQL ${s.mql}/5   SQL ${s.sql}/3   VENTAS ${s.won}`, 12, 22)
      x.textAlign = 'right'
      x.fillStyle = '#e85a2a'
      x.fillText('♥'.repeat(Math.max(0, s.lives)), W - 12, 22)
      x.textAlign = 'left'
      for (const it of s.items) {
        if (it.k === 'lead') {
          x.fillStyle = '#3ddc84'; x.beginPath(); x.arc(it.x, it.y, 7, 0, 7); x.fill()
        } else if (it.k === 'gold') {
          x.fillStyle = '#f2c14e'; x.beginPath(); x.arc(it.x, it.y, 9, 0, 7); x.fill()
          x.fillStyle = '#0b0d0c'; x.font = `10px ${font}`; x.fillText('★', it.x - 5, it.y + 4)
        } else {
          x.strokeStyle = '#e85a2a'; x.lineWidth = 3; x.beginPath()
          x.moveTo(it.x - 7, it.y - 7); x.lineTo(it.x + 7, it.y + 7); x.moveTo(it.x + 7, it.y - 7); x.lineTo(it.x - 7, it.y + 7)
          x.stroke(); x.lineWidth = 1
        }
      }
      x.fillStyle = s.flash > 0 ? '#e85a2a' : s.flash < 0 ? '#f2c14e' : '#cfd'
      x.beginPath()
      x.moveTo(s.px - 42, H - 44); x.lineTo(s.px + 42, H - 44); x.lineTo(s.px + 12, H - 22)
      x.lineTo(s.px + 12, H - 10); x.lineTo(s.px - 12, H - 10); x.lineTo(s.px - 12, H - 22)
      x.closePath(); x.fill()
      if (s.msg) {
        x.fillStyle = '#f2c14e'; x.font = `12px ${font}`; x.textAlign = 'center'; x.fillText(s.msg, s.px, H - 52); x.textAlign = 'left'
      }
      if (!s.on) {
        x.fillStyle = 'rgba(0,0,0,.7)'; x.fillRect(0, 0, W, H); x.textAlign = 'center'
        x.fillStyle = '#e85a2a'; x.font = `22px ${font}`; x.fillText('FIN DEL TRIMESTRE', W / 2, H / 2 - 16)
        x.fillStyle = '#cfd'; x.font = `13px ${font}`; x.fillText(`${s.won} ventas · ${score(s)} puntos`, W / 2, H / 2 + 10)
        x.fillStyle = '#6c7'; x.fillText('START para otro trimestre', W / 2, H / 2 + 34)
        x.textAlign = 'left'
      }
    }

    const loop = () => { step(); draw(); raf = requestAnimationFrame(loop) }
    loop()

    // Las flechas solo se capturan mientras hay partida, para no bloquear el scroll de la página
    const down = (e: KeyboardEvent) => {
      if (!st.current?.on) return
      if (e.key === 'ArrowLeft') { keys.current.L = true; e.preventDefault() }
      if (e.key === 'ArrowRight') { keys.current.R = true; e.preventDefault() }
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keys.current.L = false
      if (e.key === 'ArrowRight') keys.current.R = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const hold = (k: 'L' | 'R') => ({
    onPointerDown: () => { keys.current[k] = true },
    onPointerUp: () => { keys.current[k] = false },
    onPointerLeave: () => { keys.current[k] = false },
  })
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!e.buttons && e.pointerType !== 'touch') return
    const r = e.currentTarget.getBoundingClientRect()
    touchX.current = ((e.clientX - r.left) / r.width) * W
  }
  const key = 'w-14 h-14 border-2 border-black rounded-[10px] bg-[#26292b] text-[#e8e8e4] text-xl shadow-[0_5px_0_0_#000] active:translate-y-1 active:shadow-[0_1px_0_0_#000] select-none touch-none'

  return (
    <div className="bg-[#e9e6dc] border-2 border-black rounded-[26px] shadow-[8px_8px_0_0_#000] p-5 max-w-[520px] mx-auto">
      <div className="flex justify-between items-center font-mono text-[11px] uppercase tracking-widest mb-3">
        <span className="flex items-center gap-2">
          <i className="w-2.5 h-2.5 rounded-full bg-[#e85a2a] shadow-[0_0_6px_#e85a2a]" aria-hidden="true" />
          <b className="text-sm">LEAD·BOY</b>
        </span>
        <span>récord {hi}</span>
      </div>
      <canvas
        ref={canvas}
        width={W}
        height={H}
        tabIndex={0}
        aria-label="Juego Lead Boy: mueve el embudo con las flechas o arrastrando para atrapar leads y evitar bots"
        className="block w-full aspect-[4/3] bg-[#0b0d0c] border-2 border-black rounded-[10px] touch-none outline-none focus-visible:ring-2 focus-visible:ring-[#e85a2a]"
        onPointerMove={move}
        onPointerDown={move}
        onPointerUp={() => { touchX.current = null }}
        onPointerLeave={() => { touchX.current = null }}
      />
      <div className="flex justify-between items-center mt-4 gap-3">
        <div className="flex gap-2">
          <button type="button" className={key} aria-label="Izquierda" {...hold('L')}>◀</button>
          <button type="button" className={key} aria-label="Derecha" {...hold('R')}>▶</button>
        </div>
        <button
          type="button"
          onClick={start}
          className="h-14 px-6 border-2 border-black rounded-[10px] bg-[#e85a2a] text-white font-mono text-xs uppercase tracking-widest shadow-[0_5px_0_0_#000] active:translate-y-1 active:shadow-[0_1px_0_0_#000]"
        >
          Start
        </button>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-black/60 mt-3 text-center leading-relaxed">
        Atrapa leads ● · evita bots ✕ · 5 MQL = 1 SQL · 3 SQL = venta
      </p>
    </div>
  )
}
