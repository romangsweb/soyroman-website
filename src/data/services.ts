/** Servicios de consultoría (página /consultoria y selector del formulario). */
export type Service = {
  id: string
  title: string
  duration: string
  summary: string
  deliverables: string[]
}

export const SERVICES: Service[] = [
  {
    id: 'revops',
    title: 'Consultoría de generación de demanda y CRM',
    duration: '2 a 4 semanas',
    summary:
      'Ordeno cómo llegan, se califican y se siguen tus leads para que marketing y ventas trabajen sobre el mismo embudo.',
    deliverables: [
      'Diagnóstico del embudo actual: de dónde llegan los leads, qué pasa con ellos y dónde se pierden.',
      'Perfil de cliente ideal y definiciones de MQL y SQL acordadas con ventas.',
      'Diseño del pipeline y de los datos mínimos que el CRM debe capturar.',
      'Tablero base de métricas: leads, MQL, SQL, oportunidades y cierres.',
      'Plan priorizado para 90 días.',
    ],
  },
  {
    id: 'seo-aeo',
    title: 'Consultoría SEO + AEO',
    duration: '2 a 4 semanas',
    summary: 'Que te encuentren en Google y en las respuestas de los motores de IA, con contenido que atrae compradores.',
    deliverables: [
      'Auditoría técnica: velocidad, indexación, estructura y datos estructurados.',
      'Investigación de búsquedas y de las preguntas que hacen tus compradores.',
      'Arquitectura de contenidos: páginas de servicio y temas a cubrir.',
      'Recomendaciones para aparecer en las respuestas de los motores de IA.',
      'Plan de contenidos a 3 meses y medición en Search Console y GA4.',
    ],
  },
  {
    id: 'implementacion',
    title: 'Implementación',
    duration: '4 a 8 semanas',
    summary: 'Dejo funcionando el sistema completo: CRM, medición, sitio y campañas, con tu equipo capacitado para operarlo.',
    deliverables: [
      'CRM listo para usarse: pipeline, propiedades, formularios, automatizaciones básicas, y migración o limpieza de datos.',
      'Medición: GA4, Tag Manager, conversiones y UTMs.',
      'Sitio o landing pages conectados al CRM.',
      'Arranque de campañas de generación de demanda.',
      'Capacitación al equipo y documentación para operar sin depender de mí.',
    ],
  },
  {
    id: 'mentoria',
    title: 'Mentoría',
    duration: 'Mensual, mínimo 3 meses',
    summary: 'Acompañamiento al líder o al equipo de marketing para tomar mejores decisiones y sostener el ritmo.',
    deliverables: [
      'Sesiones con el líder o el equipo de marketing (por ejemplo, 2 al mes).',
      'Revisión de métricas y campañas.',
      'Acompañamiento en decisiones de herramientas, contrataciones y prioridades.',
      'Plantillas y playbooks.',
    ],
  },
]

export const AUDIENCE =
  'Pequeñas y medianas empresas en crecimiento que no tienen CRM o un área de marketing consolidada, y necesitan un sistema de generación de demanda que funcione y se pueda medir.'
