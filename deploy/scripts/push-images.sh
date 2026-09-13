#!/usr/bin/env bash
set -euo pipefail

# Build deployable linux/amd64 images locally and publish them to Tencent CCR.
# Usage: bash deploy/scripts/push-images.sh [tag]

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
deploy_dir="$repo_root/deploy"
admin_env_file="$deploy_dir/.env.admin.production"
image_env_file="$deploy_dir/.env.image"

if [[ ! -f "$admin_env_file" ]]; then
  echo "Missing $admin_env_file. Copy the Admin .env.product file here." >&2
  exit 1
fi
if [[ ! -f "$image_env_file" ]]; then
  echo "Missing $image_env_file. Add REGISTRY_HOST, CCR_NAMESPACE, and IMAGE_TAG." >&2
  exit 1
fi

# The deployment directory is the only source of release configuration. Admin
# VITE_* values are build-time public configuration. The image file is the
# only source for CCR registry, namespace, and release tag.
set -a
# shellcheck disable=SC1090
source "$admin_env_file"
# shellcheck disable=SC1090
source "$image_env_file"
set +a

registry_host="${REGISTRY_HOST:-ccr.ccs.tencentyun.com}"
namespace="${CCR_NAMESPACE:-ax-linkdo}"
if [[ -n "${1:-}" ]]; then
  tag="$1"
elif [[ -n "${IMAGE_TAG:-}" ]]; then
  tag="$IMAGE_TAG"
else
  tag="latest"
fi

command -v docker >/dev/null 2>&1 || {
  echo "docker is required" >&2
  exit 1
}
docker buildx version >/dev/null 2>&1 || {
  echo "docker buildx is required" >&2
  exit 1
}

build_and_push() {
  local image="$1"
  local dockerfile="$2"
  local context="$3"
  shift 3

  docker buildx build \
    --platform linux/amd64 \
    --file "$dockerfile" \
    --tag "$image:$tag" \
    --push \
    --cache-from "type=registry,ref=$image:buildcache" \
    --cache-to "type=registry,ref=$image:buildcache,mode=max" \
    "$@" \
    "$context"
}

backend_image="$registry_host/$namespace/linkdo-backend"
admin_image="$registry_host/$namespace/linkdo-admin"

build_and_push "$backend_image" "$repo_root/deploy/Dockerfile.backend" "$repo_root/services/backend"
build_and_push "$admin_image" "$repo_root/deploy/Dockerfile.admin" "$repo_root" \
  --build-arg "VITE_CLERK_PUBLISHABLE_KEY=${VITE_CLERK_PUBLISHABLE_KEY:-}" \
  --build-arg "VITE_PUBLIC_AGENT_URL=${VITE_PUBLIC_AGENT_URL:-}"

printf 'Pushed %s:%s\nPushed %s:%s\n' "$backend_image" "$tag" "$admin_image" "$tag"
