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
]

export const LIVE = RECURSOS.filter((r) => r.href)
export const recursosFor = (by: 'glossary' | 'expertise' | 'categories', keys: string | string[]) => {
  const k = Array.isArray(keys) ? keys : [keys]
  return LIVE.filter((r) => r[by].some((x) => k.includes(x)))
}
