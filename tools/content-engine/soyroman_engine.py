#!/usr/bin/env python3
"""
Content Engine — soyroman.com

Genera BORRADORES de blog en el Payload de soyroman (Hall) para que Román los
revise y publique. Basado en el content-engine v3 de Buildations y reutiliza
sus módulos compartidos (config Vault/.env, telemetría, dedup, calidad).

Diferencias con buildations:
- Auth con API key del usuario `bot` (rol que el CMS limita a borradores).
- Envía Markdown en `markdownSource`; el CMS lo convierte a Lexical completo.
- El CMS impone `_status: draft` sin importar lo que mande el motor.
- Dedup cruzado con buildations (misma colección de Qdrant, engine propio).
- Voz en primera persona y reglas de marca (marketing B2B/digital, sin SAP ni empleadores).

Uso:
  python soyroman_engine.py                       # tema de la biblioteca (cron)
  python soyroman_engine.py "mi tema" --type pillar --expertise crm-revops
  python soyroman_engine.py --dry-run             # genera e imprime, no guarda
  python soyroman_engine.py --no-cover            # sin portada

Config (Vault hall9000/buildations o .env de buildations_engines):
  SOYROMAN_PAYLOAD_API_KEY   API key del usuario bot (obligatoria)
  SOYROMAN_CMS_URL           opcional, por defecto http://127.0.0.1:3011
  MODEL_WRITER, OLLAMA_URL, QDRANT_*, PG_*, TELEGRAM_*, COMFYUI_SERVICE  (compartidas)
"""
import argparse
import contextlib
import fcntl
import json
import os
import random
import re
import subprocess
import sys
import time
from pathlib import Path

import requests

# Módulos compartidos de los motores de buildations (viven junto a sus scripts en Hall)
sys.path.insert(0, os.path.expanduser(os.environ.get("BUILDATIONS_ENGINES_DIR", "~/homeserver/scripts")))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from buildations_engines import engine_config as cfg  # noqa: E402
from buildations_engines import engine_dedup as dedup  # noqa: E402
from buildations_engines import engine_quality as qa  # noqa: E402
from buildations_engines import engine_telemetry as tel  # noqa: E402

from topics import ALL_TOPICS, category_for  # noqa: E402

ENGINE_NAME = "soyroman-posts"
CMS_PUBLIC = "https://cms.soyroman.com"
EXCERPT_MAX = 195  # el campo excerpt de Posts admite 200
IMAGE_STEPS, IMAGE_WIDTH, IMAGE_HEIGHT = "28", "1344", "768"

# ───────────────────────── Portadas: diseño industrial minimalista ─────────────────────────
# Lenguaje visual descrito en términos genéricos: sin marcas, logos ni productos reales.
COVER_BASE = (
    "minimalist industrial design product render, compact hardware device with "
    "rounded rectangular aluminum body, matte light grey (#e5e5e5) surface, "
    "precise black hairline engraved pictograms and dot-grid markings, "
    "a single signal-orange (#ff3300) knob or button as the only color accent, "
    "modular knobs, sliders and tiny LED dots, flat geometric icon language, "
    "orthographic three-quarter view on seamless light grey studio background, "
    "soft even studio light, crisp shadows, swiss grid composition, generous negative space, "
    "original fictional design, no text, no letters, no numbers, no logos, no brand marks, "
    "not a real existing product"
)
COVER_BY_EXPERTISE = {
    "crm-revops": "device with a circular dial and stacked pipeline-like sliders, pictograms of funnels and connected nodes",
    "generacion-demanda-b2b": "device with a signal meter and waveform display, pictograms of arrows converging into a target",
    "seo-aeo-geo": "device with a radar-like round screen and a magnifier pictogram, concentric circle markings",
    "paid-media": "device with a large rotary budget dial and bar-meter LEDs, pictogram of a megaphone",
    "web-herramientas": "device shaped like a tiny modular screen terminal, grid of square keys, browser-window pictogram",
    "liderazgo-equipos": "set of three small modular devices docked together on a rail, people pictograms as simple dots",
    "motores-ia": "device with an exposed circuit-grid top plate and a single glowing orange core, node graph pictograms",
}

# ───────────────────────── Voz y reglas ─────────────────────────
VOICE = """Eres Román García escribiendo en su blog personal (soyroman.com). Director de marketing B2B; desde 2017 trabaja en generación de demanda para empresas de tecnología. Tu posicionamiento: el mercadólogo que también construye la infraestructura — CRM, datos y web.
El blog trata de marketing B2B y marketing digital: generación de demanda, RevOps y CRM, SEO/AEO, paid media, contenido, email, analítica, sitios web y liderazgo de equipos de marketing. No escribas sobre ERPs ni sobre software empresarial como tema.
Escribe en primera persona, en español neutro de México. Voz directa, analítica, sin jerga vacía ni frases motivacionales. Explica criterios y trade-offs; prefieres un marco claro a una lista de tips.

REGLAS OBLIGATORIAS:
- Nunca menciones SAP ni marcas de ERP. Si un ejemplo necesita sector, di "empresas de tecnología B2B" o "software B2B", sin centrarte en ERPs.
- Nunca menciones empleadores, clientes ni empresas donde has trabajado.
- No inventes anécdotas, clientes ni cifras como si fueran reales. Usa ejemplos genéricos o rangos típicos presentados como tales.
- Donde una experiencia personal real haría el texto más fuerte, deja un marcador [COMPLETAR: qué ejemplo real va aquí] para que Román lo llene al revisar.
- Puedes mencionar Buildations (el laboratorio de IA que fundaste) solo si aporta al tema; no lo fuerces.
- Herramientas concretas (HubSpot, Search Console, GA4, LinkedIn Ads) sí, cuando sean relevantes.
ESTILO:
- Mayúsculas como en español: solo la primera palabra, nombres propios y siglas (MQL, SDR, CRM). Nunca "Title Case" en títulos ni en encabezados.
- Empieza por la tesis o el criterio, no por obviedades ("X es un paso importante", "en el mundo actual").
- Sin preguntas retóricas en el título ni en el extracto. Sin promesas tipo "éxito garantizado".
- Respeta la extensión pedida; si sobra, recorta ejemplos antes que ideas.
Markdown limpio: secciones con ## y ###, listas cuando ayuden, sin H1."""

LENGTH = {
    "pillar": ("Artículo pilar: 1500-2000 palabras, 5-7 secciones ##.", "800-1000", "800-1000"),
    "satellite": ("Artículo satélite: 700-900 palabras EN TOTAL, 3-4 secciones ##, cierre breve.", "300-350", "300-350"),
}

PROMPT_PART1 = """Escribe la primera mitad de un artículo.

TEMA: {topic}
TIPO: {article_type}
{parent_line}
{length_rule}

Responde EXACTAMENTE con este formato:

###TITLE###
título claro y específico, máximo 90 caracteres
###SLUG###
slug-kebab-case-sin-acentos
###EXCERPT###
1-2 frases afirmativas con la tesis del artículo (sin preguntas), MÁXIMO 190 caracteres
###META_TITLE###
descriptivo, sin promesas ni signos de exclamación, máximo 60 caracteres
###META_DESCRIPTION###
máximo 155 caracteres
###CONTENT_INTRO###
Introducción + primeras secciones ## con su contenido (aprox. {intro_words} palabras). Markdown."""

PROMPT_PART2 = """Continúa el artículo: {title}
Tipo: {article_type}

Responde EXACTAMENTE con este formato:

###CONTENT_BODY###
Las secciones ## restantes + un cierre (aprox. {body_words} palabras). Markdown.
Empieza directamente con un ## nuevo; no repitas la introducción."""

# Patrones de marca/privacidad propios de soyroman (además de los LEAK_PATTERNS compartidos)
BRAND_PATTERNS = [
    re.compile(r"\bSAP\b"),
    re.compile(r"\b(?:S/4\s?HANA|Business\s+One|SuccessFactors|Ariba)\b", re.IGNORECASE),
    re.compile(r"\b(?:xamai|scanda)\b", re.IGNORECASE),
]
PLACEHOLDER = re.compile(r"\[COMPLETAR:[^\]]*\]")


# ───────────────────────── Utilidades ─────────────────────────
def log(msg):
    print(msg, flush=True)


def send_telegram(msg):
    try:
        token, chat = cfg.get("TELEGRAM_BOT_TOKEN"), cfg.get("TELEGRAM_CHAT_ID")
        if token and chat:
            requests.post(
                f"https://api.telegram.org/bot{token}/sendMessage",
                data={"chat_id": chat, "text": msg, "parse_mode": "HTML"},
                timeout=10,
            )
    except Exception as e:
        log(f"  telegram error: {e}")


def slugify(t):
    t = t.lower()
    for chars, rep in [("áàäâã", "a"), ("éèëê", "e"), ("íìïî", "i"), ("óòöôõ", "o"), ("úùüû", "u"), ("ñ", "n")]:
        for c in chars:
            t = t.replace(c, rep)
    t = re.sub(r"[^a-z0-9\s-]", "", t)
    t = re.sub(r"[\s_]+", "-", t.strip())
    return re.sub(r"-+", "-", t).strip("-")[:80]


def clip(text, limit):
    text = (text or "").strip().replace("\n", " ")
    if len(text) <= limit:
        return text
    cut = text[: limit - 1].rsplit(" ", 1)[0]
    return cut.rstrip(",;:") + "…"


ACRONYM = re.compile(r"^[A-Z0-9][A-Z0-9&/+.-]*[A-Z0-9]$|^[A-Z]$")
# Nombres propios de herramientas que conservan mayúscula inicial
PROPER = {
    "Google", "Ads", "Search", "Console", "Analytics", "Tag", "Manager", "Looker", "Studio",
    "LinkedIn", "HubSpot", "Salesforce", "Meta", "Microsoft", "Excel", "WordPress", "Webflow",
    "ChatGPT", "Perplexity", "Gemini", "Claude", "Zapier", "Buildations", "Sales", "Navigator",
    "Core", "Web", "Vitals", "PageSpeed", "Insights", "YouTube", "Instagram", "Facebook",
    "Notion", "Slack", "Semrush", "Ahrefs", "Make", "Clarity", "Hotjar", "BigQuery",
}


def sentence_case(text):
    """'El Primer SDR: Métricas Clave' -> 'El primer SDR: métricas clave'. Respeta siglas y nombres de marca con mayúscula interna."""
    words = (text or "").split(" ")
    out = []
    for i, w in enumerate(words):
        core = w.strip("¿¡\"'()[]:;,.")
        keep = i == 0 or core in PROPER or ACRONYM.match(core) or any(c.isupper() for c in core[1:])
        out.append(w if keep else w[:1].lower() + w[1:])
    return " ".join(out)


def tidy(md):
    """Normaliza espacios dobles y saltos excesivos sin tocar la indentación de listas."""
    md = re.sub(r"(?<=\S) {2,}(?=\S)", " ", md)
    md = re.sub(r"\n{3,}", "\n\n", md)
    return md.strip()


def heading_case(md):
    return re.sub(r"(?m)^(#{2,4})\s+(.+)$", lambda m: f"{m.group(1)} {sentence_case(m.group(2))}", md)


def parse_delimited(raw, fields):
    out = {}
    for i, field in enumerate(fields):
        marker = f"###{field}###"
        nxt = f"###{fields[i + 1]}###" if i + 1 < len(fields) else None
        start = raw.find(marker)
        if start == -1:
            out[field.lower()] = ""
            continue
        start += len(marker)
        end = raw.find(nxt, start) if nxt else len(raw)
        out[field.lower()] = raw[start:end if end != -1 else len(raw)].strip()
    return out


# ───────────────────────── CMS (Payload) ─────────────────────────
class CMS:
    def __init__(self):
        self.url = (cfg.get("SOYROMAN_CMS_URL") or "http://127.0.0.1:3011").rstrip("/")
        key = cfg.get("SOYROMAN_PAYLOAD_API_KEY")
        if not key:
            raise RuntimeError("Falta SOYROMAN_PAYLOAD_API_KEY (Vault hall9000/buildations o .env)")
        self.auth = {"Authorization": f"users API-Key {key}"}

    def get(self, path, **params):
        r = requests.get(f"{self.url}/api/{path}", params=params, headers=self.auth, timeout=20)
        r.raise_for_status()
        return r.json()

    def expertise_id(self, slug):
        if not slug:
            return None
        try:
            docs = self.get("expertise", **{"where[slug][equals]": slug, "limit": 1, "depth": 0}).get("docs", [])
            return docs[0]["id"] if docs else None
        except Exception as e:
            log(f"  expertise '{slug}' no disponible: {e}")
            return None

    def category_id(self, slug):
        if not slug:
            return None
        try:
            docs = self.get("categories", **{"where[slug][equals]": slug, "limit": 1, "depth": 0}).get("docs", [])
            return docs[0]["id"] if docs else None
        except Exception as e:
            log(f"  tema '{slug}' no disponible: {e}")
            return None

    def unique_slug(self, base):
        slug, n = base, 2
        while self.get("posts", **{"where[slug][equals]": slug, "limit": 1, "depth": 0, "draft": "true"}).get("docs"):
            slug = f"{base[:76]}-{n}"
            n += 1
        return slug

    def upload_cover(self, path, alt):
        fname = f"post-{slugify(alt)[:40]}-{int(time.time())}.png"
        with open(path, "rb") as f:
            r = requests.post(
                f"{self.url}/api/media",
                files={"file": (fname, f, "image/png")},
                data={"_payload": json.dumps({"alt": alt})},
                headers=self.auth,
                timeout=90,
            )
        r.raise_for_status()
        return r.json().get("doc", {}).get("id")

    def create_draft(self, data):
        r = requests.post(
            f"{self.url}/api/posts", params={"draft": "true"},
            json=data, headers={**self.auth, "Content-Type": "application/json"}, timeout=60,
        )
        body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {"raw": r.text[:300]}
        if r.status_code >= 400:
            raise RuntimeError(f"Payload {r.status_code}: {json.dumps(body)[:400]}")
        return body.get("doc", {})


# ───────────────────────── Generación ─────────────────────────
def ollama_call(system, prompt, predict=6000, temperature=0.7):
    model = cfg.get("MODEL_WRITER")
    log(f"  -> {model}...")
    r = requests.post(
        f"{cfg.get('OLLAMA_URL')}/api/generate",
        json={"model": model, "system": system, "prompt": prompt, "stream": False,
              "options": {"num_ctx": 16384, "num_predict": predict, "temperature": temperature}},
        timeout=900,
    )
    r.raise_for_status()
    return r.json().get("response", "")


def generate_article(topic, article_type, parent):
    rule, intro_w, body_w = LENGTH[article_type]
    parent_line = f"ARTÍCULO PADRE: {parent}" if parent else ""

    log("[1/2] parte 1 (título, extracto, meta, introducción)")
    p1 = parse_delimited(
        ollama_call(VOICE, PROMPT_PART1.format(topic=topic, article_type=article_type, parent_line=parent_line,
                                               length_rule=rule, intro_words=intro_w)),
        ["TITLE", "SLUG", "EXCERPT", "META_TITLE", "META_DESCRIPTION", "CONTENT_INTRO"],
    )
    title = sentence_case((p1.get("title") or topic).strip().strip('"'))
    log(f"  ok: {title[:70]}")

    log("[2/2] parte 2 (cuerpo)")
    p2 = parse_delimited(
        ollama_call(VOICE, PROMPT_PART2.format(title=title, article_type=article_type, body_words=body_w)),
        ["CONTENT_BODY"],
    )
    content = (p1.get("content_intro", "") + "\n\n" + p2.get("content_body", "")).strip()
    content = re.sub(r"(?m)^#\s+", "## ", content)  # sin H1: el título va en su campo
    content = heading_case(tidy(content))
    log(f"  ok: {len(content.split())} palabras")

    return {
        "title": title,
        "slug": slugify(p1.get("slug") or title),
        "excerpt": clip(p1.get("excerpt"), EXCERPT_MAX),
        "metaTitle": clip(sentence_case(p1.get("meta_title") or title), 60),
        "metaDescription": clip(p1.get("meta_description"), 155),
        "content": content,
    }


def brand_check(article):
    """Flags propios de soyroman: reglas de marca, fugas y marcadores por completar."""
    hay = f"{article['title']}\n{article['excerpt']}\n{article['content']}"
    flags, details = [], {}
    brand_hits = sorted({m.group() for p in BRAND_PATTERNS for m in p.finditer(hay)})
    if brand_hits:
        flags.append("brand_rule_violation")
        details["brand_hits"] = brand_hits[:5]
    leak_hits = [m.group() for p in qa.LEAK_PATTERNS for m in [p.search(hay)] if m]
    if leak_hits:
        flags.append("leak_suspected")
        details["leak_hits"] = leak_hits[:5]
    placeholders = PLACEHOLDER.findall(article["content"])
    details["placeholders"] = len(placeholders)
    return flags, details


# ───────────────────────── Candado: un solo motor a la vez ─────────────────────────
LOCK_FILE = os.environ.get("SOYROMAN_ENGINES_LOCK", "/tmp/soyroman-engines.lock")


@contextlib.contextmanager
def engine_lock(name, wait_minutes=45):
    """Evita que dos motores (blog, glosario, notas) usen Ollama/ComfyUI al mismo tiempo.
    Si otro está corriendo, espera hasta `wait_minutes`; si no se libera, sale sin hacer nada."""
    fh = open(LOCK_FILE, "w")
    deadline = time.time() + wait_minutes * 60
    while True:
        try:
            fcntl.flock(fh, fcntl.LOCK_EX | fcntl.LOCK_NB)
            break
        except BlockingIOError:
            if time.time() > deadline:
                log(f"[lock] otro motor sigue corriendo tras {wait_minutes} min; {name} no se ejecuta")
                fh.close()
                raise SystemExit(0)
            time.sleep(15)
    try:
        fh.write(f"{name} {os.getpid()}\n")
        fh.flush()
        yield
    finally:
        fcntl.flock(fh, fcntl.LOCK_UN)
        fh.close()


# ───────────────────────── Portada (ComfyUI, mismo servicio que buildations) ─────────────────────────
def _comfyui_active():
    try:
        return subprocess.run(["systemctl", "is-active", "comfyui"], capture_output=True, text=True, timeout=5).stdout.strip() == "active"
    except Exception:
        return False


def _comfyui_warmup():
    try:
        subprocess.run(["sudo", "systemctl", "start", "comfyui"], capture_output=True, timeout=10)
    except Exception as e:
        log(f"  systemctl start error: {e}")
        return False
    for i in range(30):
        try:
            if requests.get("http://localhost:8188/system_stats", timeout=3).status_code == 200:
                log(f"  ComfyUI listo en {(i + 1) * 2}s")
                return True
        except Exception:
            pass
        time.sleep(2)
    return False


def _comfyui_stop():
    """Apaga ComfyUI para liberar la VRAM (si no, Ollama carga el modelo a medias y va ~10x más lento)."""
    try:
        subprocess.run(["sudo", "systemctl", "stop", "comfyui"], capture_output=True, timeout=30)
        log("  ComfyUI apagado (VRAM liberada)")
    except Exception as e:
        log(f"  no se pudo apagar ComfyUI: {e}")


def generate_cover(expertise, title):
    was_active = _comfyui_active()
    if not was_active and not _comfyui_warmup():
        log("  ComfyUI no disponible, sin portada")
        return None, None
    prompt = f"{COVER_BASE}, {COVER_BY_EXPERTISE.get(expertise, COVER_BY_EXPERTISE['motores-ia'])}, subtle reference to: {title[:60].lower()}"
    try:
        res = subprocess.run(["bash", cfg.get("COMFYUI_SERVICE"), prompt, IMAGE_STEPS, IMAGE_WIDTH, IMAGE_HEIGHT],
                             capture_output=True, text=True, timeout=600)
        last = (res.stdout.strip().split("\n") or [""])[-1]
        try:
            data = json.loads(last)
        except json.JSONDecodeError:
            log(f"  ComfyUI no devolvió JSON. Última línea: {last[:200]!r} · stderr: {res.stderr.strip()[-200:]!r}")
            return None, prompt
        path = data.get("image") or data.get("filename")
        if not path or not os.path.exists(path):
            log(f"  ComfyUI respondió sin un archivo válido: {json.dumps(data)[:200]}")
            return None, prompt
        return path, prompt
    except Exception as e:
        log(f"  comfyui error: {e}")
        return None, prompt
    finally:
        if not was_active:  # solo lo apagamos si lo encendimos nosotros
            _comfyui_stop()


# ───────────────────────── Selección de tema ─────────────────────────
def pick_topic():
    used = set()
    try:
        for run in tel.get_recent_runs(ENGINE_NAME, limit=len(ALL_TOPICS), status="success"):
            if run.get("topic"):
                used.add(run["topic"])
    except Exception as e:
        log(f"  telemetría no disponible para filtrar temas: {e}")
    fresh = [t for t in ALL_TOPICS if t[0] not in used]
    return random.choice(fresh or ALL_TOPICS)


# ───────────────────────── Main ─────────────────────────
def main():
    ap = argparse.ArgumentParser(description="Genera un borrador de blog para soyroman.com")
    ap.add_argument("topic", nargs="*", help="tema libre (si se omite, usa la biblioteca)")
    ap.add_argument("--type", choices=["pillar", "satellite"], default="satellite")
    ap.add_argument("--expertise", default="", help="slug de Expertise para ligar el post")
    ap.add_argument("--no-cover", action="store_true")
    ap.add_argument("--dry-run", action="store_true", help="genera e imprime; no guarda nada")
    ap.add_argument("--cover-only", metavar="TITULO", help="solo genera una portada (para iterar el prompt); no usa Ollama ni el CMS")
    args = ap.parse_args()

    if args.cover_only:
        path, prompt = generate_cover(args.expertise or "motores-ia", args.cover_only)
        log(json.dumps({"image": path, "prompt": prompt}, ensure_ascii=False, indent=2))
        return

    if args.topic:
        topic, article_type, parent, expertise, trigger = " ".join(args.topic), args.type, "", args.expertise, "manual"
    else:
        topic, article_type, parent, expertise = pick_topic()
        trigger = "cron"

    log(f"\n{'=' * 60}\nSOYROMAN CONTENT ENGINE\n  {topic}\n  {article_type} | {expertise or '—'} | {trigger}\n{'=' * 60}")

    if args.dry_run:
        art = generate_article(topic, article_type, parent)
        flags, details = brand_check(art)
        log(json.dumps({**art, "content": art["content"][:1500] + "…", "flags": flags, "details": details},
                       ensure_ascii=False, indent=2))
        return

    cms = CMS()  # falla rápido si falta la API key, antes de avisar o generar
    send_telegram(f"🖊 <b>soyroman: generando borrador</b>\n{topic}\n<i>{article_type} | {expertise or '—'}</i>")

    with tel.TelemetryRun(ENGINE_NAME, topic=topic, triggered_by=trigger,
                          metadata={"article_type": article_type, "expertise": expertise}) as run:
        try:
            art = generate_article(topic, article_type, parent)
        except Exception as e:
            run.set_status("failed", error=f"generación falló: {e}")
            send_telegram(f"❌ soyroman: error generando\n{e}")
            raise

        # Anti-duplicado cruzado (buildations + soyroman)
        dedup_text = f"{art['title']}\n{art['excerpt']}\n{art['content'][:1500]}"
        try:
            dup = dedup.check_duplicate(dedup_text)
            log(f"[dedup] level={dup['level']} score={dup['score']}")
            run.add_metadata(dedup_score=dup["score"], dedup_level=dup["level"])
            if dup["level"] == "duplicate":
                sim = dup.get("similar_doc") or {}
                run.set_status("skipped", error=f"duplicado de {sim.get('engine')}:{sim.get('doc_id')}")
                send_telegram(f"⚠️ soyroman: duplicado, no se guardó\nSimilar a: {sim.get('title', '?')} ({sim.get('engine')})")
                return
        except Exception as e:
            log(f"  dedup error (no bloqueante): {e}")
            run.add_metadata(dedup_error=str(e))

        # Portada
        cover_id = None
        if not args.no_cover:
            log("[cover] generando portada…")
            path, prompt = generate_cover(expertise, art["title"])
            run.add_metadata(cover_prompt=prompt)
            if path:
                try:
                    cover_id = cms.upload_cover(path, art["title"])
                    log(f"  ok media {cover_id}")
                except Exception as e:
                    log(f"  subida de portada falló: {e}")

        # Calidad: checks compartidos + reglas de soyroman
        q = qa.score_content("articles", art, extras={"type": article_type, "engine": expertise or "general",
                                                      "has_cover": bool(cover_id)})
        extra_flags, extra_details = brand_check(art)
        flags = q["flags"] + extra_flags
        score = max(0.0, round(q["score"] - 2.0 * len(extra_flags), 2))
        run.set_quality(score, flags=flags)
        run.add_metadata(**extra_details)
        log(f"[quality] score={score} flags={flags} placeholders={extra_details['placeholders']}")

        # Guardar borrador
        data = {
            "title": art["title"],
            "slug": cms.unique_slug(art["slug"] or slugify(art["title"])),
            "excerpt": art["excerpt"],
            "markdownSource": art["content"],
            "meta": {"title": art["metaTitle"], "description": art["metaDescription"]},
        }
        exp_id = cms.expertise_id(expertise)
        if exp_id:
            data["expertises"] = [exp_id]
        cat_slug = category_for(topic, expertise)
        cat_id = cms.category_id(cat_slug)
        if cat_id:
            data["categories"] = [cat_id]
        run.add_metadata(category=cat_slug)
        if cover_id:
            data["cover"] = cover_id
            data["meta"]["image"] = cover_id

        try:
            doc = cms.create_draft(data)
        except Exception as e:
            run.set_status("failed", error=str(e))
            send_telegram(f"❌ soyroman: Payload rechazó el borrador\n{str(e)[:300]}")
            return
        post_id = doc.get("id")
        run.set_output("posts", post_id)

        try:
            dedup.index_content(ENGINE_NAME, post_id, data["slug"], art["title"], dedup_text,
                                text_source="title+excerpt+content[:1500]")
        except Exception as e:
            run.add_metadata(index_error=str(e))

        alert = "🚨 " if extra_flags else ""
        send_telegram(
            f"✅ <b>soyroman: borrador listo para revisar</b>\n"
            f"📝 {art['title']}\n"
            f"⭐ Calidad: {score}/10 | {'con' if cover_id else 'SIN'} portada\n"
            f"✍️ Marcadores [COMPLETAR]: {extra_details['placeholders']}\n"
            f"{alert}🚩 {', '.join(flags) if flags else 'sin flags'}\n"
            f"🔗 {CMS_PUBLIC}/admin/collections/posts/{post_id}"
        )
        log(f"\nDRAFT {post_id} | score {score} | {CMS_PUBLIC}/admin/collections/posts/{post_id}\n")


if __name__ == "__main__":
    with engine_lock("blog"):
        main()
