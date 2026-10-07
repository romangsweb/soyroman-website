/**
 * Catálogo de micro aplicativos de /recursos y dónde recomendarlos.
 * `preview` es lo que muestra la pantalla del mini aparato (resultado con los valores por defecto).
 */
export type Recurso = {
  slug: string
  href: string | null // null = próximamente
  code: string
  name: string
  sub: string
  desc: string
  preview: { label: string; value: string }
  glossary: string[] // términos del glosario que enlazan aquí
  expertise: string[] // áreas de expertise relacionadas
  categories: string[] // temas del blog relacionados
}

export const RECURSOS: Recurso[] = [
  {
    slug: 'embudo-inverso',
    href: '/recursos/embudo-inverso',
    code: 'EMBUDO I',
    name: 'Embudo inverso',
    sub: 'calculadora inversa',
    desc: 'De tu meta de ingresos a los leads, MQL y SQL que necesitas cada mes.',
    preview: { label: 'Leads / mes', value: '1,539' },
    glossary: ['lead', 'mql', 'sql', 'sal', 'embudo-de-ventas', 'pipeline', 'win-rate', 'tasa-de-conversion', 'forecast', 'velocidad-del-pipeline', 'kpi'],
    expertise: ['generacion-demanda-b2b', 'crm-revops'],
    categories: ['generacion-demanda', 'crm-revops', 'analitica'],
  },
  {
    slug: 'roas-romi-roi',
    href: '/recursos/roas-romi-roi',
    code: 'RENDIMIENTO',
    name: 'ROAS · ROMI · ROI',
    sub: 'roas · romi · roi',
    desc: 'Los tres indicadores de retorno con sus fórmulas y tus números.',
    preview: { label: 'ROAS', value: '6.0x' },
    glossary: ['roas', 'romi', 'roi', 'cac', 'cpl', 'cpa', 'cpc', 'ltv-cac', 'payback-cac', 'modelo-de-atribucion'],
    expertise: ['paid-media', 'generacion-demanda-b2b'],
    categories: ['paid-media', 'analitica'],
  },
  {
    slug: 'madurez-revops',
    href: '/recursos/madurez-revops',
    code: 'MADUREZ',
    name: 'Diagnóstico RevOps',
    sub: 'diagnóstico',
    desc: '10 preguntas para medir la madurez de tu operación de revenue.',
    preview: { label: 'Madurez', value: '62/100' },
    glossary: ['revops', 'crm', 'sla-marketing-ventas', 'ciclo-de-vida', 'forecast', 'modelo-de-atribucion', 'meddic'],
    expertise: ['crm-revops', 'liderazgo-equipos'],
    categories: ['crm-revops', 'liderazgo'],
  },
  {
    slug: 'icp',
    href: '/recursos/icp',
    code: 'ICP',
    name: 'Generador de ICP',
    sub: 'perfil ideal',
    desc: 'Arma el perfil de tu cliente ideal y descárgalo en PDF.',
    preview: { label: 'Perfil', value: 'ICP · PDF' },
    glossary: ['icp', 'buyer-persona', 'abm', 'lead-scoring', 'customer-journey', 'outbound'],
    expertise: ['generacion-demanda-b2b', 'paid-media'],
    categories: ['generacion-demanda', 'contenido-email', 'paid-media'],
  },
  {
    slug: 'presupuesto-marketing',
    href: '/recursos/presupuesto-marketing',
    code: 'BUDGET',
    name: 'Planificador de presupuesto',
    sub: 'mesa de mezcla',
    desc: 'De tu meta de ingresos al presupuesto anual por canal, con CAC, ROMI y adelanto de caja.',
    preview: { label: 'Presupuesto', value: '$382k/año' },
    glossary: ['cac', 'cpl', 'romi', 'roi', 'payback-cac', 'ltv-cac'],
    expertise: ['paid-media', 'generacion-demanda-b2b', 'crm-revops'],
    categories: ['paid-media', 'analitica', 'generacion-demanda'],
  },
  {
    slug: 'auditor-aeo',
    href: '/recursos/auditor-aeo',
    code: 'SCAN',
    name: 'Auditor AEO',
    sub: 'radar de IA',
    desc: '¿Pueden ChatGPT, Claude y Perplexity leer y citar tu sitio? Nueve pruebas y un plan de correcciones.',
    preview: { label: 'Preparación IA', value: '—/100' },
    glossary: ['aeo', 'geo', 'seo', 'schema-markup', 'serp'],
    expertise: ['seo-aeo-geo', 'web-herramientas'],
    categories: ['seo-aeo', 'sitios-web'],
  },
  {
    slug: 'brecha-pipeline',
    href: '/recursos/brecha-pipeline',
    code: 'PIPE',
    name: 'Brecha de pipeline',
    sub: 'secuenciador',
    desc: '¿Llegas a la meta del trimestre con lo que tienes abierto? Forecast ponderado, cobertura y el pipeline que te falta.',
    preview: { label: 'Brecha', value: '$172k' },
    glossary: ['forecast', 'pipeline', 'win-rate', 'velocidad-del-pipeline', 'embudo-de-ventas'],
    expertise: ['crm-revops', 'liderazgo-equipos'],
    categories: ['crm-revops', 'analitica'],
  },
  {
    slug: 'cpl-maximo',
    href: '/recursos/cpl-maximo',
    code: 'CPL MÁX',
    name: 'CPL máximo',
    sub: 'costo permitido',
    desc: '¿Cuánto puedes pagar por un lead y por un clic sin perder dinero? CAC, CPL y CPC máximos.',
    preview: { label: 'CPL máx', value: '$9.90' },
    glossary: ['cpl', 'cpc', 'cac', 'cpa', 'roas'],
    expertise: ['paid-media', 'generacion-demanda-b2b'],
    categories: ['paid-media', 'generacion-demanda'],
  },
  {
    slug: 'radiografia-stack',
    href: '/recursos/radiografia-stack',
    code: 'STACK',
    name: 'Radiografía de stack',
    sub: 'analizador',
    desc: '¿Qué CMS, analítica, CRM, píxeles y correo usa un sitio? Ocho bandas y un diagnóstico de lo que falta.',
    preview: { label: 'Bandas', value: '8 · SCAN' },
    glossary: ['crm', 'seo', 'modelo-de-atribucion', 'lead-scoring', 'landing-page'],
    expertise: ['web-herramientas', 'crm-revops', 'seo-aeo-geo'],
    categories: ['sitios-web', 'crm-revops', 'analitica'],
  },
  {
    slug: 'velocidad-real',
    href: '/recursos/velocidad-real',
    code: 'VEL',
    name: 'Velocidad real',
    sub: 'core web vitals',
    desc: '¿Qué tan rápido carga un sitio para sus visitas reales? LCP, INP y CLS de Chrome y qué arreglar primero.',
    preview: { label: 'LCP móvil', value: '2.4 s' },
    glossary: ['seo', 'landing-page', 'tasa-de-conversion'],
    expertise: ['web-herramientas', 'seo-aeo-geo'],
    categories: ['sitios-web', 'seo-aeo'],
  },
  {
    slug: 'salud-correo',
    href: '/recursos/salud-correo',
    code: 'MAIL',
    name: 'Salud del correo',
    sub: 'entregabilidad',
    desc: '¿Tus correos llegan a la bandeja? SPF, DKIM, DMARC, listas negras y los requisitos de Gmail y Yahoo.',
    preview: { label: 'Luces', value: '8 · DNS' },
    glossary: ['crm', 'lead', 'lead-nurturing'],
    expertise: ['generacion-demanda-b2b', 'crm-revops', 'web-herramientas'],
    categories: ['contenido-email', 'crm-revops'],
  },
  {
    slug: 'comparador-competidores',
    href: '/recursos/comparador-competidores',
    code: 'VS',
    name: 'Comparador de competidores',
    sub: 'hasta 3 dominios',
    desc: 'Tu sitio contra dos competidores: velocidad real, preparación para IA, CRM, publicidad y correo, lado a lado.',
    preview: { label: 'Dominios', value: '3 · VS' },
    glossary: ['seo', 'crm', 'benchmark'],
    expertise: ['seo-aeo-geo', 'web-herramientas', 'generacion-demanda-b2b'],
    categories: ['sitios-web', 'seo-aeo', 'analitica'],
  },
  {
    slug: 'te-recomienda-la-ia',
    href: '/recursos/te-recomienda-la-ia',
    code: 'IA·REC',
    name: '¿Te recomienda la IA?',
    sub: '5 preguntas en vivo',
    desc: 'Cuando alguien pregunta a la IA por tu servicio, ¿te menciona? Menciones, lugar, competidores y fuentes que consulta.',
    preview: { label: 'Menciones', value: '1 / 5' },
    glossary: ['seo', 'aeo', 'geo'],
    expertise: ['seo-aeo-geo', 'generacion-demanda-b2b'],
    categories: ['seo-aeo', 'ia-aplicada'],
  },
]

export const LIVE = RECURSOS.filter((r) => r.href)
export const recursosFor = (by: 'glossary' | 'expertise' | 'categories', keys: string | string[]) => {
  const k = Array.isArray(keys) ? keys : [keys]
  return LIVE.filter((r) => r[by].some((x) => k.includes(x)))
}
