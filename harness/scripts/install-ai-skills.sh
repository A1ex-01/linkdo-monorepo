#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "==> Checking superpowers skills"

SUPERPOWERS_SKILLS=(brainstorming writing-plans systematic-debugging test-driven-development verification-before-completion)
SEARCH_DIRS=("$HOME/.claude/skills" "$HOME/.agents/skills")

find_skill() {
  local skill="$1"
  for dir in "${SEARCH_DIRS[@]}"; do
    if [[ -f "$dir/$skill/SKILL.md" ]]; then
      echo "$dir/$skill/SKILL.md"
      return 0
    fi
  done
  return 1
}

missing=0
for skill in "${SUPERPOWERS_SKILLS[@]}"; do
  if path=$(find_skill "$skill"); then
    echo "ok: $path"
  else
    echo "missing: $skill"
    missing=1
  fi
done

if [[ "$missing" -ne 0 ]]; then
  cat <<'MSG' >&2

Some superpowers skills are missing. Install via:
  npx skills add obra/superpowers -g
MSG
  if [[ "${STRICT_SUPERPOWERS:-0}" == "1" ]]; then
    exit 2
  fi
fi

echo "==> AI skills installation check complete"
