# Plan

This doc is the realistic status of gamestack — what is functionally shipped, what is designed but not validated, and what is planned. The README has the user-facing version; this is the engineering-honest one.

## Stages

A stage is "shipped" only when it has both a working implementation AND a credible validation signal. Functionality without validation lives in the "in progress" column.

### v1.0.0 — Early access — **functionally shipped, validation in progress**

What landed:

| Group | Scope | Functional | Validated end-to-end |
|---|---|---|---|
| Skeleton | Repo bones, host abstraction, setup script, 3 pilot skills, README | ✓ | ✓ on Claude Code |
| Plan skills | 7 `/plan-*` skills + `/autoplan` | ✓ | Tested on reference design docs; not against a shipped game |
| Build skills | `/art-bible`, `/art-shotgun`, `/scene-prototype`, `/dialogue-write` | ✓ | Reference scenarios; not against a shipped game |
| Review skills | `/code-review-gamestack`, `/bug-hunt`, `/balance-review`, `/dialogue-review`, `/asset-audit` | ✓ | Reference scenarios |
| Critique (consolidated) | `/critique` with 6 lenses (replaces 6 prior skills) | ✓ | Rubrics inherited from prior skills; no real-game retros |
| Unity SDK | UPM package, loopback HTTP, `/state` `/screenshot` `/health` `/input` `/snapshot` `/restore` `/snapshots` `/breakpoint`, Samples~/Basic, EditMode tests | ✓ | Against in-process `Bun.serve()` fake. **Live engine validation pending.** |
| Godot SDK | Full parity with Unity SDK at port 7332 | ✓ | Same caveat as Unity SDK |
| iOS SDK (post-1.0, on `main`) | Swift Package at port 7333. `Network.framework`-backed HTTP/1.1 server, `@GameStackState` property wrapper, `GameStackSnapshotable`, `InputInjector`, `BreakpointProvider`, `UIGraphicsImageRenderer` screenshot capture. iOS 15+ / tvOS 15+ / Mac Catalyst 15+. XCTest suite + Samples/Basic | ✓ | Against XCTest harness on macOS. **Live device validation pending** (full Xcode required to link `swift test`). |
| iOS coverage in skill catalog (post-1.0, on `main`) | Swift bug families in `/code-review-gamestack`; .xcassets / icon / OTA / ASTC budgets in `/asset-audit`; App Store Review + ATT + privacy manifest in `/cert-readiness`; SpriteKit + SwiftUI in `/scene-prototype`; iOS perf / a11y / onboarding in `/critique`; TestFlight + App Store Connect in `/publish`; `ios` engine in `/gamestack` | ✓ | Authored against the App Store Review Guidelines and the iOS 17 SDK; no shipped iOS title yet. |
| `/playtest` SDK + offline + zero-SDK modes | Phase-aware. 6 reference scenarios. 9-primitive scenario format. | ✓ | SDK mode tested against fake. Zero-SDK + offline modes have unit tests. |
| Ship skills | `/cert-readiness`, `/steam-page-review`, `/publish`, `/post-launch-monitor` | ✓ | Reference scenarios; no shipped game retrospective |
| CLIs (9 total) | asset-audit, cert-checklist, steam-page-check, game-benchmark, playtest-daemon (with screenshot-diff), taste-update, model-benchmark, skill-feedback, skill-lint | ✓ | 89/89 Bun tests pass |
| Reflect skills | `/patch-notes`, `/post-mortem`, `/learn` | ✓ | Reference scenarios |
| Power tools | `/careful`, `/freeze`, `/unfreeze`, `/guard`, `/cert-freeze`, `/launch-day` | ✓ | Functional; conventions documented |
| Multi-host | Claude Code, Codex, Cursor, OpenCode | ✓ | ✓ verified for Claude Code; Codex / Cursor / OpenCode follow the shared `_lib.sh` contract |
| Multi-host (unverified) | Factory, Slate, Kiro, Hermes, GBrain | ✓ scripts exist | ✗ no end-to-end install confirmed in those hosts |
| Setup ergonomics (post-1.0, on `main`) | `./setup` installs skills + CLIs by default; `--skills` / `--cli` scope to one side; `--cli-dir` overrides CLI install dir; plan-first sync exits early when in sync, articulates added/removed symlinks when not | ✓ | Smoke-tested locally; no host-portability tests yet |
| Project state file | `gamestack/state.json` schema + read/write conventions | ✓ | Schema spec + conventions doc; integration into every skill is in progress |
| `/gamestack` router | Front door, bootstrap, recommends 1–2 next skills | ✓ | Functional; effectiveness depends on `/skill-feedback` adoption |
| `/skill-feedback` + CLI | Local thumbs-up/down log + aggregator | ✓ | CLI tested |
| Docs | `README.md`, `docs/skills.md`, `docs/STATE.md`, `docs/ZERO-SDK-PLAYTEST.md`, `docs/ENGINES.md`, `docs/CERT.md`, `docs/ACCESSIBILITY.md`, `docs/PLATFORMS.md`, `docs/ROLES.md`, 5 howto tutorials, 2 reference case studies | ✓ | Internally consistent; real-game retros pending |

What did NOT land:

- A retrospective of a real shipped game built with gamestack throughout. The case studies are reference walkthroughs of toy Unity / Godot projects.
- Verified install scripts for Factory / Slate / Kiro / Hermes / GBrain.
- Live engine validation of the Unity / Godot SDKs against a real game build.
- Universal `state.json` integration across every shipped skill (some skills still read project state heuristically rather than from the canonical file).
- The `/skill-feedback` improvement loop with enough volume to meaningfully prioritize rewrites.

### v1.1 — Validation milestone — **planned**

The minimum bar for v1.1:

- One real game shipped using gamestack throughout, with the post-launch retrospective published as a case study under `docs/case-studies/`.
- Unity, Godot, or iOS SDK validated against that game's live build (not just the in-process / XCTest fakes).
- `/skill-feedback` aggregates show at least 3 skills with >10 entries each, so rewrites are signal-driven, not vibes-driven.
- At least one community-verified host beyond Claude Code (PRs welcome with screen recording / session transcript).
- `state.json` integration completed across every shipped skill (audit + per-skill PR).

### v1.x — Catalog expansion — **planned**

Driven by `/skill-feedback` aggregates. Likely areas:

- Live-service / multiplayer skill set (matchmaking design review, retention-metric review, server-cost balancing).
- Engine SDK rev'd against real-game findings.
- Community-verified host expansion (one host moved from unverified to verified per release).
- Unreal SDK (UPlugin).

### v2.0 — TBD

Reserved for breaking changes informed by v1.x findings.

## How decisions get made

- **A skill ships when its rubric is documented and at least one reference scenario exercises it.** Real-game validation happens in v1.1+.
- **A host moves from unverified to verified when a maintainer or community contributor demonstrates an end-to-end install** (screen recording or session transcript). The bar is intentionally low; the point is to stop claiming things work that nobody has tried.
- **A skill gets rewritten when `gamestack-skill-feedback --window=30d` shows < 50% useful with > 5 entries.** Below that volume, ratings are noise.
- **Breaking changes happen at major versions.** v1.0 → v1.1 is additive only. v1.x → v2.0 is when collected lessons reshape contracts.

## Open questions

- How many skills is too many? v1.0 ships 32; the consolidation to `/critique` cut 5 from 38. The next plausible consolidation: the seven `/plan-*` skills into `/plan --discipline=<x>`. Decision deferred until v1.1 feedback comes in.
- Is `state.json` the right shape? It might want to split into `project.json` (slow-moving) and `recent.json` (high-churn). Decision deferred.
- Are the engine SDK contracts going to need to change for Unreal? Likely yes; the parity claim only covers Unity ↔ Godot.

## What's next

If you want to help, the highest-impact contributions:

1. Use gamestack on a real game and log `/skill-feedback` honestly. The aggregator tells the next rewrite what to fix.
2. Verify one of the unverified hosts end-to-end. Open a PR moving it from "community / unverified" to "verified."
3. Validate the Unity or Godot SDK against a live build (not the fake) and report what breaks.

Contributions to v1.x feature work are also welcome, but the validation work above is the gate keeping v1.0 from being a credibly-shipped baseline.
