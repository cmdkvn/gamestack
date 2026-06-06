# gamestack

> A virtual game studio you talk to. Solo.

gamestack turns your AI coding agent (Claude Code, Codex, Cursor) into a coordinated set of specialists — a Creative Director, a Prototype Critic, a Senior Gameplay Engineer, a Platform Cert Officer — that you invoke as slash commands. It's a discipline scaffold for solo indie devs.

Engine-agnostic. Auto-detects **Unity, Godot, Unreal, GameMaker, Bevy, native iOS (Swift / SpriteKit / SceneKit / Metal / RealityKit), and web frameworks** (Phaser, Three.js, PixiJS, Babylon).

This is **early-access software (v1.0.0)**. The skill catalog is shipped; real-world validation across many projects is still being collected. The honest section below has the unvarnished status.

## What a session feels like

The catalog is a menu, not a path. You pick the skill that fits where you are.

```
You:    /gamestack                       # the front door — bootstraps state, picks 1–2 next steps
You:    /design-jam                      # six forcing questions before any code
Claude: (Creative Director rubric)       # locks the pitch in design/pitch.md

You:    /plan-game-design                # locks the core loop, plots the skill curve
You:    /plan-art-direction              # rates 0–10 across 8 dimensions
You:    /autoplan                        # runs all the plan-* skills in sequence

You:    /scene-prototype "first verb"    # emits Unity C# / Godot GDScript scaffolding
You:    /critique --lens=fun             # is the kernel of fun present?

You:    /code-review-gamestack           # gameplay-engineer rubric — surfaces, doesn't auto-fix
You:    /playtest --mode=screenshot-diff # zero-SDK: you drive the build, daemon catches regressions

You:    /critique --lens=a11y            # GAG audit, P0/P1/P2 dev TODO + public report
You:    /steam-page-review               # capsule / trailer / hook / tags / wishlist risk
You:    /publish                         # version bump + build + last-mile cert + upload checklist

You:    /post-launch-monitor             # daily digest of reviews / crashes / refunds
You:    /post-mortem                     # blameless retro; lessons → /learn
You:    /skill-feedback - <skill>        # log when a skill output was wrong; aggregates inform rewrites
```

`/gamestack` is the entry point. It reads `gamestack/state.json`, recommends the 1–2 next skills, and gets out of the way.

## Install

Clone the gamestack repo somewhere outside your AI agent host's skill directory, then run `./setup`. The recommended location is `~/.gamestack/`:

```bash
git clone --single-branch --depth 1 https://github.com/cmdkvn/gamestack.git ~/.gamestack
cd ~/.gamestack
./setup
```

`./setup` auto-detects Claude Code and symlinks every shipped skill into the host's discovery path (`~/.claude/skills/<name>/`) **and** every `bin/gamestack-*` CLI into a writable on-PATH directory. Subsequent runs are idempotent. Then in any project directory, open Claude Code and type `/gamestack`.

```bash
./setup                        # install skills + CLIs (default)
./setup --skills               # install skills only
./setup --cli                  # install CLIs only
./setup --status               # show both
./setup --status --cli         # show only CLI status
./setup --uninstall            # remove both
./setup --uninstall --skills   # remove only skills (CLIs left in place)
./setup --check-updates        # compare local commit to origin/main
./setup --host codex           # other host (codex, cursor, opencode — verified)
                               # factory, slate, kiro, hermes, gbrain — community / unverified
```

> **Why not clone directly into `~/.claude/skills/`?** That directory is the host's skill discovery path. gamestack ships a `/gamestack` router skill that needs to install at `~/.claude/skills/gamestack/`, which collides if the repo itself is the target. Keep the checkout separate so `./setup` can manage the symlinks cleanly.

### CLIs

The CLIs (`gamestack-asset-audit`, `gamestack-skill-feedback`, etc.) require Bun: `brew install bun` once. Skills work without it.

`./setup` symlinks each `bin/gamestack-*` shim into a writable on-PATH directory by default so you can invoke them from anywhere. Detection priority: `/opt/homebrew/bin` → `/usr/local/bin` → `~/.local/bin`. If none qualify, pass `--cli-dir=<path>`:

```bash
./setup --cli-dir=~/bin              # explicit CLI install dir
./setup --cli --cli-dir=~/bin        # CLIs only, explicit dir
```

If you don't want the CLIs on `$PATH`, pass `--skills` to install only the skill catalog. The CLIs still run when invoked via their full path under `bin/`.

### Updating

When new gamestack releases land, pull and re-run setup. The script removes stale symlinks (both skills and CLIs) for things that were deleted upstream and adds links for anything new:

```bash
cd ~/.gamestack && git pull --ff-only && ./setup
```

Add `--skills` or `--cli` to limit the refresh to one side.

`./setup --check-updates` (no `git pull`) shows whether you're behind origin/main.

Full first-session walkthrough: [`docs/howto/first-30-minutes.md`](docs/howto/first-30-minutes.md).

## Who this is for

Solo indie devs shipping single-player narrative / arcade / puzzle / platforming games for PC, console, mobile, or web. Engine-agnostic — skills detect Unity, Godot, Unreal, GameMaker, Bevy, or web frameworks and tailor advice accordingly.

If you're building hyper-casual, live-service, or multiplayer games, the discipline-scaffold skills (design, code review, accessibility, cert) still apply; the specialized skills you'd want (matchmaking design, retention metric review, server-cost balancing) aren't shipped yet.

## Skills (v1.0.0)

The catalog is **35 skills**. Pick whichever fits your phase — `/gamestack` will suggest 1–2 if you're not sure.

### Front door

| Skill | Use it when |
|---|---|
| [`/gamestack`](skills/gamestack/SKILL.md) | You don't know which skill to use. Reads project state, recommends 1–2 next. |
| [`/skill-feedback`](skills/skill-feedback/SKILL.md) | After any skill output. Logs whether it was useful (drives catalog rewrites). |

### Pitch

| Skill | What it does |
|---|---|
| [`/design-jam`](skills/design-jam/SKILL.md) | Six forcing questions that pressure-test an idea before any code or art. |

### Plan

| Skill | What it does |
|---|---|
| [`/plan-creative-director`](skills/plan-creative-director/SKILL.md) | Rethinks scope (Scope-Up / Selective Expansion / Hold / Reduction). |
| [`/plan-game-design`](skills/plan-game-design/SKILL.md) | Locks the core loop; plots minute 1 → hour 10 → hour 100. |
| [`/plan-narrative`](skills/plan-narrative/SKILL.md) | Voice cards, exposition pacing, branching fragility, localization. |
| [`/plan-level-design`](skills/plan-level-design/SKILL.md) | Tension graph, monotony zones, navigation, gating. |
| [`/plan-art-direction`](skills/plan-art-direction/SKILL.md) | Rates 0–10 across 8 dimensions (style / refs / color / silhouette / budget / animation / VFX / slop-resistance). |
| [`/plan-audio-direction`](skills/plan-audio-direction/SKILL.md) | SFX taxonomy, music structure, mix priority, accessibility, tooling. |
| [`/plan-tech-design`](skills/plan-tech-design/SKILL.md) | Architecture, state machines, frame budget, save format, cross-platform. |
| [`/autoplan`](skills/autoplan/SKILL.md) | Runs all seven `plan-*` skills in sequence; surfaces only taste decisions. |

### Build

| Skill | What it does |
|---|---|
| [`/art-bible`](skills/art-bible/SKILL.md) | Palette, naming, silhouettes, vignettes, animation language, hand-off checklist. |
| [`/art-shotgun`](skills/art-shotgun/SKILL.md) | 4–6 prompt variants per round; pairs with `gamestack-taste-update`. |
| [`/scene-prototype`](skills/scene-prototype/SKILL.md) | Engine-detected script + setup checklist (Unity C#, Godot `.tscn` + GDScript, Unreal class stub). |
| [`/dialogue-write`](skills/dialogue-write/SKILL.md) | First-pass dialogue from beats + voice cards (Yarn / Ink / Dialogic / engine-native). |

### Review

| Skill | What it does |
|---|---|
| [`/code-review-gamestack`](skills/code-review-gamestack/SKILL.md) | Game-specific runtime bug families. Defaults to `[PROPOSE]` — surfaces fixes, doesn't auto-apply. |
| [`/bug-hunt`](skills/bug-hunt/SKILL.md) | Iron Law: no fix without investigation. 3-strikes rule before reclassifying. |
| [`/balance-review`](skills/balance-review/SKILL.md) | Monte Carlo on configs; surfaces dominant strategies and dead choices. |
| [`/dialogue-review`](skills/dialogue-review/SKILL.md) | Voice consistency, info-dump scan, "as you know" detection, exposition pacing. |
| [`/asset-audit`](skills/asset-audit/SKILL.md) | Per-platform texture / audio / mesh / atlas / naming. Catches `.meta`-in-`.gitignore`. |

### Critique (the consolidated playtest-phase rubric)

| Skill | Lens | What it audits |
|---|---|---|
| [`/critique --lens=fun`](skills/critique/SKILL.md) | Prototype kernel | Is the kernel of fun here? What mechanics are dead? |
| [`/critique --lens=onboarding`](skills/critique/SKILL.md) | First 60 seconds | Time to first verb / decision / reward / failure / "I get it". |
| [`/critique --lens=feel`](skills/critique/SKILL.md) | Game feel | 8 dimensions: animation curves, hit-pause, screen-shake, particles, audio, camera, haptics, input forgiveness. |
| [`/critique --lens=pacing`](skills/critique/SKILL.md) | Tension graph | Skill demand / stakes / density. Monotony zones, hollow middles, fatigue compound. |
| [`/critique --lens=a11y`](skills/critique/SKILL.md) | Accessibility | Game Accessibility Guidelines top-4 + basic + intermediate + Xbox cert gates. |
| [`/critique --lens=perf`](skills/critique/SKILL.md) | Performance | FPS / 99th-pct frame time / 0.1th-pct (visible stutter) / draw calls / GC alloc / scene load / peak memory. |

> **Breaking change in v1.0.0:** the prior `/find-the-fun`, `/onboarding-audit`, `/game-feel-audit`, `/pacing-review`, `/a11y-audit`, `/perf-benchmark` commands have been consolidated under `/critique` with the `--lens` flag. The rubrics are unchanged; the catalog is smaller.

### Playtest

| Skill | What it does |
|---|---|
| [`/playtest`](skills/playtest/SKILL.md) | Drives a build. Three modes — **SDK live**, **zero-SDK screenshot-diff** (default if no SDK), **offline static**. Phase-aware. |

### Ship

| Skill | What it does |
|---|---|
| [`/cert-readiness`](skills/cert-readiness/SKILL.md) | PS5 TRC / Xbox TCR-XR / Switch lotcheck high-failure categories. P0 / P1 / NEEDS_LIVE_TEST. |
| [`/steam-page-review`](skills/steam-page-review/SKILL.md) | Capsule + trailer first-6-second + hook + tags + Next Fest fit. Wishlist-conversion risk. |
| [`/publish`](skills/publish/SKILL.md) | Pre-publish gates → version bump → cert → build → upload checklist → PR. Friday-afternoon guardrail. |
| [`/post-launch-monitor`](skills/post-launch-monitor/SKILL.md) | Daily digest. Steam reviews, crash rate, refund rate, players, top complaints. GREEN / YELLOW / RED / EMERGENCY. |

### Reflect

| Skill | What it does |
|---|---|
| [`/patch-notes`](skills/patch-notes/SKILL.md) | Player-facing patch notes + dev-facing changelog from the diff + closed issues + tone notes. |
| [`/post-mortem`](skills/post-mortem/SKILL.md) | Blameless retros (weekly + 7-day post-launch). |
| [`/learn`](skills/learn/SKILL.md) | Persists generalizable lessons across sessions. |

### Power tools

| Skill | Purpose |
|---|---|
| [`/careful`](skills/careful/SKILL.md) | Pause before destructive ops; surface what's lost. |
| [`/freeze`](skills/freeze/SKILL.md) | Restrict writes to a named directory. |
| [`/unfreeze`](skills/unfreeze/SKILL.md) | Lift a `/freeze`. |
| [`/guard`](skills/guard/SKILL.md) | `/careful` + `/freeze` together. |
| [`/cert-freeze`](skills/cert-freeze/SKILL.md) | Opinionated `/freeze` for cert windows. |
| [`/launch-day`](skills/launch-day/SKILL.md) | `/guard` + verbose logging + "what could go wrong" before every write. |

> **Why the `-gamestack` suffix on `/code-review-gamestack`?** Claude Code ships with a built-in `/code-review`. gamestack's game-specific version is suffixed to coexist rather than shadow it.

Catalog deep-dives: [`docs/skills.md`](docs/skills.md).

## CLIs (CI-friendly)

Skills are interactive. The CLIs wrap the mechanical checks for CI gates.

| CLI | Purpose |
|---|---|
| [`gamestack-asset-audit`](bin/impl/asset-audit/README.md) | Per-platform asset budgets. Catches Unity `.meta` integrity bugs. |
| [`gamestack-cert-checklist`](bin/impl/cert-checklist/README.md) | PS5 / Xbox / Switch high-failure cert categories. |
| [`gamestack-steam-page-check`](bin/impl/steam-page-check/README.md) | Capsule dims, trailer length, description hook, tags, screenshots. |
| [`gamestack-game-benchmark`](bin/impl/game-benchmark/README.md) | Polls engine SDK `/state` for perf metrics; diffs vs baseline. |
| [`gamestack-playtest-daemon`](bin/impl/playtest-daemon/README.md) | Broker for `/playtest`. SDK + screenshot-diff modes. |
| [`gamestack-taste-update`](bin/impl/taste-update/README.md) | Persists `/art-shotgun` per-axis approvals with time-decay. |
| [`gamestack-model-benchmark`](bin/impl/model-benchmark/README.md) | Prompt suite across several Claude models; pick winner. Local-only. |
| [`gamestack-skill-feedback`](bin/impl/skill-feedback/README.md) | Aggregates the `/skill-feedback` log. |
| [`gamestack-skill-lint`](bin/impl/skill-lint/README.md) | Regression validator for SKILL.md + scenario JSON. |

Every CLI is `0 = clean / 1 = regression / 2 = bad args / 127 = bun missing`. Wire into CI.

## Engine SDKs

Each SDK exposes a loopback-only HTTP server you drop into a running build. Same endpoints (`/state`, `/screenshot`, `/input`, `/snapshot`, `/restore`, `/breakpoint`), same JSON shapes — only the port differs. `/playtest` scenarios run unchanged across engines.

| Engine | Port | Status | Verified |
|---|---|---|---|
| Unity (UPM package) | 7331 | v0.2.0 | End-to-end against `Bun.serve()` fake. **Live engine validation pending** — first real game using it will surface engine-side bugs. |
| Godot 4.x (addon) | 7332 | v0.2.0 | End-to-end against `Bun.serve()` fake. Same caveat. |
| iOS (Swift Package) | 7333 | v0.1.0 | Authored against iOS 15+ SDK with XCTest suite. Live device validation pending — `swift test` requires a full Xcode install (CLT-only environments can't link `PackageDescription`). |
| Unreal (UPlugin) | — | post-v1 | — |

See [`engines/unity/README.md`](engines/unity/README.md), [`engines/godot/README.md`](engines/godot/README.md), [`engines/ios/README.md`](engines/ios/README.md).

**Zero-SDK alternative:** if installing the engine SDK isn't worth the friction yet, run `/playtest --mode=screenshot-diff`. Full doc: [`docs/ZERO-SDK-PLAYTEST.md`](docs/ZERO-SDK-PLAYTEST.md).

## Hosts

| Host | Status | Setup |
|---|---|---|
| Claude Code | Verified (primary target) | `./setup` |
| Codex CLI | Verified | `./setup --host codex` |
| Cursor | Verified (script confirmed working; some Cursor distributions require a manifest the script doesn't emit) | `./setup --host cursor` |
| OpenCode | Verified | `./setup --host opencode` |
| Factory Droid | Community / unverified | `./setup --host factory` |
| Slate | Community / unverified | `./setup --host slate` |
| Kiro | Community / unverified | `./setup --host kiro` |
| Hermes | Community / unverified | `./setup --host hermes` |
| GBrain | Community / unverified | `./setup --host gbrain` |

Unverified hosts: the symlink scripts exist and follow the shared `_lib.sh` contract, but no maintainer has confirmed an end-to-end install on those targets. **PRs welcome** that verify one host with a screen-recording or session transcript demonstrating an installed skill firing in that host. Adding a new host is ~15 lines — see [`hosts/_README.md`](hosts/_README.md).

## Project state

gamestack stores a single canonical state file per project at `<project>/gamestack/state.json`. Every skill reads it to orient itself; every skill writes back its run + the artifact it produced. Schema and lifecycle: [`docs/STATE.md`](docs/STATE.md).

## Privacy

gamestack is **local-only**. None of the following leave your machine:

- `gamestack/state.json` — phase, engine, platforms, artifact paths, recent runs.
- `.gamestack/taste-profile.json` — `/art-shotgun` preference data.
- `.gamestack/skill-feedback.jsonl` — thumbs-up / thumbs-down on skill outputs.
- `design/`, `playtest/`, `playtest/screenshots/`, `playtest/baseline/` — all artifacts.
- Engine SDK HTTP servers bind to **loopback only** (`127.0.0.1`) and refuse non-loopback clients.

The skills and CLIs do not transmit telemetry to gamestack maintainers or any third party. The only external network calls anywhere in gamestack are:

- `setup --check-updates` runs `git fetch origin main` if `origin` is configured. (Standard git; no other service.)
- `gamestack-model-benchmark` calls the Anthropic API using **your own** API key from env. The benchmark output stays on your disk.
- `/post-launch-monitor` reads public Steam review / community pages if you point it at your game's page. You opt in per invocation.

If you want to share feedback with the maintainer, run `gamestack-skill-feedback --format=json --out=feedback.json` and attach the file to a GitHub issue **manually**.

## Philosophy

- **Find the fun before you polish it.** `/critique --lens=fun` is the entry skill for an early build.
- **Discipline > inspiration.** Skills enforce questions you'd skip on a bad day. On a good day, you don't need them.
- **Engine-agnostic by default.** Skills detect your engine and tailor without locking you in.
- **Solo-viable.** Every skill is something one person can use without a team. CLIs cover the mechanical parts in CI.
- **Honest over flattering.** Skills push back. The right answer to "is this fun?" when it isn't is *"no, here's why, here's what to try next."*
- **Don't generate what a human can decide.** gamestack doesn't auto-write your design doc, dialogue, or trailer copy. It structures the questions and remembers what you chose.
- **Default to `[PROPOSE]`, not `[AUTO]`.** Solo devs have no second reviewer to catch a bad auto-fix. The skill surfaces the diff; the developer applies it.

## Status (honest)

- The 35 skills, 9 CLIs, and 2 engine SDKs in this repo are **functionally shipped** — they pass the test suite (`bun test` = 98 / 98), the linter (`gamestack-skill-lint`), and have documented contracts.
- They have **not been validated end-to-end by a real shipped game using gamestack throughout**. The case studies in [`docs/case-studies/`](docs/case-studies/) walk reference Unity / Godot projects; they are not retrospectives of a shipped commercial title.
- Engine SDKs are validated against an in-process `Bun.serve()` fake. The first real Unity / Godot game using them will surface engine-side bugs the fake doesn't catch.
- Six of the nine hosts (factory, slate, kiro, hermes, gbrain, plus partial cursor) have **unverified** install scripts. They follow the shared contract; nobody has run them in their respective AI agents and confirmed a skill fired.
- The Pitch → Plan → Build → Review → Playtest → Ship → Reflect *narrative* is a useful menu shape, but real solo dev work is iterative and chaotic. The skill catalog is a menu, not a path. `/gamestack` exists to make this explicit.

If something doesn't work, [open an issue](https://github.com/cmdkvn/gamestack/issues) — and please run `/skill-feedback - <skill>` so the next rewrite knows what's missing.

## Roadmap

| Stage | Focus | Status |
|---|---|---|
| v1.0 | 35 skills + 9 CLIs + Unity & Godot SDKs + 4 verified hosts | Functionally shipped, validation in progress |
| v1.1 | First end-to-end shipped game; verified Unreal SDK | Planned |
| v1.x | Live-service / multiplayer skill set | Planned |
| v2.0 | Engine SDK rev'd against real-game findings; community-verified host expansion | Planned |

For per-milestone scope, see [`docs/PLAN.md`](docs/PLAN.md). For v1.0 changes, [`CHANGELOG.md`](CHANGELOG.md).

## Contributing

The single most valuable contribution is **using gamestack on a real game and logging skill-feedback honestly**. The aggregator (`gamestack-skill-feedback`) surfaces which skills are landing and which are drifting; that's what drives the next rewrite.

For PRs: the skill-development conventions live in [`.claude/CLAUDE.md`](.claude/CLAUDE.md). Run `bin/gamestack-skill-lint --warn-as-error` before opening.

## Acknowledgments

gamestack borrows its core pattern — slash commands as a virtual team of specialists — from [garrytan/gstack](https://github.com/garrytan/gstack), Garry Tan's Claude Code virtual engineering team for software founders. gamestack adapts the pattern for game dev with disciplines unique to games: game feel, pacing, accessibility, platform cert, and console launch readiness.

## License

MIT. See [`LICENSE`](LICENSE).
