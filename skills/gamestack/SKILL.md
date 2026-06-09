---
name: gamestack
description: Router / index skill — the front door. Reads gamestack/state.json and recommends the 1–2 next skills to run based on project phase, recent activity, and what's still unanswered. Bootstraps state.json the first time it's invoked in a project (no pitch yet → /design-jam; pitch but no plan → /plan-*; build exists → /critique or /playtest; pre-launch → /a11y + /steam-page-review). Also bootstraps voice cards / taste profile scaffolding when the workflow demands it. Use as the entry point in any session where you're not sure what's next.
---

# gamestack

This is the front door to the gamestack skill catalog. It answers the only question that scales when there are dozens of specialists in the studio: **"what should I do next?"**

The catalog has many skills. A developer should never have to memorize them. This skill reads the project state and recommends what's next.

## When to fire

Use this skill when the developer:
- Just installed gamestack.
- Opens a project after a break.
- Doesn't know which skill applies.
- Asks "what's next?", "where do we stand?", or `/gamestack`.

Also fire automatically (suggest it) at the end of any skill that produces a major artifact, so the developer can immediately see what's recommended next.

## Arg parsing

`/gamestack` accepts an optional first positional arg and optional flags. Parse the user's prompt for the patterns below before doing anything else.

| Invocation | Behavior |
|---|---|
| `/gamestack` (no args) | Default — read state.json, recommend next steps. If state.json is absent, fall through to `new` mode automatically. |
| `/gamestack new` | Explicit bootstrap. See `## New mode` below. Refuses if state.json already exists. |
| `/gamestack adopt` | Retrofit onto an existing project. See `## Adopt mode` below. |
| `/gamestack catalog` | Print the full skills-by-phase catalog (existing behavior). |
| `/gamestack review=<mode>` | Persist `project.review_mode = <mode>` to state.json. `<mode>` is `lean`, `normal`, or `intense`. Acknowledge and stop (no other action). |
| `/gamestack --review=<mode>` | One-shot override. Write `<mode>` to `.gamestack/scratch/review-mode-override`. Acknowledge and stop. The next review-aware skill the developer invokes will read and delete this file. |

If multiple invocation forms are combined (e.g., `/gamestack new --review=lean`), apply the positional arg first (bootstrap), then the flag (write the scratch override at the end so it's ready for the next skill).

If the developer's intent doesn't match any of these — e.g., they typed `/gamestack help` — fall back to the default behavior and gently surface the supported forms.

## New mode

Triggered by `/gamestack new`. This is the explicit version of the implicit bootstrap that happens when `/gamestack` (no args) finds no state.json.

1. **Refuse if already initialized.** Check for `gamestack/state.json`. If it exists, reply: "state.json already exists at `gamestack/state.json`. To reinitialize, rename it and re-run, or use `/gamestack adopt` to rebuild state from what's on disk." Stop. Do NOT overwrite.
2. **Walk the 5 bootstrap questions** from `## Process / Step 1` (working name, engine, platforms, phase, review_mode) — same prompts, same auto-detection.
3. **Write state.json** including the new `review_mode` field (defaulting to `normal` if the developer skips the question).
4. **Create the scaffolding** (`gamestack/`, `design/`, `playtest/`, `.gamestack/` with the same conventions Step 1 of Process specifies).

## Adopt mode

Triggered by `/gamestack adopt`. Retrofits gamestack onto a project that already has design docs, source code, or a build — typically a developer adding gamestack mid-development.

1. **Refuse if already initialized.** Check for `gamestack/state.json`. If it exists, reply: "Already initialized. Use `/gamestack` to see next steps."
2. **Engine detection.** Reuse the marker-file table from `## Process / Step 1`. If multiple engines' markers are present (rare; e.g., a Unity project that exports to web with a Three.js wrapper), ask the developer which is primary.
3. **Artifact scan.** Check each canonical path; populate `artifacts.*` for files that exist.

   | State field | Path |
   |---|---|
   | `artifacts.pitch` | `design/pitch.md` |
   | `artifacts.design` | `design/mechanics.md` (preferred) or `design/game-design.md` (fallback) |
   | `artifacts.narrative` | `design/narrative.md` |
   | `artifacts.voice_cards` | `design/voice-cards.md` |
   | `artifacts.art_direction` | `design/art-direction.md` |
   | `artifacts.art_bible` | `design/art-bible.md` |
   | `artifacts.tech_design` | `design/tech-design.md` |
   | `artifacts.taste_profile` | `.gamestack/taste-profile.json` |

4. **Phase inference.** Apply this decision tree in order; first match wins. The more-advanced phases are tested first so they beat less-advanced overlaps.

   | Condition | Inferred phase |
   |---|---|
   | Engine markers + non-empty `playtest/` dir (≥2 `*.json` run files) | `production` |
   | Engine markers + `design/tech-design.md` + `tests/` dir containing ≥1 `*.test.*` file | `vertical-slice` |
   | Engine markers + `design/tech-design.md` (no qualifying `tests/`) | `prototype` |
   | Engine markers, no `design/tech-design.md` | `prototype` |
   | `design/pitch.md` exists, no engine markers | `pitch` |
   | No engine markers AND no `design/*` files | `pitch` |
   | Cannot determine | ask the developer |

   Never auto-infer `polish`, `cert`, or `launched` — those require explicit dev confirmation.

5. **Present a single confirmation summary:**

   First ask the developer for the two fields that can't be detected from disk: (a) the project's working name, (b) the target platforms (multi-select). Then present the confirmation summary below with those values filled in.

   ```
   gamestack adopt — found:

     Name:        <dev-provided>
     Engine:      <detected, e.g., Unity 6000.0.31f1>
     Platforms:   <dev-provided>
     Phase:       <inferred> (override if wrong)
     Artifacts:   <N> of 8 found
       ✓ <each found path>
       (missing: <comma-separated list of missing canonical artifact keys>)
     Review mode: normal (default; change later with /gamestack review=<mode>)

     Confirm? [yes / edit / cancel]
   ```

   If the user says `edit`, ask: "Which field? `[name | platforms | phase | review-mode]`". Walk them through that single edit, then re-present the summary. The detected `engine` is read-only — if it's wrong, the developer should cancel and re-run after correcting marker files. The `artifacts` block is also read-only (it reflects what's actually on disk).

6. **On confirm, write state.json** with the confirmed values. Initialize `recent_runs` to `[]` (any prior skill runs from before adopt are not recorded). Initialize `next_recommended` to `[]` (will populate on the next `/gamestack` invocation). Create any missing convention dirs (`gamestack/`, `.gamestack/`) but **do NOT touch existing `design/` files**.

7. **On cancel**, do nothing. Acknowledge and exit.

## Process

### Step 1 — locate or bootstrap `gamestack/state.json`

Look for `<project>/gamestack/state.json`.

**If absent**, you bootstrap it now. Ask the developer:

1. **"What is this project's working name?"** (slug derived as kebab-case)
2. **"Which engine?"** (Unity / Godot / Unreal / GameMaker / Bevy / iOS native / web / unknown). Auto-detect from marker files first; ask only if ambiguous:
   - `Assets/`, `ProjectSettings/` → Unity.
   - `project.godot`, `*.tscn` → Godot.
   - `*.uproject` → Unreal.
   - `*.yyp` → GameMaker.
   - `Cargo.toml` with `bevy` dependency → Bevy.
   - `package.json` with phaser / three / pixi / babylon → Web.
   - `*.xcodeproj` / `*.xcworkspace` / `Package.swift` with iOS target / `*.swift` under `Sources/` → **iOS native** (SpriteKit / SceneKit / Metal / RealityKit / SwiftUI / UIKit). Identify the rendering framework if discoverable from imports.
3. **"Which platforms is this targeting?"** (multi-select: pc, mac, linux, switch, ps5, xbox, ios, android, web). Drives per-platform budgets and cert requirements. `ios` selection routes cert work through the App Store Review path, not console TRC/lotcheck.
4. **"Which production phase?"** The seven phases:
   - `pitch` — no build yet, idea-stage.
   - `prototype` — first working build, finding the fun.
   - `vertical-slice` — one polished slice of the game.
   - `production` — most of the content being built.
   - `polish` — content locked, focus on feel / pacing / accessibility.
   - `cert` — submitting to PS5 / Xbox / Switch.
   - `launched` — live to players.
5. **"Review intensity?"** `lean` / `normal` (recommended default) / `intense`. Stored as `project.review_mode`. The default `normal` means "full rubric"; `lean` filters down to `[P0]`/`[P1]` findings only; `intense` adds adversarial cross-checks. The developer can change this later with `/gamestack review=<mode>`.

Write `gamestack/state.json` to the schema in [`../../docs/STATE.md`](../../docs/STATE.md). Initialize `artifacts.*` to empty strings, `recent_runs` to `[]`, `next_recommended` to `[]`.

Create the convention scaffolding:

```
gamestack/
  state.json             ← what you just wrote
design/                  ← created lazily by /design-jam, /plan-*, etc.
playtest/                ← created lazily by /critique, /playtest
.gamestack/
  taste-profile.json     ← initialized empty; managed by gamestack-taste-update
  skill-feedback.jsonl   ← initialized empty; appended to by /skill-feedback
```

Use `mkdir -p` and `touch` for the empty files. Don't overwrite anything that already exists.

**If present**, parse it. Verify `schema` is 1. If not, surface a schema-mismatch message and ask the developer to update gamestack.

### Step 2 — orient on recent activity

Read `recent_runs` (most recent 5 entries). Note:
- Which skills have run recently.
- Their outcomes (`ok`, `error`, `bailed`).
- Which artifacts they produced.

Read `artifacts.*` to see which design docs exist on disk. Spot-check that the path is real (file exists). If `state.json` claims an artifact at a path that doesn't exist, surface it.

### Step 3 — compute recommendations

Recommendations are phase-driven. Apply this table; pick the 1–2 most-relevant suggestions for the current phase, prioritizing artifacts that are missing.

| Phase | Likely next skills (in priority order) |
|---|---|
| `pitch` | `/design-jam` (if no pitch), then `/plan-creative-director`, `/plan-game-design`, `/plan-art-direction`, `/plan-narrative`. |
| `prototype` | `/critique --lens=fun` (kernel check), `/code-review-gamestack` (before commit), `/scene-prototype` (if expanding scope). |
| `vertical-slice` | `/critique --lens=onboarding`, `/critique --lens=pacing`, `/balance-review`, `/playtest`. |
| `production` | `/playtest`, `/critique --lens=pacing`, `/asset-audit`, `/code-review-gamestack` per merge. |
| `polish` | `/critique --lens=feel`, `/critique --lens=onboarding`, `/critique --lens=a11y`, `/critique --lens=perf`. |
| `cert` | `/cert-readiness`, `/critique --lens=a11y`, `/critique --lens=perf`, `/asset-audit`. Recommend `/cert-freeze` for discipline. For `ios` targets, the cert path is App Store Review (ATT prompt, privacy manifest, StoreKit 2 receipt validation, TestFlight dress rehearsal) — `/cert-readiness ios` walks it. |
| `launched` | `/post-launch-monitor` daily; `/patch-notes` per patch; `/post-mortem` weekly + after launch. |

Also check **artifact gaps**. If `artifacts.voice_cards` is empty and the project has narrative content (`artifacts.narrative` present), recommend a voice-cards step inside `/plan-narrative` or `/dialogue-write`. If `artifacts.art_bible` is empty and `phase` is past `prototype`, recommend `/art-bible`.

**Don't re-recommend a skill that just ran with `outcome: "ok"`** unless its artifact was deleted or the phase changed.

### Step 4 — present + write back

Print the recommendation:

```
gamestack status (phase: <phase>)
  Engine:     <engine> <version>
  Platforms:  <platforms>

Recent runs (most recent first):
  · <skill> [<lens>] <at> → <outcome>
  · ...

Next steps (pick one):
  1. /<skill> [args]   — <one-sentence reason>
  2. /<skill> [args]   — <one-sentence reason>

Catalog (long version): docs/skills.md
```

Update `next_recommended` in `state.json` with the same two suggestions and write back per [`_state-conventions.md`](../_state-conventions.md).

### Step 5 — if asked, expand

If the developer says "show me everything" or `/gamestack catalog`, print the full table of skills grouped by phase. Otherwise keep it terse.

## Phase changes

Only the developer changes `project.phase`. If the developer says "I'm in production now" or "we're shipping next week," update `phase` and re-run Step 3. Skills should never silently change phase.

## Bootstrap voice cards / taste profile

If the developer enters the catalog without these and is about to do narrative / art work:

- **Voice cards:** if `artifacts.voice_cards` is empty and the developer is heading to `/plan-narrative` or `/dialogue-write`, create `design/voice-cards.md` with a stub template:

  ```
  # Voice cards

  Each major character gets three adjectives and a sample line nobody else could plausibly say.

  ## <Character name>
  Adjectives: <three>
  Sample line: "<the line>"
  ```

- **Taste profile:** if `.gamestack/taste-profile.json` is empty and the developer is heading to `/art-shotgun`, leave it for `gamestack-taste-update --record` to populate on first round. Mention this so they're not surprised by an empty file.

## What NOT to do

- **Don't recommend more than 2 skills at a time.** Choice-overload defeats the purpose. The router exists to narrow, not to broaden.
- **Don't push the developer past phase boundaries.** If they're in `prototype`, don't recommend `/cert-readiness` "just in case." Phase-appropriate only.
- **Don't run the recommended skill yourself.** Surface the recommendation; let the developer invoke it. The router doesn't double as a dispatcher.
- **Don't overwrite an existing state file** when bootstrapping. If `gamestack/state.json` exists, read it; don't ask the bootstrap questions again.
- **Don't fabricate `recent_runs`.** If the file shows none, say so honestly — that's useful signal, not a problem to paper over.

## When to bail

If the developer asks for a specific skill by name, surface a one-line confirmation and step aside. The router exists when there's ambiguity; when there isn't, get out of the way.

## Handoff

`/gamestack` is the entry point and the recovery point. It hands off to:
- `/design-jam` when no pitch exists.
- `/plan-*` skills when the pitch exists but plans don't.
- `/critique --lens=<x>` when a build exists.
- `/playtest` when scenarios exist.
- `/cert-readiness`, `/publish`, `/post-launch-monitor` in the launch sequence.
- `/skill-feedback` after a session to capture whether the recommendations landed.
