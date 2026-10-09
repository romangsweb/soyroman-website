// Solo servidor: correo con el enlace de acceso a Mi taller (Resend).

const FROM = 'Román García <contacto@soyroman.com>'

export async function sendMagicLinkEmail(to: string, url: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('Falta RESEND_API_KEY')
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Entra a tu taller</title></head>
<body style="margin:0;background:#e5e5e2;padding:24px 8px;font-family:Menlo,Consolas,'Courier New',monospace;color:#111">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#f4f4f1;border:2px solid #111">
<tr><td style="background:#111;color:#ecebe6;padding:14px 20px;font-size:13px;letter-spacing:2px">SOYROMAN.COM · MI TALLER</td></tr>
<tr><td style="padding:24px 20px;font-size:14px;line-height:1.6">
<p style="margin:0 0 16px">Usa este botón para entrar a tu taller. El enlace funciona una sola vez y vence en 10 minutos.</p>
<p style="margin:0 0 20px"><a href="${url}" style="display:inline-block;background:#c84a1e;color:#fff;text-decoration:none;padding:12px 18px;border:2px solid #111;font-size:13px;letter-spacing:1px">ENTRAR A MI TALLER ▸</a></p>
<p style="margin:0;font-size:12px;color:#555">Si no pediste este correo, ignóralo: nadie puede entrar sin el enlace.</p>
</td></tr>
<tr><td style="border-top:2px solid #111;padding:12px 20px;font-family:Arial,sans-serif;font-size:11px;color:#555">soyroman.com · <a href="https://soyroman.com/privacidad" style="color:#555">Aviso de privacidad</a></td></tr>
</table></td></tr></table></body></html>`
  const text = `Entra a tu taller en soyroman.com (el enlace vence en 10 minutos y funciona una sola vez):\n${url}\n\nSi no pediste este correo, ignóralo.`
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject: 'Tu enlace para entrar a Mi taller', html, text }),
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}`)
}
