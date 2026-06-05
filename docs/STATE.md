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
    "phase": "pitch | prototype | vertical-slice | production | polish | cert | launched"
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
