// Solo servidor: lo importa la ruta /next/stack-scan (usa node:dns)

import dns from 'node:dns/promises'

import { AuditError, safeFetch } from './aeoAudit'

/**
 * Radiografía de stack: detecta las tecnologías de marketing de un sitio con información pública
 * (HTML de la portada, encabezados y registros DNS MX/SPF/DMARC) y las traduce en un diagnóstico.
 */

export type Band = 'cms' | 'analytics' | 'crm' | 'ads' | 'conversion' | 'privacy' | 'infra' | 'email'
export type Status = 'ok' | 'warn' | 'bad'
export type Hit = { name: string; band: Band; note?: string }
export type Finding = { title: string; detail: string; fix: string; weight: number }
export type StackResult = {
  domain: string
  url: string
  gtm: { id: string; read: boolean }[] // contenedores de Tag Manager encontrados y si se pudieron leer
  bands: { id: Band; label: string; status: Status; level: number; hits: Hit[] }[]
  findings: Finding[]
  at: string
}

export const BANDS: { id: Band; label: string }[] = [
  { id: 'cms', label: 'CMS' },
  { id: 'analytics', label: 'Analítica' },
  { id: 'crm', label: 'CRM' },
  { id: 'ads', label: 'Publicidad' },
  { id: 'conversion', label: 'Conversión' },
  { id: 'privacy', label: 'Privacidad' },
  { id: 'infra', label: 'Infraestructura' },
  { id: 'email', label: 'Correo' },
]

type Tech = {
  name: string
  band: Band
  html?: RegExp // en el HTML de la portada
  header?: [string, RegExp] // encabezado HTTP
  mx?: RegExp // registros MX
  spf?: RegExp // registro SPF (TXT)
  note?: (html: string) => string | undefined
}

const TECHS: Tech[] = [
  // CMS y plataforma
  { name: 'WordPress', band: 'cms', html: /wp-content\/|wp-includes\/|<meta[^>]+generator[^>]+WordPress/i, note: (h) => h.match(/generator[^>]+WordPress ([\d.]+)/i)?.[1] },
  { name: 'Elementor', band: 'cms', html: /elementor/i },
  { name: 'Divi', band: 'cms', html: /et_pb_|\/Divi\//i },
  { name: 'WooCommerce', band: 'cms', html: /woocommerce/i },
  { name: 'HubSpot CMS', band: 'cms', html: /hs-sites\.com|hubspot-?cms|<meta[^>]+generator[^>]+HubSpot/i },
  { name: 'Webflow', band: 'cms', html: /webflow\.(com|io)|data-wf-page/i },
  { name: 'Shopify', band: 'cms', html: /cdn\.shopify\.com|Shopify\.theme/i },
  { name: 'Wix', band: 'cms', html: /static\.wixstatic\.com|wix-code|X-Wix/i },
  { name: 'Squarespace', band: 'cms', html: /squarespace(-cdn)?\.com/i },
  { name: 'Drupal', band: 'cms', html: /Drupal\.settings|\/sites\/default\/files\//i },
  { name: 'Joomla', band: 'cms', html: /<meta[^>]+generator[^>]+Joomla/i },
  { name: 'Ghost', band: 'cms', html: /<meta[^>]+generator[^>]+Ghost/i },
  { name: 'Next.js', band: 'cms', html: /\/_next\/static\/|__NEXT_DATA__/i },
  { name: 'Nuxt', band: 'cms', html: /\/_nuxt\/|__NUXT__/i },
  { name: 'Gatsby', band: 'cms', html: /___gatsby/i },
  { name: 'Framer', band: 'cms', html: /framerusercontent\.com|framer\.(com|website)/i },
  // Analítica
  { name: 'Google Analytics 4', band: 'analytics', html: /gtag\/js\?id=G-|['"]G-[A-Z0-9]{6,}['"]/ },
  { name: 'Universal Analytics (obsoleto)', band: 'analytics', html: /['"]UA-\d{4,}-\d+['"]|google-analytics\.com\/analytics\.js/ },
  { name: 'Google Tag Manager', band: 'analytics', html: /googletagmanager\.com\/gtm\.js|GTM-[A-Z0-9]{4,}/, note: (h) => h.match(/GTM-[A-Z0-9]{4,}/)?.[0] },
  { name: 'Hotjar', band: 'analytics', html: /static\.hotjar\.com|hotjar/i },
  { name: 'Microsoft Clarity', band: 'analytics', html: /clarity\.ms/i },
  { name: 'Matomo', band: 'analytics', html: /matomo\.(js|php)|piwik\.js/i },
  { name: 'Plausible', band: 'analytics', html: /plausible\.io\/js/i },
  { name: 'Mixpanel', band: 'analytics', html: /cdn\.mxpnl\.com|mixpanel/i },
  { name: 'Segment', band: 'analytics', html: /cdn\.segment\.com|analytics\.js\/v1/i },
  { name: 'Vercel Analytics', band: 'analytics', html: /\/_vercel\/insights/i },
  { name: 'Ahrefs Web Analytics', band: 'analytics', html: /analytics\.ahrefs\.com/i },
  // CRM y automatización
  { name: 'HubSpot', band: 'crm', html: /js\.hs-scripts\.com|js\.hsforms\.net|hs-analytics|js\.hs-analytics\.net|hbspt\.forms/i },
  { name: 'Salesforce', band: 'crm', html: /webto(lead|case)|salesforce\.com\/servlet|force\.com/i },
  { name: 'Pardot (Account Engagement)', band: 'crm', html: /pi\.pardot\.com|go\.pardot\.com|piAId/i },
  { name: 'Marketo', band: 'crm', html: /munchkin\.marketo\.net|mktoForms|marketo\.com/i },
  { name: 'ActiveCampaign', band: 'crm', html: /activehosted\.com|trackcmp\.net/i },
  { name: 'Zoho', band: 'crm', html: /zohopublic|salesiq\.zoho|zcampaigns|zoho\.com\/crm/i },
  { name: 'Pipedrive', band: 'crm', html: /pipedrive(webforms)?\.com/i },
  { name: 'Mailchimp', band: 'crm', html: /chimpstatic\.com|list-manage\.com/i },
  { name: 'Brevo', band: 'crm', html: /sibforms\.com|sendinblue|brevo\.com/i },
  { name: 'Microsoft Dynamics', band: 'crm', html: /dynamics\.com|msdyncrm|d365mktforms/i },
  // Publicidad
  { name: 'Píxel de Meta', band: 'ads', html: /connect\.facebook\.net\/[^"']*fbevents|fbq\(/ },
  { name: 'LinkedIn Insight', band: 'ads', html: /snap\.licdn\.com|_linkedin_partner_id/ },
  { name: 'Google Ads', band: 'ads', html: /AW-\d{6,}|googleadservices\.com|googlesyndication/ },
  { name: 'TikTok Pixel', band: 'ads', html: /analytics\.tiktok\.com|ttq\.load/ },
  { name: 'Microsoft Ads (UET)', band: 'ads', html: /bat\.bing\.com/ },
  { name: 'X (Twitter) Pixel', band: 'ads', html: /static\.ads-twitter\.com|twq\(/ },
  { name: 'Floodlight (Google Marketing Platform)', band: 'ads', html: /fls\.doubleclick\.net|DC-\d{6,}/ },
  // Conversión
  { name: 'WhatsApp', band: 'conversion', html: /wa\.me\/|api\.whatsapp\.com|whatsapp/i },
  { name: 'Intercom', band: 'conversion', html: /widget\.intercom\.io|intercomSettings/i },
  { name: 'Drift', band: 'conversion', html: /js\.driftt\.com|drift\.com/i },
  { name: 'Zendesk Chat', band: 'conversion', html: /zopim|static\.zdassets\.com/i },
  { name: 'Tidio', band: 'conversion', html: /code\.tidio\.co/i },
  { name: 'Crisp', band: 'conversion', html: /client\.crisp\.chat/i },
  { name: 'Tawk.to', band: 'conversion', html: /embed\.tawk\.to/i },
  { name: 'Calendly', band: 'conversion', html: /calendly\.com/i },
  { name: 'HubSpot Meetings', band: 'conversion', html: /meetings\.hubspot\.com|meetings-plugin/i },
  { name: 'Cal.com', band: 'conversion', html: /cal\.com\//i },
  { name: 'Typeform', band: 'conversion', html: /typeform\.com/i },
  { name: 'Formulario en el sitio', band: 'conversion', html: /<form[\s>]/i },
  // Privacidad
  { name: 'Cookiebot', band: 'privacy', html: /consent\.cookiebot\.com|Cookiebot/i },
  { name: 'OneTrust', band: 'privacy', html: /cdn\.cookielaw\.org|onetrust/i },
  { name: 'CookieYes', band: 'privacy', html: /cookieyes/i },
  { name: 'Complianz', band: 'privacy', html: /complianz/i },
  { name: 'Osano', band: 'privacy', html: /osano\.com/i },
  { name: 'Iubenda', band: 'privacy', html: /iubenda/i },
  { name: 'Aviso de cookies propio', band: 'privacy', html: /(aviso|pol[ií]tica|preferencias) de cookies|cookie[-_ ]?(consent|banner|notice)/i },
  // Infraestructura
  { name: 'Cloudflare', band: 'infra', header: ['server', /cloudflare/i] },
  { name: 'Vercel', band: 'infra', header: ['server', /vercel/i] },
  { name: 'Netlify', band: 'infra', header: ['server', /netlify/i] },
  { name: 'Kinsta', band: 'infra', header: ['x-kinsta-cache', /./] },
  { name: 'WP Engine', band: 'infra', header: ['x-powered-by', /wp engine/i] },
  { name: 'Amazon CloudFront', band: 'infra', header: ['via', /cloudfront/i] },
  { name: 'Fastly', band: 'infra', header: ['x-served-by', /cache-/i] },
  { name: 'Nginx', band: 'infra', header: ['server', /nginx/i] },
  { name: 'Apache', band: 'infra', header: ['server', /apache/i] },
  { name: 'LiteSpeed', band: 'infra', header: ['server', /litespeed/i] },
  { name: 'PHP', band: 'infra', header: ['x-powered-by', /php/i] },
  // Correo
  { name: 'Google Workspace', band: 'email', mx: /google\.com|googlemail\.com/i },
  { name: 'Microsoft 365', band: 'email', mx: /outlook\.com|protection\.outlook/i },
  { name: 'Zoho Mail', band: 'email', mx: /zoho\./i },
  { name: 'Proofpoint', band: 'email', mx: /pphosted\.com/i },
  { name: 'Mimecast', band: 'email', mx: /mimecast/i },
  { name: 'Envíos desde HubSpot', band: 'email', spf: /hubspot|hubspotemail/i },
  { name: 'Envíos desde Mailchimp', band: 'email', spf: /servers\.mcsv\.net|mailchimp|mandrillapp/i },
  { name: 'Envíos desde SendGrid', band: 'email', spf: /sendgrid\.net/i },
  { name: 'Envíos desde Salesforce', band: 'email', spf: /salesforce\.com|exacttarget/i },
  { name: 'Envíos desde Amazon SES', band: 'email', spf: /amazonses\.com/i },
  { name: 'Envíos desde Mailgun', band: 'email', spf: /mailgun\.org/i },
  { name: 'Envíos desde Brevo', band: 'email', spf: /sendinblue|brevo/i },
  { name: 'Envíos desde Zoho', band: 'email', spf: /zoho/i },
]

// ───── Google Tag Manager: el contenedor (gtm.js) es público y trae la configuración de etiquetas ─────
// Solo se analiza el bloque de datos del contenedor (etiquetas, variables, HTML personalizado), no la librería de Google,
// que menciona muchos servicios aunque el sitio no los use.
const GTM_FN: [RegExp, string][] = [
  [/"function":"__(googtag|gaawc|gaawe)"/, 'Google Analytics 4'],
  [/"function":"__ua"/, 'Universal Analytics (obsoleto)'],
  [/"function":"__(awct|sp|awcc|awud)"|"vtp_tagId":"AW-/, 'Google Ads'],
  [/"function":"__bzi"/, 'LinkedIn Insight'],
  [/"function":"__baut"/, 'Microsoft Ads (UET)'],
  [/"function":"__hjtc"/, 'Hotjar'],
  [/"function":"__(flc|fls)"/, 'Floodlight (Google Marketing Platform)'],
]
const NOT_FROM_GTM = new Set<Band>(['cms', 'infra', 'email'])
const NOT_FROM_GTM_NAMES = new Set(['Formulario en el sitio', 'Aviso de cookies propio', 'Google Tag Manager'])

async function gtmData(id: string): Promise<string | null> {
  if (!/^GTM-[A-Z0-9]{4,10}$/.test(id)) return null
  try {
    const res = await fetch(`https://www.googletagmanager.com/gtm.js?id=${id}`, { signal: AbortSignal.timeout(6000), cache: 'no-store' })
    if (!res.ok) return null
    const js = (await res.text()).slice(0, 3_000_000)
    const s = js.indexOf('var data =')
    if (s < 0) return null
    const e = js.indexOf('\ntry{', s)
    return js
      .slice(s, e > s ? e : s + 400_000)
      .replace(/\\u003C/gi, '<')
      .replace(/\\u003E/gi, '>')
      .replace(/\\x3c/gi, '<')
      .replace(/\\x3e/gi, '>')
      .replace(/\\x22/gi, '"')
      .replace(/\\\//g, '/')
  } catch {
    return null
  }
}

const txt = async (host: string) => (await dns.resolveTxt(host).catch(() => [] as string[][])).map((r) => r.join(''))

export async function runStackScan(domain: string): Promise<StackResult> {
  const home = await safeFetch(`https://${domain}`, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 soyroman-stack-scan')
    .catch(async (e) => {
      if (e instanceof AuditError) throw e
      return safeFetch(`http://${domain}`, 'Mozilla/5.0 soyroman-stack-scan')
    })
    .catch((e) => {
      if (e instanceof AuditError) throw e
      throw new AuditError('El sitio no respondió.')
    })
  if (home.status >= 400) throw new AuditError(`La portada respondió con error ${home.status}.`)

  const html = home.text
  const headers = home.headers
  const [mxRecs, rootTxt, dmarcTxt] = await Promise.all([
    dns.resolveMx(domain).catch(() => []),
    txt(domain),
    txt(`_dmarc.${domain}`),
  ])
  const mx = mxRecs.map((m) => m.exchange).join(' ')
  const spf = rootTxt.find((t) => /^v=spf1/i.test(t)) || ''
  const dmarc = dmarcTxt.find((t) => /^v=DMARC1/i.test(t)) || ''

  const hits: Hit[] = []
  for (const t of TECHS) {
    let found = false
    if (t.html && t.html.test(html)) found = true
    if (t.header) {
      const v = headers[t.header[0]]
      if (v && t.header[1].test(v)) found = true
    }
    if (t.mx && mx && t.mx.test(mx)) found = true
    if (t.spf && spf && t.spf.test(spf)) found = true
    if (found) hits.push({ name: t.name, band: t.band, note: t.note?.(html) })
  }
  // Lo que se carga desde Google Tag Manager (máx. 2 contenedores)
  const gtmIds = [...new Set(html.match(/GTM-[A-Z0-9]{4,10}/g) || [])].slice(0, 2)
  const gtmTexts = await Promise.all(gtmIds.map(gtmData))
  const gtm = gtmIds.map((id, i) => ({ id, read: gtmTexts[i] !== null }))
  const fromGtm = new Set<string>()
  for (const data of gtmTexts) {
    if (!data) continue
    for (const [re, name] of GTM_FN) if (re.test(data)) fromGtm.add(name)
    for (const t of TECHS) {
      if (!t.html || NOT_FROM_GTM.has(t.band) || NOT_FROM_GTM_NAMES.has(t.name)) continue
      if (t.html.test(data)) fromGtm.add(t.name)
    }
  }
  for (const name of fromGtm) {
    const existing = hits.find((h) => h.name === name)
    const tech = TECHS.find((t) => t.name === name)
    if (existing) {
      if (name === 'Google Analytics 4') existing.note = existing.note || 'en HTML y en GTM'
    } else if (tech) {
      hits.push({ name, band: tech.band, note: 'vía GTM' })
    }
  }

  // GA4 instalado más de una vez
  const ga4Ids = [...new Set(html.match(/G-[A-Z0-9]{6,}/g) || [])]
  const ga4Loads = (html.match(/gtag\/js\?id=G-/g) || []).length
  const ga4 = hits.find((h) => h.name === 'Google Analytics 4')
  if (ga4 && (ga4Ids.length > 1 || ga4Loads > 1)) ga4.note = ga4Ids.length > 1 ? `${ga4Ids.length} IDs` : 'cargado 2 veces'
  const https = home.url.startsWith('https://')
  if (https) hits.push({ name: 'HTTPS', band: 'infra' })
  if (spf) hits.push({ name: 'SPF', band: 'email', note: 'configurado' })
  if (dmarc) hits.push({ name: 'DMARC', band: 'email', note: /p=(reject|quarantine)/i.test(dmarc) ? 'aplicado' : 'solo monitoreo' })

  const has = (b: Band) => hits.filter((h) => h.band === b)
  const nm = (n: string) => hits.some((h) => h.name === n)
  const onlyFormConv = has('conversion').every((h) => h.name === 'Formulario en el sitio')
  const scheduling = ['Calendly', 'HubSpot Meetings', 'Cal.com'].some(nm)

  // Diagnóstico
  const F: Finding[] = []
  if (!has('crm').length)
    F.push({ weight: 10, title: 'No hay CRM conectado al sitio', detail: 'Los formularios no alimentan un CRM visible desde el sitio: no se puede atribuir cada lead a su campaña ni medir el pipeline que genera la web.', fix: 'Conecta los formularios a un CRM (HubSpot, Zoho, Pipedrive…) e instala su código de seguimiento para ver el recorrido de cada lead.' })
  if (!has('analytics').length)
    F.push({ weight: 9, title: 'Sin analítica', detail: 'No se detectó ninguna herramienta de medición: no hay forma de saber qué canales traen visitas ni qué páginas convierten.', fix: 'Instala Google Analytics 4 (o una alternativa) con eventos para formularios y clics de contacto.' })
  const ga4Dup = Boolean(ga4?.note && ga4.note !== 'vía GTM')
  if (ga4Dup)
    F.push({ weight: 6, title: 'Google Analytics duplicado', detail: `GA4 aparece ${ga4?.note}: las visitas y conversiones pueden estar contadas doble.`, fix: 'Deja una sola instalación: por Tag Manager o directa, no ambas.' })
  if (nm('Universal Analytics (obsoleto)'))
    F.push({ weight: 5, title: 'Código de Universal Analytics', detail: 'Universal Analytics dejó de procesar datos: ese código ya no mide nada.', fix: 'Retíralo y verifica que GA4 cubra todos los eventos.' })
  if (has('ads').length && !has('privacy').length)
    F.push({ weight: 8, title: 'Píxeles de publicidad sin aviso de cookies', detail: `Se detectó ${has('ads').map((h) => h.name).join(', ')} sin un aviso de consentimiento visible.`, fix: 'Agrega un aviso de cookies y carga los píxeles solo después de que el visitante acepte.' })
  if (!has('ads').length)
    F.push({ weight: 3, title: 'Sin píxeles de publicidad', detail: 'No se detectó ningún píxel: si invierten en anuncios, no podrán crear audiencias de remarketing ni medir conversiones del sitio.', fix: 'Si hay inversión en medios, instala los píxeles de las plataformas que usan (con consentimiento).' })
  if (!scheduling)
    F.push({ weight: 5, title: 'No hay forma de agendar una reunión', detail: onlyFormConv ? 'El único camino de contacto es un formulario: el lead espera respuesta y el interés se enfría.' : 'Hay contacto, pero nadie puede reservar una llamada directamente.', fix: 'Agrega una agenda (HubSpot Meetings, Calendly) en contacto y en las páginas de servicio.' })
  if (!https)
    F.push({ weight: 9, title: 'Sin HTTPS', detail: 'El sitio no usa conexión segura: los navegadores lo marcan como "No seguro".', fix: 'Activa un certificado SSL y redirige todo el tráfico a HTTPS.' })
  if (!spf)
    F.push({ weight: 7, title: 'Sin registro SPF', detail: 'El dominio no declara quién puede enviar correos en su nombre: sus correos llegan más a spam y es más fácil suplantarlo.', fix: 'Publica un registro SPF con los servicios que envían correo (proveedor de correo, CRM, plataforma de email).' })
  if (!dmarc)
    F.push({ weight: 6, title: 'Sin DMARC', detail: 'Sin DMARC, nadie verifica los correos que dicen venir de este dominio: riesgo de suplantación y peor entregabilidad.', fix: 'Publica un registro DMARC empezando con p=none para monitorear y avanza a quarantine o reject.' })
  else if (!/p=(reject|quarantine)/i.test(dmarc))
    F.push({ weight: 3, title: 'DMARC solo en monitoreo', detail: 'DMARC está en p=none: reporta, pero no protege contra la suplantación.', fix: 'Cuando los reportes estén limpios, sube la política a quarantine y luego a reject.' })
  F.sort((x, y) => y.weight - x.weight)

  const statusOf = (b: Band): Status => {
    const n = has(b).length
    switch (b) {
      case 'crm': return n ? 'ok' : 'bad'
      case 'analytics': return !n ? 'bad' : ga4Dup || nm('Universal Analytics (obsoleto)') ? 'warn' : 'ok'
      case 'privacy': return n ? 'ok' : has('ads').length ? 'bad' : 'warn'
      case 'conversion': return !n ? 'bad' : scheduling ? 'ok' : 'warn'
      case 'email': return !spf || !dmarc ? (n ? 'warn' : 'bad') : 'ok'
      case 'infra': return https ? 'ok' : 'bad'
      case 'ads': return n ? 'ok' : 'warn'
      default: return n ? 'ok' : 'warn'
    }
  }
  const bands = BANDS.map((b) => {
    const st = statusOf(b.id)
    const n = has(b.id).length
    const level = st === 'bad' ? 1 : Math.min(12, (st === 'warn' ? 3 : 5) + n * 2)
    return { ...b, status: st, level, hits: has(b.id) }
  })
  return { domain, url: home.url, gtm, bands, findings: F.slice(0, 8), at: new Date().toISOString() }
}

