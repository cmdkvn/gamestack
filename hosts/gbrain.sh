# GBrain host implementation for gamestack.
#
# GBrain's skill discovery is at ~/.gbrain/skills/<name>/. Per-vendor convention;
# verify against GBrain's docs.
#
# Sourced by ./setup which exports GAMESTACK_DIR.

source "$GAMESTACK_DIR/hosts/_lib.sh"

GBRAIN_SKILLS_DIR="$HOME/.gbrain/skills"

gamestack_install()   { _gamestack_install_to "$GBRAIN_SKILLS_DIR"; }
gamestack_uninstall() { _gamestack_uninstall_to "$GBRAIN_SKILLS_DIR"; }
gamestack_status()    { _gamestack_status_to "$GBRAIN_SKILLS_DIR"; }
