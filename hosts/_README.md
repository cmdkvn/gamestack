# Host abstraction

gamestack supports multiple AI agent hosts via per-host install scripts. The leading underscore on this file's name keeps it from being loaded as a host (`./setup --host _README` wouldn't try to source this).

## Contract

Each host has one file: `hosts/<name>.sh`. It is sourced by `./setup`, which exposes one variable:

- `GAMESTACK_DIR` — absolute path to the gamestack checkout.

The host script MUST define three shell functions:

| Function | Purpose |
|---|---|
| `gamestack_install` | Install gamestack skills (and CLIs, when present) for this host. Should be idempotent — running twice does no harm. |
| `gamestack_uninstall` | Remove only the symlinks/installs that *this* gamestack checkout placed. Don't touch unrelated skills with the same name. |
| `gamestack_status` | Report current install state without making changes. Suitable to call any time. |

Output should be human-readable. Errors go to stderr; informational output to stdout.

## Why per-host scripts?

Different hosts discover skills differently:

| Host | Skill discovery path | Notes |
|---|---|---|
| Claude Code | `~/.claude/skills/<name>/SKILL.md` | One level deep, no plugin manifest needed. |
| Codex CLI | `~/.codex/skills/<name>/` | Similar shape, slightly different metadata. |
| OpenCode | `~/.config/opencode/skills/<name>/` | XDG-style path. |
| Cursor | `~/.cursor/skills/<name>/` | Plugin manifest required. |
| Factory Droid | `~/.factory/skills/<name>/` | Container-style install. |
| Slate, Kiro, Hermes, GBrain | host-specific paths | TBD. |

Each script translates from gamestack's `skills/<name>/SKILL.md` shape into the host's expected shape. Currently that's mostly symlinking, but a host could legitimately copy + transform if needed.

## Adding a new host

1. Create `hosts/<host-name>.sh`.
2. Implement `gamestack_install`, `gamestack_uninstall`, `gamestack_status`.
3. Test by running `./setup --host <host-name> --status`, then `./setup --host <host-name>` (install).
4. Add the host to the list in the README and to `./setup`'s usage text if needed.
5. Make `--uninstall` round-trip cleanly.

## Current support

- `claude-code.sh` — Claude Code (v0.1; the current default and standalone implementation).
- `codex.sh`, `opencode.sh`, `cursor.sh`, `factory.sh`, `slate.sh`, `kiro.sh`, `hermes.sh`, `gbrain.sh` — added in Group 13. Each is ~15 lines: sets the host's skill directory, sources `_lib.sh`, and wraps the shared install/uninstall/status helpers.

The shared `_lib.sh` (leading underscore makes it invisible to `--host` discovery) provides the symlink logic. Adding a new host is now mostly a one-variable change.
