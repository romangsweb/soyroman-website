// Solo servidor: aviso por correo cuando cambia el radar de IA (Resend).

import type { RadarSnapshot } from '@/db/schema'
import type { RadarChange } from './radar'

const FROM = 'Román García <contacto@soyroman.com>'
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export async function sendRadarAlert(to: string, snap: RadarSnapshot, changes: RadarChange[]) {
  const key = process.env.RESEND_API_KEY
  if (!key) return
  const items = changes.map((c) => `<li style="margin:0 0 8px">${esc(c.text)}</li>`).join('')
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Tu radar de IA</title></head>
<body style="margin:0;background:#e5e5e2;padding:24px 8px;font-family:Menlo,Consolas,'Courier New',monospace;color:#111">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#f4f4f1;border:2px solid #111">
<tr><td style="background:#111;color:#ecebe6;padding:14px 20px;font-size:13px;letter-spacing:2px">MI TALLER · RADAR DE IA</td></tr>
<tr><td style="padding:24px 20px;font-size:14px;line-height:1.6">
<p style="margin:0 0 6px">Corrimos tu radar mensual para <b>${esc(snap.domain)}</b> («${esc(snap.service)}», ${esc(snap.market)}).</p>
<p style="margin:0 0 14px;font-size:28px;color:#c84a1e">${snap.mentions} de ${snap.answered} respuestas te mencionan</p>
<p style="margin:0 0 8px">Lo que cambió desde la vez anterior:</p>
<ul style="margin:0 0 20px;padding-left:18px">${items}</ul>
<p style="margin:0 0 20px"><a href="https://soyroman.com/taller/radar" style="display:inline-block;background:#c84a1e;color:#fff;text-decoration:none;padding:12px 18px;border:2px solid #111;font-size:13px;letter-spacing:1px">VER MI RADAR ▸</a></p>
<p style="margin:0;font-size:12px;color:#555">Mide Gemini sin búsqueda en vivo: sirve para ver la tendencia mes a mes, no lo que responde cada motor.</p>
</td></tr>
<tr><td style="border-top:2px solid #111;padding:12px 20px;font-family:Arial,sans-serif;font-size:11px;color:#555">Recibes este aviso porque lo tienes encendido en tu <a href="https://soyroman.com/taller/perfil" style="color:#555">perfil de empresa</a>; ahí mismo lo puedes apagar.</td></tr>
</table></td></tr></table></body></html>`
  const text = `Tu radar de IA para ${snap.domain}: ${snap.mentions} de ${snap.answered} respuestas te mencionan.\n\n${changes.map((c) => `- ${c.text}`).join('\n')}\n\nVer: https://soyroman.com/taller/radar\nApaga estos avisos en https://soyroman.com/taller/perfil`
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject: `Tu radar de IA: ${changes[0].text}`, html, text }),
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}`)
}
