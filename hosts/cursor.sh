# Cursor host implementation for gamestack.
#
# Cursor discovers skills at ~/.cursor/skills/<name>/. Cursor requires a plugin
# manifest (package.json or similar) per skill in production; this v0.1 install
# symlinks the gamestack skill directories and assumes Cursor's plugin loader
# handles them. When Cursor's manifest format firms up, this script may grow a
# step to emit a manifest per linked skill.
#
# Sourced by ./setup which exports GAMESTACK_DIR.

source "$GAMESTACK_DIR/hosts/_lib.sh"

CURSOR_SKILLS_DIR="$HOME/.cursor/skills"

gamestack_install()   { _gamestack_install_to "$CURSOR_SKILLS_DIR"; }
gamestack_uninstall() { _gamestack_uninstall_to "$CURSOR_SKILLS_DIR"; }
gamestack_status()    { _gamestack_status_to "$CURSOR_SKILLS_DIR"; }
