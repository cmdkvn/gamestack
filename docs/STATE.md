# Project state — `gamestack/state.json`

Every gamestack project keeps a single canonical state file at the project root:

```
<project>/gamestack/state.json
```

It is the source of truth for which phase the project is in, where the design artifacts live, and which skills have run recently. Skills read it on entry to orient themselves and write to it on exit to record what happened. Without it, every skill re-asks the same questions and the "studio" illusion breaks the moment two specialists disagree.

This file is **local-only**. Nothing in gamestack uploads or transmits it. See [`../README.md#privacy`](../README.md#privacy).

## Schema (v1)

```json
{
  "schema": 1,
  "project": {
    "name": "untitled",
    "slug": "untitled",
    "engine": "unity | godot | unreal | gamemaker | bevy | web | unknown",
    "engine_version": "6000.0.31f1",
    "platforms": ["pc", "switch", "ps5"],
    "phase": "pitch | prototype | vertical-slice | production | polish | cert | launched",
    "review_mode": "lean | normal | intense"
  },
  "artifacts": {
    "pitch":          "design/pitch.md",
    "design":         "design/game-design.md",
    "narrative":      "design/narrative.md",
    "voice_cards":    "design/voice-cards.md",
    "art_direction":  "design/art-direction.md",
    "art_bible":      "design/art-bible.md",
    "tech_design":    "design/tech-design.md",
    "taste_profile":  ".gamestack/taste-profile.json"
  },
  "recent_runs": [
    {
      "skill": "design-jam",
      "lens": null,
      "at": "2026-06-05T14:22:11Z",
      "artifact": "design/pitch.md",
      "outcome": "ok | error | bailed"
    }
  ],
  "next_recommended": [
    {"skill": "plan-game-design", "reason": "Pitch locked; lock the core loop before scope creeps."},
    {"skill": "plan-art-direction", "reason": "Art direction unrated."}
  ],
  "gamestack_version": "1.0.0"
}
```

### Field reference

| Field | Owner | Notes |
|---|---|---|
| `schema` | gamestack | Bump on breaking changes. v1 is the current format. |
| `project.name` / `slug` | `/design-jam` | Slug is kebab-case derived from name. |
| `project.engine` / `engine_version` | `/plan-tech-design`, `/scene-prototype` | Auto-detected; user overrides win. |
| `project.platforms` | `/plan-tech-design`, `/cert-readiness` | Drives per-platform budgets in `gamestack-asset-audit`. |
| `project.phase` | the developer (skills propose, dev confirms) | Skills tailor advice by phase. |
| `project.review_mode` | the developer | `lean \| normal \| intense`. Defaults to `normal` if missing. Skills filter their output by this — see "Review mode" below. |
| `artifacts.*` | the skill that produced the artifact | Relative paths from project root. Skills update on write. |
| `recent_runs` | every skill | FIFO, max 20 entries. Used by `/gamestack` to recommend what's next. |
| `next_recommended` | `/gamestack` | Recomputed on every `/gamestack` invocation. |
| `gamestack_version` | bootstrap | Pinned the first time the state file is written. Drift surfaces via `setup --check-updates`. |

## Lifecycle

### Bootstrap

`gamestack/state.json` is created the first time any of these happens:

1. `/gamestack` is invoked in a project without a state file — it prompts the developer for engine, platforms, and phase, then writes the file.
2. `/design-jam` produces a pitch — it writes the state file with `phase: "pitch"` and `artifacts.pitch` populated.
3. The developer runs `gamestack-skill-lint --init-state` (manual override).

### Read

Every skill should read `gamestack/state.json` on entry. If absent, redirect to `/gamestack` to bootstrap. The two skills that don't redirect (they bootstrap themselves) are `/gamestack` and `/design-jam`.

### Write

Skills write back two things:
1. The artifact path they produced under `artifacts.*` (if applicable).
2. An entry under `recent_runs`. Keep the array bounded to 20 entries — drop the oldest on append.

Do not overwrite fields a skill doesn't own. A `/critique --lens=fun` run does not touch `artifacts.tech_design`.

### Schema migration

If `schema` is older than the current code, skills should call into a shared migrator (defined in `bin/impl/shared/state.ts`) before reading the rest. The migrator must be additive: never drop fields, only rename or default.

## Review mode

`project.review_mode` is the intensity dial every review-shaped skill should honor. Three levels:

- **lean** — surface only `[P0]` (blockers) and `[P1]` (strongly recommended). Skip `[P2]` (nice-to-have) and `[taste]` (judgment calls). Output should be ≤5 findings; ideal for "I just want to know if this is broken" passes.
- **normal** — full rubric. All severities surfaced. This is the default if the field is missing or unset.
- **intense** — full rubric plus an adversarial cross-check: for each `[P0]`/`[P1]` finding, generate "what could make this a false positive?" with a confidence rating (high/med/low). Slower; intended for pre-launch passes and cert prep.

### Severity tag convention

Every finding in a review skill's output must carry a leading severity tag in its header line: `[P0]`, `[P1]`, `[P2]`, or `[taste]`. The tag is what the lean filter keys on. Without it, the filter degrades to "show everything," defeating the dial.

| Tag | Meaning | Examples |
|---|---|---|
| `[P0]` | Blocker — game crashes, save corruption, cert-failing a11y, security issue | Allocation in `Update()` on Switch; off-thread main-API call; loss of write-acks |
| `[P1]` | Strongly recommended — meaningful slice of players impacted | Hit-pause missing on a primary verb; no `[P1]`-tier GAG features; dominant strategy at >70% win-rate |
| `[P2]` | Nice-to-have — polish, minor inconsistency | Particle pop-in at 30+ count; missing tooltip on optional UI; small balance asymmetry |
| `[taste]` | Judgment call — no objectively right answer | "Maybe try yellow instead of orange"; "the second-act pacing could be tighter, depending on intent" |

### One-shot override

`/gamestack --review=<mode>` writes `<mode>` to `.gamestack/scratch/review-mode-override`. The next skill that consumes review_mode reads that file, uses the override, and **deletes the file before doing any other work**. This makes the override genuinely one-shot — if the skill fails mid-run, the override is already gone so it doesn't leak.

Implementation contract for any skill that honors review_mode:

1. Read `.gamestack/scratch/review-mode-override` if it exists. Capture the value. Delete the file (`rm -f` is fine; ignore "no such file" errors).
2. If the override existed, use its value.
3. Otherwise read `project.review_mode` from `gamestack/state.json` (default to `normal` if the field is absent).
4. Tag every finding with one of `[P0]`/`[P1]`/`[P2]`/`[taste]`.
5. Filter the output according to the mode (or expand it, for `intense`).

## Why a single file

The alternative — every skill writing to its own scratch location — sounded fine until two skills disagreed about the phase. The Game Writer thought we were in Production while the Live Ops skill was already in Launched. A single canonical file removes that class of bug at the cost of a slightly stricter contract for skill authors.

If you genuinely need scratch state that isn't worth canonicalizing, put it under `.gamestack/scratch/<skill-name>/` and exclude that path from VCS.

## Reading the state from a skill

In skill markdown, a typical opener looks like:

```
Read `gamestack/state.json`. If absent, redirect to `/gamestack` to bootstrap.
Read `phase`, `engine`, and `artifacts.pitch`. If `phase` is `launched` and this
skill is build-phase, refuse politely and recommend `/post-launch-monitor`.
```

The skills/_state-conventions.md file (added in the same release as STATE.md) gives the full read/write recipe. Every shipped skill in v1.1+ follows it.

## Privacy

`gamestack/state.json` lives in the project's working directory. It is not transmitted, uploaded, or telemetered. The `taste_profile` and `recent_runs` arrays are the only places where the developer's behavior is logged, and both are local files the developer fully controls.
