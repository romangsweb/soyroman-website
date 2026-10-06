"""
Lista inicial del glosario (60 términos). Formato: (término, slug, tema)
Tema = slug de la colección Temas del CMS. Edita libremente; el motor
solo genera los que todavía no existen en el CMS.
"""

TERMS = [
    # Rentabilidad y KPIs
    ("KPI", "kpi", "analitica"),
    ("ROI", "roi", "analitica"),
    ("ROMI", "romi", "analitica"),
    ("ROAS", "roas", "paid-media"),
    ("CAC", "cac", "analitica"),
    ("LTV", "ltv", "analitica"),
    ("Relación LTV:CAC", "ltv-cac", "analitica"),
    ("Payback de CAC", "payback-cac", "analitica"),
    ("Churn", "churn", "analitica"),
    ("NPS", "nps", "analitica"),
    # Paid media
    ("CTR", "ctr", "paid-media"),
    ("CPC", "cpc", "paid-media"),
    ("CPM", "cpm", "paid-media"),
    ("CPL", "cpl", "paid-media"),
    ("CPA", "cpa", "paid-media"),
    ("Retargeting", "retargeting", "paid-media"),
    ("Audiencia lookalike", "audiencia-lookalike", "paid-media"),
    ("Quality Score", "quality-score", "paid-media"),
    # Embudo y generación de demanda
    ("Embudo de ventas", "embudo-de-ventas", "generacion-demanda"),
    ("Lead", "lead", "generacion-demanda"),
    ("MQL", "mql", "generacion-demanda"),
    ("SQL", "sql", "generacion-demanda"),
    ("SAL", "sal", "generacion-demanda"),
    ("ICP", "icp", "generacion-demanda"),
    ("Buyer persona", "buyer-persona", "generacion-demanda"),
    ("ABM", "abm", "generacion-demanda"),
    ("Lead magnet", "lead-magnet", "generacion-demanda"),
    ("Inbound marketing", "inbound-marketing", "generacion-demanda"),
    ("Outbound", "outbound", "generacion-demanda"),
    ("Customer journey", "customer-journey", "generacion-demanda"),
    # CRM y RevOps
    ("CRM", "crm", "crm-revops"),
    ("RevOps", "revops", "crm-revops"),
    ("Pipeline", "pipeline", "crm-revops"),
    ("Lead scoring", "lead-scoring", "crm-revops"),
    ("Ciclo de vida del contacto", "ciclo-de-vida", "crm-revops"),
    ("Win rate", "win-rate", "crm-revops"),
    ("Velocidad del pipeline", "velocidad-del-pipeline", "crm-revops"),
    ("Forecast", "forecast", "crm-revops"),
    ("MEDDIC", "meddic", "crm-revops"),
    ("BANT", "bant", "crm-revops"),
    ("SDR", "sdr", "liderazgo"),
    ("BDR", "bdr", "liderazgo"),
    ("SLA marketing–ventas", "sla-marketing-ventas", "crm-revops"),
    # Analítica y atribución
    ("UTM", "utm", "analitica"),
    ("Modelo de atribución", "modelo-de-atribucion", "analitica"),
    ("Atribución first-touch", "atribucion-first-touch", "analitica"),
    ("Atribución last-touch", "atribucion-last-touch", "analitica"),
    ("Atribución multi-touch", "atribucion-multi-touch", "analitica"),
    ("Tasa de conversión", "tasa-de-conversion", "sitios-web"),
    ("Tasa de rebote", "tasa-de-rebote", "analitica"),
    # SEO y AEO
    ("SEO", "seo", "seo-aeo"),
    ("AEO", "aeo", "seo-aeo"),
    ("GEO", "geo", "seo-aeo"),
    ("SERP", "serp", "seo-aeo"),
    ("Schema markup", "schema-markup", "seo-aeo"),
    ("Share of voice", "share-of-voice", "seo-aeo"),
    # Sitios y contenido
    ("CTA", "cta", "sitios-web"),
    ("Landing page", "landing-page", "sitios-web"),
    ("CRO", "cro", "sitios-web"),
    ("Nurturing", "nurturing", "contenido-email"),
]

assert len({s for _, s, _ in TERMS}) == len(TERMS), "slugs duplicados"

# Nombre completo de las siglas (se usa tal cual; el modelo no tiene que deducirlo)
FULL_NAMES = {
    "kpi": "Key Performance Indicator (indicador clave de desempeño)",
    "roi": "Return on Investment (retorno de la inversión)",
    "romi": "Return on Marketing Investment (retorno de la inversión en marketing)",
    "roas": "Return on Ad Spend (retorno de la inversión publicitaria)",
    "cac": "Customer Acquisition Cost (costo de adquisición de clientes)",
    "ltv": "Lifetime Value (valor del cliente durante toda la relación)",
    "ltv-cac": "Lifetime Value ÷ Customer Acquisition Cost",
    "nps": "Net Promoter Score (índice de recomendación neta)",
    "ctr": "Click-Through Rate (tasa de clics)",
    "cpc": "Cost per Click (costo por clic)",
    "cpm": "Cost per Mille (costo por mil impresiones)",
    "cpl": "Cost per Lead (costo por lead)",
    "cpa": "Cost per Acquisition (costo por adquisición)",
    "mql": "Marketing Qualified Lead (lead calificado por marketing)",
    "sql": "Sales Qualified Lead (lead calificado por ventas)",
    "sal": "Sales Accepted Lead (lead aceptado por ventas)",
    "icp": "Ideal Customer Profile (perfil de cliente ideal)",
    "abm": "Account-Based Marketing (marketing basado en cuentas)",
    "crm": "Customer Relationship Management (gestión de la relación con clientes)",
    "revops": "Revenue Operations (operaciones de ingresos)",
    "meddic": "Metrics, Economic buyer, Decision criteria, Decision process, Identify pain, Champion",
    "bant": "Budget, Authority, Need, Timeline (presupuesto, autoridad, necesidad y tiempo)",
    "sdr": "Sales Development Representative (representante de desarrollo de ventas)",
    "bdr": "Business Development Representative (representante de desarrollo de negocio)",
    "sla-marketing-ventas": "Service Level Agreement (acuerdo de nivel de servicio)",
    "utm": "Urchin Tracking Module (parámetros de seguimiento de campañas)",
    "seo": "Search Engine Optimization (optimización para motores de búsqueda)",
    "aeo": "Answer Engine Optimization (optimización para motores de respuesta)",
    "geo": "Generative Engine Optimization (optimización para motores generativos)",
    "serp": "Search Engine Results Page (página de resultados del buscador)",
    "cta": "Call to Action (llamada a la acción)",
    "cro": "Conversion Rate Optimization (optimización de la tasa de conversión)",
    "quality-score": "Nivel de calidad de Google Ads",
}

assert set(FULL_NAMES) <= {s for _, s, _ in TERMS}, "FULL_NAMES con slugs que no están en TERMS"
