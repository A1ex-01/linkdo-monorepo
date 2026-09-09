#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
deploy_dir="$root_dir/deploy"

required_files=(
  "$deploy_dir/compose.yaml"
  "$deploy_dir/Dockerfile.admin"
  "$deploy_dir/Dockerfile.backend"
  "$deploy_dir/nginx/default.conf"
  "$deploy_dir/scripts/deploy.sh"
  "$deploy_dir/scripts/push-images.sh"
  "$deploy_dir/scripts/backup-mysql.sh"
  "$deploy_dir/README.md"
)

for file in "${required_files[@]}"; do
  [[ -f "$file" ]] || { echo "missing deployment file: $file" >&2; exit 1; }
done

grep -q '^  admin:' "$deploy_dir/compose.yaml"
grep -q '^  gateway:' "$deploy_dir/compose.yaml"
grep -q '^  worker-email:' "$deploy_dir/compose.yaml"
grep -q '^  mysql:' "$deploy_dir/compose.yaml"
grep -q '^  redis:' "$deploy_dir/compose.yaml"
grep -q '^  rabbitmq:' "$deploy_dir/compose.yaml"
grep -q 'env_file: .env.admin.production' "$deploy_dir/compose.yaml"
grep -q 'env_file: .env.backend.production' "$deploy_dir/compose.yaml"
grep -q -- '- "${HTTP_PORT}:80"' "$deploy_dir/compose.yaml"
grep -q -- '- "${GATEWAY_PORT}:8080"' "$deploy_dir/compose.yaml"
awk '/^  worker-email:/{in_worker=1; next} in_worker && /^  [A-Za-z]/{exit} in_worker{print}' "$deploy_dir/compose.yaml" \
  | grep -q -- '- public'
grep -q 'proxy_pass http://gateway:8080;' "$deploy_dir/nginx/default.conf"

if rg -q 'x-backend-environment|MYSQL_DSN:|REDIS_ADDR:|AMQP_URL:' "$deploy_dir/compose.yaml"; then
  echo "Compose must load backend configuration directly instead of remapping it" >&2
  exit 1
fi
if rg -q '\.env\.example|\.env\.server' "$deploy_dir/compose.yaml" "$deploy_dir/scripts"; then
  echo "deploy must use only its Admin and Backend production environment files" >&2
  exit 1
fi
if rg -q 'docker-entrypoint-initdb.d|mysql/init' "$deploy_dir/compose.yaml" "$deploy_dir/README.md"; then
  echo "MySQL schema must be created by the backend migration runner, not init SQL" >&2
  exit 1
fi
if [[ -e "$deploy_dir/mysql/init/01-schema.sql" ]]; then
  echo "legacy MySQL init schema must not exist" >&2
  exit 1
fi

grep -q 'admin_env_file=.*\.env.admin.production' "$deploy_dir/scripts/deploy.sh"
grep -q 'backend_env_file=.*\.env.backend.production' "$deploy_dir/scripts/deploy.sh"
grep -q 'image_env_file=.*\.env.image' "$deploy_dir/scripts/deploy.sh"
grep -q 'admin_env_file=.*\.env.admin.production' "$deploy_dir/scripts/push-images.sh"
grep -q 'image_env_file=.*\.env.image' "$deploy_dir/scripts/push-images.sh"
if rg -q 'ADMIN_ENV_FILE|ADMIN_PRODUCTION_ENV_FILE|BACKEND_PRODUCTION_ENV_FILE|\.env\.production|\.env\.example' \
  "$deploy_dir/scripts"; then
  echo "deploy scripts must not load project .env files or legacy templates" >&2
  exit 1
fi

echo "deployment configuration is valid"
