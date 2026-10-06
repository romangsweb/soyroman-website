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
