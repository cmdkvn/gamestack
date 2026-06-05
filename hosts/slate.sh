# Slate host implementation for gamestack.
#
# Slate's skill discovery path is per-vendor and not yet stable in v0.1.
# Symlinking to ~/.slate/skills/<name>/ matches the common convention; verify
# against Slate's docs when the host firmly supports an external skill loader.
#
# Sourced by ./setup which exports GAMESTACK_DIR.

source "$GAMESTACK_DIR/hosts/_lib.sh"

SLATE_SKILLS_DIR="$HOME/.slate/skills"

gamestack_install()   { _gamestack_install_to "$SLATE_SKILLS_DIR"; }
gamestack_uninstall() { _gamestack_uninstall_to "$SLATE_SKILLS_DIR"; }
gamestack_status()    { _gamestack_status_to "$SLATE_SKILLS_DIR"; }
