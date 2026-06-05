---
name: art-shotgun
description: Visual Explorer skill — structured visual exploration. For one named subject (key art, character concept, scene vignette), generates 4–6 distinct prompt variants for image generation, structures a comparison + feedback workflow, captures the developer's taste, and iterates. Pairs with the gamestack-taste-update CLI for persistent learning. Use when you need to explore visual options before committing to a final piece.
---

# art-shotgun

The developer needs to see options before choosing. This skill takes one subject, generates 4–6 *distinct* prompt variants, structures the comparison so the developer can pick what works, captures their feedback in a way that improves the next round, and iterates until something lands.

## When to fire

Use when there's a specific asset to design and the developer wants exploration before commitment. Trigger phrases:
- "Show me options for X"
- "Explore key art / character / vignette"
- "Run art-shotgun"
- "I need to see variants"
- `/art-shotgun <subject>`

If the developer hasn't locked the art bible yet, run `/art-bible` first — variants without an anchor drift quickly.

## The flow

```
SUBJECT → 4-6 PROMPT VARIANTS → developer generates images → COMPARISON
                                                                  ↓
                                                            FEEDBACK CAPTURE
                                                                  ↓
                                                  NEXT ROUND (sharpened) → ...
                                                                  ↓
                                                             FINAL CHOICE
```

This skill produces the prompts, structures the comparison, and captures the feedback. The actual image generation runs in whatever tool the developer prefers (Midjourney, GPT Image, Stable Diffusion, Scenario, etc.). gamestack stays tool-agnostic at the generation step.

## Process

### Step 1 — clarify the subject

Ask the developer to confirm:
- **What's the subject?** ("Marin in the lighthouse keeper's quarters at dawn." Not "key art.")
- **What's the format?** Key art / character turnaround / environment vignette / capsule / UI screen / promotional shot.
- **What's the use case?** Steam capsule / in-game prop / mood reference / marketing.
- **What's the resolution / aspect?** 1920×620 (Steam hero) / 1024×1024 / 16×16 sprite reference / 9:16 portrait.

Without these specifics, the variants will all look like generic vibes.

### Step 2 — read the anchors

- `design/art-direction.md` for the style.
- `design/art-bible.md` for palette + silhouette + animation rules.
- `assets/_refs/` for prior reference material.
- `games/<name>/.gamestack/taste.json` (if present from prior rounds) for learned preferences.

If any of these are missing, generate variants based on what's available but call the gap out.

### Step 3 — generate 4–6 distinct prompt variants

Each variant must vary on at least ONE dimension from the others. Possible axes of variation:

| Axis | Examples |
|---|---|
| **Time of day** | Dawn / mid-day / dusk / night |
| **Lighting** | Direct / diffuse / rim / silhouette / backlit |
| **Color emphasis** | Warm-dominant / cool-dominant / split-complementary / monochrome |
| **Composition** | Wide / medium / close / portrait / leading-line / centered |
| **Density** | Sparse / cluttered / negative-space / texture-heavy |
| **Subject scale** | Subject dominant / subject as detail / subject vs scale |
| **Stylization** | Painterly / hard-edged / pixelated / linework-emphasized |
| **Emotion** | Quiet / urgent / hopeful / ominous / curious |

Do NOT vary on multiple axes per variant. One axis at a time — that's the point of structured exploration. The developer needs to learn what they prefer per axis.

For each variant, produce:
```
VARIANT N — <axis varied>
  Prompt:       <complete, ready-to-paste prompt>
  Variation:    <which dimension this explores>
  Negative:     <what to avoid; pull from "intentional NOTs" in art bible>
  Reference:    <pointer to closest existing reference if relevant>
```

The prompt should incorporate the art bible's style statement and palette guidance verbatim. The variant axis is the only differentiator.

### Step 4 — present the comparison structure

Tell the developer:
1. Generate images from all 4–6 prompts using their tool of choice.
2. Save outputs to `games/<name>/assets/_refs/_shotgun/<subject>/round-N/`.
3. Open them side by side (Finder Cover Flow, a Figma board, or just an HTML grid).
4. Come back with feedback per variant.

Optionally produce a simple HTML grid scaffold (`round-N.html`) the developer can open locally to view all variants at once with comment boxes.

### Step 5 — capture feedback

When the developer returns with feedback, capture per-variant:

```
VARIANT N: <KEEP | DISCARD | MIX-IN>
  What worked:     <specific elements>
  What didn't:     <specific elements>
  Confidence:      <high | medium | low>
```

Also capture **cross-cutting preferences** that emerged:
- "Cool palette wins."
- "Backlit beats direct."
- "Center composition feels right for this subject."
- "Pixel-perfect over painterly."

### Step 6 — write taste log + generate next round

Append the round's findings to `games/<name>/.gamestack/taste-shotgun.md` (a human-readable log) and `games/<name>/.gamestack/taste.json` (machine-readable for future taste-update CLI use).

Then either:
- **Generate next round** with sharpened prompts that incorporate the learned preferences (variants now branch off the winner from this round, varying a different axis).
- **Finalize** if the developer has a clear winner. Note the chosen variant's prompt + output for posterity.

Default to one more round if no clear winner. Default to finalizing if the developer says "I love variant N."

### Step 7 — finalization handoff

When the developer locks a choice:
1. Save the final prompt + output to `games/<name>/assets/<subject>-final.png` (or wherever the asset belongs).
2. Update `design/art-bible.md` with a note referencing this exploration's outcome if the choice teaches the bible something new.
3. Surface taste preferences for future rounds: append to `taste.json` so the next `/art-shotgun` invocation starts from these defaults.

## Output format

Per round:

```
ROUND N — SUBJECT: <subject>

VARIANTS
  V1 — <axis>:  <one-line description>
                <prompt>
  V2 — <axis>:  <one-line description>
                <prompt>
  ...

COMPARISON SETUP
  Save outputs to: <path>
  Open as:         <suggested view>
  Come back with:  per-variant feedback (Keep/Discard/Mix-In, what worked, what didn't)

[After feedback]

LEARNED PREFERENCES
  - <preference 1>
  - ...

NEXT ROUND PROMPTS (if iterating)
  V1' — <axis>:   <sharpened prompt>
  ...

OR

FINAL CHOICE
  Winner:    Variant <N>
  Saved to:  <path>
  Bible update: <yes — append note | no — within existing direction>
```

## What NOT to do

- **Don't vary multiple axes per variant.** The point is learning one preference at a time. Multi-axis variation produces 6 different vibes that teach the developer nothing.
- **Don't generate images yourself.** This skill prompts and structures; the developer runs whatever generator they prefer. (Future: gamestack-taste-update CLI may integrate generators automatically.)
- **Don't run more than 3 rounds without a winner.** If round 3 doesn't converge, the subject definition was wrong — go back to Step 1.
- **Don't ignore the art bible.** Variants outside the bible's palette / style / silhouette rules are not exploration, they're drift. If the developer wants to break the bible, that's a `/plan-art-direction` re-open, not an art-shotgun round.
- **Don't generate prompts containing "in the style of [living artist name]"** — bad form and gets the output into licensing-grey territory.

## Handoff

After art-shotgun:
- `/scene-prototype` — once a final asset is chosen, scaffold it into the engine.
- `/art-bible` — if exploration revealed a new visual rule worth codifying.
- [`gamestack-taste-update`](../../bin/impl/taste-update/README.md) CLI — pipe each round's approvals as a JSON event into the CLI; it appends to `.gamestack/taste.json`, applies optional time-decay, and surfaces emerging signals the next round should incorporate.

## Notes for integration

[`gamestack-taste-update`](../../bin/impl/taste-update/README.md) ships as the persistent layer for this skill. Recommended flow:
1. After each round, write the per-variant outcomes to a JSON event file.
2. Run `gamestack-taste-update --record events.ndjson` from the project root.
3. Inspect the surfaced signals: a leading value (e.g. `lighting: 'backlit'`) appears once it has ≥4 samples and ≥70% win rate.
4. The next round's prompts pre-seed those signals before varying the remaining axes.
5. Periodically run `--decay --halflife-days 90` so old rounds don't pin the taste profile to outdated preferences.
