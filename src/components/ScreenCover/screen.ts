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

function hud(code: string, num: string, unit = 'MIN') {
  return `<rect x="22" y="22" width="30" height="14" rx="2" fill="${P.red}"/>
<rect x="22" y="300" width="${code.length * 12 + 22}" height="24" fill="${P.white}"/><text x="32" y="317" font-size="14" fill="#111" style="${FONT}">${code}</text>
<g transform="translate(588,26)"><circle cx="0" cy="0" r="9" fill="none" stroke="${P.red}" stroke-width="3"/><circle cx="12" cy="0" r="9" fill="none" stroke="${P.blue}" stroke-width="3"/></g>
<text x="566" y="50" font-size="8" fill="${P.white}" letter-spacing="1" style="${FONT}">STEREO</text>
<rect x="232" y="22" width="34" height="22" rx="3" fill="none" stroke="${P.red}" stroke-width="2"/><text x="249" y="38" font-size="11" fill="${P.white}" text-anchor="middle" style="${FONT}">${unit}</text>
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
@keyframes sc-rise{0%{transform:translateY(40px);opacity:0}20%{opacity:1}100%{transform:translateY(-60px);opacity:0}}
@keyframes sc-scroll{from{transform:translateY(0)}to{transform:translateY(-120px)}}
@keyframes sc-slide{0%,100%{transform:translateX(0)}50%{transform:translateX(var(--w))}}
@keyframes sc-fill{0%,40%{fill:#2a2e33}55%,100%{fill:#e85a2a}}
.sc-still *{animation:none!important}
@media (prefers-reduced-motion: reduce){.sc *{animation:none!important}}
</style>`
// Modo fijo (imagen para redes): sin CSS, cada elemento queda "congelado" en su fase.
let STILL = false
type AOpts = { origin?: [number, number]; w?: number; fill?: string }
const a = (name: string, dur: number, delay = 0, o: AOpts = {}) => {
  if (!STILL) {
    const origin = o.origin ? `transform-origin:${o.origin[0]}px ${o.origin[1]}px;` : name === 'sweep' ? 'transform-origin:0 0;' : ''
    const w = o.w ? `--w:${o.w}px;` : ''
    return ` style="${w}${origin}animation:sc-${name} calc(${dur}s * var(--sc,1)) linear calc(${delay}s * var(--sc,1)) infinite"`
  }
  const p = ((((-delay / dur) + 0.35) % 1) + 1) % 1
  const [ox, oy] = o.origin || [0, 0]
  switch (name) {
    case 'walk': return ` transform="translate(${(370 * p).toFixed(1)} 0)"`
    case 'belt': return ` transform="translate(${(-80 + 500 * p).toFixed(1)} 0)"`
    case 'drop': return ` transform="translate(0 ${(-40 + 100 * p).toFixed(1)})" opacity="${p < 0.2 ? (p / 0.2).toFixed(2) : (1 - p).toFixed(2)}"`
    case 'fly': return ` transform="translate(${(300 * p).toFixed(1)} ${(-90 * p).toFixed(1)})" opacity="${(1 - p).toFixed(2)}"`
    case 'pass': return ` transform="translate(${(66 * (1 - Math.abs(2 * p - 1))).toFixed(1)} 0)"`
    case 'sweep': return ` transform="rotate(${(360 * p).toFixed(0)})"`
    case 'pulse': return ` transform="translate(${ox} ${oy}) scale(${(0.4 + 2.2 * p).toFixed(2)}) translate(${-ox} ${-oy})" opacity="${(0.9 * (1 - p)).toFixed(2)}"`
    case 'fill': return p > 0.5 ? ` fill="${P.or}"` : ''
    case 'rise': return ` transform="translate(0 ${(40 - 100 * p).toFixed(1)})" opacity="${p < 0.2 ? (p / 0.2).toFixed(2) : (1 - p).toFixed(2)}"`
    case 'scroll': return ` transform="translate(0 ${(-120 * p).toFixed(1)})"`
    case 'slide': return ` transform="translate(${((o.w || 0) * (1 - Math.abs(2 * p - 1))).toFixed(1)} 0)"`
    default: return ''
  }
}

const SCENES: Record<string, (r: () => number) => string> = {
  'generacion-demanda': () => {
    let s = ''
    const cols = [P.cream, P.blue, P.pink, P.teal, P.yel]
    for (let i = 0; i < 5; i++) s += `<g ${a('walk', 6, -i * 1.2)}>${sprite(i % 2 ? PERSON : PERSON2, -40, 175, { a: cols[i], b: cols[i] }, 8)}</g>`
    s += `<polygon points="330,150 430,150 395,210 395,250 365,250 365,210" fill="none" stroke="${P.white}" stroke-width="5"/>`
    for (let i = 0; i < 3; i++) s += `<g ${a('drop', 2.4, -i * 0.8)}>${sprite(COIN, 368, 240, { a: P.or, b: P.yel }, 5)}</g>`
    return s + `<rect x="440" y="250" width="140" height="10" fill="#2a2e33"/><rect x="440" y="250" width="96" height="10" fill="${P.or}"/><text x="440" y="244" font-size="10" fill="${P.white}" style="${FONT}">PIPELINE</text>`
  },
  'crm-revops': () => {
    let s = `<rect x="60" y="230" width="520" height="12" fill="#2a2e33"/>`
    for (let i = 0; i < 9; i++) s += `<circle cx="${80 + i * 60}" cy="236" r="5" fill="#3a3f45"/>`
    for (let i = 0; i < 5; i++) s += `<g ${a('belt', 7, -i * 1.4)}>${sprite(CARD, 60, 184, { a: i === 3 ? P.red : P.cream, b: '#111' }, 8)}</g>`
    s += `<rect x="330" y="110" width="60" height="60" fill="none" stroke="${P.blue}" stroke-width="4"/><rect x="354" y="170" width="12" height="40" fill="${P.blue}"/>`
    ;['MQL', 'SQL', 'OPP', 'WON'].forEach((t, i) => {
      s += `<rect x="${110 + i * 110}" y="80" width="90" height="16" ${a('fill', 4, i * 0.6) || ' fill="#2a2e33"'}/><text x="${110 + i * 110}" y="74" font-size="10" fill="${P.white}" style="${FONT}">${t}</text>`
    })
    return s
  },
  'seo-aeo': (r) => {
    let s = `<g transform="translate(320,190)"><circle r="110" fill="none" stroke="#1f3a2f" stroke-width="2"/><circle r="70" fill="none" stroke="#1f3a2f" stroke-width="2"/><circle r="30" fill="none" stroke="#1f3a2f" stroke-width="2"/>`
    s += `<g ${a('sweep', 4)}><path d="M0 0 L110 0 A110 110 0 0 0 95 -55 Z" fill="${P.teal}" opacity=".35"/><line x1="0" y1="0" x2="110" y2="0" stroke="${P.teal}" stroke-width="3"/></g>`
    for (let i = 0; i < 7; i++) {
      const ang = r() * 6.28, d = 30 + r() * 75
      s += `<rect x="${(Math.cos(ang) * d - 4).toFixed(1)}" y="${(Math.sin(ang) * d - 4).toFixed(1)}" width="8" height="8" fill="${i < 2 ? P.or : P.white}" ${a('blink', 2, -r() * 2)}/>`
    }
    return s + '</g>'
  },
  'paid-media': (r) => {
    let s = sprite(MEGA, 150, 160, { a: P.or }, 10)
    for (let i = 0; i < 3; i++) s += `<circle cx="230" cy="190" r="30" fill="none" stroke="${P.yel}" stroke-width="4" ${a('pulse', 2.4, -i * 0.8, { origin: [230, 190] })}/>`
    for (let i = 0; i < 7; i++) {
      const h = 20 + Math.floor(r() * 90)
      s += `<rect x="${380 + i * 26}" y="${250 - h}" width="16" height="${h}" fill="${i === 6 ? P.or : P.blue}" ${a('blink', 1.5 + r(), -r())}/>`
    }
    return s
  },
  'contenido-email': () => {
    let s = ''
    ;[180, 150, 200, 120].forEach((w, i) => { s += `<rect x="70" y="${110 + i * 26}" height="10" width="${w}" fill="${P.cream}" ${a('type', 3, i * 0.5, { w })}/>` })
    s += `<rect x="70" y="230" width="10" height="16" fill="${P.or}" ${a('blink', 1)}/>`
    for (let i = 0; i < 3; i++) s += `<g ${a('fly', 3.6, -i * 1.2)}>${sprite(ENV, 280, 230, { a: P.white, b: P.red }, 9)}</g>`
    return s
  },
  analitica: (r) => {
    let s = ''
    for (let x = 60; x <= 580; x += 40) s += `<line x1="${x}" y1="80" x2="${x}" y2="270" stroke="#15181b"/>`
    for (let y = 80; y <= 270; y += 38) s += `<line x1="60" y1="${y}" x2="580" y2="${y}" stroke="#15181b"/>`
    let d = 'M60 250', y = 250
    for (let x = 100; x <= 580; x += 40) { y = Math.max(90, y - 10 - r() * 28 + 8); d += ` L${x} ${y.toFixed(0)}` }
    return s + `<path d="${d}" fill="none" stroke="${P.teal}" stroke-width="5" stroke-dasharray="900" ${a('draw', 5)}/><circle cx="580" cy="${y.toFixed(0)}" r="8" fill="${P.or}" ${a('blink', 1.2)}/>`
  },
  'sitios-web': () => {
    let s = `<rect x="150" y="80" width="340" height="200" fill="none" stroke="${P.white}" stroke-width="4"/><rect x="150" y="80" width="340" height="22" fill="${P.white}"/>`
    ;[P.red, P.yel, P.teal].forEach((c, i) => { s += `<circle cx="${166 + i * 16}" cy="91" r="5" fill="${c}"/>` })
    s += `<rect x="180" y="125" width="160" height="12" fill="${P.cream}"/><rect x="180" y="148" width="120" height="8" fill="#3a3f45"/><rect x="180" y="165" width="140" height="8" fill="#3a3f45"/>`
    s += `<rect x="180" y="210" width="110" height="34" ${a('fill', 3) || ' fill="#2a2e33"'}/><text x="196" y="232" font-size="13" fill="${P.white}" style="${FONT}">DEMO ▸</text>`
    s += `<g ${a('click', 3)}>${sprite(ARROW, 262, 228, { a: '#111', b: P.white }, 4)}</g>`
    return s + `<rect x="370" y="125" width="90" height="120" fill="${P.blue}" opacity=".85"/>`
  },
  liderazgo: () => {
    let s = ''
    ;[P.cream, P.blue, P.pink, P.teal].forEach((c, i) => { s += `<g ${a('bob', 1.2, -i * 0.3)}>${sprite(PERSON, 140 + i * 95, 150, { a: c, b: c }, 10)}</g>` })
    return s + `<g ${a('pass', 2.4)}>${sprite(COIN, 190, 118, { a: P.or, b: P.yel }, 6)}</g><rect x="140" y="230" width="360" height="6" fill="#2a2e33"/>`
  },
  'ia-aplicada': () => {
    let s = sprite(BOT, 250, 120, { a: P.white, b: P.or, c: P.blue }, 17)
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * 6.28
      s += `<rect x="${(309 + Math.cos(ang) * 95).toFixed(1)}" y="${(179 + Math.sin(ang) * 80).toFixed(1)}" width="8" height="8" fill="${i % 3 === 0 ? P.or : P.teal}" ${a('spark', 1.6, -i * 0.2)}/>`
    }
    return s
  },
}


// Variantes extra por tema (el slug elige cuál le toca a cada artículo)
const MAG = ['aa..aa', 'aa..aa', 'aa..aa', 'aa..aa', 'aaaaaa', '.aaaa.']
const GLASS = ['.aaa..', 'a...a.', 'a...a.', 'a...a.', '.aaa..', '....a.', '.....a']
const PENCIL = ['....bb', '...aab', '..aaa.', '.aaa..', 'caa...', 'cc....']
const EXTRA: Record<string, ((r: () => number) => string)[]> = {
  'generacion-demanda': [
    () => {
      let s = sprite(MAG, 470, 140, { a: P.or }, 12)
      for (let i = 0; i < 4; i++) s += `<g ${a('walk', 5, -i * 1.25)}>${sprite(i % 2 ? PERSON : PERSON2, 60, 170, { a: P.cream, b: [P.blue, P.teal, P.pink, P.yel][i] }, 7)}</g>`
      for (let i = 0; i < 3; i++) s += `<rect x="${440 - i * 18}" y="${150 + i * 22}" width="10" height="4" fill="${P.or}" ${a('blink', 1.2, -i * 0.3)}/>`
      return s
    },
    () => {
      let s = ''
      ;[9, 7, 5, 3, 1].forEach((n, row) => {
        for (let i = 0; i < n; i++) s += `<rect x="${320 - n * 14 + i * 28}" y="${90 + row * 34}" width="16" height="16" fill="${row === 4 ? P.or : [P.cream, P.blue, P.teal, P.pink][row]}" ${a('blink', 2 + row * 0.4, -i * 0.2)}/>`
      })
      for (let i = 0; i < 3; i++) s += `<g ${a('drop', 2.2, -i * 0.7)}><rect x="${300 + i * 12}" y="80" width="6" height="6" fill="${P.white}"/></g>`
      return s
    },
  ],
  'crm-revops': [
    () => {
      let s = ''
      ;['MQL', 'SQL', 'OPP', 'WON'].forEach((t, i) => {
        s += `<rect x="${90 + i * 120}" y="80" width="100" height="200" fill="none" stroke="#2a2e33" stroke-width="2"/><text x="${100 + i * 120}" y="74" font-size="11" fill="${P.white}" style="${FONT}">${t}</text>`
        for (let k = 0; k < 4 - i; k++) s += `<rect x="${100 + i * 120}" y="${92 + k * 34}" width="80" height="24" fill="${i === 3 ? P.or : P.cream}" opacity="${1 - k * 0.18}"/>`
      })
      return s + `<g ${a('slide', 3, 0, { w: 120 })}><rect x="100" y="240" width="80" height="24" fill="${P.blue}"/></g>`
    },
    () => {
      const gear = (cx: number, cy: number, rr: number, c: string, d: number) => {
        let g = `<g transform="translate(${cx},${cy})"><g ${a('sweep', d)}>`
        for (let i = 0; i < 8; i++) g += `<rect x="-6" y="${-rr - 10}" width="12" height="14" fill="${c}" transform="rotate(${i * 45})"/>`
        return g + `<circle r="${rr}" fill="${c}"/><circle r="${rr * 0.35}" fill="#050607"/></g></g>`
      }
      return gear(250, 180, 52, P.cream, 6) + gear(352, 152, 34, P.or, 4) + gear(380, 238, 24, P.blue, 3)
    },
  ],
  'seo-aeo': [
    () => {
      let s = ''
      for (let i = 0; i < 5; i++) {
        s += `<rect x="120" y="${90 + i * 38}" width="${i === 1 ? 300 : 260 - i * 20}" height="10" fill="${i === 1 ? P.or : P.cream}"/><rect x="120" y="${106 + i * 38}" width="${200 - i * 15}" height="6" fill="#3a3f45"/>`
      }
      return s + `<g ${a('slide', 4, 0, { w: 220 })}>${sprite(GLASS, 110, 110, { a: P.teal }, 9)}</g>`
    },
    () => {
      let s = `<rect x="90" y="80" width="300" height="70" rx="10" fill="#1d2a3a"/><rect x="250" y="170" width="300" height="100" rx="10" fill="#2a2e33"/>`
      ;[200, 240, 160].forEach((w, i) => { s += `<rect x="270" y="${190 + i * 22}" height="8" width="${w}" fill="${P.cream}" ${a('type', 3, i * 0.6, { w })}/>` })
      ;['1', '2', '3'].forEach((t, i) => { s += `<rect x="${270 + i * 46}" y="252" width="36" height="14" rx="3" fill="${i === 0 ? P.or : P.blue}" ${a('blink', 1.6, -i * 0.4)}/><text x="${282 + i * 46}" y="263" font-size="10" fill="${P.white}" style="${FONT}">${t}</text>` })
      return s + `<rect x="110" y="104" width="180" height="8" fill="${P.white}"/><rect x="110" y="122" width="120" height="8" fill="${P.white}"/>`
    },
  ],
  'paid-media': [
    (r) => {
      let s = ''
      for (let i = 0; i < 6; i++) {
        const h = 40 + Math.floor(r() * 110)
        s += `<rect x="${130 + i * 50}" y="${260 - h}" width="30" height="${h}" fill="${i === 3 ? P.or : P.blue}"/><rect x="${130 + i * 50}" y="${250 - h}" width="30" height="6" fill="${P.white}" ${a('blink', 1 + r(), -r())}/>`
      }
      return s + `<g ${a('drop', 2.4)}>${sprite(COIN, 285, 70, { a: P.or, b: P.yel }, 5)}</g>`
    },
    () => {
      let s = ''
      ;[90, 64, 38, 14].forEach((rr, i) => { s += `<circle cx="400" cy="180" r="${rr}" fill="${i % 2 ? '#050607' : P.red}" stroke="${P.white}" stroke-width="3"/>` })
      for (let i = 0; i < 2; i++) s += `<circle cx="400" cy="180" r="30" fill="none" stroke="${P.yel}" stroke-width="3" ${a('pulse', 2.2, -i * 1.1, { origin: [400, 180] })}/>`
      return s + `<g ${a('pass', 2.2)}><rect x="160" y="176" width="140" height="6" fill="${P.cream}"/><polygon points="300,170 318,179 300,188" fill="${P.or}"/></g>`
    },
  ],
  'contenido-email': [
    () => {
      let s = ''
      for (let i = 0; i < 5; i++) s += `<rect x="130" y="${85 + i * 40}" width="380" height="30" fill="${i === 1 ? '#2a1a14' : '#15181b'}"/><circle cx="148" cy="${100 + i * 40}" r="6" fill="${i === 1 ? P.or : '#3a3f45'}" ${i === 1 ? a('blink', 1.2) : ''}/><rect x="166" y="${96 + i * 40}" width="${220 - i * 20}" height="8" fill="${i === 1 ? P.white : '#3a3f45'}"/>`
      return s + `<g ${a('drop', 2.8)}>${sprite(ENV, 470, 40, { a: P.white, b: P.red }, 6)}</g>`
    },
    () => {
      let s = `<rect x="200" y="70" width="240" height="220" fill="${P.cream}"/>`
      ;[180, 200, 150, 190, 120].forEach((w, i) => { s += `<rect x="220" y="${96 + i * 30}" height="8" width="${w}" fill="#2a2e33" ${a('type', 4, i * 0.7, { w })}/>` })
      return s + `<g ${a('slide', 3, 0, { w: 120 })}>${sprite(PENCIL, 250, 220, { a: P.yel, b: P.pink, c: '#111' }, 7)}</g>`
    },
  ],
  analitica: [
    (r) => {
      let s = `<rect x="110" y="260" width="420" height="4" fill="#3a3f45"/>`
      for (let i = 0; i < 8; i++) {
        const h = 30 + Math.floor(r() * 140)
        s += `<rect x="${125 + i * 50}" y="${260 - h}" width="28" height="${h}" fill="${i === 7 ? P.or : P.teal}" ${a('blink', 2 + r(), -r() * 2)}/>`
      }
      return s
    },
    () => {
      const segs: [number, string][] = [[0.42, P.or], [0.28, P.teal], [0.18, P.blue], [0.12, P.cream]]
      let s = '', off = 0
      const C = 2 * Math.PI * 70
      segs.forEach(([f, c]) => { s += `<circle cx="0" cy="0" r="70" fill="none" stroke="${c}" stroke-width="26" stroke-dasharray="${(f * C).toFixed(1)} ${C.toFixed(1)}" stroke-dashoffset="${(-off * C).toFixed(1)}"/>`; off += f })
      return `<g transform="translate(250,180)"><g ${a('sweep', 12)}>${s}</g></g><rect x="380" y="130" width="120" height="12" fill="${P.white}"/><rect x="380" y="156" width="90" height="8" fill="#3a3f45"/><rect x="380" y="176" width="70" height="8" fill="#3a3f45"/>`
    },
  ],
  'sitios-web': [
    () => {
      let s = ''
      ;[220, 220, 220].forEach((w, i) => { s += `<rect x="190" y="${90 + i * 46}" width="260" height="30" fill="none" stroke="${P.white}" stroke-width="3"/><rect x="200" y="${102 + i * 46}" height="8" width="${w * 0.7}" fill="${P.cream}" ${a('type', 4, i * 1.1, { w: w * 0.7 })}/>` })
      return s + `<rect x="190" y="230" width="140" height="34" ${a('fill', 4) || ' fill="#2a2e33"'}/><text x="206" y="252" font-size="13" fill="${P.white}" style="${FONT}">ENVIAR</text>`
    },
    () => {
      let s = `<defs><clipPath id="sc-phone"><rect x="282" y="86" width="76" height="188"/></clipPath></defs>`
      s += `<rect x="270" y="66" width="100" height="228" rx="14" fill="#0b0d0c" stroke="${P.white}" stroke-width="5"/><rect x="306" y="74" width="28" height="5" rx="2" fill="${P.white}"/>`
      s += `<g clip-path="url(#sc-phone)"><g ${a('scroll', 5)}>`
      for (let i = 0; i < 10; i++) s += `<rect x="288" y="${92 + i * 30}" width="${i % 3 === 0 ? 64 : 48}" height="20" fill="${[P.blue, P.cream, P.or, P.teal][i % 4]}"/>`
      return s + '</g></g>'
    },
  ],
  liderazgo: [
    () => {
      let s = `<rect x="200" y="210" width="240" height="14" fill="#3a3f45"/>`
      ;[P.cream, P.blue, P.pink, P.teal].forEach((c, i) => {
        s += `<g ${a('bob', 1.4, -i * 0.35)}>${sprite(PERSON, 205 + i * 60, 150, { a: c, b: c }, 8)}</g>`
        s += `<rect x="${215 + i * 60}" y="110" width="26" height="16" rx="3" fill="${i === 2 ? P.or : P.white}" ${a('blink', 2, -i * 0.5)}/>`
      })
      return s
    },
    () => {
      const nodes: [number, number, string][] = [[320, 90, P.or], [220, 170, P.cream], [420, 170, P.cream], [170, 250, P.blue], [270, 250, P.blue], [370, 250, P.teal], [470, 250, P.teal]]
      let s = ''
      ;[[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]].forEach(([a1, b1]) => { s += `<line x1="${nodes[a1][0]}" y1="${nodes[a1][1]}" x2="${nodes[b1][0]}" y2="${nodes[b1][1]}" stroke="#3a3f45" stroke-width="3"/>` })
      nodes.forEach(([x, y, c], i) => { s += `<rect x="${x - 14}" y="${y - 14}" width="28" height="28" fill="${c}" ${a('blink', 3, -i * 0.4)}/>` })
      return s
    },
  ],
  'ia-aplicada': [
    () => {
      const L = [[3, 170], [5, 320], [2, 470]] as const
      const pos = L.map(([n, x]) => Array.from({ length: n }, (_, i) => [x, 180 + (i - (n - 1) / 2) * 44]))
      let s = ''
      for (let l = 0; l < 2; l++) pos[l].forEach(([x1, y1]) => pos[l + 1].forEach(([x2, y2]) => { s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#1f3a2f" stroke-width="2"/>` }))
      pos.flat().forEach(([x, y], i) => { s += `<circle cx="${x}" cy="${y}" r="11" fill="${i >= 8 ? P.or : P.teal}" ${a('blink', 1.8, -i * 0.2)}/>` })
      return s
    },
    () => {
      let s = `<rect x="250" y="110" width="140" height="140" fill="#2a2e33" stroke="${P.white}" stroke-width="3"/><rect x="290" y="150" width="60" height="60" fill="${P.or}"/>`
      for (let i = 0; i < 6; i++) {
        const o = 262 + i * 22, q = 122 + i * 22
        s += `<rect x="${o}" y="94" width="8" height="16" fill="${P.white}"/><rect x="${o}" y="250" width="8" height="16" fill="${P.white}"/><rect x="234" y="${q}" width="16" height="8" fill="${P.white}"/><rect x="390" y="${q}" width="16" height="8" fill="${P.white}"/>`
      }
      return s + `<g transform="translate(320,180)"><g ${a('sweep', 3)}><path d="M0 0 L90 0 A90 90 0 0 0 78 -45 Z" fill="${P.teal}" opacity=".3"/></g></g>`
    },
  ],
}

export type ScreenOptions = {
  slug: string
  category?: string | null
  minutes?: number | null
  title?: string
  still?: boolean
  noText?: boolean
  /** Cifra clave del artículo (p. ej. "6.5") y su etiqueta de 3 letras (p. ej. "MQL"): sustituyen a los minutos */
  figure?: string | null
  tag?: string | null
  /** Forzar una variante (0-2), para vistas previas */
  variant?: number
}

export function screenSvg({ slug, category, minutes, title, still = false, noText = false, figure, tag, variant }: ScreenOptions) {
  STILL = still
  const r = rng(slug || 'soyroman')
  const key = category && SCENES[category] ? category : KEYS[Math.floor(r() * KEYS.length)]
  const m = minutes && minutes > 0 ? Math.min(99, Math.round(minutes)) : 4 + Math.floor(r() * 9)
  const fig = figure && /^\d{1,3}(\.\d)?$/.test(figure.trim()) ? figure.trim() : null
  const tg = tag && /^[A-Za-zÁÉÍÓÚÑáéíóúñ0-9→]{2,4}$/.test(tag.trim()) ? tag.trim().toUpperCase().slice(0, 3) : null
  const num = fig || `${m}.${Math.floor(r() * 10)}`
  const variants = [SCENES[key], ...(EXTRA[key] || [])]
  const vr = rng(`${slug || 'soyroman'}#variante`)
  const v = variant !== undefined ? variant % variants.length : Math.floor(vr() * variants.length)
  const label = title ? title.replace(/[<&"]/g, '') : key
  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid slice">${still ? '' : STYLE}${background(r)}${variants[v](r)}${hud(SCREEN_CODES[key], num, fig && tg ? tg : 'MIN')}</svg>`
  if (noText) svg = svg.replace(/<text[^>]*>[^<]*<\/text>/g, '').replace(/<rect x="22" y="300"[^>]*\/>/, '')
  STILL = false
  return svg
}
