# Motores de contenido — soyroman.com

Genera **borradores** de blog en el CMS (Payload en Hall). El CMS obliga a que todo
lo que escribe el usuario `bot` quede como borrador: solo Román publica.

## Requisitos en Hall
- Venv compartido: `~/homeserver/venv` (requests, psycopg2, qdrant_client).
- Módulos compartidos: `~/homeserver/scripts/buildations_engines/` (o `BUILDATIONS_ENGINES_DIR`).
- Secreto en Vault (sin sobrescribir los demás): `vault kv patch hall9000/buildations SOYROMAN_PAYLOAD_API_KEY=-`

## Uso
```bash
cd ~/homeserver/soyroman-cms
~/homeserver/venv/bin/python3 tools/content-engine/soyroman_engine.py --dry-run      # prueba sin guardar
~/homeserver/venv/bin/python3 tools/content-engine/soyroman_engine.py                # tema de la biblioteca
~/homeserver/venv/bin/python3 tools/content-engine/soyroman_engine.py "tema" --type pillar --expertise crm-revops
```

## Cron (martes y jueves, 7:47)
```
47 7 * * 2,4 cd /home/hall/homeserver/soyroman-cms && /home/hall/homeserver/venv/bin/python3 tools/content-engine/soyroman_engine.py >> /home/hall/homeserver/logs/soyroman-content.log 2>&1
```

Temas: `topics.py`. Marcadores `[COMPLETAR: …]` = dónde va un ejemplo real tuyo antes de publicar.

## Glosario (`glossary_engine.py`)
Genera borradores de los términos de `glossary_terms.py` que aún no existen en el CMS.
```bash
~/homeserver/venv/bin/python3 tools/content-engine/glossary_engine.py --dry-run --term roas   # prueba
~/homeserver/venv/bin/python3 tools/content-engine/glossary_engine.py --batch 5
```

## Blog v2 (`blog_engine.py`)
Escribe a partir de `editorial_map.py` (90 temas con lector, tesis, formato, términos y recurso):
brief → redacción por secciones → editor → calificación (segunda pasada si < 7) → resumen, enlaces al glosario,
llamado a la calculadora y preguntas frecuentes → portada por tema. `soyroman_engine.py` queda como módulo compartido.
```bash
~/homeserver/venv/bin/python3 tools/content-engine/blog_engine.py --list            # estado del mapa
~/homeserver/venv/bin/python3 tools/content-engine/blog_engine.py --dry-run --topic "ROAS, ROMI"
~/homeserver/venv/bin/python3 tools/content-engine/blog_engine.py --batch 3          # tres borradores
```
Modelo: `SOYROMAN_MODEL_WRITER` en el `.env` de buildations_engines (recomendado `qwen3:14b`; si no existe, usa `MODEL_WRITER`).

## Notas de campo (`notes_engine.py`)
Redacta las notas en etapa "idea" usando SOLO tus apuntes (campo "Tus apuntes"). La idea debe
guardarse como borrador (no publicada) para que el bot pueda editarla.
```bash
~/homeserver/venv/bin/python3 tools/content-engine/notes_engine.py --dry-run
```

## Cron sugerido (escalonado para no saturar Ollama)
```
# Blog v2: lote inicial, 3 por noche (quitar tras ~9 noches)
17 1  * * *   cd /home/hall/homeserver/soyroman-cms && /home/hall/homeserver/venv/bin/python3 tools/content-engine/blog_engine.py --batch 3 >> /home/hall/homeserver/logs/soyroman-content.log 2>&1
# Blog v2: ritmo normal, 1 artículo lunes, miércoles y viernes
# 17 1  * * 1,3,5 cd /home/hall/homeserver/soyroman-cms && /home/hall/homeserver/venv/bin/python3 tools/content-engine/blog_engine.py >> /home/hall/homeserver/logs/soyroman-content.log 2>&1
23 6  * * *   cd /home/hall/homeserver/soyroman-cms && /home/hall/homeserver/venv/bin/python3 tools/content-engine/glossary_engine.py --batch 3 >> /home/hall/homeserver/logs/soyroman-glossary.log 2>&1
11 9  * * *   cd /home/hall/homeserver/soyroman-cms && /home/hall/homeserver/venv/bin/python3 tools/content-engine/notes_engine.py >> /home/hall/homeserver/logs/soyroman-notes.log 2>&1
```

## Fiabilidad
- **Candado compartido** (`/tmp/soyroman-engines.lock`): los tres motores nunca corren a la vez; si uno está ocupado, el otro espera hasta 45 min.
- **ComfyUI se apaga** al terminar la portada si el motor lo encendió, para que Ollama recupere la VRAM.
- **Iterar portadas** sin generar posts:
  `~/homeserver/venv/bin/python3 tools/content-engine/soyroman_engine.py --cover-only "Título de prueba" --expertise crm-revops`

## Seed del CMS (en Hall)
Idempotente: crea o actualiza perfil, expertise, temas, proyectos, herramientas y menús, y solo llena campos vacíos de
lo que se edita a mano (frameworks, competencias, casos). Al terminar revalida el sitio.
```bash
cd ~/homeserver/soyroman-cms && git pull
set -a; . ./.env.hall; set +a
docker run --rm --network soyroman-cms_default -v "$PWD":/app -v /app/node_modules -w /app \
  -e PAYLOAD_SECRET="$PAYLOAD_SECRET" -e FRONTEND_URL="$FRONTEND_URL" -e REVALIDATE_SECRET="$REVALIDATE_SECRET" \
  -e DATABASE_URI="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@soyroman-db:5432/$POSTGRES_DB" \
  node:22-alpine sh -c 'corepack enable && corepack prepare pnpm@10 --activate >/dev/null && pnpm install --frozen-lockfile --silent && NODE_ENV=production pnpm seed' 2>&1 | tail -15
unset POSTGRES_PASSWORD PAYLOAD_SECRET REVALIDATE_SECRET
```

## Portadas: estilo «Señal»
Cables y conectores de colores sobre negro, un acomodo por tema (`COVER_BY_CATEGORY` en `soyroman_engine.py`).
Probar sin escribir artículos:
```bash
~/homeserver/venv/bin/python3 tools/content-engine/soyroman_engine.py --cover-only "prueba" --expertise crm-revops
```
