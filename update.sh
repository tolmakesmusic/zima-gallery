#!/bin/sh
# Neue Version bauen und Container neu starten. Fotos & Datenbank bleiben unangetastet.
set -e
cd "$(dirname "$0")"
docker build -t zima-gallery:latest .
for f in /var/lib/casaos/apps/zima-gallery/docker-compose.yml ./docker-compose.yml; do
  if [ -f "$f" ]; then docker compose -f "$f" up -d --force-recreate; exit 0; fi
done
echo "docker-compose.yml nicht gefunden – bitte Container in ZimaOS neu starten."
