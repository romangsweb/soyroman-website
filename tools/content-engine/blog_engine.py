#!/usr/bin/env python3
"""
Motor de blog v2 — soyroman.com

Escribe BORRADORES con criterio editorial a partir de editorial_map.py:

  1. Brief      esquema, título, extracto y metadatos en JSON, a partir de la tesis y el lector
  2. Redacción  introducción, cada sección y cierre por separado; cada paso ve el esquema y lo ya escrito
  3. Editor     pasada de edición contra una lista de verificación (relleno, frases hechas, repeticiones)
  4. Enriquecer resumen al inicio, enlaces al glosario, llamado a la calculadora y preguntas frecuentes
  5. Calidad    heurística + autoevaluación; si no pasa, una segunda pasada de editor; si sigue sin pasar, llega marcado
  6. Portada    el sitio dibuja la portada tipo pantalla según el tema (ComfyUI solo con --comfy-cover)

El CMS impone que el bot solo cree borradores: publicar sigue siendo decisión de Román.

Uso:
  python blog_engine.py                       # siguiente tema (la categoría con menos artículos)
  python blog_engine.py --batch 3             # varios seguidos (cron nocturno)
  python blog_engine.py --category paid-media # siguiente tema de esa categoría
  python blog_engine.py --topic "ROAS, ROMI"  # el tema del mapa que contenga ese texto
  python blog_engine.py --dry-run             # escribe e imprime; no guarda ni genera portada
  python blog_engine.py --list                # estado del mapa: qué temas ya se usaron

Config (además de la del motor v1):
  SOYROMAN_MODEL_WRITER   modelo de Ollama para el blog (si no, MODEL_WRITER)
  SOYROMAN_QUALITY_MIN    calificación mínima (0-10) para no marcar el borrador; por defecto 7
"""
import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from editorial_map import CAT_EXPERTISE, TOPICS  # noqa: E402
from soyroman_engine import (  # noqa: E402
    CMS,
    CMS_PUBLIC,
    EXCERPT_MAX,
    VOICE,
    brand_check,
    cfg,
    clip,
    dedup,
    engine_lock,
    generate_cover,
    heading_case,
    log,
    ollama_call,
    send_telegram,
    sentence_case,
    slugify,
    tel,
    tidy,
    writer_model,
)

ENGINE_NAME = "soyroman-posts"  # misma telemetría que v1: así no repite temas ya usados
RESOURCES = {
    "embudo-inverso": ("calculadora de embudo inverso", "/recursos/embudo-inverso",
                       "Calcula cuántos leads, MQL y SQL necesitas al mes para tu meta de ingresos"),
    "roas-romi-roi": ("calculadora de ROAS, ROMI y ROI", "/recursos/roas-romi-roi",
                      "Calcula el retorno real de tu inversión en marketing con tus números"),
}
FORMATS = {
    "marco": "un marco de decisión: criterios claros, cuándo aplica cada opción y sus trade-offs",
    "guia": "una guía paso a paso accionable, con el porqué de cada paso",
    "comparativa": "una comparativa honesta con criterios explícitos y una recomendación según el caso",
    "opinion": "un artículo de opinión que defiende una postura con argumentos y reconoce el contraargumento",
    "plantilla": "una plantilla que el lector pueda copiar y adaptar, explicada campo por campo",
    "checklist": "un checklist priorizado: qué revisar, en qué orden y cómo saber si está bien",
    "errores": "los errores más comunes, por qué ocurren y cómo corregir cada uno",
}
# Reglas propias del blog (se suman a VOICE)
BLOG_RULES = """
REGLAS DEL BLOG:
- Escribe como Román, en primera persona: en cada sección aparece al menos un criterio propio ("cuando reviso un presupuesto, yo…", "lo que recomiendo es…").
- Donde una experiencia real haría el texto más creíble, deja [COMPLETAR: qué ejemplo real va aquí]. Entre 1 y 3 en todo el artículo; nunca inventes la anécdota.
- Respeta las DEFINICIONES Y FÓRMULAS que se te dan: no las contradigas ni inventes otras.
- Español de México sin anglicismos innecesarios: "dirección" (no C-suite), "embudo" (no funnel), "hallazgos" (no insights), "interacción" (no engagement), "desempeño" (no performance). El presupuesto se defiende ante dirección general o finanzas (CFO), no ante el CTO.
- Nada de llamados de venta tipo "Descubre", "Conoce" o "No te pierdas".
- Varía cómo introduces tu criterio: la misma frase de arranque (por ejemplo "Cuando reviso…") no puede aparecer más de dos veces en el artículo.
- Montos siempre en dólares: "USD 20,000". Nunca pesos."""

# Anglicismos y muletillas que no deben aparecer (la calificación los penaliza)
BANNED = {
    r"\bC-?suite\b": "dirección", r"\bfunnel\b": "embudo", r"\binsights?\b": "hallazgos",
    r"\bengagement\b": "interacción", r"\bperformance\b": "desempeño", r"\bDescubre\b": "(quitar)",
}
# Arreglos automáticos seguros (los demás los corrige el editor)
AUTOFIX = [
    (r"\bal C-?suite\b", "a la dirección"), (r"\bdel C-?suite\b", "de la dirección"),
    (r"\b[Ee]l C-?suite\b", "la dirección"), (r"\b(el|del|al) funnel\b", r"\1 embudo"), (r"\bfunnel\b", "embudo"),
]

# Definiciones verificadas: mandan sobre las del glosario si hay diferencia
CANON = {
    "roas": "ROAS = ingresos atribuidos ÷ inversión en medios. No incluye margen ni otros costos de marketing.",
    "romi": "ROMI = (ingresos atribuidos × margen bruto − costo total de marketing) ÷ costo total de marketing. Requiere conocer el margen; incluye medios, herramientas, agencia y equipo.",
    "roi": "ROI = (ganancia − inversión) ÷ inversión. En marketing suele calcularse sobre ingresos sin descontar margen, por eso sobreestima el retorno frente al ROMI.",
    "cac": "CAC = costo total de ventas y marketing del periodo ÷ clientes nuevos del periodo.",
    "ltv-cac": "LTV:CAC = valor de vida del cliente ÷ CAC. Una referencia común es 3 o más.",
    "payback-cac": "Periodo de recuperación = CAC ÷ margen bruto mensual por cliente (en meses).",
    "win-rate": "Tasa de cierre = oportunidades ganadas ÷ oportunidades cerradas (ganadas + perdidas).",
    "velocidad-del-pipeline": "Velocidad del pipeline = (oportunidades × ticket promedio × tasa de cierre) ÷ duración del ciclo de venta.",
    "tasa-de-conversion": "Tasa de conversión = conversiones ÷ registros de la etapa anterior.",
    "mql": "MQL: lead que cumple los criterios acordados con ventas (ajuste al ICP e interés) para pasar a seguimiento.",
    "sql": "SQL: lead que ventas aceptó y calificó como oportunidad potencial tras un primer contacto.",
}

# Frases de relleno que delatan texto genérico (se cuentan y se piden quitar en la edición)
FILLER = [
    "en el mundo actual", "hoy en día", "en la era digital", "es crucial", "es fundamental", "es importante destacar",
    "juega un papel", "desempeña un papel", "sin lugar a dudas", "sin duda alguna", "en conclusión", "en resumen,",
    "cabe destacar", "cabe mencionar", "no es ningún secreto", "el panorama actual", "clave del éxito", "potenciar",
    "sinergia", "de manera efectiva", "de forma efectiva", "a la hora de", "en definitiva", "llevar al siguiente nivel",
    "revolucionar", "un mundo cada vez más", "panorama competitivo", "en este artículo exploraremos", "vamos a explorar",
    "en un mundo donde", "cada peso cuenta", "cada dólar cuenta", "es el momento ideal", "es clave", "en el entorno actual",
]
# Arranques de relleno que se quitan solos: "En un mundo donde X, elegir…" → "Elegir…"
FILLER_OPENERS = re.compile(
    r"(?:(?<=^)|(?<=[.!?]\s)|(?<=\n))(?:En un mundo donde|En definitiva|En conclusión|Hoy en día|En el entorno actual|"
    r"En la era digital|Sin lugar a dudas|Sin duda alguna)[^,.\n]{0,80},\s*(\w)", re.M)


def scrub(text):
    return FILLER_OPENERS.sub(lambda m: m.group(1).upper(), text)

# ───────────────────────── Prompts ─────────────────────────
BRIEF = """Vas a planear un artículo para el blog. No lo escribas todavía: arma el brief.

TEMA DE TRABAJO: {title}
LECTOR: {reader}
QUÉ BUSCA EL LECTOR: {intent}
TESIS (la postura que el artículo defiende; no la cambies): {thesis}
FORMATO: {fmt_desc}
EXTENSIÓN: {length}
DEFINICIONES Y FÓRMULAS (fuente de verdad):
{defs}

Responde SOLO con JSON válido con esta forma:
{{
  "title": "título final, específico, máximo 80 caracteres, mayúsculas solo al inicio y en siglas/nombres propios",
  "slug": "slug-sin-acentos",
  "excerpt": "1-2 frases afirmativas con la tesis, máximo 180 caracteres, sin preguntas",
  "meta_title": "máximo 60 caracteres, sin signos de exclamación",
  "meta_description": "máximo 155 caracteres",
  "takeaways": ["3 ideas clave que el lector se lleva, una frase cada una"],
  "sections": [
    {{"heading": "encabezado ## de la sección", "point": "qué argumenta o explica esta sección en una frase",
      "include": "el elemento concreto que lleva: ejemplo, criterio, tabla, pasos, cálculo o plantilla"}}
  ],
  "faq": ["4 preguntas que este lector escribiría tal cual en Google o en ChatGPT (cortas, en sus palabras, sin repetir el título)"],
  "scenario": "un caso hipotético con cifras concretas (marcado como ejemplo) que todas las secciones reutilizan; montos en USD; si hay costos, desglósalos (inversión en medios, otros costos de marketing y costo total); si el tema lleva fórmulas, el caso permite calcularlas todas con los mismos números"
}}
Reglas del esquema: {n_sections} secciones; la primera no puede ser una definición obvia; cada sección avanza la tesis; ninguna se repite con otra; la última sección da pasos concretos que el lector puede aplicar esta semana (no menciones días de la semana)."""

INTRO = """Escribe la INTRODUCCIÓN del artículo (sin encabezado, 90-140 palabras).

{context}

La introducción plantea el problema real del lector y enuncia la tesis en la primera o segunda frase. Nada de "en este artículo veremos". Solo Markdown del párrafo o párrafos."""

SECTION = """Escribe UNA sección del artículo.

{context}

LO YA ESCRITO (para no repetir y mantener el hilo):
---
{so_far}
---

IDEAS YA CUBIERTAS (no las repitas; aporta algo nuevo):
{covered}

SECCIÓN A ESCRIBIR: ## {heading}
Qué debe argumentar: {point}
Debe incluir: {include}
Extensión: {words} palabras.

Empieza con la línea "## {heading}". Puedes usar ### para subsecciones, listas o una tabla en Markdown si ayudan. Usa el ESCENARIO cuando necesites un ejemplo numérico y escribe las fórmulas tal como vienen en las DEFINICIONES. Incluye al menos un criterio tuyo en primera persona. No cierres el artículo aquí.

La sección EMPIEZA (después del encabezado) con 1-2 frases que responden directamente a su encabezado y se entienden solas, sin el resto del artículo: una IA debe poder citarlas tal cual. Después vienen el criterio, el ejemplo y el detalle. Si la sección responde a una duda concreta del lector, formula el encabezado como esa pregunta."""

CLOSING = """Escribe el CIERRE del artículo (60-110 palabras, sin encabezado "Conclusión").

{context}

LO YA ESCRITO (resumen de secciones): {headings}

El cierre retoma la tesis con una idea nueva o una consecuencia práctica; no resume sección por sección. Sin encabezado: solo el párrafo."""

FAQ = """Responde estas preguntas frecuentes del lector del artículo "{title}".
Tesis del artículo: {thesis}
DEFINICIONES Y FÓRMULAS (no las contradigas):
{defs}
EL ARTÍCULO DICE (no lo contradigas):
{article}

Preguntas:
{questions}

Sin muletillas ("es fundamental", "es clave", "en definitiva"); montos en USD.
Responde SOLO con JSON: {{"faq": [{{"q": "pregunta", "a": "respuesta directa de 40-80 palabras, empieza por la respuesta, sin rodeos"}}]}}"""

COMPLETAR = """Este artículo de Román no tiene ningún lugar marcado para una experiencia real suya, y es lo que más credibilidad le daría.
Elige 1 o 2 frases del artículo después de las cuales iría un ejemplo real de su trabajo (un caso, una cifra propia, una decisión que tomó).

Responde SOLO con JSON: {{"marcas": [{{"frase": "copia EXACTA de una frase del artículo", "completar": "qué ejemplo real debe escribir Román ahí, en pocas palabras"}}]}}

ARTÍCULO:
---
{article}
---"""

EDITOR = """Eres el editor del blog. Edita este borrador para que suene a un profesional con criterio, no a texto generado.

LISTA DE VERIFICACIÓN:
- Quita relleno y frases hechas (por ejemplo: {filler}).
- Elimina repeticiones entre secciones; si dos párrafos dicen lo mismo, deja uno.
- Cada afirmación general lleva un criterio, un ejemplo o un número presentado como rango típico. Si falta y requiere experiencia personal real, deja [COMPLETAR: qué ejemplo real va aquí].
- No inventes cifras, clientes ni anécdotas como reales.
- Frases cortas y directas; voz activa; primera persona donde aporte.
- Mantén TODOS los encabezados ## y ###, las listas y las tablas. Mantén la extensión (no recortes más de 10 %).
- Respuesta primero: el primer párrafo de cada sección ## responde su encabezado en 1-2 frases (máximo 60 palabras) que se entienden sin contexto. Si no, reescríbelo; no lo borres.
- Mayúsculas en español: solo al inicio, siglas y nombres propios.
- Reemplaza anglicismos: C-suite → dirección, funnel → embudo, insights → hallazgos, engagement → interacción, performance → desempeño.
- Asegura la primera persona: cada sección con al menos un criterio de Román ("yo…", "recomiendo…", "cuando reviso…").
- Verifica que fórmulas y definiciones coincidan con estas (corrige si no):
{defs}
{extra}

Devuelve SOLO el artículo editado en Markdown, empezando por el primer párrafo de la introducción.

BORRADOR:
---
{draft}
---"""

SCORE = """Evalúa este artículo como editor exigente de un blog de marketing B2B. Sé estricto: un 10 es publicable sin tocar.

Tesis esperada: {thesis}
Lector: {reader}
Definiciones correctas:
{defs}

Responde SOLO con JSON:
{{"tesis": 0-10, "especificidad": 0-10, "estructura": 0-10, "estilo": 0-10, "utilidad": 0-10,
  "contradicciones": ["cada frase que contradiga las definiciones o se contradiga con otra parte del artículo, citada"],
  "problemas": ["hasta 4 problemas concretos, citando la sección"]}}

ARTÍCULO:
---
{article}
---"""


# ───────────────────────── Utilidades ─────────────────────────
class NoRun:
    """Sustituto de TelemetryRun para --dry-run."""
    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False

    def __getattr__(self, name):
        return lambda *a, **k: None


def as_json(raw):
    """Extrae el primer objeto JSON de la respuesta (tolerante a texto alrededor)."""
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", raw, re.S)
        if m:
            return json.loads(m.group(0))
        raise


def words(md):
    return len(re.findall(r"\w+", md))


def filler_hits(md):
    low = md.lower()
    return {f: low.count(f) for f in FILLER if f in low}


def used_topics():
    used = set()
    try:
        for run in tel.get_recent_runs(ENGINE_NAME, limit=500, status="success"):
            if run.get("topic"):
                used.add(run["topic"])
    except Exception as e:
        log(f"  telemetría no disponible: {e}")
    return used


def category_counts(cms):
    """Cuántos posts (borradores incluidos) tiene cada categoría, para repartir el volumen."""
    counts = Counter()
    try:
        docs = cms.get("posts", **{"limit": 500, "depth": 1, "draft": "true"}).get("docs", [])
        for d in docs:
            for c in d.get("categories") or []:
                if isinstance(c, dict) and c.get("slug"):
                    counts[c["slug"]] += 1
    except Exception as e:
        log(f"  no se pudo contar posts por categoría: {e}")
    return counts


def pick_topics(cms, n, category=None, contains=None):
    used = used_topics()
    pool = [t for t in TOPICS if t["title"] not in used]
    if contains:
        pool = [t for t in TOPICS if contains.lower() in t["title"].lower()]
        return pool[:n]
    if category:
        return [t for t in pool if t["cat"] == category][:n]
    counts = category_counts(cms) if cms else Counter()
    out = []
    for _ in range(n):
        cands = [t for t in pool if t not in out]
        if not cands:
            break
        # categoría con menos artículos; dentro de ella, primero el pilar y luego en orden del mapa
        cand_cats = {t["cat"] for t in cands}
        cat = min(cand_cats, key=lambda c: (counts[c], c))
        pick = next(t for t in cands if t["cat"] == cat)
        out.append(pick)
        counts[cat] += 1
    return out


def glossary_index(cms):
    """{slug: doc} del glosario, borradores incluidos (definiciones); solo los publicados se enlazan."""
    if not cms:
        return {}
    try:
        docs = cms.get("glossary", **{"limit": 300, "depth": 0, "draft": "true"}).get("docs", [])
        return {d["slug"]: d for d in docs if d.get("slug") and d.get("term")}
    except Exception as e:
        log(f"  glosario no disponible: {e}")
        return {}


def defs_block(t, glossary):
    """Definiciones y fórmulas de los términos del tema: las verificadas (CANON) y, si no, las del glosario."""
    lines = []
    for slug in t["terms"]:
        if slug in CANON:
            lines.append(f"- {CANON[slug]}")
            continue
        d = glossary.get(slug)
        if d and d.get("definition"):
            txt = re.sub(r"\s+", " ", str(d["definition"]))[:320]
            formula = f" Fórmula: {d['formula']}" if d.get("formula") else ""
            lines.append(f"- {d['term']}: {txt}{formula}")
    return "\n".join(lines) or "- (sin definiciones específicas para este tema)"


FIRST_PERSON = re.compile(r"\b(yo|mi|mis|me|recomiendo|prefiero|reviso|uso|suelo|pido|empiezo|veo|he visto|aprendí|trabajo con)\b", re.I)


def heuristics(md, t, n_sections):
    """Chequeos objetivos que el modelo no puede inflar."""
    issues, hard = [], False
    fp = len(FIRST_PERSON.findall(md))
    if fp < max(2, n_sections):
        issues.append(f"poca primera persona ({fp} marcas para {n_sections} secciones): añade criterios propios de Román")
        hard = True
    banned = sorted({m.group(0) for pat in BANNED for m in re.finditer(pat, md, re.I)})
    if banned:
        issues.append(f"anglicismos o muletillas: {', '.join(banned)}")
        hard = True
    starts = Counter(m.group(1).lower() for m in re.finditer(
        r"(?:^|[.!?]\s+)((?:Cuando|Lo que|Yo|En mi|Por eso|En mi experiencia)\s+\w+)", md, re.M))
    rep_starts = [k for k, v in starts.items() if v > 2]
    if rep_starts:
        issues.append(f"arranque repetido más de dos veces: {', '.join(rep_starts)}; varía cómo introduces el criterio")
    if re.search(r"\b(pesos|MXN)\b", md, re.I):
        issues.append("montos en pesos: usa USD")
    long_leads = [h for h, p in re.findall(r"(?m)^## (.+)\n+([^\n#][^\n]*)", md)
                  if len(p.split()) > 70 and not h.lower().startswith("preguntas frecuentes")]
    if long_leads:
        issues.append(f"respuesta enterrada en {len(long_leads)} sección(es): el primer párrafo debe responder en ≤60 palabras ({long_leads[0][:40]}…)")
    comp = len(re.findall(r"\[COMPLETAR:", md))
    if comp == 0:
        issues.append("ningún [COMPLETAR]: marca 1-3 lugares donde va una experiencia real de Román")
    if any(x in CANON and "=" in CANON[x] for x in t["terms"][:3]) and not re.search(r"[=÷]", md):
        issues.append("faltan las fórmulas de los indicadores del tema")
        hard = True
    return issues, hard, {"first_person": fp, "banned": banned, "completar": comp,
                          "repeated_starts": rep_starts, "currency_mxn": bool(re.search(r"\b(pesos|MXN)\b", md, re.I)),
                          "long_leads": len(long_leads)}


def autofix(md):
    for pat, rep_ in AUTOFIX:
        md = re.sub(pat, rep_, md)
    return scrub(md)


def ensure_completar(md):
    """Si el modelo no dejó ningún [COMPLETAR], le pide 1-2 lugares y los inserta el código."""
    if "[COMPLETAR:" in md:
        return md
    try:
        marks = as_json(ollama_call(VOICE, COMPLETAR.format(article=md[:12000]), predict=500,
                                    temperature=0.2, fmt="json", ctx=24576)).get("marcas", [])
    except Exception as e:
        log(f"  no se pudieron proponer [COMPLETAR]: {e}")
        return md
    n = 0
    for m in marks[:2]:
        frase, nota = (m.get("frase") or "").strip(), (m.get("completar") or "").strip()
        if len(frase) > 20 and nota and frase in md:
            md = md.replace(frase, f"{frase} [COMPLETAR: {nota}]", 1)
            n += 1
    log(f"  [COMPLETAR] insertados: {n}")
    return md


def link_terms(md, slugs, glossary):
    """Enlaza la primera mención de cada término (fuera de encabezados y de enlaces existentes)."""
    linked = []
    lines = md.split("\n")
    for slug in slugs:
        d = glossary.get(slug) or {}
        term = d.get("term")
        if not term or d.get("_status") != "published":
            continue
        pat = re.compile(rf"(?<![\w\[/-])({re.escape(term)})(?![\w\]-])", re.IGNORECASE)
        for i, line in enumerate(lines):
            if line.lstrip().startswith(("#", ">", "|")):
                continue
            new, n = pat.subn(rf"[\1](/glosario/{slug})", line, count=1)
            if n:
                lines[i] = new
                linked.append(slug)
                break
    return "\n".join(lines), linked


# ───────────────────────── Pipeline ─────────────────────────
def write_article(t, glossary=None):
    length = "1600-2000 palabras" if t["pillar"] else "850-1100 palabras"
    n_sections = "5 a 6" if t["pillar"] else "3 a 4"
    section_words = "250-320" if t["pillar"] else "180-240"
    fmt_desc = FORMATS[t["fmt"]]
    defs = defs_block(t, glossary or {})
    system = VOICE + BLOG_RULES

    log("[1/5] brief")
    brief = as_json(ollama_call(system, BRIEF.format(
        title=t["title"], reader=t["reader"], intent=t["intent"], thesis=t["thesis"], defs=defs,
        fmt_desc=fmt_desc, length=length, n_sections=n_sections), predict=2000, temperature=0.5, fmt="json"))
    sections = [s for s in brief.get("sections", []) if s.get("heading")][:6]
    if len(sections) < 3:
        raise RuntimeError(f"brief con {len(sections)} secciones")
    title = sentence_case((brief.get("title") or t["title"]).strip().strip('"'))
    log(f"  {title}  ·  {len(sections)} secciones")

    outline = "\n".join(f"- {s['heading']}: {s.get('point', '')}" for s in sections)
    scenario = brief.get("scenario") if isinstance(brief.get("scenario"), str) else json.dumps(brief.get("scenario") or "", ensure_ascii=False)
    context = (f"ARTÍCULO: {title}\nLECTOR: {t['reader']}\nTESIS: {t['thesis']}\nFORMATO: {fmt_desc}\n"
               f"DEFINICIONES Y FÓRMULAS (fuente de verdad):\n{defs}\n"
               f"ESCENARIO DE EJEMPLO (hipotético, reutilízalo):\n{scenario or '—'}\n"
               f"ESQUEMA COMPLETO:\n{outline}")

    log("[2/5] redacción por secciones")
    parts = [ollama_call(system, INTRO.format(context=context), predict=600, temperature=0.7)]
    covered = ["Introducción: el problema del lector y la tesis"]
    for i, s in enumerate(sections, 1):
        so_far = "\n\n".join(parts)
        so_far = so_far if words(so_far) < 1400 else "…\n" + so_far[-6000:]
        txt = ollama_call(system, SECTION.format(context=context, so_far=so_far, heading=s["heading"],
                                                 covered="\n".join(f"- {c}" for c in covered),
                                                 point=s.get("point", ""), include=s.get("include", ""),
                                                 words=section_words), predict=1400, temperature=0.7)
        covered.append(f"{s['heading']}: {s.get('point', '')}")
        if not txt.lstrip().startswith("##"):
            txt = f"## {s['heading']}\n\n{txt}"
        parts.append(txt)
        log(f"  sección {i}/{len(sections)} ok")
    closing = ollama_call(system, CLOSING.format(context=context, headings="; ".join(s["heading"] for s in sections)),
                          predict=500, temperature=0.6)
    parts.append(re.sub(r"(?m)^#{1,3}\s.*$", "", closing).strip())
    draft = tidy(re.sub(r"(?m)^#\s+", "## ", "\n\n".join(parts)))

    draft = autofix(draft)
    log("[3/5] editor")
    edited = ensure_completar(autofix(edit(draft, t, defs=defs)))

    faq = []
    if brief.get("faq"):
        try:
            faq = as_json(ollama_call(system, FAQ.format(title=title, thesis=t["thesis"], defs=defs,
                                                         article=edited[:5000],
                                                         questions="\n".join(f"- {q}" for q in brief["faq"][:4])),
                                      predict=900, temperature=0.3, fmt="json")).get("faq", [])
        except Exception as e:
            log(f"  FAQ falló (no bloqueante): {e}")

    return {
        "title": title,
        "slug": slugify(brief.get("slug") or title),
        "excerpt": clip(brief.get("excerpt"), EXCERPT_MAX),
        "metaTitle": clip(sentence_case(brief.get("meta_title") or title), 60),
        "metaDescription": clip(brief.get("meta_description"), 155),
        "takeaways": [scrub(x) for x in brief.get("takeaways", []) if isinstance(x, str)][:3],
        "faq": [{"q": f["q"], "a": autofix(f["a"])} for f in faq if isinstance(f, dict) and f.get("q") and f.get("a")][:4],
        "content": edited,
        "defs": defs,
        "n_sections": len(sections),
    }


def edit(draft, t, extra="", defs=""):
    hits = filler_hits(draft)
    out = ollama_call(VOICE + BLOG_RULES, EDITOR.format(filler=", ".join(f'"{f}"' for f in FILLER[:12]), defs=defs or "-",
                                                        extra=extra, draft=draft), predict=6000, temperature=0.3, ctx=24576)
    out = tidy(re.sub(r"(?m)^#\s+", "## ", out.strip().strip("-").strip()))
    # Salvaguardas: si el editor recortó de más o perdió encabezados, se queda el borrador
    h_draft, h_out = draft.count("\n## "), out.count("\n## ")
    if words(out) < 0.8 * words(draft) or h_out < h_draft - 1:
        log(f"  editor descartado ({words(out)} vs {words(draft)} palabras, {h_out}/{h_draft} secciones)")
        return draft
    log(f"  editado: {words(draft)} → {words(out)} palabras · relleno {sum(hits.values())} → {sum(filler_hits(out).values())}")
    return out


def assess(art, t):
    """Calificación = la menor entre la del modelo y la de los chequeos objetivos."""
    contradictions = []
    try:
        s = as_json(ollama_call("Eres un editor exigente de marketing B2B. Calificas con dureza.", SCORE.format(
            thesis=t["thesis"], reader=t["reader"], defs=art.get("defs", "-"), article=art["content"][:14000]),
            predict=800, temperature=0.2, fmt="json", ctx=24576))
        keys = ["tesis", "especificidad", "estructura", "estilo", "utilidad"]
        vals = [float(s.get(k, 0)) for k in keys]
        score = round(sum(vals) / len(vals), 1)
        problems = [p for p in s.get("problemas", []) if isinstance(p, str)][:4]
        contradictions = [c for c in s.get("contradicciones", []) if isinstance(c, str) and c.strip()][:4]
    except Exception as e:
        log(f"  autoevaluación falló: {e}")
        score, problems = 6.0, []
    issues, hard, stats = heuristics(art["content"], t, art.get("n_sections", 4))
    if contradictions:
        hard = True
        issues = [f"contradicción: {c}" for c in contradictions] + issues
    fill = sum(filler_hits(art["content"]).values())
    score = max(0.0, round(score - 0.3 * max(0, fill - 2) - 0.3 * stats["long_leads"] - (0.5 if not stats["completar"] else 0)
                           - (0.5 if stats["repeated_starts"] else 0) - (0.5 if stats["currency_mxn"] else 0), 1))
    if hard:
        score = min(score, 6.0)
    art["stats"] = {**stats, "contradictions": len(contradictions), "model_score": score}
    return score, (issues + problems)[:6], fill


def enrich(art, t, glossary):
    md = art["content"]
    md, linked = link_terms(md, t["terms"], glossary)
    top = ""
    if art["takeaways"]:
        top = "**En resumen**\n\n" + "\n".join(f"- {x.strip()}" for x in art["takeaways"]) + "\n\n"
    tail = ""
    if t["resource"] in RESOURCES:
        name, href, desc = RESOURCES[t["resource"]]
        tail += f"\n\n> **Hazlo con tus números.** {desc}: [abrir la {name}]({href})."
    if art["faq"]:
        tail += "\n\n## Preguntas frecuentes\n\n" + "\n\n".join(f"### {f['q'].strip()}\n\n{f['a'].strip()}" for f in art["faq"])
    art["content"] = heading_case(tidy(top + md + tail))
    return linked


# ───────────────────────── Un artículo ─────────────────────────
def run_one(t, cms, glossary, dry=False, no_cover=False):
    qmin = float(cfg.get("SOYROMAN_QUALITY_MIN") or 7)
    log(f"\n{'=' * 64}\nBLOG v2 · {t['cat']} · {'pilar' if t['pillar'] else 'satélite'} · {t['fmt']}\n  {t['title']}\n  modelo: {writer_model()}\n{'=' * 64}")
    meta = {"category": t["cat"], "format": t["fmt"], "pillar": t["pillar"], "model": writer_model()}
    # En dry-run no se registra telemetría: si no, el tema quedaría como "usado"
    ctx = NoRun() if dry else tel.TelemetryRun(ENGINE_NAME, topic=t["title"], triggered_by="v2", metadata=meta)
    with ctx as run:
        try:
            art = write_article(t, glossary)
            log("[4/5] calidad")
            score, problems, fill = assess(art, t)
            log(f"  calificación {score} · relleno {fill} · {problems}")
            if score < qmin and problems:
                log("  segunda pasada de editor con los problemas detectados")
                art["content"] = autofix(edit(art["content"], t, defs=art.get("defs", ""),
                                              extra="- Corrige además estos problemas:\n" + "\n".join(f"  - {p}" for p in problems)))
                score, problems, fill = assess(art, t)
                log(f"  nueva calificación {score}")
            linked = enrich(art, t, glossary)
        except Exception as e:
            run.set_status("failed", error=f"generación falló: {e}")
            send_telegram(f"❌ soyroman v2: error en «{t['title'][:70]}»\n{str(e)[:200]}")
            log(f"  ERROR: {e}")
            return None

        flags_brand, details = brand_check(art)
        flags = flags_brand + (["below_quality_min"] if score < qmin else [])
        run.set_quality(score, flags=flags)
        run.add_metadata(words=words(art["content"]), filler=fill, problems=problems, linked_terms=linked,
                         **art.get("stats", {}), **details)

        if dry:
            log(json.dumps({k: v for k, v in art.items() if k not in ("content", "defs")}, ensure_ascii=False, indent=2))
            log(art["content"])
            log(f"\n[dry-run] {words(art['content'])} palabras · calificación {score} · enlaces {linked} · flags {flags}")
            log(f"[dry-run] chequeos {art.get('stats')} · problemas {problems}")
            return art

        dedup_text = f"{art['title']}\n{art['excerpt']}\n{art['content'][:1500]}"
        try:
            dup = dedup.check_duplicate(dedup_text)
            run.add_metadata(dedup_score=dup["score"], dedup_level=dup["level"])
            if dup["level"] == "duplicate":
                sim = dup.get("similar_doc") or {}
                run.set_status("skipped", error=f"duplicado de {sim.get('engine')}:{sim.get('doc_id')}")
                send_telegram(f"⚠️ soyroman v2: duplicado, no se guardó\n{art['title']}\nSimilar a: {sim.get('title', '?')}")
                return None
        except Exception as e:
            run.add_metadata(dedup_error=str(e))

        log("[5/5] portada y borrador")
        cover_id = None
        if not no_cover:
            path, prompt = generate_cover(t["cat"], art["title"])
            run.add_metadata(cover_prompt=prompt)
            if path:
                try:
                    cover_id = cms.upload_cover(path, art["title"])
                except Exception as e:
                    log(f"  subida de portada falló: {e}")

        data = {
            "title": art["title"],
            "slug": cms.unique_slug(art["slug"] or slugify(art["title"])),
            "excerpt": art["excerpt"],
            "markdownSource": art["content"],
            "meta": {"title": art["metaTitle"], "description": art["metaDescription"]},
        }
        cat_id = cms.category_id(t["cat"])
        if cat_id:
            data["categories"] = [cat_id]
        exp_id = cms.expertise_id(CAT_EXPERTISE.get(t["cat"]))
        if exp_id:
            data["expertises"] = [exp_id]
        if cover_id:
            data["cover"] = cover_id
            data["meta"]["image"] = cover_id
        try:
            doc = cms.create_draft(data)
        except Exception as e:
            run.set_status("failed", error=str(e))
            send_telegram(f"❌ soyroman v2: Payload rechazó el borrador\n{str(e)[:300]}")
            return None
        post_id = doc.get("id")
        run.set_output("posts", post_id)
        try:
            dedup.index_content(ENGINE_NAME, post_id, data["slug"], art["title"], dedup_text,
                                text_source="title+excerpt+content[:1500]")
        except Exception as e:
            run.add_metadata(index_error=str(e))

        mark = "🚨 " if flags else ""
        send_telegram(
            f"✅ <b>soyroman: borrador listo</b>\n📝 {art['title']}\n🏷 {t['cat']} · {t['fmt']}\n"
            f"⭐ {score}/10 · {words(art['content'])} palabras · portada {'ComfyUI' if cover_id else 'tipo pantalla'}\n"
            f"✍️ [COMPLETAR]: {details['placeholders']} · 🔗 glosario: {len(linked)}\n"
            f"{mark}{', '.join(flags) if flags else 'sin flags'}\n"
            f"{CMS_PUBLIC}/admin/collections/posts/{post_id}"
        )
        log(f"DRAFT {post_id} · {score}/10 · {CMS_PUBLIC}/admin/collections/posts/{post_id}")
        return art


def main():
    ap = argparse.ArgumentParser(description="Motor de blog v2 de soyroman.com")
    ap.add_argument("--batch", type=int, default=1, help="cuántos artículos escribir seguidos")
    ap.add_argument("--category", help="limitar a una categoría (slug)")
    ap.add_argument("--topic", help="texto contenido en el tema del mapa")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--comfy-cover", action="store_true",
                    help="generar portada con ComfyUI (por defecto no: el sitio dibuja la portada tipo pantalla)")
    ap.add_argument("--list", action="store_true", help="estado del mapa editorial")
    args = ap.parse_args()

    if args.list:
        used = used_topics()
        for cat in dict.fromkeys(t["cat"] for t in TOPICS):
            ts = [t for t in TOPICS if t["cat"] == cat]
            log(f"\n{cat}  ({sum(t['title'] in used for t in ts)}/{len(ts)} usados)")
            for t in ts:
                log(f"  {'✓' if t['title'] in used else '·'} {'[P] ' if t['pillar'] else ''}{t['title']}")
        return

    try:
        cms = CMS()  # en dry-run solo se usa para leer (glosario, conteos); no se guarda nada
    except Exception as e:
        if not args.dry_run:
            raise
        log(f"  sin CMS en dry-run ({e}): sin definiciones del glosario")
        cms = None
    glossary = glossary_index(cms)
    topics = pick_topics(cms, args.batch, args.category, args.topic)
    if not topics:
        log("No quedan temas disponibles con ese filtro.")
        return
    if not args.dry_run:
        send_telegram(f"🖊 <b>soyroman v2: {len(topics)} borrador(es)</b>\n" + "\n".join(f"· {t['title']}" for t in topics))
    ok = sum(1 for t in topics if run_one(t, cms, glossary, dry=args.dry_run, no_cover=not args.comfy_cover or args.dry_run))
    log(f"\nLote terminado: {ok}/{len(topics)} borradores")


if __name__ == "__main__":
    with engine_lock("blog"):
        main()
