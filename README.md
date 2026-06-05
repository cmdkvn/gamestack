# gamestack

> Ship a game like a 20-person studio. Solo.

gamestack turns Claude Code into a coordinated virtual game studio. Each slash command is a specialist — a Creative Director, a Prototype Critic, a Senior Gameplay Engineer, a Platform Cert Officer — and they're meant to run as a sprint:

**Pitch → Plan → Build → Review → Playtest → Ship → Reflect**

38 skills, 7 CLIs, two engine SDKs, nine AI agent hosts. One developer.

## What a session looks like

```
You:    "I want to build a 60-second cooking roguelite, but mostly about weather."
        /design-jam

Claude (Creative Director): six forcing questions. Cuts "weather as visual fluff";
                            promotes "weather as the main verb." Locks the pitch.

You:    /plan-game-design  /plan-art-direction  /plan-narrative
        (or just /autoplan to run all seven plan-* skills in sequence)

Claude (six specialists, one pipeline): pressure-tests pacing, voice, palette,
                                        kills three dead mechanics, surfaces only
                                        the taste calls that need your judgment.

You:    /scene-prototype "the weather front roll-in"

Claude (Engine Builder): emits Unity C# (or Godot GDScript) you assemble in
                         the editor. 90 minutes later you're playing it.

You:    /find-the-fun  →  it's the storm pressure, not the soup. /design-jam again.

You:    /art-shotgun "key art for the storm front"  →  six variants → you pick V3.
        gamestack-taste-update --record approval.json   # remembers what you chose

You:    /game-feel-audit  →  hit-pause too long on lightning strike. Fixed.
You:    /playtest 01-prototype-first-minute.json  →  driven by gamestack-playtest-daemon.

(several weeks later)

You:    /cert-readiness all  →  PS5 missing platinum trophy; sleep/resume PASS_CODE_ONLY.
You:    /steam-page-review  →  capsule's title illegible at thumbnail. Fixed.
You:    /publish  →  build + upload + tag + open patch-notes PR.
You:    /launch-day  →  strictest discipline: /careful + /freeze + verbose logging.

(after launch)

You:    /post-launch-monitor  →  daily digest. /patch-notes when v1.0.1 ships.
You:    /post-mortem  →  blameless retro; three lessons piped to /learn.
```

That's the loop. Every command is a real specialist with real opinions; gamestack is the discipline you'd hire 20 people to enforce.

## Install — 30 seconds

Open Claude Code and paste this:

> Install gamestack: run `git clone --single-branch --depth 1 https://github.com/cmdkvn/gamestack.git ~/.claude/skills/gamestack && cd ~/.claude/skills/gamestack && ./setup`. Then tell me which gamestack skills are now available.

Or manually:

```bash
git clone --single-branch --depth 1 https://github.com/cmdkvn/gamestack.git ~/.claude/skills/gamestack
cd ~/.claude/skills/gamestack
./setup
```

`./setup` detects your AI agent host, symlinks each skill into the host's discovery path, and reports what's installed. Subsequent runs are idempotent. To target a different host:

```bash
./setup --host codex          # or opencode, cursor, factory, slate, kiro, hermes, gbrain
./setup --status              # show what's installed
./setup --uninstall           # cleanly remove all gamestack symlinks
```

The CLIs require Bun: `brew install bun` once. Skills work without it.

## Who this is for

Solo indie game devs shipping single-player narrative games for PC, console, mobile, or web. Engine-agnostic — skills detect Unity, Godot, Unreal, GameMaker, Bevy, or web frameworks and tailor advice accordingly.

If you're building hyper-casual, live-service, or multiplayer games, gamestack v1 will still be useful for the discipline scaffolding (design, code review, accessibility, cert), but the specialized skills you'd want haven't shipped yet. See [`docs/PLAN.md`](docs/PLAN.md) for the v1.x roadmap.

## Skills (v1.0.0)

### Pitch
| Skill | Specialist | When it fires |
|---|---|---|
| [`/design-jam`](skills/design-jam/SKILL.md) | Creative Director | Start here for any new game idea or pivot. Six forcing questions that pressure-test the idea before any code or art. |
| [`/find-the-fun`](skills/find-the-fun/SKILL.md) | Prototype Critic | Run on an early prototype. Identifies the kernel of fun (if any), surfaces dead mechanics, recommends three sharpening directions. |

### Plan
| Skill | Specialist | When it fires |
|---|---|---|
| [`/plan-creative-director`](skills/plan-creative-director/SKILL.md) | Creative Director | Rethinks the design in one of four modes (Scope-Up, Selective Expansion, Hold Scope, Reduction). Looks for the 10-star version. |
| [`/plan-game-design`](skills/plan-game-design/SKILL.md) | Lead Game Designer | Locks the core loop. Plots the player's skill curve (minute 1 → hour 10). Kills dead mechanics at plan stage. |
| [`/plan-narrative`](skills/plan-narrative/SKILL.md) | Narrative Designer | Pressure-tests voice cards, exposition pacing, branching fragility, localization readiness. |
| [`/plan-level-design`](skills/plan-level-design/SKILL.md) | Level Designer | Builds the tension graph. Flags monotony zones, navigation confusion, gating hell. |
| [`/plan-art-direction`](skills/plan-art-direction/SKILL.md) | Art Director | Rates 0–10 across 8 dimensions (style, references, color, silhouette, budget, animation, VFX, slop-resistance). |
| [`/plan-audio-direction`](skills/plan-audio-direction/SKILL.md) | Audio Director | Locks SFX taxonomy, music structure, mix priority, accessibility, tooling choice. |
| [`/plan-tech-design`](skills/plan-tech-design/SKILL.md) | Technical Designer | Architecture, state machines, frame budget, save format, cross-platform abstraction, console requirements. |
| [`/autoplan`](skills/autoplan/SKILL.md) | Review Pipeline | Runs all seven `plan-*` skills in sequence. Applies auto-fixes; surfaces only taste decisions. |

### Build
| Skill | Specialist | When it fires |
|---|---|---|
| [`/art-bible`](skills/art-bible/SKILL.md) | Concept Artist | Builds the production art bible from a locked direction: palette, naming, silhouettes, vignettes, animation language, hand-off checklist. |
| [`/art-shotgun`](skills/art-shotgun/SKILL.md) | Visual Explorer | Structured visual exploration. 4–6 prompt variants per round, captures feedback, learns taste over time. Pairs with `gamestack-taste-update`. |
| [`/scene-prototype`](skills/scene-prototype/SKILL.md) | Engine Builder | Detects engine and emits script + setup checklist (Unity C#, Godot `.tscn` + GDScript, Unreal class stub). Editor-assembly-friendly. |
| [`/dialogue-write`](skills/dialogue-write/SKILL.md) | Game Writer | First-pass dialogue from beat outline + voice cards. Auto-detects Yarn / Ink / Dialogic / engine-native format. |

### Review
| Skill | Specialist | When it fires |
|---|---|---|
| [`/code-review-gamestack`](skills/code-review-gamestack/SKILL.md) | Senior Gameplay Engineer | Runtime bugs CI misses — allocation in `Update()`, off-thread API calls, signal/event leaks, save-data corruption. Auto-fixes the obvious. |
| [`/bug-hunt`](skills/bug-hunt/SKILL.md) | Debugger | Iron Law: no fix without investigation. Traces data flow, tests hypotheses, three-strikes rule to force reclassification. |
| [`/balance-review`](skills/balance-review/SKILL.md) | Systems Designer | Pulls config tables, runs Monte Carlo on outcomes, flags dominant strategies and dead choices, proposes numeric edits. |
| [`/dialogue-review`](skills/dialogue-review/SKILL.md) | Narrative Editor | Voice consistency, info-dump scan, "as you know" detection, exposition pacing, length budget. |
| [`/asset-audit`](skills/asset-audit/SKILL.md) | Technical Artist | Per-platform texture / audio / mesh / atlas / naming audit. Surfaces `.meta`-in-`.gitignore` catastrophes. |

### Playtest
| Skill | Specialist | When it fires |
|---|---|---|
| [`/game-feel-audit`](skills/game-feel-audit/SKILL.md) | Polish Coach | Audits animation curves, hit-pause, screen-shake, particles, audio, camera, haptics, input forgiveness. Detects under- AND over-juiced moments. |
| [`/pacing-review`](skills/pacing-review/SKILL.md) | Pacing Designer | Builds the tension graph from level + encounter data. Flags monotony zones, spike clusters, hollow middles, narrative misalignment. |
| [`/onboarding-audit`](skills/onboarding-audit/SKILL.md) | First-60-Seconds Critic | Times first verb / decision / reward / failure / "I get it". Counts friction. Trailer-to-game alignment check. |
| [`/a11y-audit`](skills/a11y-audit/SKILL.md) | Accessibility Consultant | Full GAG basic + intermediate + advanced. Top-4 focus. Produces dev TODO + public accessibility report. |
| [`/perf-benchmark`](skills/perf-benchmark/SKILL.md) | Performance Engineer | FPS / 99th-pct frame time / draw calls / GC alloc / scene-load / memory peak. Diffs against baseline. |
| [`/playtest`](skills/playtest/SKILL.md) | QA Lead | Phase-aware (Prototype / Vertical Slice / Polish / Cert / Launched). Drives a real Unity / Godot build via the engine SDK. Six reference scenarios shipped. Offline static-analysis fallback. |

### Ship
| Skill | Specialist | When it fires |
|---|---|---|
| [`/cert-readiness`](skills/cert-readiness/SKILL.md) | Platform Cert Officer | Per-platform PS5 TRC / Xbox TCR-XR / Switch lotcheck audit on high-failure-rate categories. P0 / P1 / NEEDS_LIVE_TEST verdicts + combined action list. |
| [`/steam-page-review`](skills/steam-page-review/SKILL.md) | Marketing Lead | Capsule sizes + trailer first-6-second + short-description hook + tag strategy + screenshots + Next Fest fit. Wishlist-conversion risk score. |
| [`/publish`](skills/publish/SKILL.md) | Release Engineer | Pre-publish gates → version bump → last-mile cert → build → upload → tag + PR → ROADMAP update. Friday-afternoon guardrail. |
| [`/post-launch-monitor`](skills/post-launch-monitor/SKILL.md) | Live Ops | Daily digest of Steam reviews, crash rate, refund rate, player count, top community complaints, wishlist conversion. GREEN / YELLOW / RED / EMERGENCY per signal. |

### Reflect
| Skill | Specialist | When it fires |
|---|---|---|
| [`/patch-notes`](skills/patch-notes/SKILL.md) | Technical Writer | Reads diff + closed issues + tone notes; drafts player-facing patch notes and a separate dev-facing changelog. |
| [`/post-mortem`](skills/post-mortem/SKILL.md) | Eng Manager | Weekly retros + 7-day post-launch retros. Blameless, specific, actionable. Pairs every "wrong" with a "differently". |
| [`/learn`](skills/learn/SKILL.md) | Memory | Persists generalizable lessons (engine quirks, bug patterns, taste preferences) across sessions; surfaces conflicts before overwriting. |

### Power tools
| Skill | Purpose |
|---|---|
| [`/careful`](skills/careful/SKILL.md) | Pause before destructive or hard-to-reverse operations; surface what's lost; ask once. |
| [`/freeze`](skills/freeze/SKILL.md) | Restrict writes to a named directory. Refuses every write outside the zone. |
| [`/unfreeze`](skills/unfreeze/SKILL.md) | Lift a `/freeze`. |
| [`/guard`](skills/guard/SKILL.md) | `/careful` + `/freeze` together. Standard for cert prep and hotfix branches. |
| [`/cert-freeze`](skills/cert-freeze/SKILL.md) | Opinionated `/freeze` for cert windows (default zone: build, dist, docs/cert, playtest/cert-readiness). |
| [`/launch-day`](skills/launch-day/SKILL.md) | Strongest setting. `/guard` plus verbose action logging and a "what could go wrong" line before every write. |

> **Why the `-gamestack` suffix on `/code-review-gamestack`?** Claude Code ships with a built-in `/code-review` slash command for general-purpose review. gamestack's game-specific version is suffixed to coexist rather than shadow it. Other skills use their natural names.

Deep-dives on every skill live in [`docs/skills.md`](docs/skills.md).

## CLIs (CI-friendly)

Each skill is interactive — meant for milestone-gate audits with a developer at the keyboard. The CLIs wrap the mechanical checks for use in CI: fail the build on a regression rather than discovering it during the next interactive session.

| CLI | Wraps | Purpose |
|---|---|---|
| [`gamestack-asset-audit`](bin/impl/asset-audit/README.md) | [`/asset-audit`](skills/asset-audit/SKILL.md) | Per-platform texture / audio / mesh / atlas / naming audit. Detects Unity `.meta` integrity catastrophes. |
| [`gamestack-cert-checklist`](bin/impl/cert-checklist/README.md) | [`/cert-readiness`](skills/cert-readiness/SKILL.md) | PS5 TRC / Xbox TCR-XR / Switch lotcheck high-failure-rate categories. PASS / PASS_CODE_ONLY / NEEDS_LIVE_TEST / FAIL_P0 / FAIL_P1 verdicts. |
| [`gamestack-steam-page-check`](bin/impl/steam-page-check/README.md) | [`/steam-page-review`](skills/steam-page-review/SKILL.md) | Capsule dimensions, trailer length, short-description hook, tag strategy, screenshot count, Next Fest fit. Wishlist-conversion risk verdict. |
| [`gamestack-game-benchmark`](bin/impl/game-benchmark/README.md) | [`/perf-benchmark`](skills/perf-benchmark/SKILL.md) | Polls engine SDK `/state` for FPS / frame time / draw calls / GC alloc / memory; diffs against a baseline. |
| [`gamestack-playtest-daemon`](bin/impl/playtest-daemon/README.md) | [`/playtest`](skills/playtest/SKILL.md) | Broker between Claude Code and a running engine build. Walks the 9 scenario step primitives; per-step run log. |
| [`gamestack-taste-update`](bin/impl/taste-update/README.md) | [`/art-shotgun`](skills/art-shotgun/SKILL.md) | Persists per-axis approval events into a project taste profile with exponential time-decay; surfaces emerging signals. |
| [`gamestack-model-benchmark`](bin/impl/model-benchmark/README.md) | _(reflective tool)_ | Runs a prompt suite against several Claude models; scores responses; picks a winner per run. Local-only. |

Every CLI is `0 = clean / 1 = regression / 2 = bad args / 127 = bun missing`. Wire them into CI for gates on asset budgets, cert readiness, Steam page quality, perf, and functional scenarios.

## Engine SDKs

Both SDKs expose a loopback-only HTTP server you drop into a running build. Same endpoints, same JSON shapes, just different ports — `/playtest` scenarios run unchanged against either.

| Engine | Port | Status | Endpoints |
|---|---|---|---|
| Unity (UPM package) | 7331 | ✓ v0.2.0 | `/state`, `/health`, `/screenshot`, `/input`, `/snapshot`, `/restore`, `/snapshots`, `/breakpoint` + Samples~/Basic |
| Godot 4.x (addon) | 7332 | ✓ v0.2.0 | Same contract as Unity at port 7332 + samples |
| Unreal (UPlugin) | — | Post-v1 | — |

See [`engines/unity/README.md`](engines/unity/README.md) and [`engines/godot/README.md`](engines/godot/README.md).

## Multi-host

| Host | Skill discovery path | Status |
|---|---|---|
| Claude Code | `~/.claude/skills/<name>/` | ✓ Default; auto-detected when `~/.claude/` exists |
| Codex CLI | `~/.codex/skills/<name>/` | ✓ `./setup --host codex` |
| OpenCode | `$XDG_CONFIG_HOME/opencode/skills/<name>/` | ✓ `./setup --host opencode` |
| Cursor | `~/.cursor/skills/<name>/` | ✓ `./setup --host cursor` |
| Factory Droid | `~/.factory/skills/<name>/` | ✓ `./setup --host factory` |
| Slate | `~/.slate/skills/<name>/` | ✓ `./setup --host slate` |
| Kiro | `~/.kiro/skills/<name>/` | ✓ `./setup --host kiro` |
| Hermes | `~/.hermes/skills/<name>/` | ✓ `./setup --host hermes` |
| GBrain | `~/.gbrain/skills/<name>/` | ✓ `./setup --host gbrain` |

All hosts share `hosts/_lib.sh` for the symlink discovery / install / uninstall / status logic. Adding another host is ~15 lines. See [`hosts/_README.md`](hosts/_README.md).

## Philosophy

- **Find the fun before you polish it.** A 10-minute prototype that feels right beats a 10-hour one that doesn't. `/find-the-fun` is the entry skill for an existing build for a reason.
- **Discipline > inspiration.** Skills enforce questions that uninspired-you would skip. Inspired-you doesn't need them.
- **Engine-agnostic by default.** Skills detect your engine and tailor advice without locking you in. Adding a new engine is a fork-skill away.
- **Solo-viable.** Every skill is something a solo dev can use without a team behind them. The CLIs let you wire the mechanical parts into CI so the interactive sessions stay focused on judgment calls.
- **Honest over flattering.** Skills push back. The polite answer to "is this fun?" when it isn't is *"no, here's why, here's what to try next."*
- **Don't generate what a human can decide.** gamestack doesn't auto-write your design doc, your dialogue, or your trailer copy. It surfaces the questions, structures the comparison, and remembers what you chose.

## Roadmap

gamestack ships in milestones. Full plan at [`docs/PLAN.md`](docs/PLAN.md).

| Milestone | Focus | Status |
|---|---|---|
| M0 | Skeleton + 3 pilot skills | ✓ Shipped |
| M1 | 8 plan-* + autoplan + 4 build skills | ✓ Shipped |
| M2 | Review + 6 playtest + Unity SDK | ✓ Shipped |
| M3 | Ship skills + 7 CLIs + Godot SDK | ✓ Shipped |
| **M4** | Reflect + power tools + docs + launch | **✓ Shipped — v1.0.0 launched 2026-06-05** |

For the v1.0 release notes, see [`CHANGELOG.md`](CHANGELOG.md). For the gates this release passed, see [`docs/LAUNCH-CHECKLIST.md`](docs/LAUNCH-CHECKLIST.md).

## Acknowledgments

gamestack borrows its core pattern — slash commands as a virtual team of specialists — from [garrytan/gstack](https://github.com/garrytan/gstack), Garry Tan's Claude Code virtual engineering team for software founders. gamestack adapts that pattern for game development, with disciplines unique to games: game feel, pacing, accessibility, platform certification, and console launch readiness.

## License

MIT. See [`LICENSE`](LICENSE).
