"""
Biblioteca de temas del motor de soyroman.com.

Formato: (tema, tipo, tema_padre, expertise_slug)
  - tipo: "pillar" (1500-2000 palabras) | "satellite" (600-900 palabras)
  - expertise_slug: slug de la colección Expertise en el CMS (se liga al post si existe)

Edita libremente: el motor elige al azar entre los temas que no ha usado
en sus últimas corridas exitosas.
"""

PILLARS = [
    ("RevOps para equipos B2B pequeños: alinear marketing, ventas y datos sin un área de operaciones", "pillar", "", "crm-revops"),
    ("Saneamiento de CRM: de una base caótica a un pipeline en el que se puede confiar", "pillar", "", "crm-revops"),
    ("Generación de demanda B2B con ciclos largos: del lead al pipeline medible", "pillar", "", "generacion-demanda-b2b"),
    ("SEO, AEO y GEO para empresas B2B: que te encuentren buscadores e IAs", "pillar", "", "seo-aeo-geo"),
    ("El sitio web B2B como sistema de captación: arquitectura, contenido y medición", "pillar", "", "web-herramientas"),
    ("Liderar un equipo de marketing B2B: diseño, contenido, SDR y paid bajo un mismo sistema", "pillar", "", "liderazgo-equipos"),
]

SATELLITES = [
    # CRM y RevOps
    ("Cómo detectar y fusionar duplicados en HubSpot sin romper el historial", "satellite", "saneamiento de CRM", "crm-revops"),
    ("Etapas de pipeline que reflejan cómo compra el cliente, no cómo vende el equipo", "satellite", "saneamiento de CRM", "crm-revops"),
    ("Por qué cinco pipelines distintos destruyen tu forecast", "satellite", "RevOps para equipos B2B pequeños", "crm-revops"),
    ("Propiedades de CRM: cuántas son demasiadas y cómo auditarlas", "satellite", "saneamiento de CRM", "crm-revops"),
    ("Lead scoring sin machine learning: un modelo simple que ventas sí usa", "satellite", "RevOps para equipos B2B pequeños", "crm-revops"),
    # Generación de demanda
    ("MQL y SQL: definiciones que marketing y ventas firman juntos", "satellite", "generación de demanda B2B", "generacion-demanda-b2b"),
    ("Nurturing para ciclos de venta B2B de 6 a 12 meses", "satellite", "generación de demanda B2B", "generacion-demanda-b2b"),
    ("Eventos B2B: cómo medir su impacto real en el pipeline", "satellite", "generación de demanda B2B", "generacion-demanda-b2b"),
    ("Outbound y contenido: cómo un SDR aprovecha lo que publica marketing", "satellite", "generación de demanda B2B", "generacion-demanda-b2b"),
    ("Account-Based Marketing sin herramientas caras: cómo empezar con 50 cuentas", "satellite", "generación de demanda B2B", "generacion-demanda-b2b"),
    ("Email marketing B2B: secuencias que la gente sí lee", "satellite", "generación de demanda B2B", "generacion-demanda-b2b"),
    ("Contenido B2B que genera pipeline: del blog al caso de estudio", "satellite", "generación de demanda B2B", "generacion-demanda-b2b"),
    ("LinkedIn orgánico para directivos B2B: publicar sin convertirse en influencer", "satellite", "generación de demanda B2B", "generacion-demanda-b2b"),
    # SEO / AEO / GEO
    ("Páginas de servicio B2B que responden preguntas: estructura para buscadores y para IAs", "satellite", "SEO, AEO y GEO para empresas B2B", "seo-aeo-geo"),
    ("Schema markup para empresas de servicios B2B: lo mínimo que sí importa", "satellite", "SEO, AEO y GEO para empresas B2B", "seo-aeo-geo"),
    ("Search Console para equipos de marketing: tres reportes para revisar cada semana", "satellite", "SEO, AEO y GEO para empresas B2B", "seo-aeo-geo"),
    # Paid Media
    ("LinkedIn Ads B2B con presupuesto acotado: segmentación que no quema dinero", "satellite", "generación de demanda B2B", "paid-media"),
    ("Google Ads en nichos B2B de bajo volumen: cuándo sí y cuándo no", "satellite", "generación de demanda B2B", "paid-media"),
    ("Atribuir paid media cuando el ciclo de venta dura meses", "satellite", "generación de demanda B2B", "paid-media"),
    # Web y herramientas
    ("Formularios que convierten: integrar el sitio con el CRM sin perder datos", "satellite", "el sitio web B2B como sistema de captación", "web-herramientas"),
    ("Core Web Vitals en sitios B2B: qué arreglar primero", "satellite", "el sitio web B2B como sistema de captación", "web-herramientas"),
    ("GA4 para marketing B2B: los eventos y conversiones que sí importan", "satellite", "el sitio web B2B como sistema de captación", "web-herramientas"),
    ("CRO en B2B: experimentos que se pueden correr con poco tráfico", "satellite", "el sitio web B2B como sistema de captación", "web-herramientas"),
    ("Anatomía de una landing B2B que convierte", "satellite", "el sitio web B2B como sistema de captación", "web-herramientas"),
    # Liderazgo
    ("Contratar al primer SDR y qué medirle en sus primeros 90 días", "satellite", "liderar un equipo de marketing B2B", "liderazgo-equipos"),
    ("Rituales semanales para un equipo de marketing que trabaja con ventas", "satellite", "liderar un equipo de marketing B2B", "liderazgo-equipos"),
    ("Del plan al sistema: la estrategia vale lo que vale su ejecución", "satellite", "liderar un equipo de marketing B2B", "liderazgo-equipos"),
    # Motores de IA
    ("IA aplicada a marketing B2B sin humo: casos que sí ahorran tiempo", "satellite", "", "motores-ia"),
]

ALL_TOPICS = PILLARS + SATELLITES
