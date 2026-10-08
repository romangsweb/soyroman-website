// Solo servidor: lo importa la ruta /next/mail-health (usa node:dns)

import { Resolver } from 'node:dns/promises'

/**
 * Salud del correo: revisa con DNS público cómo está configurado el correo de un dominio
 * (MX, SPF, DKIM, DMARC, MTA-STS, TLS-RPT, BIMI y listas negras de dominios). No envía correos.
 */

export type MailStatus = 'ok' | 'warn' | 'bad' | 'off'
export type Light = { id: string; label: string; status: MailStatus; short: string }
export type Sender = { name: string; via: string; dkim: 'si' | 'no' | 'no-verificable' }
export type MailFinding = { title: string; detail: string; fix: string; weight: number }
export type MailResult = {
  domain: string
  lights: Light[]
  senders: Sender[]
  spf: { record: string; lookups: number; all: string } | null
  dmarc: { record: string; policy: string; reports: boolean } | null
  dkim: string[]
  bulk: { spf: boolean; dkim: boolean; dmarc: boolean }
  lists: { name: string; result: 'limpio' | 'listado' | 'no verificable' }[]
  findings: MailFinding[]
  at: string
}

const r = new Resolver({ timeout: 4000, tries: 2 })
const txt = async (host: string) => (await r.resolveTxt(host).catch(() => [] as string[][])).map((x) => x.join(''))
/** Como txt, pero `null` si el DNS no respondió (distinto de "no existe"). */
const txtOrNull = (host: string) =>
  r.resolveTxt(host).then(
    (x) => x.map((y) => y.join('')),
    (e: { code?: string }) => (e.code === 'ENOTFOUND' || e.code === 'ENODATA' ? [] : null),
  )

// Quién envía: por MX, por SPF y por selector DKIM conocido. dkim [] = usa selectores propios, no se puede verificar.
const SENDERS: { name: string; mx?: RegExp; spf?: RegExp; dkim: string[] }[] = [
  { name: 'Google Workspace', mx: /google\.com|googlemail\.com/i, spf: /_spf\.google\.com/i, dkim: ['google'] },
  { name: 'Microsoft 365', mx: /outlook\.com/i, spf: /spf\.protection\.outlook\.com/i, dkim: ['selector1', 'selector2'] },
  { name: 'Zoho', mx: /zoho\./i, spf: /zoho/i, dkim: ['zoho', 'zmail'] },
  { name: 'Cloudflare Email Routing', mx: /mx\.cloudflare\.net/i, spf: /_spf\.mx\.cloudflare\.net/i, dkim: ['cf2024-1'] },
  { name: 'HubSpot', spf: /hubspotemail|hubspot/i, dkim: ['hs1', 'hs2'] },
  { name: 'Mailchimp', spf: /servers\.mcsv\.net|mailchimp|mandrillapp/i, dkim: ['k1', 'k2', 'k3', 'mte1', 'mte2'] },
  { name: 'SendGrid', spf: /sendgrid\.net/i, dkim: ['s1', 's2', 'smtpapi'] },
  { name: 'Brevo', spf: /sendinblue|brevo/i, dkim: ['mail', 'brevo1', 'brevo2'] },
  { name: 'Mailgun', spf: /mailgun\.org/i, dkim: ['mailo', 'mg', 'pic', 'smtp'] },
  { name: 'Amazon SES', spf: /amazonses\.com/i, dkim: [] },
  { name: 'Salesforce', spf: /salesforce\.com|exacttarget/i, dkim: [] },
  { name: 'Postmark', spf: /mtasv\.net/i, dkim: [] },
  { name: 'Proofpoint', mx: /pphosted\.com/i, dkim: [] },
  { name: 'Mimecast', mx: /mimecast/i, dkim: [] },
]
const SELECTORS = [...new Set([...SENDERS.flatMap((s) => s.dkim), 'default', 'dkim', 'selector', 'email', 's1024', 'resend'])]

// Listas negras de dominios (no de IP: las IP de envío no son públicas)
const DBLS = [
  { zone: 'dbl.spamhaus.org', name: 'Spamhaus DBL' },
  { zone: 'multi.surbl.org', name: 'SURBL' },
  { zone: 'multi.uribl.com', name: 'URIBL' },
]

async function listed(domain: string, zone: string): Promise<'limpio' | 'listado' | 'no verificable'> {
  try {
    const a = await r.resolve4(`${domain}.${zone}`)
    // 127.255.255.x (Spamhaus) y 127.0.0.1 (SURBL/URIBL) = consulta rechazada desde este servidor, no un listado
    if (!a.length || a.some((ip) => ip.startsWith('127.255.255.') || ip === '127.0.0.1')) return 'no verificable'
    return 'listado'
  } catch (e) {
    const code = (e as { code?: string }).code
    return code === 'ENOTFOUND' || code === 'ENODATA' ? 'limpio' : 'no verificable'
  }
}

/** Cuenta las consultas DNS del SPF (el límite del estándar es 10). */
async function spfLookups(record: string, depth: number, budget: { n: number }): Promise<number> {
  const terms = record.split(/\s+/).slice(1)
  let n = 0
  const nested: Promise<number>[] = []
  for (const term of terms) {
    const m = term.replace(/^[+\-~?]/, '').match(/^(include|redirect|a|mx|ptr|exists)(?:[:=/](.+))?$/i)
    if (!m) continue
    n++
    const mech = m[1].toLowerCase()
    const target = m[2]
    if ((mech === 'include' || mech === 'redirect') && target && !target.includes('%') && depth < 4 && budget.n++ < 25) {
      nested.push(txt(target).then((t) => {
        const rec = t.find((x) => /^v=spf1/i.test(x))
        return rec ? spfLookups(rec, depth + 1, budget) : 0
      }))
    }
  }
  return n + (await Promise.all(nested)).reduce((a, b) => a + b, 0)
}

// Plataforma probable según el formato de un selector DKIM propio
const SELECTOR_OWNER: [RegExp, string][] = [
  [/^hs\d(-\d+)?$/i, 'HubSpot'],
  [/^k\d$|^mte\d$/i, 'Mailchimp'],
  [/^s\d$|^smtpapi$/i, 'SendGrid'],
  [/^google$/i, 'Google Workspace'],
  [/^selector\d$/i, 'Microsoft 365'],
  [/^(zoho|zmail)/i, 'Zoho'],
  [/^(mail|brevo\d)$/i, 'Brevo'],
  [/^resend$/i, 'Resend'],
  [/^cf\d{4}-\d$/i, 'Cloudflare Email Routing'],
  [/pm$/i, 'Postmark'],
]
export const validSelector = (s: string) => /^[a-z0-9][a-z0-9._-]{0,62}$/i.test(s)

export async function runMailHealth(domain: string, customSelector = ''): Promise<MailResult> {
  const custom = validSelector(customSelector) ? customSelector.toLowerCase() : ''
  const [mxRecs, rootTxt, dmarcTxt, stsTxt, tlsTxt, bimiTxt, dkimHits, lists] = await Promise.all([
    r.resolveMx(domain).catch(() => []),
    txtOrNull(domain),
    txtOrNull(`_dmarc.${domain}`),
    txt(`_mta-sts.${domain}`),
    txt(`_smtp._tls.${domain}`),
    txt(`default._bimi.${domain}`),
    Promise.all([...new Set([...(custom ? [custom] : []), ...SELECTORS])].map(async (s) => ((await txt(`${s}._domainkey.${domain}`)).some((t) => /p=[A-Za-z0-9+/]/.test(t)) ? s : null))),
    Promise.all(DBLS.map(async (d) => ({ name: d.name, result: await listed(domain, d.zone) }))),
  ])
  const mx = mxRecs.filter((m) => m.exchange && m.exchange !== '.').map((m) => m.exchange.toLowerCase())
  const mxStr = mx.join(' ')
  const spfUnknown = rootTxt === null
  const dmarcUnknown = dmarcTxt === null
  const spfRecs = (rootTxt || []).filter((t) => /^v=spf1/i.test(t))
  const spfRec = spfRecs[0] || ''
  const dmarcRec = (dmarcTxt || []).find((t) => /^v=DMARC1/i.test(t)) || ''
  const dkim = dkimHits.filter((s): s is string => !!s)

  // SPF
  const lookups = spfRec ? await spfLookups(spfRec, 0, { n: 0 }) : 0
  const all = spfRec.match(/([+\-~?]?)all\b/i)?.[0] || ''
  const spf = spfRec ? { record: spfRec, lookups, all } : null

  // DMARC
  const policy = dmarcRec.match(/\bp=([a-z]+)/i)?.[1]?.toLowerCase() || ''
  const dmarc = dmarcRec ? { record: dmarcRec, policy, reports: /\brua=/i.test(dmarcRec) } : null

  // Remitentes
  const senders: Sender[] = []
  for (const s of SENDERS) {
    const byMx = !!(s.mx && s.mx.test(mxStr))
    const bySpf = !!(s.spf && s.spf.test(spfRec))
    if (!byMx && !bySpf) continue
    const owner = custom && dkim.includes(custom) ? SELECTOR_OWNER.find(([re]) => re.test(custom))?.[1] : undefined
    const sel = [...new Set([...s.dkim.filter((x) => dkim.includes(x)), ...(owner === s.name ? [custom] : [])])]
    senders.push({
      name: s.name,
      via: [byMx && 'MX', bySpf && 'SPF', sel.length && `DKIM ${sel.join('/')}`].filter(Boolean).join(' + '),
      dkim: sel.length ? 'si' : !s.dkim.length || (custom && dkim.includes(custom) && !SELECTOR_OWNER.some(([re]) => re.test(custom))) ? 'no-verificable' : 'no',
    })
  }

  // Luces
  const L: Light[] = []
  L.push(mx.length ? { id: 'mx', label: 'MX', status: 'ok', short: senders.find((s) => s.via.includes('MX'))?.name || `${mx.length} servidor${mx.length > 1 ? 'es' : ''}` }
    : { id: 'mx', label: 'MX', status: 'bad', short: 'no recibe correo' })
  L.push(spfUnknown ? { id: 'spf', label: 'SPF', status: 'off', short: 'DNS sin respuesta' }
    : !spf ? { id: 'spf', label: 'SPF', status: 'bad', short: 'no existe' }
    : spfRecs.length > 1 ? { id: 'spf', label: 'SPF', status: 'bad', short: `${spfRecs.length} registros` }
      : lookups > 10 ? { id: 'spf', label: 'SPF', status: 'bad', short: `${lookups}/10 consultas` }
        : /^\+?all$/i.test(all) ? { id: 'spf', label: 'SPF', status: 'bad', short: '+all abierto' }
          : lookups >= 9 ? { id: 'spf', label: 'SPF', status: 'warn', short: `${lookups}/10 consultas` }
            : { id: 'spf', label: 'SPF', status: 'ok', short: `${lookups}/10 · ${all || 'sin all'}` })
  const missingDkim = senders.filter((s) => s.dkim === 'no')
  L.push(!dkim.length ? { id: 'dkim', label: 'DKIM', status: 'warn', short: 'no detectado' }
    : missingDkim.length ? { id: 'dkim', label: 'DKIM', status: 'warn', short: `${senders.length - missingDkim.length} de ${senders.length}` }
      : { id: 'dkim', label: 'DKIM', status: 'ok', short: dkim.join(' · ') })
  L.push(dmarcUnknown ? { id: 'dmarc', label: 'DMARC', status: 'off', short: 'DNS sin respuesta' }
    : !dmarc ? { id: 'dmarc', label: 'DMARC', status: 'bad', short: 'no existe' }
    : policy === 'reject' || policy === 'quarantine' ? { id: 'dmarc', label: 'DMARC', status: 'ok', short: `p=${policy}` }
      : { id: 'dmarc', label: 'DMARC', status: 'warn', short: `p=${policy || '?'}` })
  L.push(stsTxt.some((t) => /^v=STSv1/i.test(t)) ? { id: 'mtasts', label: 'MTA-STS', status: 'ok', short: 'activo' } : { id: 'mtasts', label: 'MTA-STS', status: 'off', short: 'no configurado' })
  L.push(tlsTxt.some((t) => /^v=TLSRPTv1/i.test(t)) ? { id: 'tlsrpt', label: 'TLS-RPT', status: 'ok', short: 'activo' } : { id: 'tlsrpt', label: 'TLS-RPT', status: 'off', short: 'no configurado' })
  L.push(bimiTxt.some((t) => /^v=BIMI1/i.test(t)) ? { id: 'bimi', label: 'BIMI', status: 'ok', short: 'logo publicado' } : { id: 'bimi', label: 'BIMI', status: 'off', short: 'opcional' })
  const anyListed = lists.filter((l) => l.result === 'listado')
  const checked = lists.filter((l) => l.result !== 'no verificable')
  L.push(anyListed.length ? { id: 'lists', label: 'LISTAS', status: 'bad', short: `en ${anyListed.length} lista${anyListed.length > 1 ? 's' : ''}` }
    : checked.length ? { id: 'lists', label: 'LISTAS', status: 'ok', short: `limpio (${checked.length}/${lists.length})` }
      : { id: 'lists', label: 'LISTAS', status: 'off', short: 'no verificable' })

  // Diagnóstico
  const F: MailFinding[] = []
  if (!mx.length) F.push({ weight: 9, title: 'El dominio no recibe correo', detail: 'No tiene registros MX: los correos que le escriban rebotan y algunos filtros desconfían de remitentes sin MX.', fix: 'Configura los MX de tu proveedor de correo (Google Workspace, Microsoft 365…).' })
  if (anyListed.length) F.push({ weight: 10, title: `El dominio aparece en ${anyListed.map((l) => l.name).join(', ')}`, detail: 'Las listas negras de dominios hacen que los filtros manden a spam cualquier correo que mencione o venga de este dominio.', fix: 'Revisa la causa en el sitio de la lista (sitio comprometido, envíos sin permiso) y pide la baja cuando esté resuelta.' })
  if (!spf && !spfUnknown) F.push({ weight: 9, title: 'No hay SPF', detail: 'El dominio no declara qué servidores pueden enviar en su nombre: más correos a spam y suplantación más fácil.', fix: 'Publica un registro TXT v=spf1 con tus remitentes y termina en ~all.' })
  else if (spf) {
    if (spfRecs.length > 1) F.push({ weight: 9, title: `Hay ${spfRecs.length} registros SPF`, detail: 'El estándar solo permite uno: con dos o más, el SPF falla para todos los correos.', fix: 'Une todos los include en un solo registro.' })
    if (lookups > 10) F.push({ weight: 9, title: `El SPF hace ${lookups} consultas DNS (máximo 10)`, detail: 'Al pasar de 10 el SPF da error permanente: los servidores lo tratan como si no existiera.', fix: 'Quita remitentes que ya no usas o mueve envíos de marketing a un subdominio con su propio SPF.' })
    else if (lookups >= 9) F.push({ weight: 6, title: `El SPF está al límite: ${lookups} de 10 consultas`, detail: 'Una herramienta más y el SPF se rompe sin aviso.', fix: 'Antes de agregar otro remitente, limpia los include que no se usan o usa un subdominio para marketing.' })
    if (/^\+?all$/i.test(all)) F.push({ weight: 9, title: 'El SPF termina en +all', detail: 'Autoriza a cualquier servidor del mundo a enviar como este dominio: el SPF no protege nada.', fix: 'Cámbialo a ~all (o -all cuando estés seguro de la lista).' })
  }
  if (!dmarc && !dmarcUnknown) F.push({ weight: 8, title: 'No hay DMARC', detail: 'Gmail y Yahoo lo exigen a quien envía correos masivos, y sin él cualquiera puede suplantar el dominio.', fix: 'Publica _dmarc con v=DMARC1; p=none; rua=mailto:… para empezar a recibir reportes.' })
  else if (dmarc) {
    if (policy !== 'reject' && policy !== 'quarantine') F.push({ weight: 6, title: 'DMARC está en p=none', detail: 'Solo monitorea: los correos que suplantan al dominio se siguen entregando.', fix: 'Con reportes limpios unas semanas, sube a p=quarantine y después a p=reject.' })
    if (!dmarc.reports) F.push({ weight: 3, title: 'DMARC sin reportes', detail: 'No tiene rua: nadie recibe los reportes de quién envía en nombre del dominio.', fix: 'Agrega rua=mailto: con un buzón o un servicio de reportes DMARC.' })
  }
  if (!dkim.length) F.push({ weight: 5, title: 'No se detectó DKIM', detail: 'No encontré firmas en los selectores más comunes. Puede existir con un selector propio, pero si no hay DKIM, Gmail y Yahoo rechazan los envíos masivos.', fix: 'Activa DKIM en cada plataforma que envía (proveedor de correo, CRM, email marketing) y publica sus registros.' })
  for (const s of missingDkim) if (dkim.length) F.push({ weight: 4, title: `${s.name} envía sin DKIM detectado`, detail: `${s.name} está autorizado en el SPF, pero no encontré su firma DKIM: esas campañas tienen más probabilidad de caer en spam.`, fix: `Activa la autenticación de dominio en ${s.name} y publica los registros que te dé.` })
  if (mx.length && !L.find((l) => l.id === 'mtasts' && l.status === 'ok')) F.push({ weight: 2, title: 'Sin MTA-STS', detail: 'El correo entrante puede viajar sin cifrar si alguien interfiere la conexión.', fix: 'Publica una política MTA-STS en modo testing y TLS-RPT para recibir reportes.' })
  F.sort((a, b) => b.weight - a.weight)

  return {
    domain, lights: L, senders, spf, dmarc, dkim,
    bulk: { spf: !!spf && lookups <= 10 && spfRecs.length === 1, dkim: dkim.length > 0, dmarc: !!dmarc },
    lists, findings: F.slice(0, 8), at: new Date().toISOString(),
  }
}
