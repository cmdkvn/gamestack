# Codex CLI host implementation for gamestack.
#
# Codex discovers skills at ~/.codex/skills/<name>/SKILL.md (same shape as
# Claude Code). Symlink each gamestack skill into that directory.
#
# Sourced by ./setup which exports GAMESTACK_DIR.

source "$GAMESTACK_DIR/hosts/_lib.sh"

CODEX_SKILLS_DIR="$HOME/.codex/skills"

gamestack_install()   { _gamestack_install_to "$CODEX_SKILLS_DIR"; }
gamestack_uninstall() { _gamestack_uninstall_to "$CODEX_SKILLS_DIR"; }
gamestack_status()    { _gamestack_status_to "$CODEX_SKILLS_DIR"; }
