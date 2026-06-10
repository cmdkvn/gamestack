# Troubleshooting

Symptom → cause → fix, for the failures that actually happen during install and the first session. Work top to bottom inside each entry; most fixes are one command. If your problem isn't here, [open an issue](https://github.com/cmdkvn/gamestack/issues). Unfamiliar terms: [`GLOSSARY.md`](GLOSSARY.md).

## `./setup` says "no host detected"

**Cause:** `./setup` auto-detects Claude Code by looking for its config directory, and didn't find one. Either no supported AI agent host is installed, or you're using a host that needs to be named explicitly.

**Fix:**

1. Using a host other than Claude Code? Name it: `./setup --host codex` (also `cursor`, `opencode`, and others — see [`hosts/_README.md`](../hosts/_README.md)).
2. No host installed yet? Install Claude Code first, open it once, then re-run `./setup`.

## setup says "no writable on-PATH directory found for CLIs"

**Cause:** setup symlinks the `gamestack-*` CLIs into the first directory that is writable *and* already on your `$PATH`. It tries `/opt/homebrew/bin`, `/usr/local/bin`, then `~/.local/bin` — none qualified.

**Fix:**

1. Easiest: `mkdir -p ~/.local/bin`, add `export PATH="$HOME/.local/bin:$PATH"` to your shell profile, open a new terminal, re-run `./setup`.
2. Or name a directory yourself: `./setup --cli-dir=~/bin`.
3. Or skip the CLIs: `./setup --skills` — the skill catalog works without them.

## A `gamestack-*` CLI exits 127 or says "bun is required"

**Cause:** the CLIs run on [Bun](https://bun.sh), a JavaScript runtime, and it isn't installed. Exit code 127 is the CLIs' reserved "bun missing" code. Skills never need Bun — only the CLIs do.

**Fix:**

1. `brew install bun` (macOS) — or see [bun.sh](https://bun.sh) for other platforms.
2. Re-run the CLI. Nothing else to reinstall — the symlinks are already in place.

Recent `./setup` versions warn about missing Bun at install time, so if you saw that warning and ignored it, this is that warning coming due.

## `./setup --hooks-for` errors with "jq is required"

**Cause:** the optional end-user hooks (session-start banner, state.json validation) are shell scripts that parse JSON with `jq`, and it isn't installed.

**Fix:**

1. `brew install jq` (macOS) or `apt-get install jq` (Debian/Ubuntu).
2. Re-run `./setup --hooks-for /path/to/your/game-project`.

## Skills don't fire in Claude Code

**Cause:** the symlinks are missing or stale, the session predates the install, or another skill with the same name is shadowing gamestack's.

**Fix:**

1. From the gamestack checkout: `./setup --status` — every skill should show `✓ linked`. If not, re-run `./setup`.
2. Restart the Claude Code session. Skills are discovered at session start; an already-open session won't see a fresh install.
3. Check `~/.claude/skills/` for a same-name directory that isn't gamestack's symlink — same-name skills override each other, and the non-gamestack one may be winning.

## `/playtest` says the engine SDK is unreachable

**Cause:** `/playtest` probes `GET /health` on the SDK's port and nothing answered. The SDK only exists inside a *running* game with the SDK installed and started — see [`ENGINES.md`](ENGINES.md).

| Engine | Port |
|---|---|
| Unity | 7331 |
| Godot | 7332 |
| iOS | 7333 |
| Web | 7334 |

**Fix:**

1. Is the game actually running (editor play mode or a launched build)? The SDK dies with the game.
2. Is the SDK installed *and started* in that build? Install steps per engine: [`ENGINES.md`](ENGINES.md).
3. Probe it yourself: `curl http://127.0.0.1:<port>/health` with the port from the table above.
4. Web only: `gamestack-web-bridge` must be running in a terminal **and** the game must be open in a browser tab — the bridge answers `/health` alone, but everything else returns 503 until the page connects.
5. Not worth the friction right now? `/playtest --mode=screenshot-diff` needs no SDK at all.

## `gamestack/state.json` failed validation after an edit

**Cause:** the validation hook (installed via `--hooks-for`) checked the file after an edit and a field holds a value outside its allowed list — for example `project.phase: "shipping"` when the schema says `pitch | prototype | vertical-slice | production | polish | cert | launched`.

**Fix:**

1. Read the hook's stderr line — it names the exact field and the allowed values (e.g. `project.engine must be one of unity|godot|... (got unreal5)`).
2. Set the field to one of the listed values. Full schema and every enum: [`STATE.md`](STATE.md).
3. If Claude made the edit, it sees the same error and usually self-corrects — let it.

## `./setup --check-updates` says offline

**Cause:** the check runs `git fetch origin main` in the gamestack checkout and the fetch failed — no network, no `origin` remote configured, or the remote is unreachable.

**Fix:**

1. Check your network, then re-run. "Offline" only means the remote comparison was skipped — your install keeps working as-is.
2. `git remote -v` in the checkout — if `origin` is missing (e.g. you copied the directory instead of cloning), `git remote add origin https://github.com/cmdkvn/gamestack.git`.
