#!/usr/bin/env bash
set -euo pipefail

deploy_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
env_file="$deploy_dir/.env"

if [[ ! -f "$env_file" ]]; then
  echo "Missing $env_file. Copy .env.example and fill in the production values." >&2
  exit 1
fi

compose=(docker compose --env-file "$env_file" -f "$deploy_dir/compose.yaml")

"${compose[@]}" pull
exec "${compose[@]}" up -d --remove-orphans
