# Content engine — soyroman.com

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
