# OpenCode host implementation for gamestack.
#
# OpenCode uses an XDG-style path: $XDG_CONFIG_HOME/opencode/skills/<name>/
# (defaults to ~/.config/opencode/skills/<name>/).
#
# Sourced by ./setup which exports GAMESTACK_DIR.

source "$GAMESTACK_DIR/hosts/_lib.sh"

OPENCODE_SKILLS_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/opencode/skills"

gamestack_install()   { _gamestack_install_to "$OPENCODE_SKILLS_DIR"; }
gamestack_uninstall() { _gamestack_uninstall_to "$OPENCODE_SKILLS_DIR"; }
gamestack_status()    { _gamestack_status_to "$OPENCODE_SKILLS_DIR"; }
