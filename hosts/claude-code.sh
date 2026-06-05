# Claude Code host implementation for gamestack.
#
# Strategy: symlink each individual skill directory from gamestack's skills/
# into ~/.claude/skills/<skill-name>/. Claude Code discovers skills at
# ~/.claude/skills/<name>/SKILL.md, so each skill needs to be one level
# under skills/, not buried inside gamestack/skills/<name>/.
#
# This file is sourced by the main ./setup script, which provides:
#   GAMESTACK_DIR  — absolute path to the gamestack checkout.

CLAUDE_SKILLS_DIR="$HOME/.claude/skills"

# List skill names that exist in this gamestack checkout.
# A skill is any directory under skills/ that contains a SKILL.md file.
_gamestack_list_skills() {
  find "$GAMESTACK_DIR/skills" -mindepth 1 -maxdepth 1 -type d \
    | while read -r dir; do
        if [[ -f "$dir/SKILL.md" ]]; then
          basename "$dir"
        fi
      done \
    | sort
}

# Status of one skill at the host.
# Echoes one of: linked-here, linked-elsewhere, conflict-file, conflict-dir, missing
_gamestack_skill_status() {
  local name="$1"
  local src="$GAMESTACK_DIR/skills/$name"
  local target="$CLAUDE_SKILLS_DIR/$name"
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

gamestack_install() {
  mkdir -p "$CLAUDE_SKILLS_DIR"
  local added=0 reused=0 skipped=0
  while IFS= read -r name; do
    [[ -z "$name" ]] && continue
    local src="$GAMESTACK_DIR/skills/$name"
    local target="$CLAUDE_SKILLS_DIR/$name"
    local status
    status="$(_gamestack_skill_status "$name")"
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
  if [[ $added -gt 0 || $reused -gt 0 ]]; then
    echo
    echo "Try one of these in a Claude Code session:"
    while IFS= read -r name; do
      [[ -z "$name" ]] && continue
      local status
      status="$(_gamestack_skill_status "$name")"
      if [[ "$status" == "linked-here" ]]; then
        echo "  /$name"
      fi
    done < <(_gamestack_list_skills | head -3)
  fi
}

gamestack_uninstall() {
  local removed=0 untouched=0
  while IFS= read -r name; do
    [[ -z "$name" ]] && continue
    local status
    status="$(_gamestack_skill_status "$name")"
    case "$status" in
      linked-here)
        rm "$CLAUDE_SKILLS_DIR/$name"
        echo "  - $name"
        removed=$((removed+1))
        ;;
      linked-elsewhere|conflict-dir|conflict-file)
        echo "  · $name (left in place — not owned by this gamestack checkout)"
        untouched=$((untouched+1))
        ;;
      missing)
        # Nothing to do.
        ;;
    esac
  done < <(_gamestack_list_skills)

  echo
  echo "✓ gamestack uninstalled ($removed removed, $untouched left untouched)"
}

gamestack_status() {
  printf '  %-26s  %s\n' "Skill" "Status"
  printf '  %-26s  %s\n' "-----" "------"
  local any=0
  while IFS= read -r name; do
    [[ -z "$name" ]] && continue
    any=1
    local status
    status="$(_gamestack_skill_status "$name")"
    local pretty
    case "$status" in
      linked-here)      pretty="✓ linked (this checkout)" ;;
      linked-elsewhere) pretty="↪ linked elsewhere" ;;
      conflict-dir)     pretty="✗ conflict (directory exists at target)" ;;
      conflict-file)    pretty="✗ conflict (file exists at target)" ;;
      missing)          pretty="… not installed" ;;
      *)                pretty="? unknown ($status)" ;;
    esac
    printf '  %-26s  %s\n' "$name" "$pretty"
  done < <(_gamestack_list_skills)

  if [[ $any -eq 0 ]]; then
    echo "  (no skills found in $GAMESTACK_DIR/skills/)"
  fi

  echo
  echo "  Skills resolved against: $CLAUDE_SKILLS_DIR"
  echo "  Source: $GAMESTACK_DIR/skills/"
}
