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
      context: 'El grupo operaba ventas en Dynamics CRM; marketing usaba HubSpot por separado para precalificar los leads antes de subirlos a Dynamics.',
      problem: 'Dynamics se había quedado atrás en la integración entre marketing y ventas: dos sistemas, traspaso manual de leads y sin seguimiento del embudo completo.',
      approach: richText([
        bulletList([
          'Demostré el valor de HubSpot con el uso de marketing antes de proponer la migración.',
          'Impulsé la decisión de migrar todo el grupo, aprovechando el licenciamiento de HubSpot ya contratado.',
          'Definí la estructura del nuevo CRM: ciclo de vida, propiedades, scoring y el paso de lead a MQL, SQL y oportunidad.',
          'La migración técnica la ejecutó una agencia de implementación.',
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
      client: 'Cliente de una agencia (proyecto freelance)',
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

  // Caso de uso extendido (borrador). Solo llena los campos vacíos para no pisar lo que se edite en el admin.
  // Lo que lleva [COMPLETAR] no se publica hasta que se sustituya por el dato real.
  const C = '[COMPLETAR]'
  const col = (label: string, ...nodes: (string | [string, string])[]) => ({
    label,
    nodes: nodes.map((n) => (Array.isArray(n) ? { name: n[0], note: n[1] } : { name: n })),
  })
  const CASES: Record<string, any> = {
    'sitio-b2b-visible': {
      summary:
        'Llevé el sitio corporativo de HubSpot CMS a WordPress y lo preparé para buscadores y motores de IA, con herramientas interactivas que convierten visitas en leads.',
      role: 'Líder técnico de la migración: contenido, instalación, configuración y endurecimiento; el equipo apoyó en la maquetación',
      duration: '4 meses',
      team: 'Yo + equipo interno de diseño',
      outcomes: [
        { metric: 'Visibilidad en Google', before: 'Base', after: '+8% impresiones', impact: 'Cambio de CMS sin la caída de tráfico típica de una migración' },
        { metric: 'Posición media', before: '11.7', after: '10.8', impact: 'La mejor posición promedio desde el cambio de plataforma' },
        { metric: 'Herramientas de captación', before: '', after: '2', impact: 'Simulador y cotizador como puntos de conversión' },
      ],
      highlights: [
        { title: 'Dos migraciones en paralelo', text: 'El sitio salía de HubSpot CMS mientras el CRM se movía a un portal nuevo; ambas tenían que llegar juntas para no romper formularios ni atribución.' },
        { title: 'Medir antes que publicar', text: 'Apagué el motor GEO cuando vi que contaminaba los datos de GA4: un dato confiable vale más que publicar más rápido.' },
        { title: 'Herramientas que convierten', text: 'El simulador y el cotizador le dan al visitante algo útil a cambio de sus datos.' },
        { title: 'Traducción con LLM local', text: 'La traducción masiva del sitio se hizo con un modelo corriendo en infraestructura propia.' },
        { title: 'Seguridad dentro del alcance', text: 'Endurecimiento del sitio y DNSSEC como parte de la migración, no como tarea aparte.' },
      ],
      phases: [
        { name: 'Diagnóstico de narrativa y visibilidad' },
        { name: 'Migración a WordPress en Kinsta' },
        { name: 'Home y narrativa B2B' },
        { name: 'Simulador y cotizador' },
        { name: 'Traducción y motor GEO' },
        { name: 'Seguridad y DNSSEC' },
      ],
      architecture: {
        caption: 'Del contenido a la conversión medida',
        columns: [
          col('Contenido', ['WordPress', 'CMS'], ['Ollama', 'traducción local']),
          col('Plataforma', ['Kinsta', 'hosting'], ['Cloudflare', 'DNS y DNSSEC']),
          col('Conversión', ['Simulador', 'en Vercel'], ['Cotizador', 'landing interactiva']),
          col('Medición', ['GA4', 'eventos y conversiones']),
        ],
      },
    },
    'forecast-confiable': {
      summary:
        'La dirección general no podía ver los números juntos: el negocio vivía en dos portales de HubSpot con cinco pipelines separados por unidad de negocio. Planeé y ejecuté la migración por API a un solo portal con un solo pipeline.',
      role: 'Planeación y ejecución completa: mapa de datos, migración por API, pruebas y validación',
      duration: '4 meses, en paralelo con el sitio',
      team: 'Proyecto individual',
      outcomes: [
        { metric: 'Portales de CRM', before: '2', after: '1', impact: 'Una sola fuente de verdad para contactos y negocios' },
        { metric: 'Pipelines comerciales', before: '5', after: '1', impact: 'Las unidades de negocio pasan a ser un filtro, no un pipeline aparte' },
        { metric: 'Vista de la dirección', before: 'Aislada', after: 'Consolidada', impact: 'Todo el negocio en un solo tablero' },
        { metric: 'Base de contactos', before: '~76k', after: '~68k', impact: 'Depurada en varias rondas: menos ruido en reportes y segmentaciones' },
      ],
      highlights: [
        { title: 'Probar antes de mover', text: 'Cada lote se validó por API antes de la carga definitiva.' },
        { title: 'Cada propiedad mapeada', text: 'Migrar entre portales exige mapear cada propiedad personalizada antes de mover un solo registro.' },
        { title: 'Depuración iterativa', text: 'La limpieza se hizo en rondas, no en una pasada: cada ronda revelaba el siguiente problema.' },
        { title: 'Un criterio común', text: 'Dirección comercial eligió MEDDIC; mi parte fue llevarlo a un pipeline de 9 etapas que ventas y dirección leen igual.' },
        { title: 'Fecha límite real', text: 'La licencia por vencer fijó el calendario y obligó a priorizar.' },
      ],
      phases: [
        { name: 'Inventario de objetos y propiedades' },
        { name: 'Migración por API' },
        { name: 'Depuración en rondas' },
        { name: 'Análisis histórico de MQL' },
        { name: 'Modelo MEDDIC de 9 etapas' },
      ],
      architecture: {
        caption: 'Migración entre portales y modelo único de pipeline',
        columns: [
          col('Origen', ['2 portales HubSpot', '5 pipelines por unidad']),
          col('Migración', ['API de HubSpot', 'objetos y actividades'], ['Python', 'scripts y depuración']),
          col('Destino', ['HubSpot', 'portal nuevo'], ['Pipeline MEDDIC', '9 etapas']),
          col('Uso', ['Tablero único', 'dirección general'], ['Unidades de negocio', 'como filtro']),
        ],
      },
    },
    'migracion-dynamics-hubspot': {
      summary:
        'Marketing ya precalificaba leads en HubSpot mientras ventas operaba en Dynamics. Impulsé la decisión de migrar todo el grupo a HubSpot y definí la estructura del nuevo CRM; la migración técnica la ejecutó una agencia.',
      role: 'Impulsor de la decisión y responsable de la nueva estructura del CRM',
      duration: '~6 meses',
      team: 'Agencia de implementación + marketing y ventas',
      outcomes: [
        { metric: 'Sistemas de CRM', before: '2', after: '1', impact: 'Marketing y ventas sobre la misma base en todo el grupo' },
        { metric: 'Traspaso de leads', before: 'Manual', after: 'Automático', impact: 'Los leads calificados llegan a ventas sin pasar entre sistemas' },
        { metric: 'Licencias', before: 'Subutilizadas', after: 'En uso', impact: 'Se aprovechó el licenciamiento de HubSpot ya contratado' },
      ],
      highlights: [
        { title: 'Probar en pequeño', text: 'El uso de HubSpot en marketing fue la prueba de concepto que justificó migrar todo el grupo.' },
        { title: 'Argumento de negocio', text: 'La propuesta se sostuvo en dos datos: la integración que faltaba y una licencia que ya se pagaba.' },
        { title: 'Redefinir el embudo', text: 'Definí las etapas del ciclo de vida, las propiedades y el scoring de marketing, y cómo un lead pasa a MQL y SQL hasta ventas.' },
        { title: 'Reglas para la oportunidad', text: 'Quedó definido qué debe tener una oportunidad para darse de alta, para que ventas reciba negocios completos y no solo nombres.' },
      ],
      phases: [
        { name: 'HubSpot como precalificador de marketing' },
        { name: 'Caso de negocio para migrar' },
        { name: 'Diseño de la estructura del CRM' },
        { name: 'Migración con agencia' },
      ],
      architecture: {
        caption: 'De dos sistemas a un CRM de grupo',
        columns: [
          col('Antes', ['HubSpot', 'precalificación de marketing'], ['Dynamics CRM', 'ventas']),
          col('Decisión', ['Caso de negocio', 'integración + licencia']),
          col('Estructura', ['Ciclo de vida', 'lead → MQL → SQL'], ['Scoring', 'de marketing'], ['Oportunidad', 'requisitos de alta']),
          col('Después', ['HubSpot', 'marketing y ventas del grupo'], ['Agencia', 'migración técnica']),
        ],
      },
    },
    'rescate-plataforma-cursos': {
      summary:
        'Una agencia me llamó porque la tienda de cursos de su cliente llevaba meses comprometida por malware. En 4 horas la dejé vendiendo de nuevo; en el mes siguiente cerré el incidente por completo.',
      role: 'Respuesta al incidente de punta a punta: forense, limpieza, recuperación y endurecimiento',
      duration: '4 horas para recuperar la operación · 1 mes para cerrar el incidente',
      team: 'Proyecto individual (freelance para una agencia)',
      outcomes: [
        { metric: 'Tiempo de recuperación', before: '', after: '4 horas', impact: 'La tienda volvió a vender el mismo día' },
        { metric: 'Accesos comprometidos', before: 'Activos', after: 'Cerrados', impact: 'Webshells eliminados y credenciales rotadas' },
        { metric: 'Operación de la tienda', before: 'En riesgo', after: 'Restaurada', impact: 'Ventas sin exponer datos de usuarios' },
        { metric: 'Reinfecciones', before: '', after: '0', impact: 'Sin reinfección desde 2024' },
      ],
      highlights: [
        { title: 'Cerrar la entrada, no solo limpiar', text: 'En hosting compartido no basta con borrar archivos: si no se cierran los accesos, el malware vuelve.' },
        { title: 'Forense antes que limpieza', text: 'El análisis por SSH definió qué limpiar y qué credenciales rotar.' },
        { title: 'Recuperar no es cerrar', text: 'La tienda volvió a operar en horas, pero cerrar el incidente tomó un mes: configuraciones, residuos y páginas que el malware había dejado.' },
        { title: 'Seguridad como práctica', text: 'Configuro el endurecimiento y la seguridad de mis propios servidores y de los que opero; este caso es esa práctica aplicada a un incidente real.' },
      ],
      phases: [
        { name: 'Análisis forense por SSH' },
        { name: 'Eliminación de webshells' },
        { name: 'Recuperación de cuentas' },
        { name: 'Limpieza de residuos y páginas inyectadas' },
        { name: 'Endurecimiento' },
      ],
      architecture: {
        caption: 'Respuesta a un incidente en WordPress',
        columns: [
          col('Detección', ['SSH', 'análisis forense']),
          col('Contención', ['Webshells', 'eliminados'], ['Credenciales', 'rotadas']),
          col('Recuperación', ['WordPress', 'endurecido'], ['WooCommerce', 'operando']),
        ],
      },
    },
    'buildations-ia': {
      summary:
        'Monté un laboratorio de IA sobre infraestructura propia para desarrollar motores de RevOps y de presencia en buscadores sin depender de plataformas SaaS.',
      role: 'Fundador · arquitectura y operación',
      outcomes: [
        { metric: 'Operación continua', before: '', after: '+1 año', impact: 'Operación continua en producción' },
        { metric: 'Motores en producción', before: '', after: '2', impact: 'Revenue Intelligence y Search & Presence' },
        { metric: 'Costo frente a SaaS', before: C, after: C, impact: C },
      ],
      highlights: [
        { title: 'Inversión única, no suscripción', text: 'El costo se paga una vez en hardware; la condición es contar con quien lo opere.' },
        { title: 'Seguridad por capas', text: 'Wazuh, Suricata, CrowdSec y Fail2ban, con acceso solo por Tailscale.' },
        { title: 'Observabilidad', text: 'Grafana, Prometheus y Loki para ver qué pasa antes de que falle.' },
        { title: 'Respaldos verificados', text: 'Restic con copia fuera del servidor y verificación semanal.' },
      ],
      phases: [
        { name: 'Servidor y contenedores' },
        { name: 'Datos y modelos' },
        { name: 'Orquestación de motores' },
        { name: 'Seguridad y monitoreo' },
        { name: 'Respaldos' },
      ],
      architecture: {
        caption: 'Infraestructura propia para motores de IA',
        columns: [
          col('Datos', ['PostgreSQL', 'datos operativos'], ['Qdrant', 'vectores']),
          col('Modelos', ['Ollama', 'LLM local'], ['ComfyUI', 'imágenes']),
          col('Orquestación', ['n8n', 'flujos'], ['Docker', 'contenedores']),
          col('Operación', ['Tailscale', 'acceso'], ['Grafana', 'monitoreo'], ['Restic', 'respaldos']),
        ],
      },
    },
  }
  const isEmpty = (v: any) => v == null || v === '' || (Array.isArray(v) && v.length === 0) || (typeof v === 'object' && !Array.isArray(v) && !(v.columns || []).length)
  const hasPlaceholder = (v: any) => v != null && JSON.stringify(v).includes(C)
  // Campos reescritos a propósito tras la entrevista (pisan lo que haya en el CMS)
  const FORCE: Record<string, string[]> = {
    'sitio-b2b-visible': ['outcomes', 'highlights'],
    'forecast-confiable': ['summary', 'outcomes', 'highlights', 'architecture'],
    'migracion-dynamics-hubspot': ['summary', 'outcomes', 'highlights', 'phases', 'architecture'],
    'rescate-plataforma-cursos': ['summary', 'outcomes', 'highlights', 'phases'],
  }
  for (const [slug, data] of Object.entries(CASES)) {
    const found = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
    const doc = found.docs[0] as any
    if (!doc) continue
    const force = FORCE[slug] || []
    const patch = Object.fromEntries(
      Object.entries(data).filter(([k]) => isEmpty(doc[k]) || hasPlaceholder(doc[k]) || force.includes(k)),
    )
    if (Object.keys(patch).length) await payload.update({ collection: 'projects', id: doc.id, data: patch, context: ctx })
  }

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

  // Expertise: competencias, entregables y herramientas (solo si están vacíos, para no pisar lo editado a mano)
  const S = (...xs: [string, number][]) => xs.map(([name, level]) => ({ name, level: String(level) }))
  const EXPERTISE_EXTRA: Record<string, { skills: any[]; deliverables: string[]; tools: string[] }> = {
    'generacion-demanda-b2b': {
      skills: S(['Estrategia para ciclos largos', 5], ['MQL, SQL y SLA', 5], ['Eventos medidos a pipeline', 4], ['Nurturing y automatización', 4], ['Outbound coordinado con SDR', 4], ['ABM', 3]),
      deliverables: ['Plan de demanda calculado desde la meta de ingresos', 'Definición de MQL, SQL y SLA firmada por marketing y ventas', 'Programa de nurturing por etapa de compra', 'Tablero de pipeline generado por canal'],
      tools: ['HubSpot', 'LinkedIn Sales Navigator', 'Apollo', 'Zapier', 'Make', 'GA4'],
    },
    'seo-aeo-geo': {
      skills: S(['SEO técnico', 4], ['Contenido para buscadores e IA', 4], ['Datos estructurados', 4], ['Migraciones sin perder tráfico', 4], ['Medición de visibilidad en IA', 3]),
      deliverables: ['Auditoría técnica priorizada', 'Arquitectura de contenido por intención de búsqueda', 'Datos estructurados para servicios, artículos y preguntas frecuentes', 'Medición mensual de visibilidad en buscadores y motores de IA'],
      tools: ['Search Console', 'Semrush', 'Ahrefs', 'Screaming Frog', 'PageSpeed Insights', 'GA4', 'Claude'],
    },
    'paid-media': {
      skills: S(['Estrategia orientada a pipeline', 4], ['Medición y atribución', 4], ['Landing de campaña', 4], ['Operación de Google Ads', 3], ['Operación de LinkedIn Ads', 3]),
      deliverables: ['Estrategia y presupuesto por canal desde la meta de pipeline', 'Estructura de campañas y audiencias por cuenta', 'Landing pages de campaña conectadas al CRM', 'Reporte de costo por oportunidad y ROMI'],
      tools: ['Estrategia de paid media B2B', 'Google Ads (operación)', 'LinkedIn Ads (operación)', 'Meta Ads', 'Google Tag Manager (web y server-side)', 'GA4'],
    },
    'crm-revops': {
      skills: S(['Implementación de HubSpot', 5], ['Migración de CRM', 5], ['Modelado de pipeline (MEDDIC)', 5], ['Depuración de datos', 5], ['Atribución y reporting', 4], ['Automatización por API', 4]),
      deliverables: ['Auditoría del CRM con plan de depuración priorizado', 'Modelo de pipeline con criterios de salida por etapa', 'Migración entre CRMs con historial y propiedades mapeadas', 'Tablero de forecast y atribución para dirección'],
      tools: ['HubSpot', 'HubSpot API + Python', 'Modelo MEDDIC', 'Dynamics 365 / Dynamics CRM', 'Zapier', 'Make', 'BigQuery', 'Metabase'],
    },
    'web-herramientas': {
      skills: S(['Sitios B2B', 5], ['Landing interactivas y calculadoras', 5], ['Integración formulario–CRM', 5], ['WordPress', 5], ['Next.js y headless', 4], ['CRO', 3]),
      deliverables: ['Sitio B2B diseñado desde las preguntas del comprador', 'Calculadoras y herramientas interactivas que captan leads', 'Formularios integrados al CRM sin pérdida de datos', 'Medición de conversiones por página'],
      tools: ['WordPress + Divi 5', 'Next.js + Payload CMS', 'Vercel', 'Kinsta', 'Cloudflare (DNS, Workers, Tunnel)', 'Figma', 'Microsoft Clarity', 'Hotjar'],
    },
    'liderazgo-equipos': {
      skills: S(['Coordinación marketing–ventas', 5], ['Equipos de hasta 6 personas', 4], ['Planeación y OKRs', 4], ['Contratación y onboarding', 3]),
      deliverables: ['Estructura de roles con un número del embudo por persona', 'Rituales semanales con ventas y tablero común', 'Plan trimestral con objetivos ligados al pipeline'],
      tools: ['Notion', 'Asana', 'Monday', 'Slack', 'HubSpot'],
    },
    'motores-ia': {
      skills: S(['Infraestructura propia', 5], ['Automatización con n8n', 4], ['Modelos locales (LLM)', 4], ['RAG y bases vectoriales', 3], ['Generación de imágenes', 3]),
      deliverables: ['Motores de IA corriendo en infraestructura propia', 'Automatizaciones de contenido y datos con revisión humana', 'Monitoreo, seguridad y respaldos del entorno'],
      tools: ['Ollama', 'Qdrant', 'n8n', 'ComfyUI', 'PostgreSQL / SQL', 'Docker', 'Claude', 'Langfuse'],
    },
  }
  for (const [slug, extra] of Object.entries(EXPERTISE_EXTRA)) {
    const found = await payload.find({ collection: 'expertise', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
    const doc = found.docs[0] as any
    if (!doc) continue
    const patch: any = {}
    if (!doc.skills?.length) patch.skills = extra.skills
    if (!doc.deliverables?.length) patch.deliverables = extra.deliverables.map((item) => ({ item }))
    if (!doc.tools?.length) {
      const tools = await payload.find({ collection: 'tools', where: { name: { in: extra.tools } }, limit: 50, depth: 0 })
      if (tools.docs.length) patch.tools = tools.docs.map((t: any) => t.id)
    }
    if (Object.keys(patch).length) await payload.update({ collection: 'expertise', id: doc.id, data: patch, context: ctx })
  }

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

  // El seed escribe con disableRevalidate (para no disparar un aviso por documento);
  // al final se pide una sola revalidación para que el sitio muestre lo nuevo de inmediato.
  const frontend = process.env.FRONTEND_URL
  const secret = process.env.REVALIDATE_SECRET
  if (frontend && secret) {
    try {
      const res = await fetch(`${frontend.replace(/\/$/, '')}/next/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': secret },
        body: JSON.stringify({ tags: ['cms'] }),
      })
      console.log(`  revalidación del sitio: ${res.status}`)
    } catch (e) {
      console.warn('  no se pudo revalidar el sitio:', (e as Error).message)
    }
  } else {
    console.warn('  sin FRONTEND_URL o REVALIDATE_SECRET: el sitio se actualizará al vencer la caché (hasta 1 h)')
  }

  console.log('✅ Seed complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
