#!/bin/bash
podman-compose up -d
while ! podman exec pbj_db_1 pg_isready -U postgres; do
  echo "Waiting for postgres..."
  sleep 2
done
podman exec pbj_db_1 psql -U postgres -c "CREATE DATABASE n8n_db;"
echo "Done!"
