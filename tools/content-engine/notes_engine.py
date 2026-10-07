#!/usr/bin/env python3
"""
Notes Engine — soyroman.com

Redacta notas de campo A PARTIR DE LOS APUNTES de Román. Toma las notas en etapa
"idea" (borradores creados en el CMS), escribe el texto solo con lo que dicen los
apuntes y las pasa a "redactada". Nunca inventa hechos; nunca publica.

Uso:
  python notes_engine.py            # todas las ideas pendientes
  python notes_engine.py --dry-run  # genera e imprime, no guarda
"""
import argparse
import json
import re
import sys
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent))
from soyroman_engine import (  # noqa: E402
    BRAND_PATTERNS,
    CMS,
    CMS_PUBLIC,
    engine_lock,
    VOICE,
    log,
    ollama_call,
    parse_delimited,
    send_telegram,
    tel,
    tidy,
)

ENGINE_NAME = "soyroman-notes"
TOPICS = [
    "generacion-demanda", "crm-revops", "seo-aeo", "paid-media", "contenido-email",
    "analitica", "sitios-web", "liderazgo", "ia-aplicada",
]

SYSTEM = VOICE + """

TAREA ESPECIAL: redactas una NOTA DE CAMPO a partir de los apuntes de Román.
- Usa SOLO la información de los apuntes. No agregues hechos, cifras, clientes ni anécdotas que no estén ahí.
- Si a los apuntes les falta algo para que la nota se entienda, deja un marcador [COMPLETAR: qué falta].
- Primera persona, tono de bitácora: qué pasó, qué aprendí, qué haría distinto.
- 150 a 400 palabras. Sin título (ya existe). Puedes usar 1 o 2 subtítulos ## y listas si ayudan."""

PROMPT = """Título de la nota: {title}

Apuntes de Román (fuente única):
\"\"\"
{notes}
\"\"\"

Responde EXACTAMENTE con este formato:

###TOPIC###
uno de estos slugs, el que mejor describa la nota: {topics}
###BODY###
la nota en Markdown"""


class NotesCMS(CMS):
    def ideas(self):
        res = self.get("notes", **{"where[stage][equals]": "idea", "limit": 20, "depth": 0, "draft": "true"})
        return res.get("docs", [])

    def update(self, note_id, data):
        r = requests.patch(f"{self.url}/api/notes/{note_id}", params={"draft": "true"}, json=data,
                           headers={**self.auth, "Content-Type": "application/json"}, timeout=30)
        if r.status_code >= 400:
            raise RuntimeError(f"Payload {r.status_code}: {r.text[:300]}")
        return r.json().get("doc", {})


def main():
    ap = argparse.ArgumentParser(description="Redacta notas de campo a partir de los apuntes de Román")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    cms = NotesCMS()
    ideas = cms.ideas()
    if not ideas:
        log("No hay notas en etapa 'idea'.")
        return

    done, waiting = [], []
    for n in ideas:
        title, raw_notes = n.get("title", ""), (n.get("notes") or "").strip()
        if len(raw_notes) < 20:
            waiting.append(title)  # sin apuntes suficientes: no inventamos
            continue
        if n.get("_status") == "published":
            waiting.append(f"{title} (ya publicada: el bot no puede editarla)")
            continue

        log(f"\n— {title}")
        with tel.TelemetryRun(ENGINE_NAME, topic=title, triggered_by="cron", metadata={"note_id": n["id"]}) as run:
            p = parse_delimited(
                ollama_call(SYSTEM, PROMPT.format(title=title, notes=raw_notes, topics=", ".join(TOPICS)),
                            predict=1500, temperature=0.5),
                ["TOPIC", "BODY"],
            )
            body = tidy(re.sub(r"(?m)^#\s+", "## ", p.get("body", "")))
            topic = (p.get("topic") or "").strip().lower()
            words = len(body.split())
            placeholders = len(re.findall(r"\[COMPLETAR:[^\]]*\]", body))
            flags = (["muy_corta"] if words < 120 else []) + (["muy_larga"] if words > 500 else [])
            if any(pt.search(body) for pt in BRAND_PATTERNS):
                flags.append("brand_rule_violation")
            run.set_quality(max(0.0, 10.0 - 2 * len(flags)), flags=flags)
            run.add_metadata(words=words, placeholders=placeholders, topic=topic)

            if args.dry_run:
                log(json.dumps({"topic": topic, "words": words, "flags": flags, "body": body}, ensure_ascii=False, indent=2))
                continue

            data = {"markdownSource": body, "stage": "drafted"}
            if not n.get("categories") and topic in TOPICS:
                cat = cms.category_id(topic)
                if cat:
                    data["categories"] = [cat]
            try:
                cms.update(n["id"], data)
                run.set_output("notes", n["id"])
                done.append((title, words, placeholders, flags, n["id"]))
                log(f"  ok: {words} palabras, {placeholders} marcadores {flags or ''}")
            except Exception as e:
                run.set_status("failed", error=str(e))
                log(f"  error: {e}")

    if (done or waiting) and not args.dry_run:
        lines = "\n".join(
            f"• {t} · {w} palabras · [COMPLETAR]: {ph}{' 🚩 ' + ', '.join(f) if f else ''}\n  {CMS_PUBLIC}/admin/collections/notes/{i}"
            for t, w, ph, f, i in done
        )
        pend = ("\n⏸ Sin apuntes suficientes: " + ", ".join(waiting)) if waiting else ""
        send_telegram(f"🗒 <b>soyroman: notas redactadas</b>\n{lines or '—'}{pend}")


if __name__ == "__main__":
    with engine_lock("notas"):
        main()
