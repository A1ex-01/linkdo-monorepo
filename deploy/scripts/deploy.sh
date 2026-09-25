#!/usr/bin/env bash
set -euo pipefail

deploy_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
admin_env_file="$deploy_dir/.env.admin.production"
backend_env_file="$deploy_dir/.env.backend.production"
web_env_file="$deploy_dir/.env.web.production"
image_env_file="$deploy_dir/.env.image"

if [[ ! -f "$admin_env_file" ]]; then
  echo "Missing $admin_env_file. Copy the Admin .env.product file here." >&2
  exit 1
fi
if [[ ! -f "$backend_env_file" ]]; then
  echo "Missing $backend_env_file. Copy the Backend .env.product file here." >&2
  exit 1
fi
if [[ ! -f "$web_env_file" ]]; then
  echo "Missing $web_env_file. Add Web public build configuration and WEB_HTTP_PORT." >&2
  exit 1
fi
if [[ ! -f "$image_env_file" ]]; then
  echo "Missing $image_env_file. Add REGISTRY_HOST, CCR_NAMESPACE, and IMAGE_TAG." >&2
  exit 1
fi

compose=(docker compose \
  --env-file "$backend_env_file" \
  --env-file "$admin_env_file" \
  --env-file "$web_env_file" \
  --env-file "$image_env_file" \
  -f "$deploy_dir/compose.yaml")

"${compose[@]}" pull
exec "${compose[@]}" up -d --remove-orphans
