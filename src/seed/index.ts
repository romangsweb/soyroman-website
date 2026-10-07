import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

// ─── Lexical helpers ───
const textNode = (text: string) => ({
  type: 'text',
  text,
  format: 0,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
})

const linkNode = (text: string, url: string) => ({
  type: 'link',
  fields: { url, newTab: true, linkType: 'custom' },
  children: [textNode(text)],
  direction: 'ltr' as const,
  format: '',
  indent: 0,
  version: 3,
})

/** Paragraph from text; `[label](url)` segments become links. */
const paragraph = (text: string) => {
  const children: Record<string, unknown>[] = []
  const re = /\[([^\]]+)\]\(([^)]+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) children.push(textNode(text.slice(last, m.index)))
    children.push(linkNode(m[1], m[2]))
    last = m.index + m[0].length
  }
  if (last < text.length) children.push(textNode(text.slice(last)))
  return {
    type: 'paragraph',
    children,
    direction: 'ltr' as const,
    format: '',
    indent: 0,
    textFormat: 0,
    version: 1,
  }
}

const bulletList = (items: string[]) => ({
  type: 'list',
  listType: 'bullet',
  tag: 'ul',
  start: 1,
  children: items.map((item, i) => ({
    type: 'listitem',
    value: i + 1,
    checked: undefined,
    children: [textNode(item)],
    direction: 'ltr' as const,
    format: '',
    indent: 0,
    version: 1,
  })),
  direction: 'ltr' as const,
  format: '',
  indent: 0,
  version: 1,
})

const richText = (nodes: Record<string, unknown>[]) =>
  ({
    root: {
      type: 'root',
      children: nodes,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }) as any

type Slugged = 'expertise' | 'projects' | 'categories'

/**
 * Seed idempotente: crea o ACTUALIZA por clave natural (slug, nombre, puesto).
 * No borra nada: conserva IDs, así no se rompen relaciones con posts del blog.
 * No toca usuarios, posts ni media.
 */
async function seed() {
  const payload = await getPayload({ config })
  const ctx = { disableRevalidate: true }

  const upsert = async (collection: any, where: Record<string, unknown>, data: any) => {
    const found = await payload.find({ collection, where: where as any, limit: 1, depth: 0 })
    if (found.docs[0]) {
      return payload.update({ collection, id: found.docs[0].id, data, context: ctx })
    }
    return payload.create({ collection, data, context: ctx })
  }
  const bySlug = (collection: Slugged, data: any) => upsert(collection, { slug: { equals: data.slug } }, data)

  console.log('🌱 Seeding database...')

  // ─── Profile (Global) ───
  console.log('  profile')
  await payload.updateGlobal({
    slug: 'profile',
    context: ctx,
    data: {
      name: 'Román García',
      role: 'Director de marketing B2B',
      tagline: 'Marketing B2B: campañas, datos y la tecnología que los conecta.',
      shortBio:
        'Dirijo campañas de generación de demanda en medios digitales y construyo lo que las hace funcionar: sitios, analítica, CRM y posicionamiento SEO y AEO. Desde 2017 llevo leads de MQL a SQL y a venta en empresas de tecnología B2B.',
      longBio: richText([
        paragraph(
          'Estudié marketing con especialidad en publicidad. Muy pronto me di cuenta de que lo técnico era el freno: el servidor de la página, la arquitectura para posicionar, las etiquetas de medición. Si dependía de otros para cada una de esas piezas, las campañas no avanzaban.',
        ),
        paragraph(
          'Así que aprendí lo técnico y a gestionar la operación. Hoy puedo instalar un servidor, montar un sitio, configurar la analítica y diseñar cómo se mide cada etapa del embudo. Participé en migraciones de CRM, de Dynamics a HubSpot y entre portales de HubSpot, y ahí entendí el valor que tiene un CRM bien estructurado y cuidado para marketing y ventas. De esa convicción nació mi trabajo en RevOps. El posicionamiento orgánico siguió el mismo camino: el SEO evolucionó a una estrategia de SEO y AEO para aparecer también en las respuestas de los motores de IA.',
        ),
        paragraph(
          'Soy un director de marketing que sabe de tecnología e infraestructura, para que el área digital opere como debe. Fundé y dirijo [Buildations](https://buildations.com), un laboratorio de IA donde construyo motores para revenue intelligence y presencia en buscadores.',
        ),
      ]),
      email: 'contacto@soyroman.com',
      buildationsUrl: 'https://buildations.com',
      metrics: [
        { label: 'en generación de demanda B2B', value: 'Desde 2017' },
        { label: 'sitios web lanzados', value: '15+' },
        { label: 'leads al mes', value: '120+' },
        { label: 'facturación anual generada por marketing', value: 'USD 1.5M' },
      ],
      socialLinks: [
        { platform: 'linkedin', url: 'https://www.linkedin.com/in/román-garcía/' },
        { platform: 'github', url: 'https://github.com/romangsweb' },
      ],
      services: [
        {
          title: 'Consultoría RevOps',
          description:
            'Diagnóstico y diseño de pipeline, scoring de ICP, detección de roles de compra, alineación marketing–ventas.',
          engine: 'Revenue Intelligence',
        },
        {
          title: 'Consultoría SEO + AEO/GEO',
          description: 'Visibilidad en Google y en motores de IA desde un mismo pipeline.',
          engine: 'Search & Presence',
        },
        {
          title: 'Implementación',
          description:
            'CRM listo para usarse, medición (GA4, Tag Manager, UTMs), sitio conectado al CRM y arranque de campañas, con el equipo capacitado.',
          engine: 'Ambos',
        },
        {
          title: 'Mentoría',
          description:
            'Acompañamiento a líderes y equipos de marketing B2B en generación de demanda, CRM y operación digital.',
          engine: 'Ambos',
        },
      ],
    },
  })

  // ─── Expertise (7 áreas) ───
  console.log('  Seeding expertise...')
  const expertiseData = [
    {
      title: 'Generación de demanda B2B',
      slug: 'generacion-demanda-b2b',
      order: 1,
      thesis: 'Estrategia de captación para ciclos de venta largos y tickets altos.',
      level: 'advanced' as const,
      summary:
        'Diseño e implemento estrategias de generación de demanda que conectan marketing con ventas a través de contenido, eventos, outbound y nurturing medidas contra pipeline y no contra métricas de vanidad.',
    },
    {
      title: 'SEO, AEO y GEO',
      slug: 'seo-aeo-geo',
      order: 2,
      thesis:
        'Posicionamiento en buscadores y en motores de IA (ChatGPT, Perplexity, AI Overviews).',
      level: 'advanced' as const,
      summary:
        'El SEO tradicional ya no basta. Trabajo la visibilidad en buscadores y en los nuevos motores de IA desde un mismo pipeline de contenido, optimizando para humanos y para LLMs.',
    },
    {
      title: 'Paid Media',
      slug: 'paid-media',
      order: 3,
      thesis: 'Google Ads y LinkedIn Ads orientados a pipeline, no a clics.',
      // Estrategia avanzada, ejecución intermedia
      level: 'advanced' as const,
      summary:
        'Estrategia avanzada de paid media B2B con ejecución enfocada en calidad de lead y contribución a pipeline. No optimizo para CTR, optimizo para deals.',
    },
    {
      title: 'CRM y RevOps',
      slug: 'crm-revops',
      order: 4,
      thesis:
        'Implementación, migración, depuración y modelado de HubSpot; pipelines MEDDIC; atribución.',
      level: 'advanced' as const,
      summary:
        'El CRM es el sistema nervioso del revenue. Lo implemento, migro, depuro y modelo para que marketing y ventas trabajen con los mismos datos, en el mismo pipeline, con la misma definición de éxito.',
    },
    {
      title: 'Web y herramientas',
      slug: 'web-herramientas',
      order: 5,
      thesis:
        'Sitios, landing pages interactivas, automatizaciones e integraciones a medida.',
      level: 'advanced' as const,
      summary:
        'Construyo los activos digitales que sostienen la estrategia: sitios B2B que convierten, landing pages con calculadoras interactivas, y las integraciones que los conectan al CRM.',
    },
    {
      title: 'Liderazgo de equipos B2B',
      slug: 'liderazgo-equipos',
      order: 6,
      thesis:
        'Equipos de hasta 6 personas: diseño, contenido, SDR y gerencias de marketing digital.',
      level: 'advanced' as const,
      summary:
        'He liderado equipos multidisciplinarios de marketing B2B, coordinando diseñadores, creadores de contenido, SDRs y gerentes de marketing digital hacia objetivos de pipeline.',
    },
    {
      title: 'Motores de IA',
      slug: 'motores-ia',
      order: 7,
      thesis:
        'Revenue Intelligence y Search & Presence, desarrollados en Buildations.',
      level: 'advanced' as const,
      summary:
        'Desarrollo motores de IA propios para RevOps y para visibilidad en buscadores y motores de IA. Corren en infraestructura del cliente, sin rentar el stack.',
    },
  ]

  for (const exp of expertiseData) await bySlug('expertise', exp)

  // Pasos de framework (borrador para revisar en el admin). Solo se cargan si el
  // área aún no tiene pasos, para no pisar lo que se edite a mano.
  const FRAMEWORKS: Record<string, string[]> = {
    'generacion-demanda-b2b': ['Diagnóstico de pipeline', 'ICP y cuentas objetivo', 'Oferta y contenido', 'Canales y captura', 'Nutrición y handoff', 'Medición contra pipeline'],
    'seo-aeo-geo': ['Auditoría técnica', 'Mapa de intención', 'Contenido para personas y LLMs', 'Datos estructurados', 'Autoridad y menciones', 'Medición de visibilidad'],
    'paid-media': ['Objetivo de pipeline', 'Audiencias por cuenta', 'Oferta y landing', 'Lanzamiento y pruebas', 'Calidad de lead', 'Optimización por oportunidad'],
    'crm-revops': ['Auditoría de datos', 'Modelo de objetos y pipeline', 'Migración y depuración', 'Automatización', 'Atribución', 'Gobierno del dato'],
    'web-herramientas': ['Objetivo de conversión', 'Arquitectura y contenido', 'Diseño y desarrollo', 'Integración con CRM', 'Medición', 'Iteración'],
    'liderazgo-equipos': ['Roles y responsabilidades', 'Objetivos de pipeline', 'Rituales y tableros', 'Desarrollo del equipo', 'Revisión de resultados'],
    'motores-ia': ['Caso de uso y datos', 'Infraestructura propia', 'Modelo y prompts', 'Integración al flujo', 'Evaluación y mejora'],
  }
  for (const [slug, steps] of Object.entries(FRAMEWORKS)) {
    const found = await payload.find({ collection: 'expertise', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
    const doc = found.docs[0] as any
    if (doc && !doc.framework?.length) {
      await payload.update({ collection: 'expertise', id: doc.id, data: { framework: steps.map((step) => ({ step })) }, context: ctx })
    }
  }

  // ─── Temas (taxonomía compartida de blog, glosario y notas) ───
  console.log('  categories')
  const categoriesData = [
    { title: 'Generación de demanda', slug: 'generacion-demanda' },
    { title: 'CRM y RevOps', slug: 'crm-revops' },
    { title: 'SEO y AEO', slug: 'seo-aeo' },
    { title: 'Paid media', slug: 'paid-media' },
    { title: 'Contenido y email', slug: 'contenido-email' },
    { title: 'Analítica y medición', slug: 'analitica' },
    { title: 'Sitios web y conversión', slug: 'sitios-web' },
    { title: 'Liderazgo de equipos', slug: 'liderazgo' },
    { title: 'IA aplicada', slug: 'ia-aplicada' },
  ]
  for (const cat of categoriesData) await bySlug('categories', cat)

  // ─── Projects (5 casos) ───
  console.log('  projects')
  const projectsData = [
    {
      title: 'Sitio corporativo B2B preparado para buscadores e IA',
      slug: 'sitio-b2b-visible',
      featured: true,
      year: 2025,
      color: '#5B8DEF',
      client: 'Consultora de ERP enterprise',
      context:
        'El sitio estaba en HubSpot CMS, con una narrativa genérica, sin visibilidad orgánica y sin presencia en las respuestas de los motores de IA.',
      problem:
        'Sin visibilidad en buscadores ni en AI Overviews, ChatGPT o Perplexity, el sitio no generaba leads calificados.',
      approach: richText([
        bulletList([
          'Migración a WordPress en Kinsta.',
          'Home rediseñado con narrativa B2B estructurada.',
          'Landing pages interactivas: simulador en Vercel y cotizador.',
          'Traducción masiva con un LLM local.',
          'Motor GEO sobre Cloudflare Workers.',
          'Endurecimiento de seguridad y DNSSEC.',
        ]),
      ]),
      learnings:
        'El motor GEO se desactivó porque contaminaba los datos de GA4: medir bien vale más que publicar más rápido.',
      results: [
        { metric: 'Plataforma', value: 'WordPress + Kinsta', description: 'Migración completa desde HubSpot CMS' },
        { metric: 'Captación', value: 'Simulador y cotizador', description: 'Landing pages interactivas para generar leads' },
      ],
      stackTags: [{ tag: 'WordPress' }, { tag: 'Kinsta' }, { tag: 'Cloudflare' }, { tag: 'Vercel' }, { tag: 'Ollama' }, { tag: 'GA4' }],
    },
    {
      title: 'Migración entre portales de HubSpot y un solo modelo de pipeline',
      slug: 'forecast-confiable',
      featured: true,
      year: 2024,
      color: '#F59E0B',
      client: 'Confidencial',
      context:
        'Un portal de HubSpot con unos 76 mil contactos, cinco pipelines comerciales sin un modelo común y una licencia por vencer que obligaba a migrar.',
      problem:
        'Sin un modelo unificado, la dirección no podía confiar en el forecast: los datos estaban dispersos en pipelines con criterios distintos.',
      approach: richText([
        bulletList([
          'Migración completa por API entre portales: contactos, empresas, negocios, actividades y propiedades personalizadas.',
          'Depuración en varias rondas hasta unos 68 mil contactos.',
          'Análisis histórico de MQL.',
          'Unificación de los pipelines en un modelo MEDDIC de 9 etapas.',
        ]),
      ]),
      learnings:
        'Migrar entre portales de HubSpot exige mapear cada propiedad personalizada, y la depuración es iterativa, no lineal.',
      results: [
        { metric: 'Contactos depurados', value: '~68k', description: 'De ~76k a ~68k contactos limpios' },
        { metric: 'Pipelines', value: '5 → 1', description: 'Un modelo MEDDIC de 9 etapas' },
      ],
      stackTags: [{ tag: 'HubSpot' }, { tag: 'API de HubSpot' }, { tag: 'Python' }],
    },
    {
      title: 'Migración de Dynamics CRM a HubSpot',
      slug: 'migracion-dynamics-hubspot',
      featured: false,
      year: 2020,
      color: '#22C55E',
      client: 'Empresa de desarrollo de inteligencia artificial',
      context: 'Los datos comerciales vivían en Dynamics CRM y marketing no tenía forma de conectarlos con sus campañas.',
      problem: 'Sin un CRM compartido, marketing no podía atribuir leads ni dar seguimiento al embudo hasta la venta.',
      approach: richText([
        bulletList([
          'Mapeo de entidades y campos de Dynamics a HubSpot.',
          'Limpieza de datos antes de migrar.',
          'Modelo de ciclo de vida y pipeline en HubSpot.',
          'Integración con formularios y campañas.',
        ]),
      ]),
      learnings: 'Una migración de CRM es la oportunidad de redefinir el embudo, no solo de mover datos.',
      results: [{ metric: 'CRM', value: 'Dynamics → HubSpot', description: 'Marketing y ventas sobre la misma plataforma' }],
      stackTags: [{ tag: 'Dynamics CRM' }, { tag: 'HubSpot' }],
    },
    {
      title: 'Seguridad web: recuperación de una tienda WooCommerce',
      slug: 'rescate-plataforma-cursos',
      featured: false,
      year: 2024,
      color: '#EF4444',
      client: 'Confidencial',
      context: 'Una tienda de cursos en WordPress y WooCommerce llevaba meses comprometida por malware.',
      problem: 'Webshells activos, cuentas comprometidas y riesgo de exposición de datos de usuarios.',
      approach: richText([
        bulletList([
          'Análisis forense por SSH.',
          'Eliminación de webshells.',
          'Recuperación de cuentas y rotación de credenciales.',
          'Endurecimiento posterior al incidente.',
        ]),
      ]),
      learnings: 'En hosting compartido no basta con borrar archivos: hay que rastrear el vector de entrada.',
      results: [
        { metric: 'Vulnerabilidades', value: 'Cerradas', description: 'Se cerraron los accesos comprometidos' },
        { metric: 'Operación', value: 'Restaurada', description: 'La tienda volvió a vender sin exponer datos de usuarios' },
      ],
      stackTags: [{ tag: 'SSH' }, { tag: 'WordPress' }, { tag: 'WooCommerce' }],
    },
    {
      title: 'Buildations: laboratorio de IA con infraestructura propia',
      slug: 'buildations-ia',
      featured: true,
      year: 2024,
      color: '#7CF5C8',
      client: 'Buildations',
      context: 'Construir IA seria sin rentar el stack.',
      problem: 'Las plataformas SaaS de IA tienen costos recurrentes altos y no dan control total sobre los datos ni los modelos.',
      approach: richText([
        bulletList([
          'Servidor de producción propio con Docker: PostgreSQL, Qdrant, Ollama y n8n.',
          'Acceso por Tailscale.',
          'Seguridad: Wazuh, Suricata, CrowdSec y Fail2ban.',
          'Monitoreo con Grafana, Prometheus y Loki.',
          'Respaldos con Restic.',
        ]),
      ]),
      learnings: 'Es una inversión única en lugar de una suscripción, siempre que se cuente con la infraestructura para operarla.',
      results: [
        { metric: 'En producción', value: '+1 año', description: 'Operación continua' },
        { metric: 'Motores', value: '2', description: 'Revenue Intelligence y Search & Presence' },
      ],
      stackTags: [{ tag: 'Docker' }, { tag: 'PostgreSQL' }, { tag: 'Qdrant' }, { tag: 'Ollama' }, { tag: 'n8n' }, { tag: 'Tailscale' }],
    },
  ]
  for (const project of projectsData) await bySlug('projects', project)

  // ─── Experience ───
  console.log('  experience')
  const grow = { text: 'Incremento en la generación de demanda digital.' }
  const experienceData = [
    {
      company: 'Buildations',
      type: 'work' as const,
      position: 'Fundador y director',
      startDate: '2024-01-01T00:00:00.000Z',
      order: 1,
      achievements: [
        { text: 'Laboratorio de IA con motores Revenue Intelligence y Search & Presence.' },
        { text: 'Infraestructura propia con Docker, PostgreSQL, Qdrant, Ollama, n8n y Tailscale.' },
      ],
    },
    {
      company: 'Partner de ERP enterprise',
      type: 'work' as const,
      position: 'Director de marketing',
      startDate: '2023-01-01T00:00:00.000Z',
      order: 2,
      achievements: [
        { text: 'Generación de demanda con capacidad de 120+ leads al mes.' },
        { text: 'USD 1.5M de facturación anual generada por marketing.' },
        { text: 'Migración entre portales de HubSpot y unificación de 5 pipelines en un modelo MEDDIC de 9 etapas.' },
        { text: 'Liderazgo de un equipo de hasta 6 personas: diseño, contenido, SDR y marketing digital.' },
      ],
    },
    {
      company: 'Empresa de desarrollo de inteligencia artificial',
      type: 'work' as const,
      position: 'Gerente de marketing',
      startDate: '2020-01-01T00:00:00.000Z',
      endDate: '2023-01-01T00:00:00.000Z',
      order: 3,
      achievements: [{ text: 'Migración de Dynamics CRM a HubSpot.' }, grow],
    },
    {
      company: 'Empresa de soluciones RFID',
      type: 'work' as const,
      position: 'Gerente de marketing',
      startDate: '2019-01-01T00:00:00.000Z',
      endDate: '2020-01-01T00:00:00.000Z',
      order: 4,
      achievements: [grow],
    },
    {
      company: 'Empresa de servicios de nube en AWS',
      type: 'work' as const,
      position: 'Gerente de marketing',
      startDate: '2018-01-01T00:00:00.000Z',
      endDate: '2019-01-01T00:00:00.000Z',
      order: 5,
      achievements: [grow],
    },
    {
      company: 'Empresa de desarrollo de cursos digitales',
      type: 'work' as const,
      position: 'Gerente de marketing',
      startDate: '2017-01-01T00:00:00.000Z',
      endDate: '2018-01-01T00:00:00.000Z',
      order: 6,
      achievements: [grow],
    },
    {
      company: 'Formación académica',
      type: 'education' as const,
      position: 'Licenciatura en Marketing, especialidad en Publicidad',
      startDate: '2012-01-01T00:00:00.000Z',
      endDate: '2017-01-01T00:00:00.000Z',
      order: 7,
      achievements: [
        { text: 'Certificaciones de HubSpot.' },
        { text: 'Certificaciones de Google.' },
        { text: 'Universidad de Helsinki: Elements of AI, Building AI, Ethics of AI.' },
      ],
    },
  ]
  for (const exp of experienceData) {
    await upsert('experience', { and: [{ company: { equals: exp.company } }, { position: { equals: exp.position } }] }, exp)
  }

  // Entradas del seed anterior que ya no existen (otra clave company/position)
  const oldExperience: [string, string][] = [
    ['Buildations', 'Fundador y Director'],
    ['Consultora de ERP enterprise', 'Director de Marketing'],
    ['Empresas de tecnología', 'Gerencias de Marketing'],
  ]
  for (const [company, position] of oldExperience) {
    const found = await payload.find({
      collection: 'experience',
      where: { and: [{ company: { equals: company } }, { position: { equals: position } }] },
      limit: 5,
      depth: 0,
    })
    for (const doc of found.docs) await payload.delete({ collection: 'experience', id: doc.id, context: ctx })
  }

  // ─── Tools ───
  console.log('  tools')
  type Level = 'beginner' | 'intermediate' | 'advanced' | 'expert'
  type Cat = 'crm-revops' | 'analytics' | 'web' | 'ia-data' | 'infrastructure' | 'design' | 'ads' | 'workspace'
  const t = (name: string, category: Cat, level: Level = 'intermediate') => ({ name, category, level })
  const toolsData = [
    // CRM y RevOps
    t('HubSpot', 'crm-revops', 'expert'),
    t('HubSpot API + Python', 'crm-revops', 'advanced'),
    t('Modelo MEDDIC', 'crm-revops', 'advanced'),
    t('Dynamics 365 / Dynamics CRM', 'crm-revops'),
    t('LinkedIn Sales Navigator', 'crm-revops'),
    t('Apollo', 'crm-revops'),
    t('Zapier', 'crm-revops'),
    t('Make', 'crm-revops'),
    // Analítica y SEO
    t('GA4', 'analytics', 'advanced'),
    t('Google Tag Manager (web y server-side)', 'analytics', 'advanced'),
    t('Search Console', 'analytics', 'advanced'),
    t('Semrush', 'analytics'),
    t('Ahrefs', 'analytics'),
    t('Screaming Frog', 'analytics'),
    t('PageSpeed Insights', 'analytics'),
    t('Microsoft Clarity', 'analytics'),
    t('Hotjar', 'analytics'),
    t('BigQuery', 'analytics'),
    t('Metabase', 'analytics'),
    // Web
    t('WordPress + Divi 5', 'web', 'advanced'),
    t('Kinsta', 'web', 'advanced'),
    t('Cloudflare (DNS, Workers, Tunnel)', 'web', 'advanced'),
    t('Vercel', 'web', 'advanced'),
    t('Next.js + Payload CMS', 'web'),
    t('nginx', 'web'),
    // IA y datos
    t('PostgreSQL / SQL', 'ia-data', 'advanced'),
    t('Redis', 'ia-data'),
    t('Neo4j', 'ia-data'),
    t('MinIO', 'ia-data'),
    t('Ollama', 'ia-data', 'advanced'),
    t('Qdrant', 'ia-data', 'advanced'),
    t('n8n', 'ia-data', 'advanced'),
    t('ComfyUI', 'ia-data'),
    t('Langfuse', 'ia-data'),
    t('Open WebUI', 'ia-data'),
    t('Claude', 'ia-data', 'advanced'),
    t('Obsidian', 'ia-data', 'advanced'),
    // Infraestructura y seguridad
    t('Docker', 'infrastructure', 'advanced'),
    t('Tailscale', 'infrastructure', 'advanced'),
    t('Grafana / Prometheus / Loki', 'infrastructure', 'advanced'),
    t('HashiCorp Vault', 'infrastructure'),
    t('Authelia', 'infrastructure'),
    t('Uptime Kuma', 'infrastructure'),
    t('Wazuh', 'infrastructure'),
    t('Suricata', 'infrastructure'),
    t('CrowdSec + Fail2ban', 'infrastructure'),
    t('Restic', 'infrastructure'),
    // Diseño
    t('Adobe', 'design', 'advanced'),
    t('Figma', 'design'),
    t('Affinity', 'design'),
    t('Canva', 'design'),
    // Ads
    t('Estrategia de paid media B2B', 'ads', 'advanced'),
    t('Google Ads (operación)', 'ads'),
    t('LinkedIn Ads (operación)', 'ads'),
    t('Meta Ads', 'ads'),
    // Entorno de trabajo
    t('Notion', 'workspace'),
    t('Asana', 'workspace'),
    t('Monday', 'workspace'),
    t('Slack', 'workspace'),
    t('MacBook Pro M1 Pro', 'workspace', 'expert'),
    t('nix-darwin + home-manager', 'workspace', 'advanced'),
    t('WezTerm', 'workspace', 'advanced'),
    t('Helix', 'workspace', 'advanced'),
    t('Hammerspoon + Karabiner', 'workspace', 'advanced'),
    t('YubiKey', 'workspace', 'advanced'),
  ]
  for (const tool of toolsData) await upsert('tools', { name: { equals: tool.name } }, tool)

  // Herramientas viejas del seed anterior que cambiaron de nombre
  for (const old of ['GTM Server-Side', 'Cloudflare (Workers, DNS)', 'Payload CMS', 'PostgreSQL', 'Google Ads', 'LinkedIn Ads', 'CrowdSec']) {
    const found = await payload.find({ collection: 'tools', where: { name: { equals: old } }, limit: 1, depth: 0 })
    if (found.docs[0]) await payload.delete({ collection: 'tools', id: found.docs[0].id, context: ctx })
  }

  // ─── Header / Footer ───
  console.log('  header / footer')
  const nav = (items: [string, string][]) => items.map(([url, label]) => ({ link: { type: 'custom' as const, url, label } }))
  await payload.updateGlobal({
    slug: 'header',
    context: ctx,
    data: {
      navItems: nav([
        ['/expertise', 'Expertise'],
        ['/proyectos', 'Proyectos'],
        ['/consultoria', 'Consultoría'],
        ['/blog', 'Blog'],
        ['/glosario', 'Glosario'],
        ['/recursos', 'Recursos'],
        ['/about', 'Sobre mí'],
        ['/cv', 'CV'],
        ['/contacto', 'Contacto'],
      ]),
    },
  })
  await payload.updateGlobal({
    slug: 'footer',
    context: ctx,
    data: {
      navItems: nav([
        ['/about', 'Sobre mí'],
        ['/expertise', 'Expertise'],
        ['/proyectos', 'Proyectos'],
        ['/consultoria', 'Consultoría'],
        ['/blog', 'Blog'],
        ['/glosario', 'Glosario'],
        ['/recursos', 'Recursos'],
        ['/notas', 'Notas de campo'],
        ['/uses', 'Herramientas'],
        ['/cv', 'CV'],
        ['/contacto', 'Contacto'],
      ]),
      copyright: `© ${new Date().getFullYear()} Román García`,
    },
  })

  console.log('✅ Seed complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
