#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
deploy_dir="$root_dir/deploy"

required_files=(
  "$deploy_dir/compose.yaml"
  "$deploy_dir/.env.example"
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
grep -q '^  base-service:' "$deploy_dir/compose.yaml"
grep -q '^  link-service:' "$deploy_dir/compose.yaml"
grep -q '^  file-service:' "$deploy_dir/compose.yaml"
grep -q '^  worker-email:' "$deploy_dir/compose.yaml"
grep -q '^  mysql:' "$deploy_dir/compose.yaml"
grep -q '^  redis:' "$deploy_dir/compose.yaml"
grep -q '^  rabbitmq:' "$deploy_dir/compose.yaml"
grep -q 'proxy_pass http://gateway:8080;' "$deploy_dir/nginx/default.conf"
grep -q 'ccr.ccs.tencentyun.com' "$deploy_dir/compose.yaml"
grep -q '"${compose\[@\]}" pull' "$deploy_dir/scripts/deploy.sh"
if grep -q 'up --build' "$deploy_dir/scripts/deploy.sh"; then
  echo "deploy script must pull registry images instead of building on the server" >&2
  exit 1
fi
grep -q 'docker buildx build' "$deploy_dir/scripts/push-images.sh"
grep -q -- '--push' "$deploy_dir/scripts/push-images.sh"
grep -q 'VITE_PUBLIC_AGENT_URL' "$deploy_dir/scripts/push-images.sh"

if command -v docker >/dev/null 2>&1; then
  created_env_link=false
  if [[ ! -f "$deploy_dir/.env" ]]; then
    ln -s .env.example "$deploy_dir/.env"
    created_env_link=true
  fi
  cleanup() {
    if [[ "$created_env_link" == true ]]; then
      rm -f "$deploy_dir/.env"
    fi
  }
  trap cleanup EXIT
  rendered_compose="$(docker compose --env-file "$deploy_dir/.env.example" -f "$deploy_dir/compose.yaml" config)"
  grep -q 'MYSQL_DSN: root:change-me@tcp(mysql:3306)/linkdo' <<<"$rendered_compose"
  grep -q 'REDIS_ADDR: redis:6379' <<<"$rendered_compose"
  grep -q 'AMQP_URL: amqp://linkdo:change-me@rabbitmq:5672/' <<<"$rendered_compose"
fi

echo "deployment configuration is valid"
