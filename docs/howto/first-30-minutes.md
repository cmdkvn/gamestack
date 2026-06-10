# First 30 minutes with gamestack

The point of this doc is to get you from `git clone` to your first useful artifact in half an hour. No theory until the end — just the path. If you're reading this and stuck, the longer walkthrough lives in [`docs/skills.md`](../skills.md).

## 0:00 — Install (≈3 min)

Clone gamestack to a host-agnostic location, then run setup:

```bash
git clone --single-branch --depth 1 https://github.com/cmdkvn/gamestack.git ~/.gamestack
cd ~/.gamestack
./setup
```

`./setup` auto-detects Claude Code (or pass `--host codex` / `--host cursor` for those). By default it installs **both** the skill catalog (symlinked into `~/.claude/skills/<name>/`) and the `gamestack-*` CLIs (symlinked into the first writable on-PATH directory it finds: `/opt/homebrew/bin`, `/usr/local/bin`, then `~/.local/bin`). Scope to one side with `--skills` or `--cli` if you want.

(Don't clone into `~/.claude/skills/gamestack/` — the `/gamestack` router skill needs that exact path for its symlink. The repo and the install target stay separate.)

Sanity check:

```bash
./setup --status
```

You should see **37 skills** marked `✓ linked` and 10 CLIs reported as installed. Anything else, see [`hosts/_README.md`](../../hosts/_README.md) for host-discovery details, or [`docs/TROUBLESHOOTING.md`](../TROUBLESHOOTING.md) for the common failures.

The CLIs (`gamestack-skill-feedback`, `gamestack-asset-audit`, etc.) require Bun: `brew install bun` once. Skills themselves work without it; the CLIs surface a friendly error if Bun is missing.

Re-running `./setup` after a `git pull` is idempotent. It prints "Already in sync" when nothing needs to change, or articulates the exact symlinks it will add/remove when it does.

## 3:00 — Open your game's project (≈1 min)

```bash
cd ~/code/<your-game-project>
```

In a fresh Claude Code session at this directory, you'll invoke `/gamestack` as the front door.

If you don't have a project yet — say you're starting from scratch — `mkdir my-game && cd my-game` works. Anything past this point will bootstrap a state file in that directory.

## 4:00 — Run `/gamestack` (≈3 min)

In your Claude Code session, type:

```
/gamestack
```

What you'll see:

1. The skill notices you don't have `gamestack/state.json` and offers to bootstrap.
2. It asks a short series of questions, starting with your experience level (beginner / intermediate / expert — this sets how much the skills explain vs. assume), then working name, engine (with auto-detection from marker files), platforms, and production phase.
3. It writes `gamestack/state.json` and creates the scaffolding (`design/`, `playtest/`, `.gamestack/`).
4. It prints two recommended next steps.

For a brand-new idea, you'll see something like:

```
gamestack status (phase: pitch)
  Engine:    unknown
  Platforms: pc

Recent runs:
  (none yet)

Next steps (pick one):
  1. /design-jam — no pitch yet; six forcing questions before any code.
  2. /scene-prototype — only if you already have a single moment you want to test in code.
```

The router is now your standing entry point. Any time you're not sure what to do next, type `/gamestack`.

> **Never built a game?** Answer `beginner` to the first question and accept the web suggestion — no engine to install or learn. From there, `/design-jam` then `/build-feature` gets you a playable verb in the browser, with the skills implementing and explaining as they go.

## 7:00 — `/design-jam` (≈15 min)

```
/design-jam
```

This is the highest-leverage skill in the catalog. It asks six questions, **one at a time**:

1. The core verb.
2. The one-screen pitch.
3. The target player.
4. The irreducible kernel of fun.
5. "X meets Y" references.
6. The 8-week cut list.

Answer each one in your own words. Push back if the skill misreads your intent — it expects pushback. Don't try to answer all six at once; the skill rejects that.

After Q6, it produces a design statement and three implementation directions. The statement gets written to `design/pitch.md`. The recommended direction is the one to start prototyping.

What it does **not** do:
- It doesn't write your design doc for you. The artifact is a one-page distillation, not a 40-page bible.
- It doesn't validate the idea. If your kernel is weak, it says so. If your target player is "indie gamers," it pushes back.

## 22:00 — Look at the artifact + first feedback (≈5 min)

Open `design/pitch.md`:

```
GAME:        <name>
CORE VERB:   <verb>
LOGLINE:     <one sentence>
PLAYER:      <specific person>
KERNEL:      <30-second loop>
LIKE:        <X> meets <Y>
8-WEEK CUT:  <what survives>

DIRECTION A — Deepen the kernel
DIRECTION B — Cut and rebuild
DIRECTION C — Add the missing minute

RECOMMENDED: <A | B | C>
WHY: <one paragraph>
```

If the artifact is useful, log it. In Claude Code:

```
/skill-feedback + design-jam
```

That appends one line to `.gamestack/skill-feedback.jsonl`. Later, when you've used a few skills, you can run:

```bash
gamestack-skill-feedback --window=30d
```

to see which skills are landing and which are drifting. That's the only feedback loop the project has — the more honest you are about thumbs-down, the faster the skills get rewritten.

## 27:00 — Hand off + know what's next (≈3 min)

Type `/gamestack` again. It now sees that `artifacts.pitch` is populated and recommends the plan-stage skills:

```
Next steps (pick one):
  1. /plan-creative-director — challenge whether this is the 10-star version of the pitch.
  2. /plan-game-design — lock the core loop before scope creeps.
```

You can also run `/autoplan` to run the seven `plan-*` skills in sequence (it skips disciplines that don't apply, like narrative for a non-story game).

## Where you are now

In 30 minutes you have:
- Installed gamestack and verified the host symlinks.
- A canonical `gamestack/state.json` for this project.
- A `design/pitch.md` that survives the six-question pressure test.
- One line of feedback signal in `.gamestack/skill-feedback.jsonl`.
- A clear next two steps from `/gamestack`.

## Where to go next

| You want to... | Read |
|---|---|
| Understand the menu of all skills | [`docs/skills.md`](../skills.md) |
| Set up the Unity / Godot engine SDK | [`docs/ENGINES.md`](../ENGINES.md) |
| See how the state file is structured | [`docs/STATE.md`](../STATE.md) |
| Run gamestack in CI | each `bin/impl/*/README.md` |
| Submit feedback or a PR | [`README.md#contributing`](../../README.md#contributing) |

If a skill output was wrong or unhelpful, `/skill-feedback - <skill>` immediately, with a one-sentence reason. That's the most useful contribution you can make to gamestack while still working on your own game.
