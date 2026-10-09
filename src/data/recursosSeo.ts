import type { Metadata } from 'next'

import { canonical } from '@/lib/seo'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

/**
 * SEO de cada herramienta de /recursos: la frase que la gente busca (kw), el título y la descripción para Google,
 * el H1 de la página y las preguntas frecuentes que se muestran abajo (con su FAQPage en JSON-LD).
 * La frase objetivo es una hipótesis: revísala con Search Console cuando haya impresiones.
 */
export type ToolSeo = {
  kw: string
  title: string // ≤ 60 caracteres; va sin el sufijo del sitio
  description: string // ≤ 160 caracteres
  h1: string
  faq: [q: string, a: string][]
}

export const TOOL_SEO: Record<string, ToolSeo> = {
  icp: {
    kw: 'generador de ICP',
    title: 'Generador de ICP gratis: perfil de cliente ideal B2B',
    description: 'Arma tu perfil de cliente ideal (ICP) B2B en 6 pasos: industria, tamaño, ticket, ciclo de compra y quién decide. Gratis y en PDF.',
    h1: 'Generador de ICP: perfil de cliente ideal B2B',
    faq: [
      ['¿Qué es un ICP?', 'El ICP (ideal customer profile) describe a la empresa que más te conviene como cliente: industria, tamaño, ticket, ciclo de compra y quién decide. Describe una empresa, no a una persona.'],
      ['¿En qué se diferencia el ICP del buyer persona?', 'El ICP dice a qué empresas venderle; el buyer persona describe a las personas dentro de esas empresas que investigan, influyen y deciden. Primero se define el ICP y después las personas.'],
      ['¿Cómo defino mi ICP si tengo pocos clientes?', 'Parte de tus mejores clientes actuales, los que pagan bien, se quedan y no consumen soporte de más, y busca qué tienen en común. Revisa el perfil cada trimestre con los negocios que vas cerrando.'],
    ],
  },
  'embudo-inverso': {
    kw: 'calculadora de embudo de ventas',
    title: 'Calculadora de embudo inverso: leads, MQL y SQL por mes',
    description: 'Calcula gratis cuántas visitas, leads, MQL y SQL necesitas cada mes para llegar a tu meta de ingresos B2B, de abajo hacia arriba.',
    h1: 'Calculadora de embudo inverso: los leads que necesitas para tu meta',
    faq: [
      ['¿Qué es un embudo inverso?', 'Es calcular el embudo de abajo hacia arriba: de la meta de ingresos a los negocios que necesitas, y con cada tasa de conversión hacia atrás hasta las oportunidades, SQL, MQL, leads y visitas.'],
      ['¿Qué tasas de conversión uso?', 'Las de tu CRM de los últimos 2 o 3 trimestres. Los valores que trae la calculadora son de ejemplo, salvo MQL → SQL (6.5 %), que es un dato real de operación.'],
      ['¿Cómo paso del número anual al mensual?', 'Divide entre los meses del año, pero recuerda que un lead de hoy cierra después del ciclo de venta: si tu ciclo es de 4 meses, los leads del Q4 se generan desde el Q3.'],
    ],
  },
  'roas-romi-roi': {
    kw: 'calculadora de ROAS',
    title: 'Calculadora de ROAS, ROMI y ROI de marketing',
    description: 'Calcula gratis ROAS, ROMI y ROI de tus campañas con sus fórmulas y entiende por qué un ROAS alto puede esconder pérdidas.',
    h1: 'Calculadora de ROAS, ROMI y ROI',
    faq: [
      ['¿Cuál es la diferencia entre ROAS y ROMI?', 'El ROAS divide ingresos entre inversión en medios. El ROMI usa el margen y todos los costos de marketing (herramientas, contenido, equipo), así que muestra si de verdad ganas dinero.'],
      ['¿Cómo se calcula el ROAS?', 'ROAS = ingresos atribuidos a la campaña ÷ inversión en medios. Un ROAS de 4 significa 4 pesos de venta por cada peso en anuncios, antes de costos y margen.'],
      ['¿Por qué un ROAS alto puede no ser rentable?', 'Porque no descuenta el costo de lo que vendes ni el resto del gasto de marketing. Con márgenes bajos, un ROAS alto puede dar un ROMI negativo.'],
    ],
  },
  'madurez-revops': {
    kw: 'diagnóstico RevOps',
    title: 'Diagnóstico de madurez RevOps gratis en 10 preguntas',
    description: 'Mide gratis qué tan madura es tu operación de revenue en cinco áreas: datos y CRM, procesos, alineación, medición y tecnología.',
    h1: 'Diagnóstico de madurez RevOps',
    faq: [
      ['¿Qué es RevOps?', 'Revenue Operations une los procesos, datos y herramientas de marketing, ventas y servicio para que trabajen sobre un mismo embudo, con definiciones y métricas compartidas.'],
      ['¿Qué mide este diagnóstico?', 'Diez preguntas en cinco áreas: datos y CRM, procesos, alineación, medición y tecnología. Cada área se lleva a una escala de 0 a 100 para ver por dónde empezar.'],
      ['¿Por dónde empiezo si salgo bajo?', 'Casi siempre por los datos y las definiciones: qué es un MQL y un SQL, quién es dueño de cada contacto y qué campos son obligatorios. Sin eso, la medición y la automatización no se sostienen.'],
    ],
  },
  'presupuesto-marketing': {
    kw: 'calculadora de presupuesto de marketing',
    title: 'Calculadora de presupuesto de marketing B2B por canal',
    description: 'Calcula gratis tu presupuesto anual de marketing B2B desde tu meta de ingresos: inversión por canal, CAC, ROMI y adelanto de caja.',
    h1: 'Calculadora de presupuesto de marketing B2B',
    faq: [
      ['¿Cómo calculo mi presupuesto de marketing?', 'Desde la meta: meta ÷ ticket da los clientes; con la conversión de lead a cliente salen los leads; por el costo por lead, la inversión en medios. Al final se suman los costos fijos de herramientas, contenido y equipo.'],
      ['¿Por qué no usar un porcentaje de las ventas?', 'El porcentaje sirve para comparar, pero no dice si alcanza para la meta. Calcularlo desde el embudo te dice cuánto necesitas y en qué canal.'],
      ['¿Qué es el adelanto de caja?', 'Lo que inviertes antes de recibir el primer ingreso, porque en B2B la venta tarda meses en cerrar. Conviene tenerlo resuelto antes de arrancar las campañas.'],
    ],
  },
  'auditor-aeo': {
    kw: 'auditoría AEO',
    title: 'Auditoría AEO gratis: ¿la IA puede leer tu sitio?',
    description: 'Revisa gratis si ChatGPT, Claude, Perplexity y Google pueden leer y citar tu sitio: bots de IA, robots.txt, llms.txt y datos estructurados.',
    h1: 'Auditor AEO: ¿tu sitio está listo para la IA?',
    faq: [
      ['¿Qué es AEO?', 'Answer Engine Optimization: preparar tu sitio para que los motores de respuesta con IA (ChatGPT, Perplexity, Gemini, los resúmenes de Google) puedan leerlo, entenderlo y citarlo.'],
      ['¿Qué revisa la auditoría?', 'Nueve puntos en tres grupos: acceso (robots.txt y servidor para bots de IA), lectura (contenido en el HTML, título, descripción y llms.txt) y estructura (datos estructurados, sitemap, canónica e idioma).'],
      ['¿AEO reemplaza al SEO?', 'No. Lo básico del SEO (que el sitio se rastree, cargue rápido y tenga contenido claro) es la base del AEO; el AEO agrega lo que necesitan los bots de IA para citarte.'],
    ],
  },
  'brecha-pipeline': {
    kw: 'calculadora de forecast de ventas',
    title: 'Calculadora de forecast y cobertura de pipeline',
    description: '¿Llegas a la meta del trimestre? Forecast ponderado por etapa, cobertura, probabilidad de llegar y el pipeline nuevo que te falta.',
    h1: 'Calculadora de brecha de pipeline y forecast',
    faq: [
      ['¿Qué es el forecast ponderado?', 'Lo ya ganado más cada etapa del pipeline multiplicada por su probabilidad de cerrarse dentro del trimestre. Usar la probabilidad del trimestre, y no la de "algún día", evita que el forecast se infle.'],
      ['¿Qué cobertura de pipeline necesito?', 'Depende de tu tasa de cierre: si cierras 1 de cada 4 oportunidades, necesitas unas 4 veces lo que te falta. Calcula la tuya con tu histórico en lugar de usar una regla fija.'],
      ['¿Cómo se calcula la probabilidad de llegar a la meta?', 'Se simulan 10,000 trimestres: cada etapa se parte en negocios del tamaño de tu ticket y cada uno se gana o no según su probabilidad. El resultado es la parte de simulaciones que llega a la meta.'],
    ],
  },
  'cpl-maximo': {
    kw: 'calcular costo por lead',
    title: 'Calculadora de CPL máximo: cuánto pagar por un lead',
    description: 'Calcula gratis cuánto puedes pagar por un lead y por un clic sin perder dinero: CAC, CPL y CPC máximos desde tu margen.',
    h1: 'Calculadora de CPL y CPC máximo',
    faq: [
      ['¿Cómo se calcula el CPL máximo?', 'CAC máximo × conversión de lead a cliente. El CAC máximo sale del margen de tu primer negocio por la parte que estás dispuesto a invertir para conseguir al cliente.'],
      ['¿Y el CPC máximo?', 'CPL máximo × conversión de visita a lead. Es lo más que conviene pujar por un clic en anuncios con tu conversión actual.'],
      ['¿Qué hago si el CPL de mis campañas está arriba del máximo?', 'O bajas el costo (segmentación, creatividad, puja) o subes la conversión (landing, oferta, calificación). Mejorar la conversión de lead a cliente sube el CPL que te puedes permitir.'],
    ],
  },
  'radiografia-stack': {
    kw: 'qué tecnología usa una página web',
    title: '¿Qué tecnología usa una página web? CMS, CRM y píxeles',
    description: 'Descubre gratis qué CMS, analítica, CRM, píxeles, chat y correo usa cualquier sitio web, con un diagnóstico de lo que le falta.',
    h1: 'Radiografía de stack: qué tecnología usa un sitio web',
    faq: [
      ['¿Cómo sé qué CMS o CRM usa una página?', 'Escribe el dominio: el analizador lee la portada, los encabezados, los registros DNS y el contenedor público de Google Tag Manager, y busca las señales de unas 80 herramientas de marketing B2B.'],
      ['¿Qué detecta?', 'Ocho bandas: CMS, analítica, CRM, publicidad, conversión, privacidad, infraestructura y correo. Lo que encuentra dentro de Tag Manager se marca como vía GTM.'],
      ['¿Por qué no aparece una herramienta que sé que usan?', 'Lo que se carga desde el servidor o por gestores de etiquetas distintos a Tag Manager puede no verse desde fuera.'],
    ],
  },
  'velocidad-real': {
    kw: 'medir Core Web Vitals',
    title: 'Medir Core Web Vitals gratis: LCP, INP y CLS reales',
    description: 'Mide gratis qué tan rápido carga un sitio para sus visitas reales (LCP, INP y CLS) y qué arreglar primero, en móvil y escritorio.',
    h1: 'Velocidad real: Core Web Vitals de un sitio',
    faq: [
      ['¿Qué son las Core Web Vitals?', 'Tres métricas de Google sobre la experiencia de carga: LCP (cuánto tarda en verse lo principal), INP (qué tan rápido responde al tocar) y CLS (cuánto se mueve la página mientras carga). Google las usa como señal para posicionar.'],
      ['¿Cuál es la diferencia entre datos de campo y de laboratorio?', 'Los de campo vienen del Chrome UX Report: lo que vivieron las visitas reales en los últimos 28 días. Los de laboratorio simulan una visita y sirven para estimar cuánto ahorra cada arreglo.'],
      ['¿Por qué no salen datos de campo de mi sitio?', 'Google solo publica datos de campo de sitios con suficiente tráfico. Mientras tanto, usa la prueba de laboratorio.'],
    ],
  },
  'salud-correo': {
    kw: 'verificar SPF DKIM DMARC',
    title: 'Verificador de SPF, DKIM y DMARC gratis',
    description: 'Revisa gratis si tu dominio cumple los requisitos de Gmail y Yahoo: SPF, DKIM, DMARC, MTA-STS, listas negras y quién envía en tu nombre.',
    h1: 'Salud del correo: SPF, DKIM, DMARC y listas negras',
    faq: [
      ['¿Qué son SPF, DKIM y DMARC?', 'SPF dice qué servidores pueden enviar en nombre de tu dominio, DKIM firma cada correo y DMARC le dice al receptor qué hacer con los que fallan. Juntos evitan que suplanten tu dominio.'],
      ['¿Por qué mis correos llegan a spam?', 'Las causas más comunes son SPF o DKIM mal configurados, no tener DMARC o estar en una lista negra. Desde 2024 Gmail y Yahoo exigen los tres a quien envía correos masivos.'],
      ['¿Por qué no encuentra mi DKIM?', 'DKIM se busca en los selectores más comunes; si tu proveedor usa uno propio puede existir aunque no aparezca aquí.'],
    ],
  },
  'comparador-competidores': {
    kw: 'analizar página web de la competencia',
    title: 'Analiza el sitio de tu competencia: velocidad, IA y stack',
    description: 'Compara gratis tu sitio con hasta dos competidores: velocidad real, preparación para buscadores con IA, CRM, publicidad y correo.',
    h1: 'Comparador de competidores: tu sitio contra dos más',
    faq: [
      ['¿Qué compara?', 'Corre tres análisis sobre cada dominio: preparación para buscadores con IA, el stack de marketing (CRM, analítica, publicidad, agenda y correo) y la velocidad móvil con datos de Chrome. Después los pone lado a lado.'],
      ['¿De dónde salen los datos?', 'Solo de señales públicas: el HTML del sitio, sus registros DNS, Tag Manager y el Chrome UX Report de Google.'],
      ['¿Por qué un competidor sale con datos incompletos?', 'Los sitios con poco tráfico no tienen datos de velocidad real, y las herramientas cargadas desde el servidor pueden no detectarse.'],
    ],
  },
  'te-recomienda-la-ia': {
    kw: 'mi empresa aparece en la IA',
    title: '¿Tu empresa aparece en las respuestas de la IA?',
    description: 'Descubre gratis si la IA recomienda tu empresa cuando alguien busca tu servicio: menciones, posición y competidores que aparecen.',
    h1: '¿Te recomienda la IA? Revisa si menciona tu empresa',
    faq: [
      ['¿Cómo sé si la IA recomienda mi empresa?', 'La herramienta le hace a Gemini cinco preguntas que haría un comprador de tu servicio y cuenta en cuántas respuestas apareces, en qué lugar y qué competidores menciona.'],
      ['¿Sirve para ChatGPT o Perplexity?', 'Mide un solo motor (Gemini) y sin búsqueda en vivo. Otros motores pueden responder distinto, pero suelen apoyarse en las mismas fuentes públicas.'],
      ['¿Cómo hago que la IA me mencione?', 'Que tu sitio sea legible para los bots de IA, que diga con claridad qué haces y para quién, y que otros sitios te mencionen. El Auditor AEO revisa la primera parte.'],
    ],
  },
  'explorador-busquedas': {
    kw: 'buscador de palabras clave gratis',
    title: 'Buscador de palabras clave gratis: búsquedas reales',
    description: 'Encuentra gratis las búsquedas y preguntas reales de Google alrededor de una palabra, agrupadas por intención, con ideas de contenido.',
    h1: 'Explorador de búsquedas: palabras clave y preguntas reales',
    faq: [
      ['¿De dónde salen las búsquedas?', 'Del autocompletado de Google: la herramienta escribe tu palabra con unas 30 variantes (qué, cómo, cuánto, mejor, precio, alternativas) y junta las sugerencias. Son búsquedas que la gente hace de verdad.'],
      ['¿Muestra el volumen de búsqueda?', 'No. Google no publica el volumen en el autocompletado; la señal de popularidad sirve para comparar búsquedas entre sí, no para saber cuántas personas buscan cada una.'],
      ['¿Cómo agrupa los temas?', 'Gemini agrupa las búsquedas por intención y propone qué pieza de contenido escribir para cada grupo.'],
    ],
  },
  'auditoria-crm': {
    kw: 'auditoría de CRM',
    title: 'Auditoría de CRM gratis: duplicados y calidad de datos',
    description: 'Sube la exportación de contactos de tu CRM y descubre gratis duplicados, datos incompletos, contactos sin propietario e inactivos.',
    h1: 'Auditoría de CRM: salud de tu base de contactos',
    faq: [
      ['¿Con qué CRM funciona?', 'Con cualquiera que exporte a CSV: HubSpot, Salesforce, Pipedrive, Zoho y otros. Las columnas se detectan por su nombre.'],
      ['¿Mis datos se suben a algún servidor?', 'No. El análisis corre en tu navegador; si pides el plan por correo solo se envían las cifras resumidas.'],
      ['¿Qué revisa?', 'Duplicados por correo, duplicados probables por nombre y empresa, correos inválidos o personales, contactos sin propietario, sin etapa del ciclo de vida y sin actividad en el último año.'],
    ],
  },
  'capacidad-comercial': {
    kw: 'cuántos vendedores necesito',
    title: '¿Cuántos vendedores y SDR necesito? Calculadora',
    description: 'Calcula gratis cuántos SDR y vendedores necesitas para tu meta, cuál es tu cuello de botella y cuándo empieza a cerrar alguien que contratas hoy.',
    h1: 'Capacidad comercial: ¿cuántos SDR y vendedores necesitas?',
    faq: [
      ['¿Cómo calculo cuántos vendedores necesito?', 'De la meta de ingresos nuevos y el ticket salen los negocios; con tu tasa de cierre, las oportunidades. Eso se divide entre lo que puede trabajar un vendedor y se compara con su cuota: el número mayor manda.'],
      ['¿Y cuántos SDR?', 'Las reuniones calificadas que necesitan tus vendedores entre las que entrega un SDR al mes.'],
      ['¿Cuándo empieza a vender alguien que contrato hoy?', 'Después de su rampa más un ciclo de venta completo. Por eso conviene contratar varios meses antes del trimestre en que lo necesitas.'],
    ],
  },
  'planeador-marketing': {
    kw: 'plan de marketing en Excel',
    title: 'Plan de marketing B2B en Excel: plantilla gratis',
    description: 'Arma tu plan de marketing anual gratis: cuota por trimestre, leads por mes, actividades, presupuesto y KPIs. Se descarga en Excel con fórmulas.',
    h1: 'Planeador de marketing B2B: tu plan anual en Excel',
    faq: [
      ['¿Qué incluye el plan?', 'Cuota por unidad y trimestre, el embudo hacia atrás hasta los leads de cada mes, actividades y su cobertura, presupuesto, KPIs, riesgos y seguimiento de lo real contra lo planeado.'],
      ['¿El Excel trae fórmulas?', 'Sí. Trae las mismas hojas que ves en pantalla con fórmulas vivas: si cambias una cuota o una tasa, se recalcula todo.'],
      ['¿Por qué empezar por la cuota de venta?', 'Porque el plan de marketing debe responder a cuánto pipeline necesita ventas y cuándo. Con el ciclo de venta, el planeador te dice en qué mes hay que generar cada lead.'],
    ],
  },
  'velocidad-pipeline': {
    kw: 'calculadora de sales velocity',
    title: 'Calculadora de velocidad de pipeline (sales velocity)',
    description: 'Calcula gratis cuánto dinero sale de tu pipeline por día, qué palanca mover para llegar a la meta y qué explicó el cambio contra el trimestre anterior.',
    h1: 'Calculadora de velocidad de pipeline',
    faq: [
      ['¿Cómo se calcula la velocidad de pipeline?', 'Oportunidades abiertas × ticket promedio × tasa de cierre ÷ días del ciclo de venta. El resultado es cuánto dinero sale de tu pipeline por día.'],
      ['¿Qué palanca conviene mover?', 'La calculadora te dice cuánto tendría que cambiar cada una por separado para llegar a la meta; elige la que tu equipo puede mover con menos esfuerzo.'],
      ['¿Qué datos uso?', 'Promedios de tu CRM de los últimos 2 o 3 trimestres. La fórmula supone que el pipeline se repone al ritmo en que cierra.'],
    ],
  },
  'ltv-cac': {
    kw: 'calculadora LTV CAC',
    title: 'Calculadora de LTV:CAC y payback del CAC',
    description: 'Calcula gratis cuánto vale un cliente contra lo que cuesta conseguirlo y en cuántos meses lo recuperas. Para suscripción o proyecto más recurrente.',
    h1: 'Calculadora de LTV:CAC y payback',
    faq: [
      ['¿Cómo se calcula el LTV:CAC?', 'El CAC es el gasto de marketing y ventas de un periodo entre los clientes nuevos de ese periodo. El LTV es el margen mensual por la vida promedio del cliente (1 ÷ cancelación mensual). La razón es LTV ÷ CAC.'],
      ['¿Cuál es un buen LTV:CAC?', 'La referencia común de la industria es 3:1 o más. Una razón muy alta también es señal: puede que estés invirtiendo poco en crecer.'],
      ['¿Qué es el payback del CAC?', 'Los meses que tarda el margen de un cliente en cubrir lo que costó conseguirlo. Las referencias comunes son hasta 12 meses en pymes, 12 a 18 en mercado medio y hasta 24 en empresas grandes.'],
    ],
  },
  'lead-scoring': {
    kw: 'modelo de lead scoring',
    title: 'Modelo de lead scoring B2B: constructor gratis',
    description: 'Arma gratis tu modelo de lead scoring de perfil e interés, calíbralo con la exportación de tu CRM y pruébalo. Incluye los pasos para HubSpot.',
    h1: 'Lead scoring B2B: arma y calibra tu modelo',
    faq: [
      ['¿Qué es el lead scoring?', 'Un puntaje que ordena a los leads por qué tan probable es que compren, con dos ejes: perfil (quién es: industria, tamaño, puesto) e interés (qué hace: pidió demo, visitó precios, fue a un webinar).'],
      ['¿Cómo asigno los puntos?', 'Sube tus contactos con una columna que diga si se volvieron cliente: por cada atributo se compara su conversión contra el promedio (lift) y se sugieren puntos con 10 × log₂ del lift.'],
      ['¿Cuándo pasa un lead a ventas?', 'Cuando suma el umbral y además cumple el perfil mínimo. Así evitas mandar a ventas a alguien muy activo que no puede comprarte.'],
    ],
  },
}

/** Metadatos de la página de una herramienta (título sin sufijo para que quepa la frase completa). */
export function toolMeta(slug: string): Metadata {
  const s = TOOL_SEO[slug]
  const path = `/recursos/${slug}`
  return {
    alternates: canonical(path),
    title: { absolute: s.title },
    description: s.description,
    openGraph: mergeOpenGraph({ title: s.title, description: s.description, url: path }),
  }
}
