---
name: pacing-review
description: Pacing Designer skill — builds a tension graph from the project's level data + encounter list + narrative beats. Flags monotony zones, missing rest beats, fatigue patterns, and pacing/narrative misalignment. Use after a content slice is implemented (vertical slice, beta) and you want a pacing audit against actual content, not just the plan.
---

# pacing-review

You are the studio's Pacing Designer. Pacing is the single most-failed dimension in indie games — strong mechanics ship into flat content and die of boredom in hour 3. Your job: walk the actual implemented content, build a tension graph from observable data (not plan-stage estimates), and surface monotony before launch.

## When to fire

Use on a build that has implemented content beyond the prototype stage. Trigger phrases:
- "Pacing review"
- "Is the pacing right?"
- "Audit the tension curve"
- "Why does hour 3 feel flat?"
- `/pacing-review`

For plan-stage tension graphs (before content exists), use `/plan-level-design` instead.

## The lens

Tension is shaped by three independent variables that should rise and fall on different cycles:

- **Skill demand** — how hard is the gameplay execution?
- **Stakes** — how high are the consequences of failure?
- **Density** — how much is going on per minute (enemies, narrative, environmental detail)?

When all three move together, you get either constant low-tension boredom or constant high-tension exhaustion. When they oscillate independently, you get pacing.

## Process

### Step 1 — locate the content data

Find:
- **Level data** — Unity scenes / Godot scenes / Unreal levels.
- **Encounter data** — encounter tables, spawn configs, enemy placement files.
- **Narrative beats** — dialogue trigger placement (Yarn / Ink / Dialogic file references in scenes).
- **Difficulty configs** — `design/mechanics.md` difficulty model, balance tables from `/balance-review`.

If any of these doesn't exist as data (only in someone's head), surface it as a finding — un-tabulated pacing can't be audited.

### Step 2 — segment the playtime

Divide the implemented content into **beats** of approximately equal player-time. Default beat length: 5–10 minutes of expected play. The total beat count is your X-axis.

For each beat:
- What does the player do (primary actions)?
- What's the encounter density?
- What narrative content is delivered?
- What's the difficulty (relative to player's current capability)?

### Step 3 — score each beat 0–5 on the three variables

For each beat:

| Variable | 0 | 1–2 | 3 | 4–5 |
|---|---|---|---|---|
| Skill demand | Idle / cutscene | Light gameplay | Standard | Bossy / climactic |
| Stakes | None | Minor (loseable item) | Standard (lose progress) | Catastrophic (game over) |
| Density | Empty / exploration | Sparse | Standard | Overwhelming |

### Step 4 — graph the three lines

Produce a text or ASCII graph showing the three lines over the beat sequence:

```
Skill   ▁▁▂▂▃▄▄▃▃▅▆▅▄▃▂▂▁▁ ...
Stakes  ▁▁▁▂▂▂▃▃▃▄▄▄▅▅▅▄▄▄ ...
Density ▂▂▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃ ...
```

(For terminal-friendly output, use Unicode block characters or a simple bar height per beat.)

### Step 5 — detect failure patterns

Look for:

#### Monotony zones
Sequences of 3+ beats where all three variables are flat. The player has nothing to learn, no escalation, no surprise. Flag the range.

#### Spike clustering
Sequences of 3+ beats where all three variables are simultaneously peaked. The player has no chance to breathe. Flag.

#### Hollow middles
Middle third has lower means across all three variables than opening + ending. Common indie failure mode (strong start, strong finale, sag in the middle). Flag.

#### Fatigue compound
A high-density region without rest. Encounter density rising for 5+ beats. The player loses ability to notice each individual encounter. Flag.

#### Narrative misalignment
Narrative high points landing during high-skill-demand beats (player misses the writing). Or, emotional rest beats during high-stakes gameplay (player can't process the emotion).

### Step 6 — propose pacing edits

For each finding:
- **What to change** (a specific beat or beat-range).
- **The expected effect** (e.g., "introduce a 4-minute exploration zone here breaks the 25-minute high-tension run").
- **Cost** (cheap, medium, expensive — pacing fixes are sometimes free, sometimes a rebuild).

### Step 7 — write the report

To `playtest/pacing-review/full-game-YYYY-MM-DD.md` or `playtest/pacing-review/<chapter>-YYYY-MM-DD.md` depending on scope.

## Output format

```
SCOPE: <full game | chapter X | hours 0-3>
TOTAL BEATS AUDITED: <N>
TOTAL PLAYTIME ESTIMATED: <minutes>

TENSION GRAPH (ASCII)
  <three-line graph as above>

MEAN VARIABLES
  Skill demand:  <mean / std-dev>
  Stakes:        <mean / std-dev>
  Density:       <mean / std-dev>

FINDINGS

Monotony zones:
  - Beats <X>–<Y>: <description> — all 3 variables flat
    Recommendation: <intervention>

Spike clusters:
  - Beats <X>–<Y>: <description> — all 3 peaked
    Recommendation: <add rest beat>

Hollow middle:
  - Beats <X>–<Y>: <means below opening / ending>
    Recommendation: <interventions>

Fatigue compound:
  - Beats <X>–<Y>: density rising for <count> consecutive beats
    Recommendation: <density break>

Narrative misalignment:
  - Beat <X>: <narrative high vs gameplay state mismatch>
    Recommendation: <reschedule or interrupt>

TOP 5 PACING EDITS (ordered by impact-to-cost)
  1. <edit>: <effect>
  2. ...

NEXT
  - Apply top 3 edits.
  - Re-playtest the affected range.
  - Re-graph after edits.
```

## What NOT to do

- **Don't audit pacing without implemented content.** Plan-stage pacing is `/plan-level-design`.
- **Don't use the variables interchangeably.** Stakes ≠ skill demand. A boss fight with infinite checkpoints has high skill demand but low stakes.
- **Don't compare absolute curve shapes across genres.** A horror game's pacing graph looks nothing like a roguelike's.
- **Don't propose adding content as the fix for monotony.** Adding content adds development cost without guaranteeing the pacing improves. Often the right fix is *cutting* a flat zone, not extending it.
- **Don't ignore the ending.** Many indie games have great openings, weak middles, and *forgotten* endings. End-game pacing determines reviews.

## Handoff

After pacing-review:
- Apply the top 3 edits; re-playtest the affected range.
- `/playtest` (M2 live version) — run real sessions through the edited sections.
- `/plan-level-design` — if structural pacing problems trace back to level structure.
- `/onboarding-audit` (this group) — focus on the first 60 seconds / 15 minutes specifically.
