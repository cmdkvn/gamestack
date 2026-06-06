---
name: critique
description: Critique-phase rubric that audits a working build through one of six lenses. Use `/critique --lens=<fun|onboarding|feel|pacing|a11y|perf>` to pick the rubric. `fun` = is the kernel of fun present, what's dead? `onboarding` = time-to-first-verb / decision / reward / failure / "I get it" against retention benchmarks. `feel` = animation curves, hit-pause, screen-shake, particles, input forgiveness. `pacing` = tension graph from level / encounter / narrative data. `a11y` = Game Accessibility Guidelines top-4 + basic + intermediate tiers. `perf` = FPS, frame-time percentiles, draw calls, GC, memory, scene-load. Use when you have a working build and want to audit it.
---

# critique

A working build exists. This skill applies one of six rubrics to it, surfaces specific findings, and recommends what to change. Each rubric is a different lens — the same build, examined for a different failure mode.

## When to fire

Trigger phrases per lens:

- `--lens=fun` — "Is my prototype fun?", "What should I focus on next?", "Help me figure out what to cut", `/critique --lens=fun`.
- `--lens=onboarding` — "Audit the onboarding", "First 60 seconds review", "How long until the game is fun?", `/critique --lens=onboarding`.
- `--lens=feel` — "Audit the game feel", "How does it feel?", "Polish review", "Juice review", `/critique --lens=feel`.
- `--lens=pacing` — "Pacing review", "Is the pacing right?", "Audit the tension curve", "Why does hour 3 feel flat?", `/critique --lens=pacing`.
- `--lens=a11y` — "Accessibility audit", "GAG check", "a11y review", `/critique --lens=a11y`.
- `--lens=perf` — "Perf snapshot", "Benchmark this", "Did my change regress perf?", `/critique --lens=perf`.

If the developer asks "is my game good?" without specifying a lens, ask which kind of "good" — they're different audits.

## Process

The shared process across every lens:

1. **Read state** — load `gamestack/state.json` per [`_state-conventions.md`](../_state-conventions.md). If absent, redirect to `/gamestack`.
2. **Phase-gate the lens.** `--lens=feel` on `phase: prototype` should redirect to `--lens=fun` first. `--lens=a11y` and `--lens=perf` calibrate against `project.platforms` (Switch / Xbox change the bar).
3. **Run the lens rubric** (per-lens sections below).
4. **Write the report** to `playtest/critique-<lens>-<scope>-YYYY-MM-DD.md`.
5. **Append to `recent_runs`** with `lens: "<lens>"` and the artifact path written.

The lens-specific steps live in the six "`--lens=<x>`" sections further down.

## Output format

Each lens writes its own per-step report. See each lens section below for the exact output template. The shared shape across all lenses:

```
SCOPE / SCENARIO: <what was audited>
PROJECT PHASE:    <phase>

<lens-specific metrics block>

TOP <K> FINDINGS (ordered by player-impact)
  1. <finding>: <recommendation>
  ...

NEXT
  - <Apply top edits. Re-run the same lens. Or pivot to a different lens.>
```

Always write the report file. Always update `recent_runs`. The chat summary is a digest; the file is the artifact.

## Lens routing

Read the `--lens=` flag. If absent, ask which lens the developer wants, listing the six options below with one-line summaries:

| `--lens` | What it audits | Phase fit |
|---|---|---|
| `fun` | Is the kernel of fun here? What mechanics are dead? | Prototype / Vertical Slice |
| `onboarding` | Does the first 60 seconds / 15 minutes work? | Vertical Slice / Polish / pre-launch |
| `feel` | Is the moment-to-moment satisfaction in proportion to stakes? | Polish |
| `pacing` | Does the tension curve rise and fall, or sit flat? | Vertical Slice / Production |
| `a11y` | Does the game meet the Game Accessibility Guidelines? | Pre-launch / cert / patch |
| `perf` | Is the frame budget being spent well? | Any phase with a build |

If the developer asks "is my game good?" without specifying a lens, ask which kind of "good" — they're different audits.

## On entry (shared)

Read `gamestack/state.json` per [`_state-conventions.md`](../_state-conventions.md). If absent, redirect to `/gamestack`.

From the state file, read:
- `project.phase` — used to gate lenses that don't fit. E.g. `--lens=feel` on `phase: prototype` should redirect to `--lens=fun` first.
- `project.engine` and `project.platforms` — relevant for `--lens=perf` and `--lens=a11y` (Xbox cert tightens a11y; iOS adds VoiceOver / Dynamic Type / Reduce Motion to the audit; iOS perf adds thermal state, MetricKit, and energy log).
- `artifacts.pitch` — needed for `--lens=fun` and `--lens=feel` (to know what the primary verb is).

If the prerequisite artifact for the chosen lens is missing, redirect to the producing skill.

---

## `--lens=fun` — kernel-of-fun critique

Use when the build is a prototype and the developer isn't sure whether the fun is there or what to do next. Polite encouragement that papers over a missing kernel wastes weeks of the developer's life. Don't be polite at the cost of being useful.

### Step 1 — gather signal

Ask the developer four questions, **one at a time**:

1. **"Describe one specific moment that felt good when you played it."** Concrete: a 5–10 second moment, not "the combat is fun."
2. **"Describe one specific moment that felt boring or wrong."** Same level of concreteness.
3. **"What playtester (if any) has played this, and what did they do with their hands and face?"** Hesitation, second-guessing, looking away, leaning in — that's the data, not their words afterwards.
4. **"How long have you been working on this prototype?"** Calibrates fatigue bias.

If they can't answer #1 at all — no specific working moment, anywhere — the kernel of fun is not yet present. Say so directly:

> "There's no working moment yet. I can't sharpen what isn't there. Two options: (a) build a smaller, dumber prototype around the one thing you most want the player to feel, or (b) go back to `/design-jam` and challenge whether the premise has a kernel at all."

### Step 2 — locate the kernel

If they have a working moment, walk through:
- **Action** — what is the player taking?
- **Feedback** — what is the player getting back (visual, audio, controller, narrative)?
- **Learning** — what is the player understanding about the game's rules in that moment?
- **Pull** — what does the player want to do next?

The kernel of fun is the smallest unit containing all four. Make sure the developer can articulate it before moving on.

### Step 3 — identify dead mechanics

A dead mechanic is one that:
- Is implemented in the prototype, AND
- Doesn't contribute to the kernel of fun, AND
- Hasn't generated any specific working moment the developer can point to.

Walk their feature list. For each: *"Has this generated a working moment? If not, is it on the way to one, or has it been there for weeks without payoff?"* Tag the dead ones. A prototype with three dead mechanics and one live one is **worse** than a prototype with only the live one.

### Step 4 — recommend three sharpening directions

- **A — Deepen the kernel.** Find five variations of the working moment. Build them. Playtest each. The point is to find the seams — when does it stop being fun?
- **B — Cut and rebuild.** Strip everything that isn't kernel-adjacent. Rebuild around just the kernel.
- **C — Add the missing minute.** Surround the kernel with the minute before (setup, anticipation) and the minute after (consequence, reward, transition).

Recommend one. Explain why in one paragraph. Name the specific kind of next playtester (e.g., "someone who's played Hollow Knight to completion" or "someone who has never played a roguelike").

### Output (`--lens=fun`)

```
KERNEL OF FUN
  Action:    <what the player does>
  Feedback:  <what they get back>
  Learning:  <what they understand>
  Pull:      <what they want next>

DEAD MECHANICS
  - <mechanic>: why it's dead

THREE DIRECTIONS
  A — Deepen:           <specific suggestion>
  B — Cut and rebuild:  <specific suggestion>
  C — Add the minute:   <specific suggestion>

RECOMMENDED:  <A | B | C>
WHY:          <one paragraph>
NEXT PLAYTESTER:  <specific person profile and brief>
```

Write to `playtest/critique-fun-YYYY-MM-DD.md` if a `playtest/` directory exists; otherwise print and tell the user where it should live.

---

## `--lens=onboarding` — first-60-seconds critique

Use before launch or a Next Fest demo. Steam's 2-hour refund window means onboarding determines half of refunds; demos that don't hook in 15 minutes don't get wishlists.

### The five critical times

| Moment | Target (most genres) |
|---|---|
| Time to first verb | < 10 seconds from "press start" |
| Time to first meaningful decision | < 30 seconds |
| Time to first reward | < 60 seconds |
| Time to first failure | 5–10 minutes |
| Time to "I get it" | 15 minutes |

Calibrate by genre — narrative slow-burn stretches; roguelike compresses.

### Steps

1. **Walk the new-player path** main menu → first button → opening → first controls → first loop → first reward / failure / choice → "I get it".
2. **Time each critical moment.** From a recording in `playtest/recordings/` or a careful walkthrough. Anything > 2× target is a critical finding.
3. **Count the friction points** — tutorial pop-ups, unskippable cutscenes, "press X" prompts, pre-game menus, pre-game modals. For each, is it justified, skippable, deferrable?
4. **Trailer ↔ first-30-seconds alignment.** If the actual first 30 seconds don't match the trailer / capsule promise, that's a launch-disappointment risk.
5. **Accessibility on-ramp.** Controller / keyboard auto-detection, subtitles default ON, tutorial skippable for replays, difficulty options before the first hard moment.
6. **iOS-specific first-launch patterns.** When the project targets iOS, audit these in addition to the cross-platform items:
   - **App Tracking Transparency (ATT) prompt placement.** The prompt should fire *after* the player has seen what the app does — typically 2–3 screens in, never on cold launch. Apps that prompt on first launch with no context get refused. The Guideline 5.1.2 rejection rate here is high; surface as P0 if the prompt fires before the first verb.
   - **Notification permission prompt timing.** Same discipline: don't prompt on cold launch. Prompt when the player just did something that implies they'd want a future notification (saving progress, scheduling a task). If the game never sends notifications, don't request the permission at all.
   - **Photo / camera / microphone permission timing.** Each prompt fires in-context, with a clear `Info.plist` description string the player can read in the system prompt. Pre-warning the player with a custom modal before the system prompt fires improves acceptance rate ~2x.
   - **App Store first-launch metrics.** The reviewer cold-launches the build. If the splash screen dwells > 2 s, or the first interactive frame takes > 3 s on a 3-year-old iPhone, flag as P1 — Guideline 4 rejections cite "slow launch" as a frequent reason.
   - **iCloud sync prompt timing.** If the game uses iCloud saves, the first-launch sync dialog should be deferred until after the player has completed onboarding — interrupting the first 60 seconds with "Resolve iCloud conflict?" is a refund-risk moment.
7. **Propose edits.** Each edit: what changes, expected effect, cost. Usual fixes — cut content before first verb; make cutscenes skippable / shorter; move "explain the controls" to hint overlay; add a one-line reward earlier; on iOS, move permission prompts past the first verb.

### Output (`--lens=onboarding`)

```
NEW-PLAYER PATH (step-by-step)
  1. <step>: <time>
  ...

CRITICAL TIMES
  First verb:           <time> (target: <X>) — <pass | fail>
  First decision:       <time> (target: <X>) — <pass | fail>
  First reward:         <time> (target: <X>) — <pass | fail>
  First failure:        <time> (target: <X>) — <pass | fail>
  "I get it":           <time> (target: <X>) — <pass | fail>

FRICTION COUNT
  Tutorial pop-ups:        <count>
  Unskippable cutscenes:   <count>
  "Press X" prompts:       <count>
  Pre-game menus:          <count>
  Pre-game modals:         <count>

TRAILER ↔ FIRST 30 SECONDS ALIGNMENT
  <Match | Mismatch on X>

ACCESSIBILITY ON-RAMP
  - Controller detection:    <pass | fail>
  - Subtitles default:       <ON | OFF>
  - Skippable tutorial:      <yes | no>
  - Pre-difficulty surfaced: <yes | no>

TOP 5 ONBOARDING EDITS (ordered by retention impact)
  1. <edit>: <expected effect>
  ...
```

Write to `playtest/critique-onboarding-YYYY-MM-DD.md`.

---

## `--lens=feel` — game-feel critique

Use on a working build whose mechanics are mostly locked. Don't use on a non-working prototype — fix the core loop first (`--lens=fun`). Polish never rescues a weak core.

Game feel = coordinated multi-channel feedback amplifying player actions in proportion to their stakes.

### The eight dimensions

1. **Animation curves** — easing, snap, anticipation, follow-through.
2. **Hit-pause / freeze frames** — micro-pauses on impact that sell the weight (~30–80 ms / 2–5 frames at 60 FPS).
3. **Screen-shake** — intensity, duration, frequency budget.
4. **Particles** — when they fire, how long, what color, how much screen they take.
5. **Audio sweeteners** — hit sounds, pickups, ambient layers, reaction cues.
6. **Camera response** — zoom on action, follow lag, look-ahead.
7. **Controller / haptic feedback** — rumble pattern, adaptive trigger response.
8. **Input forgiveness** — buffer windows, coyote-time, lenient hitboxes.

### Steps

1. **Orient on the primary verb** from `design/pitch.md`. Audit that first; then secondary verbs that recur dozens of times per session.
2. **Read the code, watch the game.** Look for Animator states, `Time.timeScale` modulation, screen-shake / Cinemachine impulse, ParticleSystem emission, `AudioSource.PlayOneShot` / FMOD events, camera follow code, haptic calls, input-buffer logic.
3. **Audit each dimension.** Rate 0–3 (0 absent / 1 weak / 2 working / 3 hero moment) and note specifics.
4. **Detect over-juicing.** Every event has shake? Particle storms on minor pickups? Hit-pause everywhere? For each: would the underlying action still be satisfying if you removed the juice? If no, surface as a `--lens=fun` problem — the game is leaning on juice to compensate for a weak verb.
5. **Propose specific changes.** Add (new juice), Remove (over-juice), Reshape (intensity / duration / frequency). Each proposal: 1–2 sentences, concrete.

### Output (`--lens=feel`)

```
PRIMARY VERB AUDITED: <verb>
ENGINE: <detected>

DIMENSION-BY-DIMENSION RATING (0–3)
  Animation curves:        <N> — <one-line note>
  Hit-pause:               <N>
  Screen-shake:            <N>
  Particles:               <N>
  Audio sweeteners:        <N>
  Camera response:         <N>
  Haptic feedback:         <N>
  Input forgiveness:       <N>

UNDER-JUICED MOMENTS
  - <moment>: <missing> — <proposed addition>

OVER-JUICED MOMENTS
  - <moment>: <excess> — <proposed removal/reshape>

CORE-LOOP CONCERNS (if over-juicing is masking weakness)
  - <Concern> — back to /critique --lens=fun?

PROPOSED CHANGES (top 5, ordered by player-impact)
  1. <change>: <expected feel difference>
```

Write to `playtest/critique-feel-<verb>-YYYY-MM-DD.md`.

---

## `--lens=pacing` — tension-graph critique

Use on a build that has implemented content beyond the prototype stage. For plan-stage tension graphs, use `/plan-level-design` instead.

Tension is shaped by three independent variables that should rise and fall on different cycles:

- **Skill demand** — how hard is the gameplay execution?
- **Stakes** — how high are the consequences of failure?
- **Density** — how much is going on per minute (enemies, narrative, environmental detail)?

When all three move together, you get either constant low-tension boredom or constant high-tension exhaustion. When they oscillate independently, you get pacing.

### Steps

1. **Locate content data** — level scenes, encounter tables, narrative-beat triggers, difficulty configs. If only in someone's head, that's a finding.
2. **Segment the playtime** into beats of 5–10 minutes expected play.
3. **Score each beat 0–5** on Skill demand / Stakes / Density.
4. **Graph the three lines** in ASCII (Unicode block heights are fine):

   ```
   Skill   ▁▁▂▂▃▄▄▃▃▅▆▅▄▃▂▂▁▁ ...
   Stakes  ▁▁▁▂▂▂▃▃▃▄▄▄▅▅▅▄▄▄ ...
   Density ▂▂▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃ ...
   ```

5. **Detect failure patterns:**
   - **Monotony zones** — 3+ consecutive flat beats.
   - **Spike clusters** — 3+ consecutive peaked beats.
   - **Hollow middles** — middle third has lower means than opening + ending.
   - **Fatigue compound** — density rising for 5+ consecutive beats.
   - **Narrative misalignment** — narrative high points during high-skill-demand beats, or rest-beat narrative during high-stakes gameplay.
6. **Propose edits.** Each one: which beat range, expected effect, cost. Often the right fix is *cutting* a flat zone, not extending it.

### Output (`--lens=pacing`)

```
SCOPE: <full game | chapter X | hours 0–3>
TOTAL BEATS AUDITED: <N>

TENSION GRAPH (ASCII)
  <three-line graph>

MEAN VARIABLES
  Skill demand:  <mean / std-dev>
  Stakes:        <mean / std-dev>
  Density:       <mean / std-dev>

FINDINGS
  Monotony zones:    <ranges + recommendations>
  Spike clusters:    <ranges>
  Hollow middle:     <range>
  Fatigue compound:  <range>
  Narrative misalign: <beats>

TOP 5 PACING EDITS (ordered by impact-to-cost)
  1. <edit>: <effect>
```

Write to `playtest/critique-pacing-YYYY-MM-DD.md`.

---

## `--lens=a11y` — Game Accessibility Guidelines audit

Use before launch, before every shipped patch, and during cert prep. Xbox has the strictest a11y cert of the three consoles.

### Top 4 (non-negotiable)

1. **Remappable controls** — keyboard + every supported controller.
2. **Adjustable text size** — minimum 1.5× scaling without UI breakage.
3. **Colorblind modes** — Deuteranopia, Protanopia, Tritanopia presets; high-contrast mode.
4. **Subtitles + closed captions** — toggleable, speaker labels, background opacity, non-dialogue audio cue captions.

### Basic tier (everyone ships this)

- No flicker > 3 Hz / > 3 high-contrast flashes within 1 s.
- No essential info conveyed by color alone.
- Controls as simple as possible — no required chords / QTEs without alternative.
- Game can be paused.
- Clear introduction to controls.
- Subtitle / CC toggle within 2 menu clicks.
- Independent volume sliders (Music / SFX / Voice).
- Visual representation of all important audio.

### Intermediate tier (aim for this)

- Difficulty options OR assist mode.
- Skippable + re-watchable cutscenes.
- Save-anywhere or autosave; never lose > 5 minutes of progress.
- Visual cues for off-screen audio.
- Mono-output option.
- Hold-to-press alternative for any rapid-tap mechanic.
- Larger hit targets for menus / interactables.

### iOS-specific a11y (when shipping to App Store)

iOS exposes accessibility APIs the OS owns; the game has to opt in to them or it ships inaccessible to a large slice of the iOS user base.

- **VoiceOver labels.** Every interactive UI element needs `accessibilityLabel`, `accessibilityHint` (where the action isn't obvious), and `accessibilityTraits` (`.button`, `.image`, `.staticText`, etc.) set. Decorative elements use `accessibilityElementsHidden = true`. SwiftUI: `.accessibilityLabel(_:)`, `.accessibilityHint(_:)`, `.accessibilityHidden(_:)`.
- **Dynamic Type.** Player-facing text uses `UIFont.preferredFont(forTextStyle:)` or SwiftUI's `.font(.body)` / `.scaledFont(_:)` so it scales to the player's system text-size setting. Hardcoded point sizes break Dynamic Type. The audit walks the UI at the largest accessibility content-size category (`accessibility5XL`) and flags clipping or overlap.
- **Reduce Motion.** Read `UIAccessibility.isReduceMotionEnabled`. If true, skip parallax, screen-shake, FOV pulses, and decorative camera moves. Critical animations (transitions that carry meaning) stay; cosmetic motion goes. Listen for `UIAccessibility.reduceMotionStatusDidChangeNotification` to react mid-session.
- **Smart Invert Colors / Reduce Transparency.** Smart Invert flips the screen but skips images / videos with `accessibilityIgnoresInvertColors = true`. Audit that decorative UI passes Smart Invert without becoming unreadable. Reduce Transparency (`UIAccessibility.isReduceTransparencyEnabled`) means blurs and translucency should fall back to opaque fills.
- **Switch Control / AssistiveTouch.** The game must be playable end-to-end via Switch Control (one switch, scanning). This usually means: no required swipe gestures, no required multi-touch (offer single-touch alternative), no time-pressure inputs without a setting to disable.
- **Closed Captions.** iOS has system-wide closed caption preferences (`MediaAccessibility` framework). If you ship video content (cutscenes, trailers), respect `MACaptionAppearanceGetDisplayType`. For in-game dialogue, ship CC as part of the subtitle system regardless.
- **Audio descriptions.** For narrative-heavy games on iOS, consider an audio-description track — checked via `UIAccessibility.isAudioDescriptionEnabled`.

The audit: walk the build with VoiceOver on (Settings → Accessibility → VoiceOver). Tap every interactive element. If VoiceOver reads a generic "button" or "image" instead of a meaningful label, that's a P0 finding.

### Steps

1. **Inventory the settings menus** — what accessibility options exist? Where? Default state?
2. **Audit the top 4** — each item PASS / PARTIAL / FAIL.
3. **Walk the basic-tier checklist** — pass / fail / partial.
4. **Walk the intermediate-tier checklist** — same.
5. **Game-specific advanced.** Per mechanics: photosensitivity warning (storms / explosions / strobe), dyslexic font (narrative-heavy games), reading speed adjuster, combat slowdown, aim-assist, audio-only / visual-only play.
6. **Xbox-specific gates** if shipping to Xbox: subtitles + visual representation of audio + adjustable text size — these are required for cert. Surface as P0 for Xbox.
7. **Group findings** — P0 (top-4 + Xbox-required), P1 (basic-tier), P2 (intermediate + advanced).
8. **Produce a public accessibility report** for the Steam page. Be honest about what's in, what's not, what's coming. Don't promise post-launch features unless they're scheduled. Reference Celeste's and TLOU2's accessibility reports as models.

### Output (`--lens=a11y`)

```
GAME: <name> v<version>

TOP 4 STATUS
  - Remappable controls:     <PASS | PARTIAL | FAIL>
  - Adjustable text size:    <PASS | PARTIAL | FAIL>
  - Colorblind modes:        <PASS | PARTIAL | FAIL>
  - Subtitles + CC:          <PASS | PARTIAL | FAIL>

BASIC-TIER CHECKLIST
  <Item>: <pass | fail | partial> — <note>

INTERMEDIATE-TIER CHECKLIST
  <Item>: <pass | fail | partial>

GAME-SPECIFIC ADVANCED
  - <proposed advanced item>: <why relevant>

XBOX CERT GATES (if shipping to Xbox)
  - <pass | fail>

P0 FINDINGS (block launch)
  - <finding> — <fix> — <effort>

P1 FINDINGS (strongly recommended)
P2 FINDINGS (nice-to-have)

DEVELOPER TODO WRITTEN TO: <path>
PUBLIC REPORT WRITTEN TO: <path>
```

Developer TODO → `playtest/critique-a11y/dev-todo-YYYY-MM-DD.md`.
Public report → `playtest/critique-a11y/public-report-v<version>.md`.

---

## `--lens=perf` — performance snapshot

Use before / after perf-sensitive changes, at milestone gates, or during cert prep. The standalone [`gamestack-game-benchmark`](../../bin/impl/game-benchmark/README.md) CLI wraps this for CI use.

### Six metrics

| Metric | Why |
|---|---|
| Frame rate (avg + 99th-pct + 0.1th-pct) | Average hides stutters; percentiles reveal them. |
| Frame-time distribution | A histogram catches what mean / max can't. |
| Draw calls / batches | Death by a thousand calls on Switch / mobile. |
| GC allocations per frame | Per-frame allocation = future GC spike. |
| Scene-load times | Switch lotcheck cares about cold-start time. |
| Peak memory | Switch hard-caps; mobile crashes silently. |

### iOS-specific perf metrics

When `project.engine` is `ios native` (or the platform list includes `ios`), add these to the snapshot:

| Metric | How | Why |
|---|---|---|
| `CADisplayLink` frame time | Subscribe to a `CADisplayLink`; the `targetTimestamp - timestamp` delta is the per-frame budget; the actual `timestamp - lastTimestamp` is the realized frame time. | The hardware refresh on ProMotion devices is variable (10–120 Hz); a 60 FPS measurement is meaningless without referencing the display's current target. |
| `ProcessInfo.processInfo.thermalState` | Read at snapshot start and end. States: `.nominal` → `.fair` → `.serious` → `.critical`. | Anything past `.fair` is a perf finding — the OS is already throttling. Sustained `.serious` over 30 s of gameplay is a P1; `.critical` is a P0 (the system will start killing background work and your frame budget collapses). |
| MetricKit (`MXMetricPayload`) | Conform a singleton to `MXMetricManagerSubscriber`; `didReceive` fires once a day with `MXFrameRateMetric`, `MXMemoryMetric`, `MXCPUMetric`, `MXAppLaunchMetric`. | This is the only on-device metric source that aggregates across real player sessions. Pull it into the report when available. |
| Memory pressure / `didReceiveMemoryWarning` | Hook `UIApplication.didReceiveMemoryWarningNotification`. | Count warnings received during the scenario. >0 means you're flirting with OOM-kill; iOS terminates apps that don't free memory after the second warning. |
| Energy log (Xcode → Energy gauge) | Manual capture from Xcode Organizer; report as "energy impact" (% CPU and screen-on cost). | Apps that drain battery faster than peers get App Store complaints. Energy log is the canonical reference. |
| App launch time | `MXAppLaunchMetric.histogrammedTimeToFirstDraw`. | App Store reviewers cold-launch and watch the splash dwell; >2 s to first frame is a Guideline 4 risk. |

Capture method note: the iOS engine SDK (`engines/ios`) exposes thermal state and FPS via `/state` directly — no extra wiring needed. For MetricKit and energy log, the data only exists in production sessions; surface as "OFFLINE — Instruments capture required" if no live data is available.

### Steps

1. **Define the scenario.** Scene, what the player is doing, duration, platform, build mode. A perf number without a scenario is meaningless.
2. **Capture the snapshot** via (in order of accuracy): engine SDK `/state` (preferred), engine profiler (Unity Profiler / Godot built-in / `Unreal Insights`), or manual capture (developer-provided JSON / screenshots).
3. **Establish a baseline** — either a previous snapshot under `playtest/critique-perf/<scenario>-baseline.md`, or declare this run as baseline.
4. **Compute the metrics** — avg FPS, 99th-pct frame time, 0.1th-pct frame time (the visible stutter), draw calls, batches, GC alloc / frame, scene load (ms), peak memory (MB).
5. **Diff against baseline.** Mark as regression if: avg FPS -5% rel; 99th-pct +10% abs; draw calls +10% abs; GC any increase; memory peak +5% abs.
6. **Diagnose regressions.** Hypothesize using `/bug-hunt`'s discipline — what changed? Which subsystem? What would confirm? Don't fix; identify.
7. **Frame-budget breakdown** by subsystem if data permits. Don't fabricate numbers.

### Output (`--lens=perf`)

```
SCENARIO: <name>
PLATFORM: <target>
BUILD: <id, mode>
CAPTURE METHOD: <SDK | profiler | manual>
DURATION: <seconds>

METRICS (current vs baseline)

  Metric                    Current     Baseline    Δ        Verdict
  ------------------------------------------------------------------------
  Avg FPS                   <X>         <Y>         <Z>      <PASS | REGRESSED | IMPROVED>
  99th-pct frame time (ms)  <X>         <Y>         <Z>      <...>
  0.1th-pct frame time (ms) <X>         <Y>         <Z>      <...>
  Draw calls / frame        <X>         <Y>         <Z>
  Batches / frame           <X>         <Y>         <Z>
  GC alloc / frame (KB)     <X>         <Y>         <Z>
  Scene load (ms)           <X>         <Y>         <Z>
  Peak memory (MB)          <X>         <Y>         <Z>

FRAME-BUDGET BREAKDOWN (if available)
  <table>

REGRESSIONS
  - <metric>: <hypothesis>
    Investigation: <what to check>
```

Write to `playtest/critique-perf/<scenario>-YYYY-MM-DD.md`.

---

## What NOT to do (cross-lens)

- **Don't run all six lenses in one pass.** The output is unreadable and the developer can't act on it. Pick the lens that fits the current phase.
- **Don't soften a missing kernel with polish suggestions.** `--lens=feel` on a game whose `--lens=fun` would fail is harmful — it tells the developer to add juice to a verb that isn't working.
- **Don't fabricate numbers** for `--lens=perf` if the profiler isn't running. Say so and propose how to capture them.
- **Don't promise post-launch features** in `--lens=a11y` public reports unless they are scheduled in the project's roadmap.
- **Don't apply console / mobile / web onboarding targets uniformly.** Mobile players abandon at 5 s of nothing happening; PC gives 30 s; console gives a bit more.
- **Don't compare absolute pacing curves across genres.** A horror game's pacing graph looks nothing like a roguelike's.

## When to bail

If the developer disagrees with your assessment, ask one clarifying question to make sure you understood, then defer to them. They know the game.

If the build doesn't run or isn't reachable, drop to offline analysis (read the code, the design docs, recorded gameplay if any) and clearly mark the report as "offline — no live capture."

## Handoff

After `/critique`:

- Apply the top edits. Re-run the same lens after a playtest.
- `/critique --lens=<other>` if the findings hint at a different failure mode (e.g., feel critique reveals a fun problem).
- `/playtest` to drive the audited scenarios in a real session against the engine SDK (or offline screenshot-diff mode).
- `/code-review-gamestack` if proposed changes touch hot paths.
- `/bug-hunt` for any regression `/critique --lens=perf` surfaces.
- `/skill-feedback` if this audit was or wasn't useful — your thumbs-up/down shapes the next rewrite.

Per [`_state-conventions.md`](../_state-conventions.md), append a `recent_runs` entry with `lens: "<lens>"` and the artifact path written.
