#!/usr/bin/env bash
# tests/hooks.test.sh — exercises Batch E1's end-user hook scripts and setup integration.
# Scenarios:
#   1. validate-state accepts a well-formed state.json
#   2. validate-state rejects a bad-enum phase
#   3. validate-state rejects missing schema
#   4. validate-state no-ops on non-matching file paths
#   5. setup --hooks-for install creates symlinks + settings entries
#   6. setup --hooks-for re-run is idempotent
#   7. setup --hooks-for preserves user's existing hooks
# (uninstall/status scenarios added in the next commit.)
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
# Scenario 5 — setup --hooks-for install creates symlinks + settings entries
# ---------------------------------------------------------------------------
echo "--- setup --hooks-for: fresh install"
PROJECT="$SCRATCH/p2"
CLI_DIR="$SCRATCH/cli"
mkdir -p "$PROJECT" "$CLI_DIR"
set +e
out="$("$REPO_ROOT/setup" --cli --hooks-for "$PROJECT" --cli-dir "$CLI_DIR" 2>&1)"
rc=$?
set -e
_assert_exit 0 "$rc" "setup --hooks-for install"

if [ ! -L "$CLI_DIR/gamestack-hook-session-start" ]; then
  _fail "setup --hooks-for install: session-start symlink missing"
fi
if [ ! -L "$CLI_DIR/gamestack-hook-validate-state" ]; then
  _fail "setup --hooks-for install: validate-state symlink missing"
fi

settings="$PROJECT/.claude/settings.local.json"
if [ ! -f "$settings" ]; then
  _fail "setup --hooks-for install: settings.local.json missing"
else
  ss_count="$(jq '.hooks.SessionStart // [] | length' "$settings")"
  pt_count="$(jq '.hooks.PostToolUse // [] | length' "$settings")"
  if [ "$ss_count" != "1" ]; then
    _fail "setup --hooks-for install: expected 1 SessionStart entry, got $ss_count"
  fi
  if [ "$pt_count" != "1" ]; then
    _fail "setup --hooks-for install: expected 1 PostToolUse entry, got $pt_count"
  fi
fi

# ---------------------------------------------------------------------------
# Scenario 6 — re-running install is idempotent (no duplicate entries)
# ---------------------------------------------------------------------------
echo "--- setup --hooks-for: re-run idempotency"
before="$(cat "$settings")"
set +e
out="$("$REPO_ROOT/setup" --cli --hooks-for "$PROJECT" --cli-dir "$CLI_DIR" 2>&1)"
rc=$?
set -e
_assert_exit 0 "$rc" "setup --hooks-for re-run"
after="$(cat "$settings")"
if [ "$before" != "$after" ]; then
  _fail "setup --hooks-for re-run: settings.local.json changed between runs (expected no-op)"
fi
ss_count="$(jq '.hooks.SessionStart // [] | length' "$settings")"
pt_count="$(jq '.hooks.PostToolUse // [] | length' "$settings")"
if [ "$ss_count" != "1" ]; then
  _fail "setup --hooks-for re-run: SessionStart duplicated (got $ss_count)"
fi
if [ "$pt_count" != "1" ]; then
  _fail "setup --hooks-for re-run: PostToolUse duplicated (got $pt_count)"
fi

# ---------------------------------------------------------------------------
# Scenario 7 — install preserves user's pre-existing hooks
# ---------------------------------------------------------------------------
echo "--- setup --hooks-for: preserves user's existing hooks"
PROJECT="$SCRATCH/p3_install"
mkdir -p "$PROJECT/.claude"
cat > "$PROJECT/.claude/settings.local.json" <<'EOF'
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [{"type": "command", "command": "/usr/local/bin/user-banner.sh"}]
      }
    ]
  }
}
EOF
set +e
out="$("$REPO_ROOT/setup" --cli --hooks-for "$PROJECT" --cli-dir "$CLI_DIR" 2>&1)"
rc=$?
set -e
_assert_exit 0 "$rc" "setup --hooks-for with user hooks present"
settings="$PROJECT/.claude/settings.local.json"
user_cmd="$(jq -r '.hooks.SessionStart[].hooks[].command' "$settings" | grep '/usr/local/bin/user-banner.sh' || true)"
if [ -z "$user_cmd" ]; then
  _fail "setup --hooks-for: user's SessionStart hook lost during install"
fi
gs_cmd="$(jq -r '.hooks.SessionStart[].hooks[].command' "$settings" | grep 'gamestack-hook-session-start' || true)"
if [ -z "$gs_cmd" ]; then
  _fail "setup --hooks-for: gamestack SessionStart hook not installed when user had one"
fi

# ---------------------------------------------------------------------------
# Result
# ---------------------------------------------------------------------------
if [ "$fail_count" -ne 0 ]; then
  echo "FAILED: $fail_count assertion(s) failed" >&2
  exit 1
fi
echo "OK: all hook scenarios passed"
