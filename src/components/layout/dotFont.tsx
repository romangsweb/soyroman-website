import React from 'react'

/** Fuente de matriz de puntos 5×7 (mayúsculas, dígitos y signos básicos). */
const F: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'], B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'], D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'], G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'], K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'], N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'], R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'], T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'], Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '·': ['00000', '00000', '00000', '00100', '00000', '00000', '00000'], ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
}

export function dotMatrix(text: string, on: string, off: string, cell = 4) {
  const dots: React.ReactNode[] = []
  let x = 0
  for (const ch of text.toUpperCase()) {
    const g = F[ch] || F[' ']
    g.forEach((row, j) =>
      [...row].forEach((b, i) =>
        dots.push(<circle key={`${x}-${j}-${i}`} cx={x + i * cell + cell / 2} cy={j * cell + cell / 2} r={cell * 0.38} fill={b === '1' ? on : off} />),
      ),
    )
    x += 6 * cell
  }
  return { dots, w: Math.max(cell, x - cell), h: 7 * cell }
}

/** La misma matriz como texto SVG, para servirla como archivo estático (no infla el HTML de cada página). */
export function dotMatrixSvg(text: string, on: string, off: string, cell = 4) {
  const parts: string[] = []
  const r = +(cell * 0.38).toFixed(2)
  let x = 0
  for (const ch of text.toUpperCase()) {
    const g = F[ch] || F[' ']
    g.forEach((row, j) =>
      [...row].forEach((b, i) => parts.push(`<circle cx="${x + i * cell + cell / 2}" cy="${j * cell + cell / 2}" r="${r}" fill="${b === '1' ? on : off}"/>`)),
    )
    x += 6 * cell
  }
  const w = Math.max(cell, x - cell)
  const h = 7 * cell
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${parts.join('')}</svg>`
}
