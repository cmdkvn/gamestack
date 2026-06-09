---
name: plan-level-design
description: Level Designer skill — pressure-tests world/level design for pacing, navigation, encounter rhythm, and gating logic. Builds a tension graph from the plan. Flags monotony zones, missing rest beats, navigation confusion, and gating-dependency hell. Use when levels are designed but not built, or when the pacing feels off mid-production.
---

# plan-level-design

This skill walks through a level on paper to predict where the player will get lost, where they'll get bored, and where they'll feel powerful. It builds a tension graph from the plan, finds the monotony zones, and makes sure the player always knows where to go without being told.

## When to fire

Use when level layouts are designed (even at sketch / block-out level) but not playable end to end. Trigger phrases:
- "Review level design"
- "Pacing review"
- "Plan level design"
- "Is the level pacing right?"
- `/plan-level-design`

If no level structure exists at all, that's a gap — redirect to `/design-jam` or `/plan-game-design`. If levels are built and playable, use `/critique --lens=pacing` (M2) instead.

## The lens

Pacing is the most-failed dimension in indie games. A great mechanic ships into a flat-paced game and dies of boredom in hour 3. This skill looks at the *shape* of the experience over time and forces the developer to confront where the curve is flat.

## Process

### Step 1 — read the plan

Find `design/level-design.md` and any per-level documents. Note the structure: open world / hub-spoke / linear / chapter-based / metroidvania.

### Step 2 — build the tension graph

Walk the planned experience beat by beat. For each major beat (a scene, a level, a chapter section), assign:
- **Tension (1–10):** how high-stakes is this moment for the player?
- **Skill demand (1–10):** how hard is the gameplay execution?
- **Narrative density (1–10):** how much story content is delivered?

Plot the three lines over the planned playtime. Surface:
- **Monotony zones:** > 15 minutes of similar tension/skill/narrative density.
- **Spike clustering:** three or more peaks back-to-back with no rest beat.
- **Hollow middles:** a middle third that's flatter than the opening or the ending.

You don't need pixel-perfect data. Even rough estimates expose pacing problems.

### Step 3 — critical path vs side content audit

For each region/level/chapter:
- What does **every player see** (critical path)?
- What's **optional**?
- What's the **estimated ratio**?

If critical path is < 50% of content, the optional content has to be strong enough to justify the work — surface it as a risk if it's filler. If critical path is > 90%, the game is shorter than it appears in the doc.

### Step 4 — navigation and readability

For each space, ask:
- **How does the player know where to go?** Sight lines? Lighting? Audio? NPC direction? A map? Quest markers?
- **What stops the player from going the wrong way** (or, if intentional, what makes the "wrong way" valuable)?
- **What's the player's view** at decision points? Is the critical path visible from where they stand?

Flag any space where the dev has no answer to "how does the player know where to go." This is the #1 cause of "stuck players" in QA.

### Step 5 — gating logic

Walk the gating dependencies:
- What gates progress? (item, skill, narrative, just-go-there)
- Where could the player get **stuck without realizing**? (e.g., need item X but don't know it; can backtrack but the game doesn't tell them)
- Are there **gating loops** (need A to get B, but B is in a space gated by A)?

Sketch the gate graph. If it's a deep tree, the late game will be a soft-lock risk. If it's a flat list, the game is more linear than the plan implies.

### Step 6 — hero shots and rest beats

- Which moments **must be visually striking** (photo-mode-worthy, in the marketing trailer)?
- Where are the **rest beats** — explicit low-tension moments to let the player catch their breath?

A game without planned hero shots will be hard to market. A game without rest beats will be exhausting.

### Step 7 — produce the review

## Inputs and outputs

**Reads:** `design/level-design.md` — schema: see [`docs/templates/level-design.md`](../../docs/templates/level-design.md).

**Review output:** writes to `design/reviews/plan-level-design.md`. Schema will be canonicalized in `docs/templates/plan-review.md` (Task 9 of this batch); inline format below remains active until then.

Review format (inline pending Task 9 — `docs/templates/plan-review.md`):

```
MACRO STRUCTURE
  <Stated structure; confirm or push back>

TENSION GRAPH
  <Beat-by-beat or per-region table with tension / skill demand / narrative density>
  Monotony zones: <list>
  Spike clusters: <list>
  Hollow middles: <list>

CRITICAL PATH / SIDE CONTENT
  Estimated ratio: <X%/Y%>
  Concerns:

NAVIGATION AUDIT
  Spaces with unclear wayfinding:
    - <space>: <missing signposting | sight line | breadcrumb>

GATING LOGIC
  Dependency depth: <shallow | deep | risky>
  Soft-lock risks: <list>
  Backtracking burden: <stated>

HERO SHOTS & REST BEATS
  Planned hero shots: <count and quality>
  Rest beats: <present | missing>

TOP 3 LEVEL DESIGN RISKS
  1.
  2.
  3.

DESIGN DOC EDITS
  <Specific edits to level-design.md or per-level files>
```

Offer to apply edits.

## What NOT to do

- **Don't propose new levels.** You're auditing what's planned, not designing more content.
- **Don't accept "the player will figure it out."** Wayfinding is designed, not discovered. If the developer can't articulate how the player knows where to go, that's a finding.
- **Don't redesign the macro structure.** If the developer planned a metroidvania, your job is to audit a metroidvania — not to suggest it should be linear. Macro-structure changes are `/plan-creative-director` territory.
- **Don't ignore the late game.** Many plans are detailed for hour 1 and vague for hour 10. The vague part is where pacing dies.

## Handoff

After plan-level-design:
- `/plan-narrative` — to align level pacing with narrative pacing.
- `/plan-game-design` — if dead mechanics surface in specific level contexts.
- `/critique --lens=pacing` (M2) — once levels exist as block-outs, validate the tension graph against actual play.
- `/autoplan` — for full multi-discipline review.
