# Changelog

All notable changes land here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the project follows [semver](https://semver.org/).

## [Unreleased]

### Added

- **End-user Claude Code hooks** at `bin/impl/hooks/`. `gamestack-hook-session-start` (SessionStart) reads `gamestack/state.json` and emits a one-line banner — `gamestack: <engine> | phase=<phase> | review_mode=<mode> | <N> recent runs` — so Claude has phase / engine / review_mode context on the first turn. Degrades to a `/gamestack new` hint when state.json is missing. `gamestack-hook-validate-state` (PostToolUse on `Edit` / `Write` / `MultiEdit`) validates `gamestack/state.json` against the v1 schema and enums (`engine`, `phase`, `review_mode`) after every Claude edit; emits one stderr line per failure so Claude self-corrects on the next turn. New `setup --hooks-for <project-dir>` flag covers install / uninstall / status; merges entries into `<project>/.claude/settings.local.json` (per-user, not committed) via idempotent jq pipelines that preserve user-added hooks. Requires `jq`. (PR #13.)
- **Skill template-link drift check.** `gamestack-skill-lint` gains a `templates/link-target-exists` ERROR rule: every `docs/templates/<x>.md` link in `SKILL.md` / `docs/skills.md` / `docs/templates/README.md` / `docs/howto/*.md` must resolve. Catches the most common drift class — a template renamed or removed without updating the consuming skill — at CI time. New dogfood `validate-skill-change.sh` PostToolUse hook wired into `gamestack/.claude/settings.json` re-runs the lint when Claude edits a SKILL.md or template, so drift surfaces in-loop rather than waiting for CI. Requires `jq` for the hook. (PR #12.)
- **Shader sub-rubrics for `/code-review-gamestack`.** Per-file Step 1b subsystem detection tags each diff file as Unity Shader, Godot Shader, iOS native, or none. Family 10 (Unity Shaders, 9 sub-patterns: dynamic branching on uniforms, derivatives in conditionals, sampler state declaration, `_MainTex` on URP / HDRP, half-precision world coordinates, compute thread-group platform max, missing LOD, sRGB / linear mismatch, `multi_compile` underscore-default). Family 11 (Godot Shaders, 6 sub-patterns: `texture()` in conditional blocks, missing `render_mode`, `SCREEN_TEXTURE` in opaque-queue materials, conditional varying writes, UV2 without mesh guarantee, default precision for mobile). `review_mode` lean filter includes `[P0]`/`[P1]` findings from these families — a shader break on mobile is a ship-stopper. (PR #11.)
- **`project.review_mode` + `/gamestack` sub-commands.** New `project.review_mode` field in `gamestack/state.json` (`lean` / `normal` / `intense`; defaults to `normal` for existing state files). Lean filters review-skill output to `[P0]`/`[P1]` findings (≤5); intense adds adversarial cross-checks. Severity tag convention: every finding from a review skill carries a leading `[P0]`/`[P1]`/`[P2]`/`[taste]` tag. `/critique`, `/code-review-gamestack`, `/balance-review` honor the dial. New `/gamestack` sub-commands: `new` (explicit bootstrap; refuses if state.json exists), `adopt` (retrofit onto an existing project — engine detection + artifact scan + phase inference + single confirm), `review=<mode>` (persist the mode), `--review=<mode>` (one-shot override via `.gamestack/scratch/review-mode-override`). (PR #10.)
- **`docs/templates/` — canonical artifact schemas.** 13 templates (`pitch`, `mechanics`, `narrative`, `voice-cards`, `art-direction`, `art-bible`, `audio-direction`, `level-design`, `tech-design`, `post-mortem`, `patch-notes`, `cert-readiness`, `plan-review`) with HTML-comment frontmatter (`artifact`, `authored_by` *or* `audited_by`, `schema_version`, `when_written`). Introduces the "Authored by" / "Audited by" distinction — several `/plan-*` skills are reviewers, not authors. 13 SKILL.md files updated to replace inline output schemas with template links. (PR #9.)
- **CI workflow for gamestack itself** at `.github/workflows/ci.yml`. Runs `gamestack-skill-lint --warn-as-error`, a per-CLI `bun test` matrix (9 CLIs), `shellcheck` on `setup` / `hosts/*.sh` / `bin/gamestack-*` / `bin/impl/hooks/*`, and `tests/setup-sync.test.sh`. Plus `.github/workflows/gamestack-gates.yml.example` — copy-pasteable CI workflow for downstream game projects. (PR #9.)
- **`CONTRIBUTING.md` and `SECURITY.md`.** GitHub-discoverable surface files; documents the testing-locally recipes (skill-lint, per-CLI tests, setup status, hooks test) and prerequisites (`bun`, `jq`). (PRs #9, #12, #13.)
- **iOS Swift Package SDK** at `engines/ios/` (`v0.1.0`). Same contract as Unity / Godot SDKs at port 7333. `Network.framework`-backed loopback HTTP/1.1 server (no third-party dependencies), `@GameStackState("key")` property wrapper, `GameStackSnapshotable` protocol, `InputInjector.shared` subscription-model input dispatch, `BreakpointProvider.shared` tag-based pause control, `UIGraphicsImageRenderer` screenshot capture. iOS 15+ / tvOS 15+ / Mac Catalyst 15+. XCTest suite; sample SpriteKit hookup at `engines/ios/Samples/Basic/`.
- **iOS engine support across the skill catalog.** `/code-review-gamestack` adds Swift-specific bug families (retain cycles, force unwraps, weak-delegate misses, off-main-thread UIKit updates, CADisplayLink leaks, background-task expiration, IAP receipt validation, Documents-vs-Caches misuse). `/asset-audit` adds iOS asset budgets (.xcassets, app icon sets, OTA download caps, ASTC vs PVRTC). `/cert-readiness` adds the App Store Review Guidelines + ATT + privacy manifest checklist. `/scene-prototype` emits SpriteKit + SwiftUI scaffolding. `/critique` adds iOS-specific lenses for perf (CADisplayLink, MetricKit, thermal state), a11y (VoiceOver, Dynamic Type, Reduce Motion, Smart Invert), and onboarding (ATT prompt placement, notification permission timing). `/publish` adds the TestFlight + App Store Connect upload checklist. `/gamestack` recognizes `ios` as a platform option.
- **Documentation:** `docs/ENGINES.md` iOS section with SPM install, `docs/PLATFORMS.md` iOS platform budgets, `docs/CERT.md` App Store cert categories, `docs/ACCESSIBILITY.md` iOS accessibility API mappings.

### Changed

- **`./setup` installs skills + CLIs by default.** Previously skills were the default and CLIs required `--with-cli`. The new defaults match what most users want; `--skills` and `--cli` scope to one side when needed. `--status`, `--uninstall`, and `--check-updates` are scoped by the same flags. (PRs #4, #5.)
- **Plan-first sync output.** `./setup` exits early with "Already in sync" when no symlinks need to change. When a change is needed, it articulates the exact added / removed symlinks before doing the work, instead of mixing planning and execution output. (PR #7.)
- **Install-path collision + stale-symlink cleanup.** Re-running `./setup` after a `git pull` no longer leaves stale symlinks behind when a skill is renamed or deleted; the script reconciles the host's skill directory against the current checkout. (PR #3.)

## [1.0.0] — 2026-06-05

**v1.0.0 is the early-access launch.** The 35 skills, 9 CLIs, and 2 engine SDKs in this release pass their test suite (98/98), the linter, and have documented contracts. They have **not** been validated by a real shipped commercial game using gamestack throughout. The case studies in `docs/case-studies/` describe reference Unity / Godot projects, not retrospectives of shipped titles. See [`README.md#status-honest`](README.md#status-honest) for full provenance.

### Added

- **35 skills** across pitch, plan, build, review, critique (consolidated), playtest, ship, reflect, and 6 power tools. Plus `/gamestack` (router) and `/skill-feedback` (quality signal) — the two skills that make the catalog discoverable and improvable. Full catalog in [`README.md`](README.md) and [`docs/skills.md`](docs/skills.md).
- **9 CLIs** under `bin/` for CI gates: asset audit, cert checklist, Steam page check, perf benchmark, playtest daemon (now with `--mode=screenshot-diff`), taste update, model benchmark, skill-feedback aggregator, skill-lint. All Bun-runtime; `0` / `1` / `2` / `127` exit codes.
- **Unity SDK v0.2.0** at `engines/unity/` — loopback HTTP server, `[GameStackState]` attribute, input injection, snapshot/restore, breakpoints, EditMode tests. Validated against in-process `Bun.serve()` fake; live engine validation pending the first real shipped game.
- **Godot SDK v0.2.0** at `engines/godot/` — full Unity-SDK contract parity at port 7332. Same validation caveat.
- **Zero-SDK playtest mode** — `/playtest --mode=screenshot-diff` watches a directory the developer manually populates and diffs against baselines. Removes the engine-SDK install as a prerequisite for the first useful playtest. Doc: [`docs/ZERO-SDK-PLAYTEST.md`](docs/ZERO-SDK-PLAYTEST.md).
- **Project state file** — `<project>/gamestack/state.json` is now the canonical source for project phase / engine / platforms / artifact paths / recent runs. Every skill reads on entry and writes on exit. Schema: [`docs/STATE.md`](docs/STATE.md). Conventions: [`skills/_state-conventions.md`](skills/_state-conventions.md).
- **`/gamestack` router skill** — front door. Reads `state.json`, bootstraps if absent, recommends 1–2 next skills based on phase + recent activity. Replaces "memorize 30 commands" with "ask gamestack what's next."
- **`/skill-feedback` skill + `gamestack-skill-feedback` CLI** — captures the developer's thumbs-up / thumbs-down per skill output to `.gamestack/skill-feedback.jsonl`. CLI aggregates by skill and surfaces "drifting" skills (< 50% useful) to prioritize for rewrites. Local-only; no telemetry.
- **Per-skill off-switch** — `enabled: false` in a SKILL.md frontmatter excludes that skill from `./setup` installs. Surfaced in `./setup --status` as `⊘ disabled`.
- **`./setup --check-updates`** — compares the local gamestack commit to `origin/main`. Standard `git fetch`; no third-party network calls.
- **Skill versioning** — single source of truth at `VERSION` (repo root). The CLI version helper reads it dynamically. Skill outputs include a footer convention (`— gamestack vX.Y.Z · /skill · YYYY-MM-DD`) for in-chat provenance. Convention documented at [`skills/_skill-footer.md`](skills/_skill-footer.md).
- **`docs/howto/first-30-minutes.md`** — install → first artifact tutorial.
- **`docs/STATE.md`** — state.json schema, lifecycle, and skill read/write contract.
- **`docs/ZERO-SDK-PLAYTEST.md`** — zero-SDK playtest mode walkthrough.

### Changed

- **Hard-cutover consolidation of six critique skills.** `/find-the-fun`, `/onboarding-audit`, `/game-feel-audit`, `/pacing-review`, `/a11y-audit`, `/perf-benchmark` have been deleted. Their rubrics live under a single `/critique` skill with `--lens={fun, onboarding, feel, pacing, a11y, perf}`. The lenses are intact; the catalog is smaller. **Migrate by replacing every old command with `/critique --lens=<x>`.**
- **`/code-review-gamestack` defaults to `[PROPOSE]`, not `[AUTO]`.** Solo devs have no second reviewer to catch a bad auto-fix. The new `[AUTO]` whitelist is narrow (StringBuilder swap, cached GetComponent, equivalent LINQ→for, empty-catch surfacing). Everything else surfaces a diff for the developer's call.
- **Persona conditioning trimmed from 31 skill openers.** Replaced "You are the studio's Senior X with 15 years..." with rubric-first openings. The opinionated voice in process / what-not-to-do sections is preserved unchanged.
- **Pipeline reframed as a menu, not a path.** The README, skill openers, and `/gamestack` router treat the Pitch → Plan → Build → Review → Playtest → Ship → Reflect ordering as an artifact view rather than a linear discipline.
- **Multi-host claims demoted.** Codex, Cursor, OpenCode marked verified. Factory / Slate / Kiro / Hermes / GBrain marked "community / unverified — PRs welcome." Cursor carries an additional caveat for distributions that require a manifest the script doesn't emit.
- **Privacy section added to README.** Explicit statement that nothing leaves the developer's machine, with a per-file accounting of what's local.

### Removed

- **`/find-the-fun`, `/onboarding-audit`, `/game-feel-audit`, `/pacing-review`, `/a11y-audit`, `/perf-benchmark`** — see the consolidation note above.
- **Several aspirational milestone claims** from `docs/PLAN.md`. The roadmap there now reflects what is functionally shipped vs. what is designed vs. what is planned.

### Notes

- gamestack is **not** a substitute for the NDA-protected TRC / TCR / lotcheck checklists. `/cert-readiness` and `gamestack-cert-checklist` catch the high-failure-rate public-knowledge categories that account for ~80% of indie cert rejections; cross-check the current platform checklist before submit.
- **No auto-upload to console partner portals.** `/publish` surfaces the build path and a manual upload checklist. By design.
- The Cursor host script symlinks like the other hosts; if Cursor's production plugin loader requires a manifest per skill, the script will need an emit step in a future release.
- Live Unity / Godot project validation is still pending — the SDKs are validated end-to-end against an in-process `Bun.serve()` fake. Real engine bugs will surface with the first shipped game using them.
- `[AUTO]` to `[PROPOSE]` is a behavior change for `/code-review-gamestack` users. If you previously relied on auto-fix application, the new default surfaces the diff for you to apply manually. The whitelist for `[AUTO]` is documented inside the skill.

[1.0.0]: https://github.com/cmdkvn/gamestack/releases/tag/v1.0.0
