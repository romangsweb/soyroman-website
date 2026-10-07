/**
 * Portada tipo pantalla del blog: fondo negro, iconos tenues, números de 7 segmentos
 * y una escena de pixeles animada según el tema del artículo. Se genera como SVG
 * (cadena) para poder usarla en la página y en imágenes fijas.
 */

const P = {
  or: '#e85a2a', red: '#ff4a3d', blue: '#3a7bfd', cream: '#f2e6d0', white: '#f4f4f0',
  teal: '#2ec4b6', yel: '#ffc93c', pink: '#ff6f91', dim: '#2a1512', dim2: '#141c2c',
}
const W = 640
const H = 360
const FONT = 'font-family:var(--font-aldrich),ui-monospace,monospace'

export const SCREEN_CODES: Record<string, string> = {
  'generacion-demanda': 'DEM', 'crm-revops': 'CRM', 'seo-aeo': 'SEO', 'paid-media': 'ADS', 'contenido-email': 'TXT',
  analitica: 'KPI', 'sitios-web': 'WEB', liderazgo: 'EQP', 'ia-aplicada': 'IA',
}
const KEYS = Object.keys(SCREEN_CODES)

function rng(seed: string) {
  let h = 2166136261
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Map = Record<string, string>
function sprite(rows: string[], x: number, y: number, map: Map, px: number) {
  let s = `<g transform="translate(${x},${y})">`
  rows.forEach((r, j) => [...r].forEach((ch, i) => {
    if (ch !== '.' && map[ch]) s += `<rect x="${i * px}" y="${j * px}" width="${px}" height="${px}" fill="${map[ch]}"/>`
  }))
  return s + '</g>'
}
const PERSON = ['..a..', '.aaa.', '..a..', '.bbb.', 'b.b.b', '..b..', '.b.b.']
const PERSON2 = ['..a..', '.aaa.', '..a..', '.bbb.', 'b.b.b', '..b..', 'b...b']
const COIN = ['.aaa.', 'aabaa', 'abbba', 'aabaa', '.aaa.']
const ENV = ['aaaaaaa', 'abaaaba', 'aabbbaa', 'aaaaaaa', 'aaaaaaa']
const CARD = ['aaaaaa', 'abbbba', 'aaaaaa', 'abbaaa', 'aaaaaa']
const BOT = ['.a...a.', '.aaaaa.', 'aabaaba', 'aaaaaaa', '.accca.', '.aaaaa.', '.a...a.']
const ARROW = ['a.....', 'aa....', 'aba...', 'abba..', 'abbba.', 'abbbba', 'aaaba.', '...aa.']
const MEGA = ['....aa', '..aaaa', 'aaaaaa', 'aaaaaa', '..aaaa', '....aa']

const SEG: Record<string, string> = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcfgd' }
const SEGS: Record<string, number[]> = { a: [4, 0, 24, 5], b: [28, 4, 5, 26], c: [28, 34, 5, 26], d: [4, 59, 24, 5], e: [0, 34, 5, 26], f: [0, 4, 5, 26], g: [4, 30, 24, 5] }
function seg7(str: string, x: number, y: number, s: number) {
  let o = `<g transform="translate(${x},${y}) scale(${s})">`
  let cx = 0
  for (const ch of str) {
    if (ch === '.') { o += `<rect x="${cx - 6}" y="58" width="6" height="6" fill="${P.white}"/>`; continue }
    const on = SEG[ch] || ''
    for (const [k, [a, b, c, d]] of Object.entries(SEGS)) o += `<rect x="${cx + a}" y="${b}" width="${c}" height="${d}" rx="2" fill="${on.includes(k) ? P.white : '#2a2e33'}"/>`
    cx += 42
  }
  return o + '</g>'
}

function background(r: () => number) {
  let s = `<rect width="${W}" height="${H}" fill="#050607"/>`
  for (let i = 0; i < 34; i++) {
    const x = Math.floor(r() * 20) * 32 + 8, y = Math.floor(r() * 11) * 32 + 8, k = r()
    s += k < 0.5 ? `<rect x="${x}" y="${y}" width="16" height="16" rx="2" fill="${P.dim}"/>`
      : k < 0.8 ? `<rect x="${x}" y="${y}" width="22" height="8" fill="${P.dim2}"/>`
        : `<circle cx="${x + 8}" cy="${y + 8}" r="7" fill="${P.dim}"/>`
  }
  return s
}

function hud(code: string, num: string) {
  return `<rect x="22" y="22" width="30" height="14" rx="2" fill="${P.red}"/>
<rect x="22" y="300" width="${code.length * 12 + 22}" height="24" fill="${P.white}"/><text x="32" y="317" font-size="14" fill="#111" style="${FONT}">${code}</text>
<g transform="translate(588,26)"><circle cx="0" cy="0" r="9" fill="none" stroke="${P.red}" stroke-width="3"/><circle cx="12" cy="0" r="9" fill="none" stroke="${P.blue}" stroke-width="3"/></g>
<text x="566" y="50" font-size="8" fill="${P.white}" letter-spacing="1" style="${FONT}">STEREO</text>
<rect x="232" y="22" width="34" height="22" rx="3" fill="none" stroke="${P.red}" stroke-width="2"/><text x="237" y="38" font-size="11" fill="${P.white}" style="${FONT}">MIN</text>
${seg7(num, 276, 18, 0.62)}
<g transform="translate(596,290)">${[0, 1, 2, 3].map((i) => `<rect x="0" y="${i * 9}" width="6" height="6" fill="${i < 2 ? P.red : P.blue}"/><rect x="9" y="${i * 9}" width="6" height="6" fill="${i < 1 ? P.red : P.blue}"/>`).join('')}</g>`
}

// Animaciones con prefijo sc- para no chocar con otras del sitio. --sc controla la velocidad.
const STYLE = `<style>
@keyframes sc-walk{from{transform:translateX(0)}to{transform:translateX(370px)}}
@keyframes sc-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes sc-drop{0%{transform:translateY(-40px);opacity:0}20%{opacity:1}100%{transform:translateY(60px);opacity:0}}
@keyframes sc-belt{from{transform:translateX(-80px)}to{transform:translateX(420px)}}
@keyframes sc-sweep{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes sc-blink{0%,100%{opacity:1}50%{opacity:.15}}
@keyframes sc-pulse{0%{transform:scale(.4);opacity:.9}100%{transform:scale(2.6);opacity:0}}
@keyframes sc-fly{0%{transform:translate(0,0);opacity:0}15%{opacity:1}100%{transform:translate(300px,-90px);opacity:0}}
@keyframes sc-draw{from{stroke-dashoffset:900}to{stroke-dashoffset:0}}
@keyframes sc-type{from{width:0}to{width:var(--w)}}
@keyframes sc-pass{0%,100%{transform:translateX(0)}50%{transform:translateX(66px)}}
@keyframes sc-spark{0%,100%{opacity:0}50%{opacity:1}}
@keyframes sc-click{0%,60%,100%{transform:translate(0,0)}70%{transform:translate(2px,2px)}}
@keyframes sc-fill{0%,40%{fill:#2a2e33}55%,100%{fill:#e85a2a}}
.sc-still *{animation:none!important}
@media (prefers-reduced-motion: reduce){.sc *{animation:none!important}}
</style>`
const a = (name: string, dur: number, delay = 0, extra = '') =>
  `animation:sc-${name} calc(${dur}s * var(--sc,1)) linear calc(${delay}s * var(--sc,1)) infinite;${extra}`

const SCENES: Record<string, (r: () => number) => string> = {
  'generacion-demanda': () => {
    let s = ''
    const cols = [P.cream, P.blue, P.pink, P.teal, P.yel]
    for (let i = 0; i < 5; i++) s += `<g style="${a('walk', 6, -i * 1.2)}">${sprite(i % 2 ? PERSON : PERSON2, -40, 175, { a: cols[i], b: cols[i] }, 8)}</g>`
    s += `<polygon points="330,150 430,150 395,210 395,250 365,250 365,210" fill="none" stroke="${P.white}" stroke-width="5"/>`
    for (let i = 0; i < 3; i++) s += `<g style="${a('drop', 2.4, -i * 0.8)}">${sprite(COIN, 368, 240, { a: P.or, b: P.yel }, 5)}</g>`
    return s + `<rect x="440" y="250" width="140" height="10" fill="#2a2e33"/><rect x="440" y="250" width="96" height="10" fill="${P.or}"/><text x="440" y="244" font-size="10" fill="${P.white}" style="${FONT}">PIPELINE</text>`
  },
  'crm-revops': () => {
    let s = `<rect x="60" y="230" width="520" height="12" fill="#2a2e33"/>`
    for (let i = 0; i < 9; i++) s += `<circle cx="${80 + i * 60}" cy="236" r="5" fill="#3a3f45"/>`
    for (let i = 0; i < 5; i++) s += `<g style="${a('belt', 7, -i * 1.4)}">${sprite(CARD, 60, 184, { a: i === 3 ? P.red : P.cream, b: '#111' }, 8)}</g>`
    s += `<rect x="330" y="110" width="60" height="60" fill="none" stroke="${P.blue}" stroke-width="4"/><rect x="354" y="170" width="12" height="40" fill="${P.blue}"/>`
    ;['MQL', 'SQL', 'OPP', 'WON'].forEach((t, i) => {
      s += `<rect x="${110 + i * 110}" y="80" width="90" height="16" fill="#2a2e33" style="${a('fill', 4, i * 0.6)}"/><text x="${110 + i * 110}" y="74" font-size="10" fill="${P.white}" style="${FONT}">${t}</text>`
    })
    return s
  },
  'seo-aeo': (r) => {
    let s = `<g transform="translate(320,190)"><circle r="110" fill="none" stroke="#1f3a2f" stroke-width="2"/><circle r="70" fill="none" stroke="#1f3a2f" stroke-width="2"/><circle r="30" fill="none" stroke="#1f3a2f" stroke-width="2"/>`
    s += `<g style="${a('sweep', 4)}transform-origin:0 0"><path d="M0 0 L110 0 A110 110 0 0 0 95 -55 Z" fill="${P.teal}" opacity=".35"/><line x1="0" y1="0" x2="110" y2="0" stroke="${P.teal}" stroke-width="3"/></g>`
    for (let i = 0; i < 7; i++) {
      const ang = r() * 6.28, d = 30 + r() * 75
      s += `<rect x="${(Math.cos(ang) * d - 4).toFixed(1)}" y="${(Math.sin(ang) * d - 4).toFixed(1)}" width="8" height="8" fill="${i < 2 ? P.or : P.white}" style="${a('blink', 2, -r() * 2)}"/>`
    }
    return s + '</g>'
  },
  'paid-media': (r) => {
    let s = sprite(MEGA, 150, 160, { a: P.or }, 10)
    for (let i = 0; i < 3; i++) s += `<circle cx="230" cy="190" r="30" fill="none" stroke="${P.yel}" stroke-width="4" style="${a('pulse', 2.4, -i * 0.8)}transform-origin:230px 190px"/>`
    for (let i = 0; i < 7; i++) {
      const h = 20 + Math.floor(r() * 90)
      s += `<rect x="${380 + i * 26}" y="${250 - h}" width="16" height="${h}" fill="${i === 6 ? P.or : P.blue}" style="${a('blink', 1.5 + r(), -r())}"/>`
    }
    return s
  },
  'contenido-email': () => {
    let s = ''
    ;[180, 150, 200, 120].forEach((w, i) => { s += `<rect x="70" y="${110 + i * 26}" height="10" width="${w}" fill="${P.cream}" style="--w:${w}px;${a('type', 3, i * 0.5)}"/>` })
    s += `<rect x="70" y="230" width="10" height="16" fill="${P.or}" style="${a('blink', 1)}"/>`
    for (let i = 0; i < 3; i++) s += `<g style="${a('fly', 3.6, -i * 1.2)}">${sprite(ENV, 280, 230, { a: P.white, b: P.red }, 9)}</g>`
    return s
  },
  analitica: (r) => {
    let s = ''
    for (let x = 60; x <= 580; x += 40) s += `<line x1="${x}" y1="80" x2="${x}" y2="270" stroke="#15181b"/>`
    for (let y = 80; y <= 270; y += 38) s += `<line x1="60" y1="${y}" x2="580" y2="${y}" stroke="#15181b"/>`
    let d = 'M60 250', y = 250
    for (let x = 100; x <= 580; x += 40) { y = Math.max(90, y - 10 - r() * 28 + 8); d += ` L${x} ${y.toFixed(0)}` }
    return s + `<path d="${d}" fill="none" stroke="${P.teal}" stroke-width="5" stroke-dasharray="900" style="${a('draw', 5)}"/><circle cx="580" cy="${y.toFixed(0)}" r="8" fill="${P.or}" style="${a('blink', 1.2)}"/>`
  },
  'sitios-web': () => {
    let s = `<rect x="150" y="80" width="340" height="200" fill="none" stroke="${P.white}" stroke-width="4"/><rect x="150" y="80" width="340" height="22" fill="${P.white}"/>`
    ;[P.red, P.yel, P.teal].forEach((c, i) => { s += `<circle cx="${166 + i * 16}" cy="91" r="5" fill="${c}"/>` })
    s += `<rect x="180" y="125" width="160" height="12" fill="${P.cream}"/><rect x="180" y="148" width="120" height="8" fill="#3a3f45"/><rect x="180" y="165" width="140" height="8" fill="#3a3f45"/>`
    s += `<rect x="180" y="210" width="110" height="34" fill="#2a2e33" style="${a('fill', 3)}"/><text x="196" y="232" font-size="13" fill="${P.white}" style="${FONT}">DEMO ▸</text>`
    s += `<g style="${a('click', 3)}">${sprite(ARROW, 262, 228, { a: '#111', b: P.white }, 4)}</g>`
    return s + `<rect x="370" y="125" width="90" height="120" fill="${P.blue}" opacity=".85"/>`
  },
  liderazgo: () => {
    let s = ''
    ;[P.cream, P.blue, P.pink, P.teal].forEach((c, i) => { s += `<g style="${a('bob', 1.2, -i * 0.3)}">${sprite(PERSON, 140 + i * 95, 150, { a: c, b: c }, 10)}</g>` })
    return s + `<g style="${a('pass', 2.4)}">${sprite(COIN, 190, 118, { a: P.or, b: P.yel }, 6)}</g><rect x="140" y="230" width="360" height="6" fill="#2a2e33"/>`
  },
  'ia-aplicada': () => {
    let s = sprite(BOT, 250, 120, { a: P.white, b: P.or, c: P.blue }, 17)
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * 6.28
      s += `<rect x="${(309 + Math.cos(ang) * 95).toFixed(1)}" y="${(179 + Math.sin(ang) * 80).toFixed(1)}" width="8" height="8" fill="${i % 3 === 0 ? P.or : P.teal}" style="${a('spark', 1.6, -i * 0.2)}"/>`
    }
    return s
  },
}

export type ScreenOptions = { slug: string; category?: string | null; minutes?: number | null; title?: string }

export function screenSvg({ slug, category, minutes, title }: ScreenOptions) {
  const r = rng(slug || 'soyroman')
  const key = category && SCENES[category] ? category : KEYS[Math.floor(r() * KEYS.length)]
  const m = minutes && minutes > 0 ? Math.min(99, Math.round(minutes)) : 4 + Math.floor(r() * 9)
  const num = `${m}.${Math.floor(r() * 10)}`
  const label = title ? title.replace(/[<&"]/g, '') : key
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid slice">${STYLE}${background(r)}${SCENES[key](r)}${hud(SCREEN_CODES[key], num)}</svg>`
}
