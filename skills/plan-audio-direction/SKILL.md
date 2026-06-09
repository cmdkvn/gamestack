---
name: plan-audio-direction
description: Audio Director skill — pressure-tests the audio plan for SFX taxonomy completeness, adaptive music structure, mix priority, diegetic/non-diegetic policy, accessibility, and tooling choice. Surfaces audio that hasn't earned its place. Use when audio direction is documented but no implemented audio pipeline exists yet.
---

# plan-audio-direction

This skill pressure-tests the audio plan across composition, sound design, mix priority, and accessibility — locks decisions that can't be deferred, and makes sure the audio is doing real work for the game. The failure mode it scans for: indie games spending months on visual polish and shipping with afterthought audio that undercuts everything else.

## When to fire

Use when an audio direction document exists but the actual audio pipeline (FMOD/Wwise/engine-native) hasn't been set up. Trigger phrases:
- "Review the audio plan"
- "Is the audio direction right?"
- "Plan audio direction"
- "Audio direction review"
- `/plan-audio-direction`

If no audio plan exists at all, redirect to `/design-jam` or `/art-bible` (M1, which covers audio bible too for now). If audio is already in production, use `/audio-review` (post-M2) once available.

## The lens

Audio carries about half of game feel. Indie games shipping with "we'll add audio at the end" universally feel half-finished. This skill ensures the plan locks the things that can't be added late:
1. **SFX taxonomy** (you can't add categories after writing thousands of SFX).
2. **Music structure** (adaptive layering decisions affect the entire composition pipeline).
3. **Mix priority** (without a priority policy, every sound competes and the player misses important cues).
4. **Tooling choice** (FMOD vs Wwise vs engine-native locks in workflow).
5. **Accessibility** (subtitles + closed captions + per-bus volume sliders are non-negotiable).

## Process

### Step 1 — read the plan

Find `design/audio-direction.md`. Read it end to end.

### Step 2 — SFX taxonomy completeness

The plan should categorize SFX into at least:

| Category | Examples | Style notes expected |
|---|---|---|
| UI | Click, confirm, deny, error | Dry, no reverb |
| Player | Step, jump, hit, hurt, ability | Material-aware (wood/stone/water) |
| World | Door, switch, pickup, ambient | Spatialized; ambient layered |
| Notifications | Pickup, save, level-up, alert | Distinct chord, never overlap |
| Diegetic music | Speakers, radios, in-world instruments | Sourced in space |
| Voice / dialogue | Speech, grunts, exclamations | Pre-recorded vs procedural? |

For each missing category, surface it. For each present category, check the **style notes** are specific enough to brief a sound designer.

### Step 3 — music structure

Ask:
- **Static loops** or **adaptive**?
- If adaptive: **layered stems**, **vertical re-orchestration**, **tension-state machine**, or **horizontal cues**?
- How many states? What triggers them?
- Who's the composer? Where do source files live?

If the plan says "we'll figure it out," push back. Music structure determines composition. A composer brought in late can't retrofit a horizontal-cue system if everything was written as 4-minute loops.

### Step 4 — mix priority

When everything fires at once, what ducks under what? Propose the policy if the plan doesn't have one:

1. **Player feedback always wins** (player damage, ability cast, key pickup).
2. **Voice / dialogue** ducks ambient and music.
3. **Notifications** duck briefly, then resume.
4. **Music** has dedicated bus and lower headroom than SFX.
5. **Ambient** sits at -20 dBFS or below.

If the plan doesn't have a mix priority, you can't build the mixer state — flag it as a top finding.

### Step 5 — tooling

- **FMOD** (free up to a revenue threshold; industry standard; strong adaptive music tooling).
- **Wwise** (similar; free up to a smaller revenue threshold; strong spatial audio).
- **Engine-native** (Unity Audio Mixer, Godot AudioBus, Unreal Sound Cues): adequate for simple needs; struggles with complex adaptive music.

If the plan has adaptive music + procedural audio + spatial audio aspirations but stays engine-native, push back. Tooling choice changes the budget.

### Step 6 — loudness targets

| Track | Target |
|---|---|
| Master | -14 LUFS integrated (matches platform loudness norms) |
| Music | -18 LUFS integrated (headroom for SFX) |
| Dialogue | -16 LUFS dialogue intelligibility window |
| SFX | Peak -6 dBTP |

If the plan has no loudness targets, the final mix will have a "mastering pass" that breaks every intentional balance. Surface it.

### Step 7 — diegetic vs non-diegetic policy

When does music exist in the world (a radio plays it) vs. only in the player's headspace? Without a policy, designers and composers each invent their own and the audio identity fractures.

### Step 8 — accessibility

The plan must include:
- **Subtitles default ON.**
- **Closed captions** for non-dialogue audio cues (footsteps, environmental).
- **Music / SFX / Voice independent volume sliders.**
- **Mono-output option** for hearing-loss accommodation.
- **Visual representation** of audio cues (icon indicators for off-screen sound, etc.) for the hearing-impaired.

Flag any missing accessibility items as top findings.

## Inputs and outputs

**Reads:** `design/audio-direction.md` — schema: see [`docs/templates/audio-direction.md`](../../docs/templates/audio-direction.md).

**Review output:** writes to `design/reviews/plan-audio-direction.md`. Schema will be canonicalized in `docs/templates/plan-review.md` (Task 9 of this batch); inline format below remains active until then.

Review format (inline pending Task 9 — `docs/templates/plan-review.md`):

```
SFX TAXONOMY
  Categories present: <list>
  Missing: <list>
  Style-note specificity per category: <pass | needs detail>

MUSIC STRUCTURE
  Stated: <model>
  Composer: <named | open>
  Adaptive system: <yes | no>
  Concerns:

MIX PRIORITY
  Policy stated: <yes | NO — propose default>
  Recommended policy: <list>

TOOLING
  Choice: <FMOD | Wwise | engine-native | undecided>
  Fit with plan: <good | mismatch>

LOUDNESS TARGETS
  Stated: <yes | NO — propose defaults>

DIEGETIC POLICY
  Stated: <yes | NO — propose policy>

ACCESSIBILITY CHECKLIST
  - Subtitles default ON:           <pass | fail>
  - Closed captions:                <pass | fail>
  - Independent bus sliders:        <pass | fail>
  - Mono-output option:             <pass | fail>
  - Visual cues for off-screen audio: <pass | fail>

TOP 3 AUDIO RISKS
  1.
  2.
  3.

DESIGN DOC EDITS
  <Specific edits to audio-direction.md>
```

Offer to apply edits.

## What NOT to do

- **Don't write SFX or compose music.** You're locking the plan, not producing assets.
- **Don't propose a different musical style.** Style is the developer's choice. Locking the *structure* and *policy* is yours.
- **Don't ignore accessibility.** Subtitles default ON is non-negotiable per studio policy and most platform cert requirements (Xbox specifically).
- **Don't accept "we'll mix at the end."** A mix priority and loudness targets are plan-stage decisions.

## Handoff

After plan-audio-direction:
- `/plan-narrative` — to align music states with narrative beats.
- `/plan-tech-design` — to lock audio middleware integration.
- `/audio-review` (post-M2) — once audio is in production, audit against the plan.
- `/autoplan` — full multi-discipline review.
