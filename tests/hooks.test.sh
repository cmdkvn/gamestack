#!/usr/bin/env bash
# tests/hooks.test.sh — exercises Batch E1's end-user hook scripts and setup integration.
# Scenarios:
#   1. validate-state accepts a well-formed state.json
#   2. validate-state rejects a bad-enum phase
#   3. validate-state rejects missing schema
#   4. validate-state no-ops on non-matching file paths
# (install/uninstall scenarios added in later commits once setup --hooks-for ships.)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOK_VALIDATE="$REPO_ROOT/bin/impl/hooks/gamestack-hook-validate-state"

if ! command -v jq >/dev/null 2>&1; then
  echo "skip: jq not installed; hooks.test.sh requires jq"
  exit 0
fi

if [[ ! -x "$HOOK_VALIDATE" ]]; then
  echo "error: hook not found: $HOOK_VALIDATE" >&2
  exit 1
fi

SCRATCH="$(mktemp -d -t gs-hooks-test.XXXXXX)"
trap 'rm -rf "$SCRATCH"' EXIT

fail_count=0

_fail() {
  echo "FAIL: $1" >&2
  fail_count=$((fail_count + 1))
}

_assert_exit() {
  local expected="$1" actual="$2" label="$3"
  if [ "$expected" != "$actual" ]; then
    _fail "$label: expected exit $expected, got $actual"
  fi
}

_assert_contains() {
  local needle="$1" haystack="$2" label="$3"
  if ! printf '%s' "$haystack" | grep -qF -- "$needle"; then
    _fail "$label: expected output to contain '$needle', got: $haystack"
  fi
}

_assert_empty() {
  local actual="$1" label="$2"
  if [ -n "$actual" ]; then
    _fail "$label: expected empty output, got: $actual"
  fi
}

# ---------------------------------------------------------------------------
# Scenario 1 — validate-state accepts a valid state.json
# ---------------------------------------------------------------------------
echo "--- validate-state: accepts well-formed state.json"
mkdir -p "$SCRATCH/p1/gamestack"
cat > "$SCRATCH/p1/gamestack/state.json" <<'EOF'
{
  "schema": 1,
  "project": {
    "name": "Test",
    "engine": "godot",
    "phase": "prototype",
    "review_mode": "normal"
  }
}
EOF
set +e
out="$(echo "{\"tool_input\":{\"file_path\":\"$SCRATCH/p1/gamestack/state.json\"}}" | "$HOOK_VALIDATE" 2>&1)"
rc=$?
set -e
_assert_exit 0 "$rc" "validate-state on valid file"
_assert_empty "$out" "validate-state on valid file (no output)"

# ---------------------------------------------------------------------------
# Scenario 2 — validate-state rejects bad-enum phase
# ---------------------------------------------------------------------------
echo "--- validate-state: rejects bad-enum phase"
mkdir -p "$SCRATCH/p2/gamestack"
cat > "$SCRATCH/p2/gamestack/state.json" <<'EOF'
{
  "schema": 1,
  "project": {
    "name": "Test",
    "engine": "godot",
    "phase": "production-ready",
    "review_mode": "normal"
  }
}
EOF
set +e
out="$(echo "{\"tool_input\":{\"file_path\":\"$SCRATCH/p2/gamestack/state.json\"}}" | "$HOOK_VALIDATE" 2>&1)"
rc=$?
set -e
_assert_exit 1 "$rc" "validate-state on bad-enum phase"
_assert_contains "project.phase must be one of" "$out" "validate-state bad-enum error message"
_assert_contains "production-ready" "$out" "validate-state bad-enum mentions offending value"

# ---------------------------------------------------------------------------
# Scenario 3 — validate-state rejects missing schema
# ---------------------------------------------------------------------------
echo "--- validate-state: rejects missing schema"
mkdir -p "$SCRATCH/p3/gamestack"
cat > "$SCRATCH/p3/gamestack/state.json" <<'EOF'
{
  "project": {
    "name": "Test",
    "engine": "godot",
    "phase": "prototype"
  }
}
EOF
set +e
out="$(echo "{\"tool_input\":{\"file_path\":\"$SCRATCH/p3/gamestack/state.json\"}}" | "$HOOK_VALIDATE" 2>&1)"
rc=$?
set -e
_assert_exit 1 "$rc" "validate-state on missing schema"
_assert_contains "schema must be 1" "$out" "validate-state missing-schema error"

# ---------------------------------------------------------------------------
# Scenario 4 — validate-state no-ops on non-matching paths
# ---------------------------------------------------------------------------
echo "--- validate-state: no-op on non-matching file path"
set +e
out="$(echo '{"tool_input":{"file_path":"/tmp/unrelated.txt"}}' | "$HOOK_VALIDATE" 2>&1)"
rc=$?
set -e
_assert_exit 0 "$rc" "validate-state no-op exit"
_assert_empty "$out" "validate-state no-op (silent)"

# ---------------------------------------------------------------------------
# Result
# ---------------------------------------------------------------------------
if [ "$fail_count" -ne 0 ]; then
  echo "FAILED: $fail_count assertion(s) failed" >&2
  exit 1
fi
echo "OK: all hook scenarios passed"
