#!/usr/bin/env bash
# validate-skill-change — PostToolUse hook for SKILL.md / docs/templates edits.
# Re-runs gamestack-skill-lint --warn-as-error so Claude sees template-link
# drift the moment it introduces it, before the developer ever commits.
set -euo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo "error: jq is required (install: brew install jq)" >&2
  exit 1
fi

FILE_PATH="$(jq -r '.tool_input.file_path // empty')"

case "$FILE_PATH" in
  */skills/*/SKILL.md|*/docs/templates/*.md) ;;
  *) exit 0 ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
exec "$REPO_ROOT/bin/gamestack-skill-lint" --warn-as-error
