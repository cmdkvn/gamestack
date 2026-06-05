# Shared helpers for gamestack host scripts.
#
# Sourced by per-host shell files (claude-code.sh, codex.sh, opencode.sh, ...).
# Provides three functions each host wraps with a single target directory:
#
#   _gamestack_install_to <target_dir>
#   _gamestack_uninstall_to <target_dir>
#   _gamestack_status_to <target_dir>
#
# `setup` skips files starting with underscore, so this file is not selectable as a host.

if [[ -z "${GAMESTACK_DIR:-}" ]]; then
  echo "error: _lib.sh expects GAMESTACK_DIR to be exported by setup" >&2
  return 1
fi

# Returns 0 if the skill is enabled (default), 1 if its frontmatter sets `enabled: false`.
# Tolerates spaces / quotes / case in the frontmatter value. Only inspects the YAML
# frontmatter block bounded by the first two `---` lines.
_gamestack_skill_enabled() {
  local skill_md="$1"
  if [[ ! -f "$skill_md" ]]; then
    return 0
  fi
  awk '
    BEGIN { in_fm = 0; seen_first = 0 }
    /^---[[:space:]]*$/ {
      if (seen_first == 0) { in_fm = 1; seen_first = 1; next }
      if (in_fm == 1)      { in_fm = 0; exit }
    }
    in_fm == 1 && /^[[:space:]]*enabled[[:space:]]*:/ {
      val = $0
      sub(/^[^:]*:[[:space:]]*/, "", val)
      gsub(/["'\'']/, "", val)
      gsub(/[[:space:]]+$/, "", val)
      if (tolower(val) == "false" || val == "0" || tolower(val) == "no") {
        print "disabled"
      }
    }
  ' "$skill_md" | grep -q '^disabled$' && return 1
  return 0
}

_gamestack_list_skills() {
  find "$GAMESTACK_DIR/skills" -mindepth 1 -maxdepth 1 -type d \
    | while read -r dir; do
        if [[ -f "$dir/SKILL.md" ]]; then
          if _gamestack_skill_enabled "$dir/SKILL.md"; then
            basename "$dir"
          fi
        fi
      done \
    | sort
}

# Same as _gamestack_list_skills but includes disabled ones so status output can show them.
_gamestack_list_skills_all() {
  find "$GAMESTACK_DIR/skills" -mindepth 1 -maxdepth 1 -type d \
    | while read -r dir; do
        if [[ -f "$dir/SKILL.md" ]]; then
          basename "$dir"
        fi
      done \
    | sort
}

# Echo one of: linked-here, linked-elsewhere, conflict-file, conflict-dir, missing
_gamestack_skill_status() {
  local name="$1"
  local target_dir="$2"
  local src="$GAMESTACK_DIR/skills/$name"
  local target="$target_dir/$name"
  if [[ -L "$target" ]]; then
    if [[ "$(readlink "$target")" == "$src" ]]; then
      echo "linked-here"
    else
      echo "linked-elsewhere"
    fi
  elif [[ -d "$target" ]]; then
    echo "conflict-dir"
  elif [[ -e "$target" ]]; then
    echo "conflict-file"
  else
    echo "missing"
  fi
}

# Remove symlinks in target_dir that point into this gamestack checkout's
# skills/ directory but whose target no longer exists (e.g. a skill that was
# consolidated or deleted upstream). Idempotent. Never touches symlinks
# pointing somewhere else, and never touches real directories or files.
_gamestack_clean_stale_symlinks() {
  local target_dir="$1"
  local source_prefix="$GAMESTACK_DIR/skills/"
  local cleaned=0
  if [[ ! -d "$target_dir" ]]; then
    return 0
  fi
  while IFS= read -r entry; do
    [[ -z "$entry" ]] && continue
    local link_target
    link_target="$(readlink "$entry" 2>/dev/null || true)"
    [[ -z "$link_target" ]] && continue
    # Only consider symlinks pointing into this gamestack checkout.
    case "$link_target" in
      "$source_prefix"*) ;;
      *) continue ;;
    esac
    # If the symlink target no longer exists, the skill was deleted upstream.
    if [[ ! -e "$link_target" ]]; then
      rm "$entry"
      echo "  - $(basename "$entry") (stale; removed)"
      cleaned=$((cleaned+1))
    fi
  done < <(find "$target_dir" -mindepth 1 -maxdepth 1 -type l)
  if [[ $cleaned -gt 0 ]]; then
    echo "  (cleaned $cleaned stale symlink(s))"
  fi
}

_gamestack_install_to() {
  local target_dir="$1"
  mkdir -p "$target_dir"
  _gamestack_clean_stale_symlinks "$target_dir"
  local added=0 reused=0 skipped=0
  while IFS= read -r name; do
    [[ -z "$name" ]] && continue
    local src="$GAMESTACK_DIR/skills/$name"
    local target="$target_dir/$name"
    local status
    status="$(_gamestack_skill_status "$name" "$target_dir")"
    case "$status" in
      linked-here)
        echo "  · $name (already linked)"
        reused=$((reused+1))
        ;;
      linked-elsewhere)
        echo "  ! $name — already symlinked to a different gamestack checkout; skipping" >&2
        skipped=$((skipped+1))
        ;;
      conflict-dir|conflict-file)
        echo "  ! $name — $target already exists and is not a gamestack symlink; remove it manually if you want gamestack's version" >&2
        skipped=$((skipped+1))
        ;;
      missing)
        ln -s "$src" "$target"
        echo "  + $name"
        added=$((added+1))
        ;;
    esac
  done < <(_gamestack_list_skills)

  echo
  echo "✓ gamestack ($added added, $reused already present, $skipped skipped)"
}

_gamestack_uninstall_to() {
  local target_dir="$1"
  local removed=0 untouched=0
  while IFS= read -r name; do
    [[ -z "$name" ]] && continue
    local status
    status="$(_gamestack_skill_status "$name" "$target_dir")"
    case "$status" in
      linked-here)
        rm "$target_dir/$name"
        echo "  - $name"
        removed=$((removed+1))
        ;;
      linked-elsewhere|conflict-dir|conflict-file)
        echo "  · $name (left in place — not owned by this gamestack checkout)"
        untouched=$((untouched+1))
        ;;
      missing)
        ;;
    esac
  done < <(_gamestack_list_skills)

  echo
  echo "✓ gamestack uninstalled ($removed removed, $untouched left untouched)"
}

_gamestack_status_to() {
  local target_dir="$1"
  printf '  %-26s  %s\n' "Skill" "Status"
  printf '  %-26s  %s\n' "-----" "------"
  local any=0
  while IFS= read -r name; do
    [[ -z "$name" ]] && continue
    any=1
    local pretty
    if ! _gamestack_skill_enabled "$GAMESTACK_DIR/skills/$name/SKILL.md"; then
      pretty="⊘ disabled (enabled: false in SKILL.md)"
    else
      local status
      status="$(_gamestack_skill_status "$name" "$target_dir")"
      case "$status" in
        linked-here)      pretty="✓ linked (this checkout)" ;;
        linked-elsewhere) pretty="↪ linked elsewhere" ;;
        conflict-dir)     pretty="✗ conflict (directory exists at target)" ;;
        conflict-file)    pretty="✗ conflict (file exists at target)" ;;
        missing)          pretty="… not installed" ;;
        *)                pretty="? unknown ($status)" ;;
      esac
    fi
    printf '  %-26s  %s\n' "$name" "$pretty"
  done < <(_gamestack_list_skills_all)

  if [[ $any -eq 0 ]]; then
    echo "  (no skills found in $GAMESTACK_DIR/skills/)"
  fi

  echo
  echo "  Skills resolved against: $target_dir"
  echo "  Source: $GAMESTACK_DIR/skills/"
}
