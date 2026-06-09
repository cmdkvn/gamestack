---
name: plan-narrative
description: Narrative Designer skill — pressure-tests the story plan for voice consistency, exposition pacing, branching mechanics, and emotional beats. Looks for info-dumps, character-voice drift, missing environmental storytelling, fragile branching, and missing localization plan. Use when narrative beats are planned but not written, or when the writing pipeline is being designed.
---

# plan-narrative

This skill pressure-tests the story plan, locks the writing pipeline, and surfaces narrative risks before they become rewrites. It scans for voice drift, info-dump density, fragile branching, missing environmental storytelling, and missing localization plan — the failure modes that turn a planned story into a six-month rewrite mid-production.

## When to fire

Use when the story is outlined and characters are sketched but the dialogue isn't written yet. Trigger phrases:
- "Review the narrative plan"
- "Is the story plan right?"
- "Plan narrative"
- "Pressure-test the writing"
- `/plan-narrative`

If only a logline exists, redirect to `/design-jam`. If the dialogue is mostly written, use `/dialogue-review` (post-M2) instead.

## The lens

Strong game narratives die at five places:
1. **Voice drift** — characters that started distinct merging into the same tone over 30 hours of writing.
2. **Info dumps** — backstory delivered in monologue instead of action.
3. **Pacing mismatch** — emotional beats out of phase with gameplay beats.
4. **Branching fragility** — combinatorial state that breaks midway through QA.
5. **Localization shipwreck** — strings hardcoded that can't ship in any non-English market.

This skill is the early-warning system for all five.

## Process

### Step 1 — read the plan

Find `design/narrative.md` in the game directory (or whatever the developer points you at). Read all of it before forming any opinion.

### Step 2 — voice cards

For each major character, check:
- Are they described by **three adjectives**?
- Is there a **sample line** demonstrating those adjectives?
- Are they distinguishable from any other character by sample line alone?

If any character lacks a voice card, surface it. If two characters' voice cards read the same, surface it.

### Step 3 — exposition audit

Walk the story beats. For each, ask:
- Is backstory delivered through **action**, **environmental cue**, or **NPC dialogue**?
- If it's dialogue, is the dialogue motivated by what the character would say in that moment, or by what the player needs to know? (The second is an info dump.)
- Is exposition **paced** — never more than 60–90 seconds of contiguous reading before the player acts again?

Tag every info-dump candidate. Propose alternatives: environmental storytelling, gameplay reveal, journal entries the player can ignore, dialogue spread across multiple encounters.

### Step 4 — emotional beat / gameplay beat alignment

For each story beat, ask:
- What is the **player meant to feel**?
- What **gameplay** is happening at that moment?
- Are they aligned or fighting each other?

Mismatches (a tense story beat during a tutorial; a quiet emotional beat during a boss fight) are red flags. Surface them.

### Step 5 — branching structure

If the game branches:
- What's the **branching model**? Linear-with-choices? Multi-ending? Persistent-state? Faction-style?
- What **state is tracked** across choices? Be specific. "Karma" isn't a system; "+1 trust with Marin, +0 elsewhere, tracked per chapter" is.
- What's the **QA combinatorial cost**? If the dev hasn't estimated this, estimate it now.
- Is there a **fallback** for branching that breaks during QA (e.g., a "canonical" path)?

If branching is more complex than the developer can QA solo, propose simplification.

### Step 6 — writing pipeline and tooling

- What **dialogue format** is planned? (Yarn, Ink, Dialogic, engine-native, custom)
- Is dialogue **versioned** with the rest of the game's source?
- Are **strings externalized** for localization from day one? (Hardcoded English = no foreign-language ship later.)
- Is there an **editor's pass** scheduled before writing-complete?

## Inputs and outputs

**Reads:** `design/narrative.md` — schema: see [`docs/templates/narrative.md`](../../docs/templates/narrative.md).

**Authors / updates:** `design/voice-cards.md` — schema: see [`docs/templates/voice-cards.md`](../../docs/templates/voice-cards.md).

**Review output:** writes to `design/reviews/plan-narrative.md` — schema: see [`docs/templates/plan-review.md`](../../docs/templates/plan-review.md).

Offer to apply the edits.

## What NOT to do

- **Don't write dialogue.** That's `/dialogue-write` (M1). Plan-stage means structure and risk, not prose.
- **Don't propose new branching arms.** Lock what's there or simplify. Adding arms at plan stage is a Scope-Up move (`/plan-creative-director` territory).
- **Don't accept "we'll figure out tone in writing."** Voice cards are a planning artifact. Without them, voice drift is inevitable.
- **Don't dismiss localization.** Even a PC-only English-launch game benefits from externalized strings; even small studios end up wanting Steam Workshop translations.

## Handoff

After plan-narrative:
- `/plan-level-design` — to make sure level pacing matches narrative pacing.
- `/plan-audio-direction` — to align music states with emotional beats.
- `/dialogue-write` (M1) — when the plan is locked and dialogue writing can begin.
- `/dialogue-review` (M2) — once dialogue is drafted, to audit voice consistency in practice.
