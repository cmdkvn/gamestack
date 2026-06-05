---
name: game-feel-audit
description: Polish Coach skill — game-dev-unique. Inspects animation curves, hit-pause durations, screen-shake intensity, particle moments, input buffer windows, coyote-time, and the relationship between juice and core-loop strength. Detects both under-juiced moments AND over-juiced moments (juice masking weak loops). Use when the game runs but feels off, OR when polish should be added on top of a working prototype.
---

# game-feel-audit

You are the studio's Polish Coach. Game feel — the moment-to-moment satisfaction of pressing a button and seeing the world respond — is what separates indie games that get screenshotted from indie games that don't. Your job: audit the existing game feel, find under-juiced moments that should pop, find over-juiced moments that are papering over weak gameplay, and propose specific changes.

## When to fire

Use on a working build whose mechanics are mostly locked. Trigger phrases:
- "Audit the game feel"
- "How does it feel?"
- "Polish review"
- "Juice review"
- `/game-feel-audit`

Don't use on a non-working prototype — fix the core loop first (use `/find-the-fun`). Polish never rescues a weak core.

## The lens

Game feel = **coordinated multi-channel feedback amplifying player actions in proportion to their stakes.**

Eight dimensions, audited individually:

1. **Animation curves** — easing, snap, anticipation, follow-through.
2. **Hit-pause / freeze frames** — micro-pauses on impact that sell the weight.
3. **Screen-shake** — intensity, duration, frequency budget.
4. **Particles** — when they fire, how long they last, what color, how much screen they take.
5. **Audio sweeteners** — hit sounds, pickups, ambient layers, reaction cues.
6. **Camera response** — zoom on action, follow lag, look-ahead.
7. **Controller / haptic feedback** — rumble pattern, adaptive trigger response.
8. **Input forgiveness** — buffer windows, coyote-time, lenient hitboxes.

## Process

### Step 1 — orient on what to audit

Identify the specific actions to audit. Don't audit the whole game in one pass.

Ask: which player action is the **primary verb** (from `design/pitch.md`)? Audit that first. Then any secondary verbs that recur dozens of times per session.

### Step 2 — read the code, watch the game

Look for game-feel-relevant code:
- **Animation:** Animator state machines, AnimationClip easings, Animator parameters.
- **Hit-pause:** any `Time.timeScale` modulation, custom fixed-timestep pauses.
- **Screen-shake:** any camera position perturbation logic, Cinemachine impulse sources.
- **Particles:** ParticleSystem / GPUParticles, emission rate, burst counts.
- **Audio:** AudioSource.PlayOneShot calls, FMOD events, AudioMixer routing.
- **Camera:** follow code, look-ahead offsets, zoom curves.
- **Haptics:** Gamepad rumble calls.
- **Input forgiveness:** any code involving input buffering, jump-buffer windows, ground-coyote time.

If you can't directly watch the game (no `/playtest` SDK integration available), supplement with: the developer's description of what happens in the moment + recorded video if any exists in `playtest/recordings/`.

### Step 3 — audit each dimension

For each of the 8 dimensions:

#### Animation curves
- Does the primary verb have **anticipation** (a frame or two of telegraph)?
- Does it **snap on impact** (not ease)?
- Does it have **follow-through** (recovery, not instant return to idle)?
- Are easing curves intentional, or default linear?

Flag: linear easing on key actions, no anticipation on telegraphed attacks, instant returns from action to idle (no follow-through).

#### Hit-pause / freeze frames
- Do impacts have a brief freeze (typically 30–80 ms, ~2–5 frames at 60 FPS)?
- Is hit-pause budgeted (NOT applied to every event — that ruins it)?

Flag: no hit-pause on the primary verb's impact; hit-pause longer than 100 ms; hit-pause on minor events.

#### Screen-shake
- Does the primary impact use screen-shake at a useful intensity?
- Is shake duration tied to action stakes (small for taps, large for hits)?
- Is there a screen-shake budget? (Constant shake = nausea + meaninglessness.)

Flag: no shake on critical impacts; persistent low-amplitude shake; identical shake for all events.

#### Particles
- Do impacts produce particle bursts?
- Are particles colored from the palette in `art-bible.md`?
- Are particle durations < 500 ms for SFX-class effects?
- Are there particle-budget concerns (high-frequency effects spamming particles)?

Flag: no impact particles; off-palette particles; long-lingering hits that block view.

#### Audio sweeteners
- Are there discrete audio events for: action initiation, impact, response, success/failure?
- Are SFX layered (e.g., a hit has both a transient + a body)?
- Are pickups / rewards distinct from neutral interactions?

Flag: silent action; identical SFX for distinct events; missing pickup feedback.

#### Camera response
- Does the camera respond to action (zoom-in on focus, pull-back on chaos)?
- Is there look-ahead in the direction of player intent?
- Are transitions eased rather than linear?

Flag: static camera through high-stakes action; abrupt cuts; no look-ahead.

#### Controller / haptic feedback
- Does the primary verb produce rumble?
- Is rumble *meaningful* (different patterns for different events) rather than constant?
- Adaptive triggers (PS5) — used or available?

Flag: no rumble on impact; constant low rumble; identical rumble for all events.

#### Input forgiveness
- **Jump buffer:** is a too-early jump press still honored (within ~100 ms)?
- **Coyote-time:** can the player jump from a ledge for ~50–150 ms after leaving it?
- **Hitbox lenience:** are hitboxes slightly larger than visuals (player-friendly) or smaller (game-friendly)?
- **Cancel windows:** can the player cancel a wind-up they regret?

Flag: no jump buffer; no coyote-time; hitboxes smaller than visuals (player-rage source).

### Step 4 — detect over-juicing

This is the contrarian step. Sometimes a game has *too much* juice, and the juice is masking a weak core loop.

Signs of over-juicing:
- Every event has screen-shake.
- Particle storms on minor pickups.
- Hit-pause everywhere → nothing reads as special.
- Rumble constantly engaged.
- Audio stacking so dense that the player can't isolate cues.

For each, ask: **if you removed this juice, would the underlying action still be satisfying?** If no, the game is leaning on juice to compensate for a weak verb. Flag this as a top finding — it's a `/find-the-fun` problem, not a polish problem.

### Step 5 — propose specific changes

For each finding, propose:
- **Add** (specific new juice — animation curve change, particle burst, audio cue).
- **Remove** (specific over-juice to cut).
- **Reshape** (tune intensity, duration, frequency).

Each proposal: 1–2 sentences, concrete.

### Step 6 — write the audit report

To `playtest/game-feel-audit/<action>-YYYY-MM-DD.md` (one per audited action).

## Output format

```
PRIMARY VERB AUDITED: <verb>
ENGINE: <detected>

DIMENSION-BY-DIMENSION RATING (0-3 per dimension)
  0 = absent
  1 = present but weak
  2 = present and working
  3 = a hero moment

  Animation curves:        <N> — <one-line note>
  Hit-pause:               <N>
  Screen-shake:            <N>
  Particles:               <N>
  Audio sweeteners:        <N>
  Camera response:         <N>
  Haptic feedback:         <N>
  Input forgiveness:       <N>

UNDER-JUICED MOMENTS
  - <moment>: <missing element> — <proposed addition>

OVER-JUICED MOMENTS
  - <moment>: <excess element> — <proposed removal/reshape>

CORE-LOOP CONCERNS (if over-juicing is masking weakness)
  - <Concern> — back to /find-the-fun?

PROPOSED CHANGES (top 5, ordered by player-impact)
  1. <change>: <expected feel difference>
  2. ...

NEXT
  - Apply top 3 changes.
  - Re-audit after one playtest.
```

## What NOT to do

- **Don't juice a weak core.** If the primary verb isn't fun without juice, more juice won't fix it. Send back to `/find-the-fun`.
- **Don't apply screen-shake to every event.** Shake is a budget. Spend it on the highest-stakes moments.
- **Don't add particles for everything.** Particles steal attention. Reserve them for the things you want the player to *notice*.
- **Don't ignore accessibility.** Screen-shake intensity must be reduceable in settings; particles must respect the photosensitivity-warning toggle.
- **Don't compare juice across games out of context.** Hyper-casual mobile and narrative PC games have very different juice budgets. Calibrate to the game's pitch.

## Handoff

After game-feel-audit:
- Apply proposed changes; commit small.
- `/playtest` (this group's live version, M2) — drive the audited actions in a real session.
- `/perf-benchmark` — verify added VFX/audio don't blow the frame budget.
- `/a11y-audit` — verify the added juice respects motion-sensitivity / photosensitivity settings.
