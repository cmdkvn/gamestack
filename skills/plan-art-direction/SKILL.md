---
name: plan-art-direction
description: Art Director skill — rates the art direction plan 0-10 across style coherence, silhouette readability, color discipline, asset budget realism, and AI-slop resistance, then edits the plan to reach 10. Use after /design-jam when art direction is documented but the art pipeline isn't yet producing final assets.
---

# plan-art-direction

This skill rates the art plan across the dimensions that determine whether the game can look like itself, edits the plan to fix the weak spots, and calls out execution risks early. The lens: can a small team actually execute this moodboard in 18 months, and does the plan resist AI-slop hallmarks (floating fingers, plasticky lighting, generic-fantasy mush)?

## When to fire

Use when art direction has been documented (style, references, palette, budget) but the art pipeline is still producing concepts and placeholders. Trigger phrases:
- "Review the art direction"
- "Is the art plan right?"
- "Rate the art direction"
- "Plan art direction"
- `/plan-art-direction`

If only a vague "it'll look like X" exists, redirect to `/design-jam` or `/art-bible` (M1). If the art is in production with shippable assets being made, use `/design-review` (M2) once it ships.

## The lens

Eight dimensions, each rated 0–10. The plan is "ready" when each is ≥ 8.

| Dimension | What 10 looks like |
|---|---|
| **Style in one sentence** | A single sentence anyone on the team could quote that captures the visual identity. |
| **References specificity** | References name specific games (or films, or artists) AND name what's being borrowed from each. Generic vibes ("dark fantasy") rate ≤ 4. |
| **Color discipline** | A palette is defined (hex codes / named slots), a color script exists for the major regions/scenes, and per-region shifts are intentional. |
| **Silhouette readability** | Characters distinguishable at 16×16; enemies distinguishable by silhouette alone; interactables visually unique. |
| **Asset budget realism** | Per-platform texture / atlas / draw-call budgets are set AND the planned content count is achievable inside them for a solo / small team. |
| **Animation language** | Frame rate, easing preferences, snap-on-impact policy, idle loop length — explicit. |
| **VFX policy** | When particles fire, for how long, how much screen they occupy — explicit. Juice budget articulated. |
| **AI-slop resistance** | References avoid AI-render hallmarks. The plan calls out what it WILL NOT do (floating fingers, plasticky materials, anachronistic blur, generic fantasy detail). |

## Process

### Step 1 — read the plan

Find `design/art-direction.md` (or wherever the developer keeps it). Read it end to end. Look at any reference images stored alongside.

### Step 2 — rate each dimension 0–10

For each dimension, assign a rating and a one-sentence rationale. Be honest. A plan that's mostly 5s and 6s is not ready for production.

| Rating | Meaning |
|---|---|
| 0–3 | Section is missing or generic to the point of useless. |
| 4–6 | Section exists but is too vague to guide execution. |
| 7–8 | Section is solid but has gaps. |
| 9–10 | Section is shippable as written. |

### Step 3 — explain what 10 looks like

For every dimension under 9, write a sentence describing what 10 looks like for *this game*. Not generic best practices — concrete, this-plan-specific direction.

### Step 4 — propose plan edits

Produce specific edits that move each under-9 dimension toward 10. Be concrete: text to add, references to replace, specific budget numbers to set.

### Step 5 — AI-slop scan

Walk the references and any concept art the developer has produced or generated. Flag:
- **Floating finger / hand anatomy errors.**
- **Plasticky materials / generic fantasy lighting.**
- **Anachronistic blur** (e.g., 16th-century scene with modern depth-of-field falloff).
- **Generic fantasy detail** ("intricate" patterns with no underlying logic).
- **Vibe-mush references** that don't specify what's being borrowed.

Each flag is a candidate to either re-do the reference, replace it with a real human-made source, or commit to the AI-slop look as an intentional choice (rare but possible).

## Output format

```
RATINGS (0-10)
  Style in one sentence:       <N> — <rationale>
  References specificity:      <N> — <rationale>
  Color discipline:            <N> — <rationale>
  Silhouette readability:      <N> — <rationale>
  Asset budget realism:        <N> — <rationale>
  Animation language:          <N> — <rationale>
  VFX policy:                  <N> — <rationale>
  AI-slop resistance:          <N> — <rationale>

WHAT 10 LOOKS LIKE (per under-9 dimension)
  <dimension>: <one-sentence game-specific 10>

AI-SLOP FLAGS
  - <reference / image>: <issue> — <action>

TOP 3 ART DIRECTION RISKS
  1.
  2.
  3.

DESIGN DOC EDITS
  <Specific concrete edits to art-direction.md>
```

Offer to apply edits.

## What NOT to do

- **Don't propose a different style.** You're locking and tightening what the developer has chosen, not redirecting them.
- **Don't accept "we'll figure out the palette in production."** Palette discipline is plan-stage work — without it, every region looks like every other.
- **Don't ignore the asset budget.** A plan that says "highly detailed" with no count, polygon, texture, or atlas budget is a plan to never ship.
- **Don't let "AI-slop" become a slur.** The intent of the check is to catch unintentional sloppy references. Some games will deliberately use AI-generated art and that's a valid choice — call it out and let the developer commit explicitly.

## Handoff

After plan-art-direction:
- `/art-bible` (M1) — when the plan reaches 9+ across the board, start the production-side art bible.
- `/art-shotgun` (M1) — for visual exploration of specific scenes.
- `/plan-audio-direction` — to align audio style with visual style.
- `/design-review` (M2) — once art is being made, run on shipped assets.
- `/autoplan` — for the full multi-discipline review.
