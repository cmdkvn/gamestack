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
  local stale_name="zz-deleted-by-test-$$"
  ln -s "$GAMESTACK_DIR/skills/$stale_name" "$target/$stale_name"
  local output
  output="$(_gamestack_plan_skills "$target")"
  assert_contains "$output" "$(printf 'stale\t%s' "$stale_name")" \
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
  local stale_name="gamestack-zz-deleted-by-test-$$"
  ln -s "$GAMESTACK_DIR/bin/$stale_name" "$cli_dir/$stale_name"
  local output
  output="$(_gamestack_plan_clis "$cli_dir")"
  assert_contains "$output" "$(printf 'stale\t%s' "$stale_name")" \
    "dead CLI symlink into this checkout is detected as stale"
}

run_test test_plan_clis_empty_dir_emits_add_for_every_cli
run_test test_plan_clis_in_sync_emits_nothing
run_test test_plan_clis_detects_stale_symlink

test_plan_skills_detects_conflict_file() {
  local target="$HOME/.claude/skills"
  mkdir -p "$target"
  local known_skill
  known_skill="$(_gamestack_list_skills | head -1)"
  : > "$target/$known_skill"  # regular file at target path
  local output
  output="$(_gamestack_plan_skills "$target")"
  assert_contains "$output" "$(printf 'conflict\t%s' "$known_skill")" \
    "regular file at target for known skill produces a conflict line"
}

test_plan_skills_detects_skip_for_linked_elsewhere() {
  local target="$HOME/.claude/skills"
  mkdir -p "$target"
  local known_skill
  known_skill="$(_gamestack_list_skills | head -1)"
  # Symlink to a fabricated other-checkout path so the status reads as linked-elsewhere.
  local foreign="$HOME/foreign-gamestack/skills/$known_skill"
  mkdir -p "$(dirname "$foreign")"
  : > "$foreign"
  ln -s "$foreign" "$target/$known_skill"
  local output
  output="$(_gamestack_plan_skills "$target")"
  assert_contains "$output" "$(printf 'skip\t%s' "$known_skill")" \
    "symlink pointing into a different checkout produces a skip line"
}

test_plan_skills_ignores_foreign_dead_symlinks() {
  local target="$HOME/.claude/skills"
  mkdir -p "$target"
  # Dead symlink that does NOT point into this checkout — must be left alone.
  ln -s "$HOME/elsewhere/never-existed" "$target/foreign-orphan"
  local output
  output="$(_gamestack_plan_skills "$target")"
  assert_not_contains "$output" "foreign-orphan" \
    "dead symlinks pointing outside this checkout are not flagged stale"
}

test_plan_clis_detects_conflict_file() {
  local cli_dir="$HOME/bin"
  mkdir -p "$cli_dir"
  local sample_cli
  sample_cli="$(_gamestack_list_clis | head -1)"
  : > "$cli_dir/$sample_cli"  # regular file at target path
  local output
  output="$(_gamestack_plan_clis "$cli_dir")"
  assert_contains "$output" "$(printf 'conflict\t%s' "$sample_cli")" \
    "regular file at target for known CLI produces a conflict line"
}

test_plan_clis_detects_skip_for_linked_elsewhere() {
  local cli_dir="$HOME/bin"
  mkdir -p "$cli_dir"
  local sample_cli
  sample_cli="$(_gamestack_list_clis | head -1)"
  local foreign="$HOME/foreign-gamestack/bin/$sample_cli"
  mkdir -p "$(dirname "$foreign")"
  : > "$foreign"
  ln -s "$foreign" "$cli_dir/$sample_cli"
  local output
  output="$(_gamestack_plan_clis "$cli_dir")"
  assert_contains "$output" "$(printf 'skip\t%s' "$sample_cli")" \
    "CLI symlink pointing into a different checkout produces a skip line"
}

test_plan_clis_ignores_foreign_dead_symlinks() {
  local cli_dir="$HOME/bin"
  mkdir -p "$cli_dir"
  # Note: planner restricts stale scan to gamestack-* CLI names; check both
  # foreign-prefix and gamestack-prefix dead symlinks pointing outside checkout.
  ln -s "$HOME/elsewhere/never-existed-cli" "$cli_dir/gamestack-foreign-orphan"
  local output
  output="$(_gamestack_plan_clis "$cli_dir")"
  assert_not_contains "$output" "gamestack-foreign-orphan" \
    "dead gamestack-* symlinks pointing outside this checkout are not flagged stale"
}

run_test test_plan_skills_detects_conflict_file
run_test test_plan_skills_detects_skip_for_linked_elsewhere
run_test test_plan_skills_ignores_foreign_dead_symlinks
run_test test_plan_clis_detects_conflict_file
run_test test_plan_clis_detects_skip_for_linked_elsewhere
run_test test_plan_clis_ignores_foreign_dead_symlinks

test_plan_uninstall_skills_nothing_owned_emits_nothing() {
  local target="$HOME/.claude/skills"
  mkdir -p "$target"
  local output
  output="$(_gamestack_plan_uninstall_skills "$target")"
  assert_eq "" "$output" "nothing owned by this checkout = empty uninstall plan"
}

test_plan_uninstall_skills_emits_remove_for_each_owned() {
  local target="$HOME/.claude/skills"
  mkdir -p "$target"
  local sample_name
  sample_name="$(_gamestack_list_skills | head -1)"
  ln -s "$GAMESTACK_DIR/skills/$sample_name" "$target/$sample_name"
  local output
  output="$(_gamestack_plan_uninstall_skills "$target")"
  assert_contains "$output" "$(printf 'remove\t%s' "$sample_name")" \
    "owned skill is planned as 'remove'"
}

test_plan_uninstall_clis_nothing_owned_emits_nothing() {
  local cli_dir="$HOME/bin"
  mkdir -p "$cli_dir"
  local output
  output="$(_gamestack_plan_uninstall_clis "$cli_dir")"
  assert_eq "" "$output" "nothing owned by this checkout = empty CLI uninstall plan"
}

test_plan_uninstall_clis_emits_remove_for_each_owned() {
  local cli_dir="$HOME/bin"
  mkdir -p "$cli_dir"
  local sample_cli
  sample_cli="$(_gamestack_list_clis | head -1)"
  ln -s "$GAMESTACK_DIR/bin/$sample_cli" "$cli_dir/$sample_cli"
  local output
  output="$(_gamestack_plan_uninstall_clis "$cli_dir")"
  assert_contains "$output" "$(printf 'remove\t%s' "$sample_cli")" \
    "owned CLI is planned as 'remove'"
}

run_test test_plan_uninstall_skills_nothing_owned_emits_nothing
run_test test_plan_uninstall_skills_emits_remove_for_each_owned
run_test test_plan_uninstall_clis_nothing_owned_emits_nothing
run_test test_plan_uninstall_clis_emits_remove_for_each_owned

test_install_to_quiet_noops_suppresses_already_linked_lines() {
  local target="$HOME/.claude/skills"
  mkdir -p "$target"
  local sample_name
  sample_name="$(_gamestack_list_skills | head -1)"
  ln -s "$GAMESTACK_DIR/skills/$sample_name" "$target/$sample_name"

  local output
  output="$(GAMESTACK_QUIET_NOOPS=1 _gamestack_install_to "$target" 2>&1)"
  assert_not_contains "$output" "(already linked)" \
    "GAMESTACK_QUIET_NOOPS=1 suppresses '· already linked' lines"
}

test_install_to_default_still_prints_already_linked() {
  local target="$HOME/.claude/skills"
  mkdir -p "$target"
  local sample_name
  sample_name="$(_gamestack_list_skills | head -1)"
  ln -s "$GAMESTACK_DIR/skills/$sample_name" "$target/$sample_name"

  local output
  output="$(_gamestack_install_to "$target" 2>&1)"
  assert_contains "$output" "(already linked)" \
    "default _gamestack_install_to still prints '· already linked' lines"
}

run_test test_install_to_quiet_noops_suppresses_already_linked_lines
run_test test_install_to_default_still_prints_already_linked

test_host_claude_code_install_quiet_noops() {
  local target="$HOME/.claude/skills"
  mkdir -p "$target"
  local sample_name
  sample_name="$(_gamestack_list_skills | head -1)"
  ln -s "$GAMESTACK_DIR/skills/$sample_name" "$target/$sample_name"

  # Source the host so gamestack_install is defined for this test.
  # Re-sourcing _lib.sh is idempotent.
  (
    # shellcheck source=../hosts/claude-code.sh
    source "$GAMESTACK_DIR/hosts/claude-code.sh"
    GAMESTACK_QUIET_NOOPS=1 gamestack_install 2>&1
  ) >"$HOME/output.txt"

  local output
  output="$(cat "$HOME/output.txt")"
  assert_not_contains "$output" "(already linked)" \
    "claude-code host gamestack_install honors GAMESTACK_QUIET_NOOPS"
}

run_test test_host_claude_code_install_quiet_noops

# End-to-end: run ./setup against a temp HOME and inspect output / exit / disk.
# Returns the captured stdout+stderr in $RUN_OUTPUT and exit code in $RUN_EXIT.
run_setup() {
  RUN_OUTPUT="$("$GAMESTACK_DIR/setup" "$@" 2>&1)"
  RUN_EXIT=$?
}

test_setup_install_against_empty_home_prints_plan_section() {
  run_setup --skills
  assert_eq "0" "$RUN_EXIT" "exit 0 on first install"
  assert_contains "$RUN_OUTPUT" "would apply these changes" \
    "first install prints a plan section header"
  assert_contains "$RUN_OUTPUT" "Skills:" "plan groups skills under 'Skills:' heading"
}

run_test test_setup_install_against_empty_home_prints_plan_section

# ── summary ─────────────────────────────────────────────────────────────────

echo
echo "──────────────────────────────────────────"
echo "  $PASS passed, $FAIL failed"
echo "──────────────────────────────────────────"

if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
