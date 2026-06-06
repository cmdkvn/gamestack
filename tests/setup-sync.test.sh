#!/usr/bin/env bash
# Integration tests for ./setup plan-first sync.
# Uses a temp HOME so we don't touch the developer's real ~/.claude.

set -u

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PASS=0
FAIL=0

# ── helpers ─────────────────────────────────────────────────────────────────

setup_tmp_home() {
  TMP_HOME="$(mktemp -d -t gamestack-test-home.XXXXXX)"
  mkdir -p "$TMP_HOME/.claude"
  export HOME="$TMP_HOME"
}

teardown_tmp_home() {
  if [[ -n "${TMP_HOME:-}" && -d "$TMP_HOME" ]]; then
    rm -rf "$TMP_HOME"
  fi
  unset TMP_HOME
}

assert_eq() {
  local expected="$1" actual="$2" label="$3"
  if [[ "$expected" == "$actual" ]]; then
    echo "  ✓ $label"
    PASS=$((PASS+1))
  else
    echo "  ✗ $label"
    echo "    expected: $expected"
    echo "    actual:   $actual"
    FAIL=$((FAIL+1))
  fi
}

assert_contains() {
  local haystack="$1" needle="$2" label="$3"
  if [[ "$haystack" == *"$needle"* ]]; then
    echo "  ✓ $label"
    PASS=$((PASS+1))
  else
    echo "  ✗ $label"
    echo "    expected to contain: $needle"
    echo "    actual: $haystack"
    FAIL=$((FAIL+1))
  fi
}

assert_not_contains() {
  local haystack="$1" needle="$2" label="$3"
  if [[ "$haystack" != *"$needle"* ]]; then
    echo "  ✓ $label"
    PASS=$((PASS+1))
  else
    echo "  ✗ $label"
    echo "    expected NOT to contain: $needle"
    echo "    actual: $haystack"
    FAIL=$((FAIL+1))
  fi
}

# ── test runner ─────────────────────────────────────────────────────────────

run_test() {
  local name="$1"
  echo
  echo "▸ $name"
  setup_tmp_home
  "$name"
  teardown_tmp_home
}

# Source _lib.sh for direct planner-helper tests.
# setup expects GAMESTACK_DIR exported.
export GAMESTACK_DIR="$REPO_DIR"
# shellcheck source=../hosts/_lib.sh
source "$REPO_DIR/hosts/_lib.sh"

# ── tests go here ───────────────────────────────────────────────────────────

test_plan_skills_empty_target_emits_add_for_every_skill() {
  local target="$HOME/.claude/skills"
  mkdir -p "$target"
  local output
  output="$(_gamestack_plan_skills "$target")"
  # Every enabled skill in the repo should be in the plan as `add\t<name>`.
  local sample_name
  sample_name="$(_gamestack_list_skills | head -1)"
  assert_contains "$output" "$(printf 'add\t%s' "$sample_name")" \
    "first listed skill ($sample_name) is planned as 'add' against empty target"
}

test_plan_skills_in_sync_emits_nothing() {
  local target="$HOME/.claude/skills"
  mkdir -p "$target"
  # Symlink every skill to simulate a clean install.
  while IFS= read -r name; do
    [[ -z "$name" ]] && continue
    ln -s "$GAMESTACK_DIR/skills/$name" "$target/$name"
  done < <(_gamestack_list_skills)
  local output
  output="$(_gamestack_plan_skills "$target")"
  assert_eq "" "$output" "fully-installed target produces empty plan"
}

test_plan_skills_detects_stale_symlink() {
  local target="$HOME/.claude/skills"
  mkdir -p "$target"
  # Point a symlink at a non-existent skill under this checkout.
  ln -s "$GAMESTACK_DIR/skills/__deleted-skill" "$target/__deleted-skill"
  local output
  output="$(_gamestack_plan_skills "$target")"
  assert_contains "$output" "$(printf 'stale\t__deleted-skill')" \
    "dead symlink into this checkout is detected as stale"
}

test_plan_skills_detects_conflict_dir() {
  local target="$HOME/.claude/skills"
  mkdir -p "$target"
  # Real directory at the target path for a known skill blocks install.
  local known_skill
  known_skill="$(_gamestack_list_skills | head -1)"
  mkdir -p "$target/$known_skill"
  local output
  output="$(_gamestack_plan_skills "$target")"
  assert_contains "$output" "$(printf 'conflict\t%s' "$known_skill")" \
    "real directory at target for known skill produces a conflict line"
}

run_test test_plan_skills_empty_target_emits_add_for_every_skill
run_test test_plan_skills_in_sync_emits_nothing
run_test test_plan_skills_detects_stale_symlink
run_test test_plan_skills_detects_conflict_dir

test_plan_clis_empty_dir_emits_add_for_every_cli() {
  local cli_dir="$HOME/bin"
  mkdir -p "$cli_dir"
  local output
  output="$(_gamestack_plan_clis "$cli_dir")"
  local sample_cli
  sample_cli="$(_gamestack_list_clis | head -1)"
  assert_contains "$output" "$(printf 'add\t%s' "$sample_cli")" \
    "first listed CLI ($sample_cli) is planned as 'add' against empty dir"
}

test_plan_clis_in_sync_emits_nothing() {
  local cli_dir="$HOME/bin"
  mkdir -p "$cli_dir"
  while IFS= read -r name; do
    [[ -z "$name" ]] && continue
    ln -s "$GAMESTACK_DIR/bin/$name" "$cli_dir/$name"
  done < <(_gamestack_list_clis)
  local output
  output="$(_gamestack_plan_clis "$cli_dir")"
  assert_eq "" "$output" "fully-installed CLI dir produces empty plan"
}

test_plan_clis_detects_stale_symlink() {
  local cli_dir="$HOME/bin"
  mkdir -p "$cli_dir"
  ln -s "$GAMESTACK_DIR/bin/gamestack-__deleted" "$cli_dir/gamestack-__deleted"
  local output
  output="$(_gamestack_plan_clis "$cli_dir")"
  assert_contains "$output" "$(printf 'stale\tgamestack-__deleted')" \
    "dead CLI symlink into this checkout is detected as stale"
}

run_test test_plan_clis_empty_dir_emits_add_for_every_cli
run_test test_plan_clis_in_sync_emits_nothing
run_test test_plan_clis_detects_stale_symlink

# ── summary ─────────────────────────────────────────────────────────────────

echo
echo "──────────────────────────────────────────"
echo "  $PASS passed, $FAIL failed"
echo "──────────────────────────────────────────"

if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
