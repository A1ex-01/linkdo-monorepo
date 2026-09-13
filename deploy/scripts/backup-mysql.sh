#!/usr/bin/env bash
set -euo pipefail

deploy_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
admin_env_file="$deploy_dir/.env.admin.production"
backend_env_file="$deploy_dir/.env.backend.production"
image_env_file="$deploy_dir/.env.image"
backup_dir="$deploy_dir/backups"

[[ -f "$admin_env_file" ]] || { echo "Missing $admin_env_file" >&2; exit 1; }
[[ -f "$backend_env_file" ]] || { echo "Missing $backend_env_file" >&2; exit 1; }
[[ -f "$image_env_file" ]] || { echo "Missing $image_env_file" >&2; exit 1; }
mkdir -p "$backup_dir"

set -a
. "$backend_env_file"
set +a

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
output="$backup_dir/${MYSQL_DATABASE:-linkdo}-$timestamp.sql.gz"
docker compose --env-file "$backend_env_file" --env-file "$admin_env_file" --env-file "$image_env_file" -f "$deploy_dir/compose.yaml" exec -T \
  -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql \
  mysqldump -uroot --single-transaction --routines --events "${MYSQL_DATABASE:-linkdo}" | gzip > "$output"
echo "Backup written to $output"
