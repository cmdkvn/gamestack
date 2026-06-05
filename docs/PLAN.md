# Implementation plan

gamestack ships across four milestones organized as 16 groups, each ≤400k tokens. The authoritative plan lives in the companion alliance studio repo:

> [`alliance/docs/superpowers/plans/2026-06-04-gamestack-implementation-plan.md`](https://github.com/alliance/alliance/blob/main/docs/superpowers/plans/2026-06-04-gamestack-implementation-plan.md)

A snapshot of the milestone-level plan follows. For the design rationale behind each skill, see the spec at `alliance/docs/superpowers/specs/2026-06-03-gamestack-design.md`.

## Milestones

### M0 — Skeleton (Week 1) — **✓ SHIPPED**

Group 1 of the implementation plan. Repo bones, host abstraction (Claude Code), setup script, 3 pilot skills (`/design-jam`, `/find-the-fun`, `/code-review-gamestack`), README v0.

### M1 — Plan + Build skills (Weeks 2–3) — **✓ SHIPPED**

- **Group 2 — Plan skills (✓ shipped):** 7 `/plan-*` skills + `/autoplan` pipeline.
- **Group 3 — Build skills (✓ shipped):** `/art-bible`, `/art-shotgun`, `/scene-prototype`, `/dialogue-write`.

Engine SDKs still stubbed (full integration lands in M2).

### M2 — Review + Playtest + Unity SDK (Weeks 4–5) — **review + playtest offline + Unity SDK foundation shipped**

- **Group 4 — Review skills (✓ shipped):** `/bug-hunt`, `/balance-review`, `/dialogue-review`, `/asset-audit`.
- **Group 5 — Playtest offline skills (✓ shipped):** `/game-feel-audit`, `/pacing-review`, `/onboarding-audit`, `/a11y-audit`, `/perf-benchmark`.
- **Group 6 — Unity SDK foundation (✓ shipped):** UPM package, HTTP server (loopback), `GET /state`, `POST /screenshot`, `GET /health`, Editor menu + window, EditMode tests.
- **Group 7 — Unity SDK extended (✓ shipped, v0.2.0):** `POST /input` (event dispatch), `POST /snapshot`, `GET /snapshots`, `POST /restore`, `POST /breakpoint`, `IGameStackSnapshotable`, `BreakpointProvider.Hit`, Samples~/Basic.
- **Group 8 — `/playtest` + Unity integration (✓ shipped):** Phase-aware live playtest skill. 6 reference scenarios shipped at `skills/playtest/scenarios/`. JSON scenario format with 9 step primitives. Offline static-analysis fallback when SDK absent.

### M3 — Ship + CLIs + Godot SDK (Week 6) — **✓ SHIPPED**

- **Group 9 — Godot SDK (✓ shipped):** Full Unity-SDK contract parity at port 7332. Autoload singleton, TCPServer-based HTTP, all 5 providers (state/screenshot/input/snapshot/breakpoint), self-test scene, sample.
- **Group 10 — Ship skills (✓ shipped):** `/cert-readiness`, `/steam-page-review`, `/publish`, `/post-launch-monitor`.
- **Group 11 — CLIs batch A (✓ shipped):** `gamestack-asset-audit`, `gamestack-cert-checklist`, `gamestack-steam-page-check`. TypeScript/Bun under `bin/impl/`. 30 tests pass.
- **Group 12 — CLIs batch B + daemon (✓ shipped):** `gamestack-game-benchmark`, `gamestack-playtest-daemon`, `gamestack-taste-update`, `gamestack-model-benchmark`. 78 tests pass. Daemon validated end-to-end against a fake engine SDK on `Bun.serve()`.

### M4 — Reflect + docs + launch (Weeks 7–8) — **✓ SHIPPED — v1.0.0 launched 2026-06-05**

- **Group 13 — Reflect + power tools + multi-host (✓ shipped):** 3 reflect skills (`/patch-notes`, `/post-mortem`, `/learn`), 6 power tools (`/careful`, `/freeze`, `/unfreeze`, `/guard`, `/cert-freeze`, `/launch-day`), 8 new host scripts (codex, opencode, cursor, factory, slate, kiro, hermes, gbrain) on a shared `hosts/_lib.sh`.
- **Group 14 — README + skills.md (✓ shipped):** Launch-quality README rewrite + 38 skill deep-dives in `docs/skills.md` (~10,400 words across pitch, plan, build, review, playtest, ship, reflect, power tools, with a multi-host table at the end).
- **Group 15 — Reference docs + tutorials (✓ shipped):** ROLES / ENGINES / CERT / ACCESSIBILITY / PLATFORMS reference + 5 howto-* tutorials at `docs/howto/`. ~28,700 words across 10 docs.
- **Group 16 — Tests + case studies + launch (✓ shipped):** `gamestack-skill-lint` regression validator (8th CLI, 11 tests), 2 case studies at `docs/case-studies/` (Unity + Godot, ~3500 words each), [`docs/LAUNCH-CHECKLIST.md`](LAUNCH-CHECKLIST.md), [`CHANGELOG.md`](../CHANGELOG.md) v1.0.0 entry. 89/0 Bun tests pass.

## Group structure

The 16 groups are individually sized at ≤400k tokens (cache-friendly Claude Code sessions). See the full plan in the alliance repo for the group breakdown, dependencies, recommended execution order, and risk flags.
