# Changelog

All notable changes to gamestack land here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the project follows [semver](https://semver.org/).

## [1.0.0] — 2026-06-05

### Added

- **38 skills** across the full Pitch → Plan → Build → Review → Playtest → Ship → Reflect pipeline plus six power tools.
- **7 CLIs** under `bin/`: `gamestack-asset-audit`, `gamestack-cert-checklist`, `gamestack-steam-page-check`, `gamestack-game-benchmark`, `gamestack-playtest-daemon`, `gamestack-taste-update`, `gamestack-model-benchmark`. Plus the regression validator `gamestack-skill-lint` (Group 16). All Bun-runtime; `0` / `1` / `2` / `127` exit-code scheme.
- **Unity SDK v0.2.0** at `engines/unity/` — loopback HTTP server, `[GameStackState]` attribute, input injection, snapshot/restore, breakpoints, EditMode tests.
- **Godot SDK v0.2.0** at `engines/godot/` — full Unity-SDK contract parity at port 7332, `GameStack.expose()`, duck-typed snapshot contract, signal-based input injection.
- **6 reference playtest scenarios** at `skills/playtest/scenarios/` covering the SDK smoke, prototype first-minute, vertical-slice friction, polish game-feel, and two cert-class scenarios (controller-disconnect + save-fuzz).
- **9-primitive scenario format** documented at `skills/playtest/scenarios/README.md`. Contract enforced by both engine SDKs and by `gamestack-skill-lint`.
- **9 AI agent hosts** supported via `hosts/` setup scripts: Claude Code (default), Codex CLI, OpenCode, Cursor, Factory Droid, Slate, Kiro, Hermes, GBrain. Per-host scripts wrap shared `hosts/_lib.sh`.
- **Launch-quality docs** at `docs/`: `README.md` (top level), `skills.md` (38-skill deep-dive catalog), `ROLES.md` (cross-skill role catalog), `ENGINES.md` (Unity + Godot SDK reference), `CERT.md` (PS5/Xbox/Switch cert reference), `ACCESSIBILITY.md` (GAG-based), `PLATFORMS.md` (per-platform budgets). Plus 5 howto tutorials at `docs/howto/`. Plus 2 case studies at `docs/case-studies/`.
- **`docs/LAUNCH-CHECKLIST.md`** — the pre-v1 gates this release passed.
- **89 Bun-native CLI tests** pass with 0 failures, type-check clean.

### Notes

- gamestack is **not** a substitute for the NDA-protected TRC / TCR / lotcheck checklists. `/cert-readiness` and `gamestack-cert-checklist` catch the high-failure-rate public-knowledge categories that account for ~80% of indie cert rejections; always cross-check the current platform checklist before submit.
- **No auto-upload to console partner portals.** `/publish` surfaces the build path and a manual upload checklist. This is by design.
- The Cursor host script symlinks like the other hosts; if Cursor's production plugin loader requires a manifest per skill, the script will need an emit step in a future release.
- Live Unity / Godot project validation is still pending — the SDKs are validated end-to-end against an in-process `Bun.serve()` fake. Real engine bugs will surface with the first shipped game using them.

[1.0.0]: https://github.com/alliance/gamestack/releases/tag/v1.0.0
