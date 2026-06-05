# Hermes host implementation for gamestack.
#
# Hermes's skill discovery is at ~/.hermes/skills/<name>/. Per-vendor convention;
# verify against Hermes's docs.
#
# Sourced by ./setup which exports GAMESTACK_DIR.

source "$GAMESTACK_DIR/hosts/_lib.sh"

HERMES_SKILLS_DIR="$HOME/.hermes/skills"

gamestack_install()   { _gamestack_install_to "$HERMES_SKILLS_DIR"; }
gamestack_uninstall() { _gamestack_uninstall_to "$HERMES_SKILLS_DIR"; }
gamestack_status()    { _gamestack_status_to "$HERMES_SKILLS_DIR"; }
