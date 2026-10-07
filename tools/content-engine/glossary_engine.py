#!/usr/bin/env python3
"""
Glossary Engine — soyroman.com

Genera BORRADORES de términos del glosario (/glosario) a partir de glossary_terms.py.
Solo crea los términos que todavía no existen en el CMS. El CMS obliga a que todo lo
que escribe el bot quede en borrador: publicar lo hace Román.

Uso:
  python glossary_engine.py              # siguientes 5 términos pendientes
  python glossary_engine.py --batch 10   # siguientes 10
  python glossary_engine.py --term roas  # solo ese slug (aunque no sea el siguiente)
  python glossary_engine.py --dry-run    # genera e imprime, no guarda
"""
import argparse
import json
import re
import sys
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent))
from soyroman_engine import (  # noqa: E402  (reutiliza config, CMS, Ollama y reglas de marca)
    BRAND_PATTERNS,
    CMS,
    CMS_PUBLIC,
    engine_lock,
    VOICE,
    log,
    ollama_call,
    parse_delimited,
    qa,
    send_telegram,
    tel,
    tidy,
)
from glossary_terms import FULL_NAMES, TERMS  # noqa: E402

ENGINE_NAME = "soyroman-glossary"
SLUGS = {s for _, s, _ in TERMS}

SYSTEM = VOICE + """

TAREA ESPECIAL: estás escribiendo una entrada de GLOSARIO, no un artículo. Tono didáctico y preciso.
No uses primera persona ni marcadores [COMPLETAR]. Nada de introducciones ni cierres.
- Si el término es una sigla, SIEMPRE da su nombre completo.
- Montos siempre en USD (escribe "USD 2,000"), nunca mezcles dólares y pesos.
- Sé exacto: no atribuyas al término alcances que no tiene. Sin frases de relleno ("es crucial", "es fundamental")."""

PROMPT = """Escribe la entrada de glosario para el término: {term}
Contexto: marketing B2B y marketing digital. Tema: {topic}.

Responde EXACTAMENTE con este formato (copia los delimitadores tal cual, en mayúsculas, cada uno en su propia línea):
{full_name_block}###DEFINITION###
2 o 3 frases claras que definan el término. Sin jerga, sin "se refiere a", sin "es un concepto".
###FORMULA###
fórmula en una línea con palabras, por ejemplo "Ingresos atribuidos ÷ inversión en anuncios". Si no tiene fórmula, escribe N/A
###EXAMPLE###
un ejemplo concreto de 2 o 3 frases con números en USD que cuadren con la fórmula. Solo el ejemplo, sin conclusiones genéricas
###WHY###
2 o 3 frases: por qué importa en marketing B2B y un error común al usarlo
###RELATED###
de 2 a 4 términos relacionados, separados por comas, elegidos SOLO de esta lista: {candidates}"""


FULL_NAME_BLOCK = """
###FULL_NAME###
si es sigla: su nombre completo, y si está en inglés agrega la traducción entre paréntesis. Si no aplica, escribe N/A
"""


def parse_positional(raw, fields):
    """Respaldo: si el modelo cambió el texto de los delimitadores, toma las secciones por orden."""
    import re as _re
    parts = [x.strip() for x in _re.split(r"(?m)^\s*###[^\n#]*###\s*$", raw)]
    parts = [x for x in parts[1:]] if len(parts) > 1 else []
    return {f.lower(): parts[i] if i < len(parts) else "" for i, f in enumerate(fields)}


def none_if_na(s):
    s = tidy((s or "").strip())
    return None if not s or s.upper().startswith("N/A") else s


def generate(term, slug, topic):
    candidates = ", ".join(t for t, _, _ in TERMS if t != term)
    known = FULL_NAMES.get(slug)
    fields = (["FULL_NAME"] if not known else []) + ["DEFINITION", "FORMULA", "EXAMPLE", "WHY", "RELATED"]
    prompt = PROMPT.format(term=term, topic=topic, candidates=candidates,
                           full_name_block="" if known else FULL_NAME_BLOCK.lstrip("\n"))
    p = {}
    for attempt in (1, 2):  # el modelo a veces altera los delimitadores: respaldo por posición + un reintento
        raw = ollama_call(SYSTEM, prompt, predict=1500, temperature=0.4)
        p = parse_delimited(raw, fields)
        if not (p.get("definition") or "").strip():
            p = parse_positional(raw, fields)
        if (p.get("definition") or "").strip():
            break
        log(f"  respuesta sin formato (intento {attempt}): {raw[:160]!r}")
    related = [r.strip().strip(".") for r in (p.get("related") or "").split(",") if r.strip()]
    by_name = {t.lower(): s for t, s, _ in TERMS}
    return {
        "fullName": known or none_if_na(p.get("full_name")),
        "definition": tidy((p.get("definition") or "").strip()),
        "formula": none_if_na(p.get("formula")),
        "example": none_if_na(p.get("example")),
        "whyItMatters": none_if_na(p.get("why")),
        "related_slugs": [by_name[r.lower()] for r in related if r.lower() in by_name][:4],
    }


def check(term, entry):
    """Flags de calidad: definición genérica/corta, reglas de marca, campos vacíos."""
    flags = []
    d = entry["definition"]
    if len(re.findall(r"[.!?](\s|$)", d)) < 1 or len(d) < 80:
        flags.append("definicion_corta")
    if any(p.search(d.lower()) for p in qa.GENERIC_PATTERNS):
        flags.append("definicion_generica")
    hay = " ".join(str(v) for v in entry.values() if isinstance(v, str))
    if any(p.search(hay) for p in BRAND_PATTERNS):
        flags.append("brand_rule_violation")
    if not entry["example"]:
        flags.append("sin_ejemplo")
    is_acronym = bool(re.fullmatch(r"[A-Z]{2,6}", term.replace(":", "").replace(" ", "")))
    if is_acronym and not entry["fullName"]:
        flags.append("sigla_sin_nombre_completo")
    if re.search(r"\bpesos?\b", hay, re.IGNORECASE):
        flags.append("moneda_mezclada")
    return flags


class GlossaryCMS(CMS):
    def existing_slugs(self):
        out, page = set(), 1
        while True:
            res = self.get("glossary", limit=100, page=page, depth=0, draft="true")
            out |= {d["slug"] for d in res.get("docs", [])}
            if not res.get("hasNextPage"):
                return out
            page += 1

    def ids_for(self, slugs):
        if not slugs:
            return []
        params = {"limit": 20, "depth": 0, "draft": "true"}
        for i, s in enumerate(slugs):
            params[f"where[slug][in][{i}]"] = s
        return [d["id"] for d in self.get("glossary", **params).get("docs", [])]

    def create(self, data):
        r = requests.post(f"{self.url}/api/glossary", params={"draft": "true"}, json=data,
                          headers={**self.auth, "Content-Type": "application/json"}, timeout=30)
        if r.status_code >= 400:
            sent = {k: (v if k in ("categories", "relatedTerms", "slug") else f"<{len(str(v))} chars>") for k, v in data.items()}
            raise RuntimeError(f"Payload {r.status_code}: {r.text[:300]} · enviado: {sent}")
        return r.json().get("doc", {})


def main():
    ap = argparse.ArgumentParser(description="Genera borradores del glosario de soyroman.com")
    ap.add_argument("--batch", type=int, default=5)
    ap.add_argument("--term", help="slug específico de glossary_terms.py")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    cms = GlossaryCMS()
    done = cms.existing_slugs()
    if args.term:
        queue = [t for t in TERMS if t[1] == args.term]
        if not queue:
            sys.exit(f"'{args.term}' no está en glossary_terms.py")
    else:
        queue = [t for t in TERMS if t[1] not in done][: args.batch]
    if not queue:
        log("Glosario completo: no hay términos pendientes.")
        return

    log(f"Pendientes: {len([t for t in TERMS if t[1] not in done])} · generando {len(queue)}")
    created, skipped = [], []

    for term, slug, topic in queue:
        log(f"\n— {term}")
        with tel.TelemetryRun(ENGINE_NAME, topic=term, triggered_by="manual" if args.term else "cron",
                              metadata={"slug": slug, "category": topic}) as run:
            entry = generate(term, slug, topic)
            flags = check(term, entry)
            run.set_quality(max(0.0, 10.0 - 2 * len(flags)), flags=flags)
            if args.dry_run:
                log(json.dumps({**entry, "flags": flags}, ensure_ascii=False, indent=2))
                continue
            if not entry["definition"]:
                run.set_status("failed", error="el modelo no respetó el formato (sin definición)")
                skipped.append(term)
                log("  saltado: el modelo no devolvió una definición con el formato pedido")
                continue
            data = {k: v for k, v in entry.items() if k != "related_slugs" and v}
            data.update({"term": term, "slug": slug})
            cat = cms.category_id(topic)
            if cat:
                data["categories"] = [cat]
            rel = cms.ids_for([s for s in entry["related_slugs"] if s in done or s in {c[1] for c in created}])
            if rel:
                data["relatedTerms"] = rel
            try:
                doc = cms.create(data)
                run.set_output("glossary", doc.get("id"))
                created.append((term, slug, flags))
                log(f"  ok borrador {doc.get('id')} {flags or ''}")
            except Exception as e:
                run.set_status("failed", error=str(e))
                skipped.append(term)
                log(f"  error: {e}")

    if created and not args.dry_run:
        lines = "\n".join(f"• {t}{' 🚩 ' + ', '.join(f) if f else ''}" for t, _, f in created)
        send_telegram(
            f"📖 <b>soyroman: {len(created)} términos en borrador</b>\n{lines}\n"
            f"{'⚠️ Fallaron: ' + ', '.join(skipped) if skipped else ''}\n"
            f"🔗 {CMS_PUBLIC}/admin/collections/glossary?where[_status][equals]=draft"
        )


if __name__ == "__main__":
    with engine_lock("glosario"):
        main()
