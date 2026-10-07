/** Servicios de consultoría (página /consultoria y selector del formulario). */
export type Service = {
  id: string
  title: string
  duration: string
  summary: string
  deliverables: string[]
  caseSlug?: string // caso relacionado en /proyectos
  caseLabel?: string
  toolSlug: string // recurso con el que conviene empezar
}

export const SERVICES: Service[] = [
  {
    id: 'revops',
    title: 'Consultoría de generación de demanda y CRM',
    duration: '2 a 4 semanas',
    summary:
      'Ordeno cómo llegan, se califican y se siguen tus leads para que marketing y ventas trabajen sobre el mismo embudo.',
    caseSlug: 'forecast-confiable',
    caseLabel: 'Migración entre portales de HubSpot',
    toolSlug: 'madurez-revops',
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
    caseSlug: 'sitio-b2b-visible',
    caseLabel: 'Sitio B2B para buscadores e IA',
    toolSlug: 'auditor-aeo',
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
    caseSlug: 'migracion-dynamics-hubspot',
    caseLabel: 'Migración de Dynamics CRM a HubSpot',
    toolSlug: 'radiografia-stack',
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
    toolSlug: 'presupuesto-marketing',
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

export const FIT = [
  'Tus leads llegan por correo o WhatsApp y nadie sabe cuántos se convierten en venta.',
  'Tienes CRM, pero ventas no lo usa o los datos no son confiables.',
  'Inviertes en anuncios o en contenido y no puedes decir qué te trae clientes.',
  'Tu sitio no aparece en Google ni en las respuestas de la IA para lo que vendes.',
]

export const NOT_FIT = [
  'Buscas solo quien opere anuncios día a día, sin revisar el embudo.',
  'Necesitas resultados en una semana: un sistema de demanda tarda meses en madurar.',
  'Nadie en tu equipo puede dedicar tiempo a definir y operar el proceso.',
]

export const STEPS = [
  { title: 'Llamada de 30 minutos', text: 'Entiendo dónde estás, qué intentaste y qué necesitas. Si no soy la persona indicada, te lo digo.', note: 'Sin costo' },
  { title: 'Propuesta', text: 'Alcance, entregables, tiempos y precio por escrito.', note: 'En 3 días hábiles' },
  { title: 'Trabajo por fases', text: 'Avances con revisiones semanales: ves el trabajo mientras se hace, no al final.', note: '2 a 8 semanas' },
  { title: 'Entrega y documentación', text: 'Todo queda en tus cuentas y documentado, con tu equipo capacitado para operarlo sin depender de mí.', note: 'Opcional: mentoría' },
]

export const PRICE_FACTORS = [
  { title: 'Estado de tus datos', text: 'Una base limpia de 2 mil contactos no es lo mismo que 60 mil duplicados en dos sistemas.', tag: 'Migración y limpieza' },
  { title: 'Cuántas piezas hay que conectar', text: 'Portales, pipelines, formularios, sitio, herramientas de anuncios e integraciones.', tag: 'Implementación' },
  { title: 'Alcance del contenido', text: 'Cuántas páginas de servicio, artículos o idiomas entran en el plan.', tag: 'SEO + AEO' },
  { title: 'Tu equipo', text: 'Si hay alguien que opere después o si necesitas más capacitación y acompañamiento.', tag: 'Todos' },
  { title: 'Plazo', text: 'Un plazo más corto requiere más horas en paralelo.', tag: 'Todos' },
]

export const NEEDS = [
  'Una persona responsable de tu lado, con unas horas a la semana.',
  'Acceso a tu CRM, GA4, Search Console y cuentas de anuncios (o crearlas juntos).',
  'Datos de ventas: cuántos clientes cierras, de qué tamaño y en cuánto tiempo.',
  'Alguien de ventas para acordar qué es un lead calificado.',
]

export const GETS = [
  'Todo en tus cuentas, a tu nombre: nada queda amarrado a mí.',
  'Documentación de lo que se hizo y por qué.',
  'Un plan priorizado de lo que sigue.',
]

export const FAQ = [
  { q: '¿Trabajas solo con HubSpot?', a: 'Trabajo principalmente con HubSpot, y he trabajado en migraciones desde Dynamics CRM y entre portales de HubSpot. Si usas otro CRM, lo revisamos en la llamada.' },
  { q: '¿Qué pasa después de la entrega?', a: 'Tu equipo queda capacitado y con documentación. Si quieres acompañamiento, la mentoría mensual sigue el trabajo; si no, puedes escribirme cuando lo necesites.' },
  { q: '¿Ejecutas campañas o solo das recomendaciones?', a: 'Las dos cosas, según el servicio: las consultorías entregan diagnóstico y plan; la implementación deja todo funcionando, campañas incluidas.' },
  { q: '¿Cuánto tardas en mandar la propuesta?', a: 'Tres días hábiles después de la llamada, con alcance, entregables, tiempos y precio por escrito.' },
  { q: '¿Cada cuánto veo avances?', a: 'Cada semana hay una revisión de avances, para que veas el trabajo mientras se hace.' },
]
