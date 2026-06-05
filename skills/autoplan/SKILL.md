---
name: autoplan
description: Review pipeline skill — runs Creative Director → Game Design → Narrative → Level → Art → Audio → Tech in order, automatically. Auto-detects which disciplines apply, skips the inapplicable, applies obvious edits, and surfaces only taste decisions and high-priority risks for human approval. Use when you have a complete-ish design doc set and want one comprehensive review pass.
---

# autoplan

You are the review pipeline. The developer has a design doc set and wants a comprehensive multi-discipline review without invoking each `plan-*` skill manually. Your job: detect which disciplines apply, run each in order, apply obvious edits directly, and surface only the taste decisions and the top-tier risks. The developer's attention is the scarcest resource.

## When to fire

Use when there's a substantial design package and the developer wants a full review pass. Trigger phrases:
- "Run autoplan"
- "Review the whole plan"
- "Full plan review"
- "Multi-discipline review"
- `/autoplan`

If only a single discipline matters (e.g., the developer just rewrote the narrative plan), use the specific `plan-*` skill directly.

## The pipeline

In this order:
1. **`/plan-creative-director`** — picks a mode (Scope-Up / Selective Expansion / Hold Scope / Reduction) and produces a top-level critique.
2. **`/plan-game-design`** — locks the core loop, plots the skill curve, kills dead mechanics.
3. **`/plan-narrative`** (if narrative content exists) — voice cards, exposition pacing, branching, localization.
4. **`/plan-level-design`** (if level structure exists) — tension graph, navigation, gating.
5. **`/plan-art-direction`** — 0–10 ratings across 8 dimensions, AI-slop scan.
6. **`/plan-audio-direction`** — SFX taxonomy, music structure, mix priority, accessibility.
7. **`/plan-tech-design`** — engine, state machines, data flow, frame budget, save format.

## Process

### Step 1 — detect applicable disciplines

Read the design doc set (typically `games/<name>/design/` or the project's `design/` directory). Detect:

| Discipline | Skip if… |
|---|---|
| Creative Director | never skip — always run first |
| Game Design | never skip |
| Narrative | game has no story/character/dialog (pure mechanical sandbox) |
| Level Design | game has no spatial or temporal level structure (pure menu / abstract play) |
| Art Direction | never skip |
| Audio Direction | never skip |
| Tech Design | never skip |

Announce the planned pipeline at the start. If you're skipping a discipline, say why.

### Step 2 — run each plan skill in order

For each applicable discipline:
- Follow that skill's process.
- Collect the findings.
- Identify **auto-fixes** (clearly correct edits with no taste judgment): apply directly.
- Identify **taste decisions** (judgment calls the developer needs to make): hold for the final report.
- Identify **risks** (things that may bite later but don't need an immediate edit): tag and hold.

### Step 3 — cross-discipline reconciliation

After all disciplines have run, check for conflicts:
- Does narrative pacing match level pacing?
- Do audio music states match emotional beats?
- Does art direction asset budget match tech design's per-platform constraints?
- Does game design's skill curve match level design's tension graph?

For any conflict, propose a resolution. Surface unresolved conflicts as their own section.

### Step 4 — synthesize for the developer

The output is a short, dense report. The developer should be able to read it in 10 minutes and decide on every surfaced decision.

## Output format

```
PIPELINE
  Ran: <list>
  Skipped: <list, with reason>

CREATIVE DIRECTION
  Mode: <Scope-Up | Selective Expansion | Hold Scope | Reduction>
  Top critique: <one paragraph>

PER-DISCIPLINE SUMMARIES (one paragraph each, with link to full report)
  Game design:    <key finding>
  Narrative:      <key finding>
  Level design:   <key finding>
  Art direction:  <key finding + worst rating>
  Audio:          <key finding>
  Tech design:    <key finding>

CROSS-DISCIPLINE CONFLICTS
  - <conflict 1>: <proposed resolution>
  - ...

AUTO-FIXES APPLIED
  <Count by discipline, with one-line summary of each>

TASTE DECISIONS — needs your call
  1. <decision 1>: <option A> / <option B> — pick or hold scope?
  2. ...

TOP 5 RISKS (prioritized)
  1. <risk> — <discipline> — <mitigation>
  2. ...

NEXT STEPS
  <The 1–3 things to do before implementation begins>
```

The "Taste Decisions" section is the heart of the output — the developer should focus their attention there. Auto-fixes are FYI.

### Per-discipline detailed reports

Save each plan-* skill's detailed report to a separate file under `design/reviews/`:
- `design/reviews/plan-creative-director-YYYY-MM-DD.md`
- `design/reviews/plan-game-design-YYYY-MM-DD.md`
- ...etc.

The autoplan summary in the chat references each file. The developer can read deep on any one if they want.

## Encoded principles (the autopilot guardrails)

These are baked into the pipeline. They auto-apply without asking unless they conflict with explicit developer choices:

1. **Accessibility basic-tier is non-negotiable.** If `plan-audio-direction` or other skills find missing accessibility items, apply the defaults from [`docs/ACCESSIBILITY.md`](../../docs/ACCESSIBILITY.md) (GAG basic-tier + Top-4: remap, text scale, colorblind, subtitles).
2. **Save format must have a version field and atomic writes.** Auto-add to tech-design if missing.
3. **`.meta` files (Unity) are committed, never gitignored.** If found in `.gitignore`, propose removal as a top-priority finding.
4. **Externalize strings from day one.** If localization tooling is unspecified, propose engine-default and surface as a quick decision.
5. **Subtitles default ON.** If absent from audio-direction, add.
6. **Per-platform frame budget targets must be stated.** Default to: 60 FPS PC, 30 FPS Switch handheld, 60 FPS Series X / PS5, 60 FPS mid-range mobile.

If the developer has explicitly overridden one of these in a "Supersedes studio rule about X" line in their CLAUDE.md, respect it and don't apply.

## What NOT to do

- **Don't surface every finding.** The developer can't process 80 findings. Apply auto-fixes, then surface only the 5–10 that need a decision.
- **Don't skip a discipline because "it's mostly fine."** Skip only when the discipline genuinely doesn't apply.
- **Don't run two reviews in parallel mid-pipeline.** Sequential, in the prescribed order, so cross-discipline reconciliation has all the data.
- **Don't write to design docs without permission** when applying anything other than auto-fixes. Auto-fixes are pre-approved by the encoded principles above; everything else surfaces first.
- **Don't be encouraging.** This is a review, not a pep talk.

## Handoff

After autoplan:
- If results are mostly green and the few taste decisions are settled: implementation can begin.
- If multiple disciplines surface major risks: rerun the affected `plan-*` skills individually after addressing them, then `/autoplan` again to confirm.
- The per-discipline reports under `design/reviews/` are durable references — they should be cited in commits and PRs that affect their domain.
