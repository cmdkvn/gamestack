# Factory Droid host implementation for gamestack.
#
# Factory discovers skills at ~/.factory/skills/<name>/. Factory runs in
# container-style environments; symlinks resolve correctly when the gamestack
# repo is mounted into the container at the same absolute path used at install
# time.
#
# Sourced by ./setup which exports GAMESTACK_DIR.

source "$GAMESTACK_DIR/hosts/_lib.sh"

FACTORY_SKILLS_DIR="$HOME/.factory/skills"

gamestack_install()   { _gamestack_install_to "$FACTORY_SKILLS_DIR"; }
gamestack_uninstall() { _gamestack_uninstall_to "$FACTORY_SKILLS_DIR"; }
gamestack_status()    { _gamestack_status_to "$FACTORY_SKILLS_DIR"; }
