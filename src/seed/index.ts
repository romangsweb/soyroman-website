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

async function seed() {
  const payload = await getPayload({ config })

  console.log('🌱 Seeding database...')

  // ─── Clean existing data ───
  console.log('  Cleaning existing data...')
  const collections = ['expertise', 'projects', 'experience', 'tools'] as const
  for (const slug of collections) {
    const existing = await payload.find({ collection: slug, limit: 100 })
    for (const doc of existing.docs) {
      await payload.delete({ collection: slug, id: doc.id })
    }
  }

  // ─── Profile (Global) ───
  console.log('  Seeding profile...')
  await payload.updateGlobal({
    slug: 'profile',
    context: { disableRevalidate: true },
    data: {
      name: 'Román García',
      role: 'Director de Marketing B2B',
      tagline: 'Marketing B2B que se construye, no solo se planea.',
      shortBio:
        'Llevo más de 10 años generando demanda B2B para empresas de tecnología. Diseño la estrategia y también construyo los sistemas que la hacen funcionar: CRM, datos, web y motores de IA propios.',
      longBio: richText([
        paragraph(
          'Soy Román García, mercadólogo con especialidad en publicidad y más de 10 años en generación de demanda B2B para empresas de tecnología. Hoy dirijo el marketing de una consultora de ERP enterprise: demanda, CRM, operación del pipeline y web.',
        ),
        paragraph(
          'Mi forma de trabajar parte de una convicción: la estrategia de marketing vale lo que vale el sistema que la ejecuta. Por eso no me quedo en el plan. Modelo pipelines en el CRM, escribo los scripts que lo conectan, construyo los sitios y monto la infraestructura de datos donde todo se mide.',
        ),
        paragraph(
          'Esa misma idea me llevó a fundar [Buildations](https://buildations.com), un laboratorio de IA en la Ciudad de México. Ahí desarrollo motores propios para RevOps y para visibilidad en buscadores y en motores de IA. Corren en infraestructura del cliente, sin rentar el stack.',
        ),
        paragraph(
          'Fuera del trabajo leo sobre teoría social, psicología y arquitectura. Me interesa entender cómo deciden las personas y cómo los espacios y los sistemas moldean esas decisiones, lo cual resulta útil cuando el oficio consiste en provocar una conversación de compra.',
        ),
      ]),
      email: 'contacto@soyroman.com',
      buildationsUrl: 'https://buildations.com',
      metrics: [
        { label: 'años en generación de demanda B2B', value: '+10' },
        { label: 'personas en equipos liderados', value: '6' },
        { label: 'contactos depurados en CRM (de ~76k)', value: '~68k' },
        { label: 'de infraestructura de IA propia en producción', value: '+1 año' },
      ],
      // Redes: por definir
      socialLinks: [{ platform: 'website', url: 'https://buildations.com' }],
      services: [
        {
          title: 'Consultoría RevOps',
          description:
            'Diagnóstico y diseño de pipeline, scoring de ICP, detección de roles de compra, alineación marketing–ventas.',
          engine: 'Revenue Intelligence',
        },
        {
          title: 'Consultoría SEO + AEO/GEO',
          description:
            'Visibilidad en Google y en motores de IA desde un mismo pipeline.',
          engine: 'Search & Presence',
        },
        {
          title: 'Implementación',
          description:
            'Despliegue de los motores en infraestructura propia del cliente (PostgreSQL, Qdrant, Ollama, n8n), sin SaaS de por medio.',
          engine: 'Ambos',
        },
        {
          title: 'Adopción y operación',
          description:
            'Acompañamiento hasta que el equipo opera los motores de forma autónoma.',
          engine: 'Ambos',
        },
      ],
    },
  })

  // ─── Expertise (7 areas) ───
  console.log('  Seeding expertise...')
  const expertiseData = [
    {
      title: 'Generación de demanda B2B',
      slug: 'generacion-demanda-b2b',
      order: 1,
      thesis: 'Estrategia de captación para ciclos de venta largos y tickets altos.',
      level: 'advanced' as const,
      summary:
        'Diseño e implemento estrategias de generación de demanda que conectan marketing con ventas a través de contenido, eventos, outbound y nurturing — todo medido contra pipeline, no contra vanity metrics.',
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
        'Implementación, depuración y modelado de HubSpot; pipelines MEDDIC; atribución.',
      level: 'advanced' as const,
      summary:
        'El CRM es el sistema nervioso del revenue. Lo implemento, depuro y modelo para que marketing y ventas trabajen con los mismos datos, en el mismo pipeline, con la misma definición de éxito.',
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

  for (const exp of expertiseData) {
    await payload.create({ collection: 'expertise', data: exp })
  }

  // ─── Projects (4 cases) ───
  console.log('  Seeding projects...')
  const projectsData = [
    {
      title: 'Sitio B2B visible para buscadores y motores de IA',
      slug: 'sitio-b2b-visible',
      featured: true,
      year: 2025,
      color: '#5B8DEF',
      client: 'Consultora de ERP enterprise',
      approach: richText([
        bulletList([
          'Migración a WordPress en Kinsta.',
          'Home rediseñado con narrativa B2B estructurada.',
          'Landing pages interactivas: simulador fiscal en Vercel y cotizador.',
          'Traducción masiva con un LLM local.',
          'Un motor GEO sobre Cloudflare Workers.',
          'Endurecimiento de seguridad y DNSSEC.',
        ]),
      ]),
      context:
        'El sitio de una consultora de ERP enterprise estaba en HubSpot CMS, tenía una narrativa genérica y no aparecía en las respuestas de los motores de IA.',
      problem:
        'Sin visibilidad orgánica ni presencia en AI Overviews, ChatGPT o Perplexity. El sitio no generaba leads calificados.',
      learnings:
        'El motor GEO se desactivó porque contaminaba los datos de GA4; medir bien vale más que publicar más rápido.',
      results: [
        {
          metric: 'Presencia en IA',
          value: '↑',
          description: 'Más menciones en motores de IA',
        },
        {
          metric: 'Leads orgánicos',
          value: '↑',
          description: 'Crecimiento de leads orgánicos',
        },
      ],
      stackTags: [
        { tag: 'WordPress' },
        { tag: 'Divi 5' },
        { tag: 'Kinsta' },
        { tag: 'Cloudflare' },
        { tag: 'Vercel' },
        { tag: 'Ollama' },
        { tag: 'GA4' },
      ],
    },
    {
      title: 'De cinco pipelines a un forecast confiable',
      slug: 'forecast-confiable',
      featured: true,
      year: 2024,
      color: '#F59E0B',
      client: 'Confidencial',
      approach: richText([
        bulletList([
          'Migración completa por API entre portales: contactos, empresas, deals, actividades y propiedades personalizadas.',
          'Depuración en varias rondas hasta unos 68k contactos.',
          'Análisis histórico de MQLs (2022–2026).',
          'Unificación de los pipelines en un modelo MEDDIC de 9 etapas.',
        ]),
      ]),
      context:
        'Un portal de HubSpot con unos 76k contactos, cinco pipelines comerciales sin un modelo común y un portal por vencer que había que migrar.',
      problem:
        'Sin un modelo unificado, la dirección no podía confiar en el forecast. Los datos estaban dispersos en múltiples pipelines con criterios diferentes.',
      learnings:
        'La migración API-to-API entre portales de HubSpot requiere mapear cada propiedad personalizada. La depuración es iterativa, no lineal.',
      results: [
        {
          metric: 'Contactos depurados',
          value: '~68k',
          description: 'De 76k a 68k contactos limpios',
        },
        {
          metric: 'Pipeline unificado',
          value: 'MEDDIC',
          description: 'Modelo de 9 etapas',
        },
        {
          metric: 'Forecast',
          value: 'Confiable',
          description: 'La dirección puede tomar decisiones',
        },
      ],
      stackTags: [
        { tag: 'HubSpot' },
        { tag: 'API de HubSpot' },
        { tag: 'Python' },
      ],
    },
    {
      title: 'Rescate de una plataforma de cursos en línea',
      slug: 'rescate-plataforma-cursos',
      featured: true,
      year: 2024,
      color: '#EF4444',
      client: 'Confidencial',
      approach: richText([
        bulletList([
          'Análisis forense por SSH.',
          'Eliminación de webshells.',
          'Recuperación de la cuenta y rotación de credenciales.',
          'Endurecimiento posterior al incidente.',
        ]),
      ]),
      context:
        'Una tienda de cursos en WordPress/WooCommerce llevaba meses comprometida por malware antes de mi intervención.',
      problem:
        'Webshells activos, cuentas comprometidas, y riesgo de exposición de datos de usuarios.',
      learnings:
        'La seguridad web en hosting compartido requiere un enfoque forense: no basta con eliminar archivos, hay que rastrear el vector de entrada.',
      results: [
        {
          metric: 'Vulnerabilidades',
          value: 'Cerradas',
          description: 'Se cerraron todas las vulnerabilidades',
        },
        {
          metric: 'Datos de usuarios',
          value: 'Protegidos',
          description: 'No se expusieron datos',
        },
        {
          metric: 'Operación',
          value: 'Restaurada',
          description: 'Cliente volvió a operar su tienda',
        },
      ],
      stackTags: [
        { tag: 'SSH' },
        { tag: 'WordPress' },
        { tag: 'WooCommerce' },
        { tag: 'Hosting compartido' },
      ],
    },
    {
      title: 'Buildations: infraestructura de IA propia',
      slug: 'buildations-ia',
      featured: true,
      year: 2024,
      color: '#7CF5C8',
      client: 'Buildations',
      approach: richText([
        bulletList([
          'Servidor de producción propio con Docker: n8n, Qdrant, Ollama, PostgreSQL y GTM Server-Side.',
          'Acceso por Tailscale.',
          'Capa de seguridad: Wazuh, Suricata, CrowdSec y Fail2ban.',
          'Monitoreo con Grafana, Prometheus y Loki.',
          'Respaldos con Restic.',
        ]),
      ]),
      context: 'Construir IA seria sin rentar el stack.',
      problem:
        'Las plataformas SaaS de IA tienen costos recurrentes altos y no permiten control total sobre los datos y modelos.',
      learnings:
        'Es una inversión única en lugar de una suscripción, siempre que se cuente con la infraestructura para montarla.',
      results: [
        {
          metric: 'Tiempo en producción',
          value: '+1 año',
          description: 'En producción continua',
        },
        {
          metric: 'Servicios activos',
          value: '3',
          description: 'Revenue Intelligence, Search & Presence, Adaptive Security',
        },
      ],
      stackTags: [
        { tag: 'Docker' },
        { tag: 'PostgreSQL' },
        { tag: 'Qdrant' },
        { tag: 'Ollama' },
        { tag: 'n8n' },
        { tag: 'Tailscale' },
      ],
    },
  ]

  for (const project of projectsData) {
    await payload.create({ collection: 'projects', data: project })
  }

  // ─── Experience ───
  console.log('  Seeding experience...')
  const experienceData = [
    {
      company: 'Buildations',
      type: 'work' as const,
      position: 'Fundador y Director',
      startDate: '2024-01-01T00:00:00.000Z',
      order: 1,
      achievements: [
        {
          text: 'Laboratorio de IA: motores Revenue Intelligence y Search & Presence.',
        },
        {
          text: 'Infraestructura propia con Docker, PostgreSQL, Qdrant, Ollama, n8n y Tailscale.',
        },
        { text: 'Más de un año en producción con 3 servicios activos.' },
      ],
    },
    {
      company: 'Consultora de ERP enterprise',
      type: 'work' as const,
      position: 'Director de Marketing',
      startDate: '2020-01-01T00:00:00.000Z',
      order: 2,
      achievements: [
        {
          text: 'Demanda B2B, RevOps, CRM, web; equipo de hasta 6 personas.',
        },
        {
          text: 'Migración y depuración de CRM: de 76k a 68k contactos.',
        },
        {
          text: 'Unificación de 5 pipelines en un modelo MEDDIC de 9 etapas.',
        },
      ],
    },
    {
      company: 'Empresas de tecnología',
      type: 'work' as const,
      position: 'Gerencias de Marketing',
      startDate: '2014-01-01T00:00:00.000Z',
      endDate: '2020-01-01T00:00:00.000Z',
      order: 3,
      achievements: [{ text: 'Generación de demanda B2B para múltiples empresas de tecnología.' }],
    },
    {
      company: 'Formación académica',
      type: 'education' as const,
      position: 'Licenciatura en Marketing, especialidad en Publicidad',
      startDate: '2010-01-01T00:00:00.000Z',
      endDate: '2014-01-01T00:00:00.000Z',
      order: 4,
      achievements: [
        { text: 'Certificaciones HubSpot.' },
        { text: 'Certificaciones Google.' },
        {
          text: 'Universidad de Helsinki: Elements of AI, Building AI, Ethics of AI.',
        },
      ],
    },
  ]

  for (const exp of experienceData) {
    await payload.create({ collection: 'experience', data: exp })
  }

  // ─── Tools ───
  console.log('  Seeding tools...')
  const toolsData = [
    // CRM y RevOps
    { name: 'HubSpot', category: 'crm-revops' as const, level: 'expert' as const },
    { name: 'HubSpot API + Python', category: 'crm-revops' as const, level: 'advanced' as const },
    { name: 'Modelo MEDDIC', category: 'crm-revops' as const, level: 'advanced' as const },
    // Analítica
    { name: 'GA4', category: 'analytics' as const, level: 'advanced' as const },
    { name: 'GTM Server-Side', category: 'analytics' as const, level: 'advanced' as const },
    { name: 'Search Console', category: 'analytics' as const, level: 'advanced' as const },
    // Web
    { name: 'WordPress + Divi 5', category: 'web' as const, level: 'advanced' as const },
    { name: 'Kinsta', category: 'web' as const, level: 'advanced' as const },
    { name: 'Cloudflare (Workers, DNS)', category: 'web' as const, level: 'advanced' as const },
    { name: 'Vercel', category: 'web' as const, level: 'advanced' as const },
    { name: 'Payload CMS', category: 'web' as const, level: 'intermediate' as const },
    // IA y datos
    { name: 'Ollama', category: 'ia-data' as const, level: 'advanced' as const },
    { name: 'Qdrant', category: 'ia-data' as const, level: 'advanced' as const },
    { name: 'PostgreSQL', category: 'ia-data' as const, level: 'advanced' as const },
    { name: 'n8n', category: 'ia-data' as const, level: 'advanced' as const },
    { name: 'Claude', category: 'ia-data' as const, level: 'advanced' as const },
    { name: 'Obsidian', category: 'ia-data' as const, level: 'advanced' as const },
    // Infraestructura
    { name: 'Docker', category: 'infrastructure' as const, level: 'advanced' as const },
    { name: 'Tailscale', category: 'infrastructure' as const, level: 'advanced' as const },
    { name: 'Grafana / Prometheus / Loki', category: 'infrastructure' as const, level: 'advanced' as const },
    { name: 'Wazuh', category: 'infrastructure' as const, level: 'intermediate' as const },
    { name: 'CrowdSec', category: 'infrastructure' as const, level: 'intermediate' as const },
    { name: 'Restic', category: 'infrastructure' as const, level: 'intermediate' as const },
    // Diseño
    { name: 'Adobe', category: 'design' as const, level: 'advanced' as const },
    { name: 'Figma', category: 'design' as const, level: 'intermediate' as const },
    { name: 'Affinity', category: 'design' as const, level: 'intermediate' as const },
    // Ads
    { name: 'Google Ads', category: 'ads' as const, level: 'advanced' as const },
    { name: 'LinkedIn Ads', category: 'ads' as const, level: 'advanced' as const },
    // Entorno de trabajo
    { name: 'MacBook Pro M1 Pro', category: 'workspace' as const, level: 'expert' as const },
    { name: 'nix-darwin + home-manager', category: 'workspace' as const, level: 'advanced' as const },
    { name: 'WezTerm', category: 'workspace' as const, level: 'advanced' as const },
    { name: 'Helix', category: 'workspace' as const, level: 'advanced' as const },
    { name: 'Hammerspoon + Karabiner', category: 'workspace' as const, level: 'advanced' as const },
    { name: 'YubiKey', category: 'workspace' as const, level: 'advanced' as const },
  ]

  for (const tool of toolsData) {
    await payload.create({ collection: 'tools', data: tool })
  }

  // ─── Header Navigation ───
  console.log('  Seeding header...')
  await payload.updateGlobal({
    slug: 'header',
    context: { disableRevalidate: true },
    data: {
      navItems: [
        { link: { type: 'custom', url: '/about', label: 'Sobre mí' } },
        { link: { type: 'custom', url: '/expertise', label: 'Expertise' } },
        { link: { type: 'custom', url: '/proyectos', label: 'Proyectos' } },
        { link: { type: 'custom', url: '/blog', label: 'Blog' } },
        { link: { type: 'custom', url: '/contacto', label: 'Contacto' } },
      ],
    },
  })

  // ─── Footer ───
  console.log('  Seeding footer...')
  await payload.updateGlobal({
    slug: 'footer',
    context: { disableRevalidate: true },
    data: {
      navItems: [
        { link: { type: 'custom', url: '/about', label: 'Sobre mí' } },
        { link: { type: 'custom', url: '/expertise', label: 'Expertise' } },
        { link: { type: 'custom', url: '/proyectos', label: 'Proyectos' } },
        { link: { type: 'custom', url: '/uses', label: 'Uses' } },
        { link: { type: 'custom', url: '/cv', label: 'CV' } },
        { link: { type: 'custom', url: '/contacto', label: 'Contacto' } },
      ],
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
