#!/usr/bin/env bash
set -euo pipefail

# Build deployable linux/amd64 images locally and publish them to Tencent CCR.
# Usage: bash deploy/scripts/push-images.sh [tag]

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
registry_host="${REGISTRY_HOST:-ccr.ccs.tencentyun.com}"
namespace="${CCR_NAMESPACE:-ax-linkdo}"
tag="${1:-${IMAGE_TAG:-latest}}"

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
  --build-arg "VITE_PUBLIC_AGENT_URL=${VITE_PUBLIC_AGENT_URL:-}" \
  --build-arg "VITE_PUBLIC_AGENT_API_KEY=${VITE_PUBLIC_AGENT_API_KEY:-}"

printf 'Pushed %s:%s\nPushed %s:%s\n' "$backend_image" "$tag" "$admin_image" "$tag"
