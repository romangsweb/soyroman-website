#!/usr/bin/env python3
"""
Señales del motor de soyroman.com.

  signals.py collect-ai   Copia las visitas de bots de IA (colección `ai-visits` de Payload)
                          a marketing-hall (tabla mkt_ai_visits) para cruzarlas con GSC y GA4.
  signals.py report       Reporte semanal por Telegram: búsqueda, IA, conversión, borradores
                          y los 3 temas que conviene trabajar.
  signals.py report --dry-run   Imprime el reporte sin enviarlo.

Config (Vault hall9000/buildations o .env de buildations_engines):
  SOYROMAN_PAYLOAD_API_KEY, SOYROMAN_CMS_URL, PG_*, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
Cron (Hall):
  50 6 * * *  … signals.py collect-ai
  30 8 * * 1  … signals.py report
"""
import argparse
import html
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import psycopg2

sys.path.insert(0, str(Path(__file__).resolve().parent))

from soyroman_engine import CMS, cfg, log, send_telegram  # noqa: E402

CLIENT = "soyroman"
DOMAIN = "soyroman.com"
LEAD_EVENTS = ("generate_lead", "sign_up", "contact_click")


def db():
    return psycopg2.connect(
        host=cfg.get("PG_HOST") or "localhost",
        port=int(cfg.get("PG_PORT") or 5432),
        dbname=cfg.get("PG_DB") or "homeserver",
        user=cfg.get("PG_USER") or "homeserver",
        password=cfg.get("PG_PASSWORD"),
    )


DDL = """
CREATE TABLE IF NOT EXISTS mkt_ai_visits (
  payload_id  text PRIMARY KEY,
  client_id   text NOT NULL,
  visited_at  timestamptz NOT NULL,
  bot         text NOT NULL,
  company     text,
  kind        text NOT NULL,
  path        text NOT NULL
);
CREATE INDEX IF NOT EXISTS mkt_ai_visits_client_time ON mkt_ai_visits (client_id, visited_at);
"""


# ───────────────────────── collect-ai ─────────────────────────
def collect_ai():
    cms = CMS()
    conn = db()
    with conn, conn.cursor() as cur:
        cur.execute(DDL)
        cur.execute("SELECT max(visited_at) FROM mkt_ai_visits WHERE client_id=%s", (CLIENT,))
        since = cur.fetchone()[0]
    since_iso = (since - timedelta(minutes=5)).isoformat() if since else "2000-01-01T00:00:00Z"

    page, total, new = 1, 0, 0
    while True:
        res = cms.get("ai-visits", **{
            "where[createdAt][greater_than]": since_iso,
            "sort": "createdAt", "limit": 500, "page": page, "depth": 0,
        })
        docs = res.get("docs", [])
        if not docs:
            break
        with conn, conn.cursor() as cur:
            for d in docs:
                cur.execute(
                    """INSERT INTO mkt_ai_visits (payload_id, client_id, visited_at, bot, company, kind, path)
                       VALUES (%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (payload_id) DO NOTHING""",
                    (str(d["id"]), CLIENT, d["createdAt"], d.get("bot") or "?", d.get("company"),
                     d.get("kind") or "?", (d.get("path") or "/")[:300]),
                )
                new += cur.rowcount
        total += len(docs)
        if not res.get("hasNextPage"):
            break
        page += 1
    conn.close()
    log(f"[signals] ai-visits leídas={total} nuevas={new}")


# ───────────────────────── report ─────────────────────────
def pct(a, b):
    if not b:
        return "nuevo" if a else "—"
    return f"{(a - b) / b * 100:+.0f}%"


def q(cur, sql, *args):
    cur.execute(sql, args)
    return cur.fetchall()


def search_block(cur):
    anchor = q(cur, "SELECT max(date) FROM gsc_search_data WHERE site=%s", DOMAIN)[0][0]
    if not anchor:
        return ["<b>BÚSQUEDA</b>  sin datos todavía (Search Console tarda unos días)"], []
    a0, b0 = anchor - timedelta(days=6), anchor - timedelta(days=13)
    def agg(start, end):
        r = q(cur, """SELECT coalesce(sum(clicks),0), coalesce(sum(impressions),0),
                             sum(position*impressions)/nullif(sum(impressions),0)
                      FROM gsc_search_data WHERE site=%s AND date BETWEEN %s AND %s""", DOMAIN, start, end)[0]
        return int(r[0]), int(r[1]), float(r[2]) if r[2] else None
    c1, i1, p1 = agg(a0, anchor)
    c0, i0, _ = agg(b0, a0 - timedelta(days=1))
    lines = [f"<b>BÚSQUEDA</b>  clics {c1} ({pct(c1, c0)}) · impr {i1:,} ({pct(i1, i0)})"
             + (f" · pos {p1:.1f}" if p1 else "")]
    movers = q(cur, """
        WITH w AS (
          SELECT query,
                 sum(position*impressions) FILTER (WHERE date BETWEEN %s AND %s)/nullif(sum(impressions) FILTER (WHERE date BETWEEN %s AND %s),0) AS now_pos,
                 sum(position*impressions) FILTER (WHERE date BETWEEN %s AND %s)/nullif(sum(impressions) FILTER (WHERE date BETWEEN %s AND %s),0) AS prev_pos,
                 sum(impressions) FILTER (WHERE date BETWEEN %s AND %s) AS impr
          FROM gsc_search_data WHERE site=%s AND date BETWEEN %s AND %s GROUP BY query)
        SELECT query, prev_pos, now_pos FROM w
        WHERE now_pos IS NOT NULL AND prev_pos IS NOT NULL AND impr >= 5 AND prev_pos - now_pos >= 3
        ORDER BY prev_pos - now_pos DESC LIMIT 3""",
        a0, anchor, a0, anchor, b0, a0 - timedelta(days=1), b0, a0 - timedelta(days=1), a0, anchor, DOMAIN, b0, anchor)
    for qry, prev, now in movers:
        lines.append(f"  ↑ «{html.escape(qry)}» {prev:.0f}→{now:.0f}")
    striking = q(cur, """
        SELECT query, sum(position*impressions)/nullif(sum(impressions),0) AS pos, sum(impressions) AS impr,
               (array_agg(page ORDER BY impressions DESC))[1] AS page
        FROM gsc_search_data WHERE site=%s AND date > %s
        GROUP BY query HAVING sum(impressions) >= 20
           AND sum(position*impressions)/nullif(sum(impressions),0) BETWEEN 5 AND 20
        ORDER BY sum(impressions) DESC LIMIT 3""", DOMAIN, anchor - timedelta(days=28))
    return lines, striking


def ai_block(cur):
    since = datetime.now(timezone.utc) - timedelta(days=7)
    rows = q(cur, "SELECT kind, bot, count(*) FROM mkt_ai_visits WHERE client_id=%s AND visited_at>=%s GROUP BY kind, bot",
             CLIENT, since)
    if not rows:
        return ["<b>IA</b>  sin visitas de bots esta semana"], []
    total = sum(r[2] for r in rows)
    live = [(b, n) for k, b, n in rows if k == "user"]
    by_kind = {}
    for k, _, n in rows:
        by_kind[k] = by_kind.get(k, 0) + n
    lines = [f"<b>IA</b>  {total} visitas · {by_kind.get('user', 0)} en vivo · {by_kind.get('search', 0)} búsqueda · "
             f"{by_kind.get('training', 0)} entrenamiento"]
    if live:
        lines.append("  en vivo: " + ", ".join(f"{b} {n}" for b, n in sorted(live, key=lambda x: -x[1])))
    top = q(cur, """SELECT path, count(*) FROM mkt_ai_visits WHERE client_id=%s AND visited_at>=%s AND kind='user'
                    GROUP BY path ORDER BY 2 DESC LIMIT 3""", CLIENT, since)
    for path, n in top:
        lines.append(f"  → {html.escape(path)} ({n})")
    return lines, top


def conversion_block(cur):
    rows = dict(q(cur, """SELECT event_name, sum(event_count) FROM ga4_events_data
                          WHERE client_id=%s AND date > current_date - 7 AND event_name = ANY(%s)
                          GROUP BY event_name""", CLIENT, list(LEAD_EVENTS)))
    if not rows:
        return ["<b>CONVERSIÓN</b>  sin eventos todavía"]
    return [f"<b>CONVERSIÓN</b>  leads {int(rows.get('generate_lead', 0))} · suscriptores {int(rows.get('sign_up', 0))}"
            f" · clics a contacto {int(rows.get('contact_click', 0))}"]


def drafts_block(cms):
    try:
        docs = cms.get("posts", **{"where[_status][equals]": "draft", "draft": "true", "limit": 200, "depth": 0}).get("docs", [])
    except Exception as e:
        return [f"<b>BORRADORES</b>  no se pudo leer el CMS ({e.__class__.__name__})"]
    clean = [d for d in docs if "[COMPLETAR]" not in json.dumps(d.get("content") or {}, ensure_ascii=False)]
    return [f"<b>BORRADORES</b>  {len(docs)} pendientes · {len(clean)} sin [COMPLETAR]"]


def next_topic(cms):
    try:
        from blog_engine import pick_topics
        picks = pick_topics(cms, 1)
        return picks[0]["title"] if picks else None
    except Exception as e:
        log(f"  no se pudo elegir tema del mapa: {e}")
        return None


def report(dry_run=False):
    cms = CMS()
    conn = db()
    with conn, conn.cursor() as cur:
        cur.execute(DDL)
        s_lines, striking = search_block(cur)
        a_lines, ai_top = ai_block(cur)
        c_lines = conversion_block(cur)
    conn.close()

    proposals = []
    for qry, pos, impr, page in striking[:1]:
        target = page.replace("https://soyroman.com", "") if page else ""
        proposals.append(f"«{html.escape(qry)}» (pos {pos:.0f}, {int(impr)} impr): reforzar {html.escape(target) or 'la página'}")
    for path, n in ai_top[:1]:
        proposals.append(f"{html.escape(path)}: las IA lo consultan en vivo ({n}); ampliarlo o enlazarlo más")
    topic = next_topic(cms)
    if topic:
        proposals.append(f"Tema nuevo del mapa: «{html.escape(topic)}»")

    week = datetime.now().isocalendar().week
    msg = "\n".join(
        [f"<b>SOYROMAN · semana {week}</b>", ""]
        + s_lines + [""] + a_lines + [""] + c_lines + drafts_block(cms) + [""]
        + ["<b>PROPUESTA</b>"] + [f"  {i}. {p}" for i, p in enumerate(proposals[:3], 1)]
    )
    if dry_run:
        print(msg)
    else:
        send_telegram(msg[:4000])
        log("[signals] reporte enviado")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("cmd", choices=["collect-ai", "report"])
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    collect_ai() if a.cmd == "collect-ai" else report(dry_run=a.dry_run)
