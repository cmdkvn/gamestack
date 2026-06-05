# Kiro host implementation for gamestack.
#
# Kiro's skill discovery is at ~/.kiro/skills/<name>/. Per-vendor convention;
# adjust if Kiro's docs settle on an XDG path.
#
# Sourced by ./setup which exports GAMESTACK_DIR.

source "$GAMESTACK_DIR/hosts/_lib.sh"

KIRO_SKILLS_DIR="$HOME/.kiro/skills"

gamestack_install()   { _gamestack_install_to "$KIRO_SKILLS_DIR"; }
gamestack_uninstall() { _gamestack_uninstall_to "$KIRO_SKILLS_DIR"; }
gamestack_status()    { _gamestack_status_to "$KIRO_SKILLS_DIR"; }
