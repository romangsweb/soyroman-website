// Solo servidor: correo del reporte de /recursos con Resend (lo usan submitToolLead y la ruta de IA)

/**
 * Correo 1: el diagnóstico al momento. Correo 2: seguimiento programado a 3 días.
 * Sin RESEND_API_KEY no hace nada. Todo el texto que viene del visitante se escapa y se recorta;
 * los únicos enlaces son fijos (herramienta y agenda).
 */

export type ReportItem = { t: string; fix?: string }
export type Report = {
  to: string
  name?: string
  tool: string
  slug: string
  domain?: string
  score?: number | null
  items: ReportItem[]
}

const FROM = 'Román García <contacto@soyroman.com>'
const SITE = 'https://soyroman.com'
const MEETINGS = process.env.NEXT_PUBLIC_MEETINGS_URL || 'https://meetings.hubspot.com/roman-garcia-solis'
const PCT = new Set(['radiografia-stack', 'salud-correo', 'te-recomienda-la-ia'])
const SCORE_LABEL: Record<string, string> = {
  'auditor-aeo': 'preparación para buscadores con IA',
  'radiografia-stack': 'bandas del stack cubiertas',
  'salud-correo': 'controles de correo en verde',
  'velocidad-real': 'calificación de velocidad (laboratorio)',
  'comparador-competidores': 'tu preparación para IA',
  'te-recomienda-la-ia': 'respuestas de la IA que te mencionan',
  'madurez-revops': 'madurez de tu operación de revenue',
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const cut = (s = '', n: number) => s.replace(/\s+/g, ' ').trim().slice(0, n)

/** Limpia lo que llega del formulario: máximo 3 puntos, textos cortos. */
export function cleanItems(raw: unknown): ReportItem[] {
  if (!Array.isArray(raw)) return []
  return raw
    .slice(0, 3)
    .map((x) => ({ t: cut(String((x as ReportItem)?.t ?? ''), 160), fix: cut(String((x as ReportItem)?.fix ?? ''), 320) || undefined }))
    .filter((x) => x.t)
}

const toolUrl = (slug: string) => (slug === 'cv' ? `${SITE}/cv` : `${SITE}/recursos/${slug}`)
const scoreText = (r: Report) => (r.score == null ? '' : PCT.has(r.slug) ? `${Math.round(r.score)}%` : `${Math.round(r.score)} / 100`)

function shell(title: string, inner: string, footer: string) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title></head>
<body style="margin:0;background:#e5e5e2;padding:24px 8px;font-family:Menlo,Consolas,'Courier New',monospace;color:#111">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#f4f4f1;border:2px solid #111">
${inner}
<tr><td style="border-top:2px solid #111;padding:12px 20px;font-family:Arial,sans-serif;font-size:11px;line-height:1.6;color:#555">${footer}</td></tr>
</table></td></tr></table></body></html>`
}

const button = (href: string, label: string, dark = false) =>
  `<a href="${href}" style="display:inline-block;background:${dark ? '#ffffff' : '#e85a2a'};color:${dark ? '#111111' : '#ffffff'};text-decoration:none;padding:12px 16px;border:2px solid #111;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;margin:6px 8px 6px 0">${label}</a>`

function firstEmail(r: Report) {
  const hi = r.name ? `Hola ${esc(cut(r.name, 40))},` : 'Hola,'
  const where = r.domain ? ` de <b>${esc(cut(r.domain, 120))}</b>` : ''
  const score = scoreText(r)
  const lcd = score
    ? `<div style="background:#0b0d0c;color:#3ddc84;border:2px solid #111;border-radius:6px;padding:14px 16px;margin:6px 0 18px"><div style="font-size:36px;line-height:1">${score}</div><div style="color:#66cc77;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;margin-top:6px">${esc(SCORE_LABEL[r.slug] || 'resultado')}</div></div>`
    : ''
  const items = r.items
    .map(
      (x, i) =>
        `<div style="border-top:1px solid #111;padding:10px 0"><b style="color:#e85a2a">${i + 1}. ${esc(x.t)}</b>${x.fix ? `<div style="color:#444;font-size:13px;margin-top:4px">${esc(x.fix)}</div>` : ''}</div>`,
    )
    .join('')
  const inner = `
<tr><td style="background:#e85a2a;color:#fff;padding:14px 20px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase">soyroman.com · ${esc(r.tool)}</td></tr>
<tr><td style="padding:22px 20px;font-size:14px;line-height:1.65">
<p style="margin:0 0 14px">${hi}</p>
<p style="margin:0 0 14px">Aquí está el resultado${where}. Te lo dejo por escrito para que lo tengas a la mano o se lo reenvíes a tu equipo.</p>
${lcd}
${items ? `<p style="margin:0 0 6px"><b>Lo más importante:</b></p>${items}` : ''}
<p style="margin:16px 0 8px">Si quieres, lo revisamos juntos 30 minutos y te digo por dónde empezar.</p>
${button(MEETINGS, 'Agendar 30 minutos')}${button(toolUrl(r.slug), 'Volver a la herramienta', true)}
<p style="margin:14px 0 0">Román</p>
</td></tr>`
  const footer = `Recibiste este correo porque usaste ${esc(r.tool)} en soyroman.com. Si tienes dudas, responde a este correo. <a href="${SITE}/privacidad" style="color:#555">Aviso de privacidad</a>`
  const subject = `Tu diagnóstico: ${r.tool}${r.domain ? ` · ${cut(r.domain, 60)}` : ''}${score ? ` · ${score.replace(' / ', '/')}` : ''}`
  const text = [
    r.name ? `Hola ${cut(r.name, 40)},` : 'Hola,',
    '',
    `Resultado de ${r.tool}${r.domain ? ` para ${r.domain}` : ''}${score ? `: ${score}` : ''}.`,
    '',
    ...r.items.map((x, i) => `${i + 1}. ${x.t}${x.fix ? `\n   ${x.fix}` : ''}`),
    '',
    `Agendar 30 minutos: ${MEETINGS}`,
    `Volver a la herramienta: ${toolUrl(r.slug)}`,
    '',
    'Román',
  ].join('\n')
  return { subject, html: shell(subject, inner, footer), text }
}

function followUp(r: Report) {
  const hi = r.name ? `Hola ${esc(cut(r.name, 40))},` : 'Hola,'
  const what = r.domain ? `${esc(r.tool)} en <b>${esc(cut(r.domain, 120))}</b>` : esc(r.tool)
  const first = r.items[0]?.t
  const inner = `
<tr><td style="padding:22px 20px;font-size:14px;line-height:1.65">
<p style="margin:0 0 14px">${hi}</p>
<p style="margin:0 0 14px">Hace unos días usaste ${what}.${first ? ` Lo primero que salió fue: <b>${esc(first)}</b>.` : ''}</p>
<p style="margin:0 0 14px">Si quieres, vuelve a correrlo después de hacer cambios, o agenda una llamada y lo vemos juntos.</p>
${button(MEETINGS, 'Agendar 30 minutos')}
<p style="margin:14px 0 0">Román<br><span style="color:#666;font-size:12px">Si no te interesa, responde "no" y no te vuelvo a escribir.</span></p>
</td></tr>`
  const subject = r.domain ? `¿Pudiste revisar lo de ${cut(r.domain, 60)}?` : `¿Pudiste revisar tu resultado de ${r.tool}?`
  const footer = `soyroman.com · Ciudad de México · <a href="${SITE}/privacidad" style="color:#555">Aviso de privacidad</a>`
  const text = [
    r.name ? `Hola ${cut(r.name, 40)},` : 'Hola,',
    '',
    `Hace unos días usaste ${r.tool}${r.domain ? ` en ${r.domain}` : ''}.${first ? ` Lo primero que salió fue: ${first}.` : ''}`,
    'Si quieres, vuelve a correrlo después de hacer cambios, o agenda una llamada y lo vemos juntos.',
    '',
    `Agendar 30 minutos: ${MEETINGS}`,
    '',
    'Román',
    'Si no te interesa, responde "no" y no te vuelvo a escribir.',
  ].join('\n')
  return { subject, html: shell(subject, inner, footer), text }
}

async function send(body: Record<string, unknown>) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`resend ${res.status} ${(await res.text()).slice(0, 300)}`)
}

/** Manda el reporte y programa el seguimiento. Nunca lanza: si falla, solo lo registra. */
export async function sendReport(r: Report): Promise<boolean> {
  if (!process.env.RESEND_API_KEY || !r.to) return false
  const headers = { 'List-Unsubscribe': '<mailto:contacto@soyroman.com?subject=baja>' }
  const base = { from: FROM, to: [r.to], reply_to: 'contacto@soyroman.com', headers }
  try {
    const a = firstEmail(r)
    await send({ ...base, subject: a.subject, html: a.html, text: a.text, tags: [{ name: 'tipo', value: 'reporte' }] })
    const b = followUp(r)
    await send({
      ...base,
      subject: b.subject,
      html: b.html,
      text: b.text,
      scheduled_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      tags: [{ name: 'tipo', value: 'seguimiento' }],
    })
    console.info(`[report] enviado ${r.slug}`)
    return true
  } catch (e) {
    console.error('[report] error', e instanceof Error ? e.message : e)
    return false
  }
}
