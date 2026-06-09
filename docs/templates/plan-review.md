<!--
artifact: plan-review
authored_by: plan-creative-director, plan-game-design, plan-narrative, plan-art-direction, plan-audio-direction, plan-level-design, plan-tech-design
schema_version: 1
when_written: "Every time a /plan-* skill runs. Filename: design/reviews/plan-<discipline>.md (overwritten on re-run)."
-->

# Plan review — {{discipline}}

<!--
Replace {{discipline}} with the audited discipline name, e.g.:
  creative-director | game-design | narrative | art-direction | audio-direction | level-design | tech-design
-->

<!-- SUMMARY (all disciplines) -->
<!-- 2–3 sentences. What was read, what the overall finding is, and whether the plan is ready for production. -->

<summary goes here>

---

<!-- DISCIPLINE-SPECIFIC BODY
     Each /plan-* skill produces a different body section before the shared closing sections.
     Use the block that matches the discipline; remove the others before writing output.
-->

<!-- ─── creative-director ─────────────────────────────────────────────────────
MODE: <Scope-Up | Selective Expansion | Hold Scope | Reduction>
WHY THIS MODE: <2–3 sentences on the signals that drove mode selection>

CRITIQUE
  <2–4 paragraphs of substance — what's working, what isn't, what's missing>

RECOMMENDATION
  <The one or two things the developer should do next, in priority order>

RISKS (if Hold Scope)  /  CUTS (if Reduction)  /  THE ONE BET (if Selective Expansion)  /  DIRECTIONS (if Scope-Up)
  <Mode-specific output>
──────────────────────────────────────────────────────────────────────────── -->

<!-- ─── game-design ────────────────────────────────────────────────────────────
CORE LOOP
  Articulated:  <one paragraph in your words>
  Status:       <clear | unclear | mismatched with stated pitch>

SKILL CURVE
  | Time horizon    | What the player can do | What the player has just learned | What's about to challenge them |
  |---|---|---|---|
  | Minute 1        | | | |
  | Minute 15       | | | |
  | Hour 1          | | | |
  | Hour 5          | | | |
  | Hour 10+ (mid)  | | | |
  | Hour 50+ (long) | | | |
  Cliffs / plateaus: <list>

DEAD MECHANICS (proposed for cut)
  - <mechanic>: <why it doesn't earn its place>

DIFFICULTY & PROGRESSION
  Difficulty model:       <observed and gap analysis>
  Progression pace:       <observed and gap analysis>
  Win/loss conditions:    <observed and gap analysis>
──────────────────────────────────────────────────────────────────────────── -->

<!-- ─── narrative ──────────────────────────────────────────────────────────────
VOICE CARDS
  <character>: <pass | needs three-adjective voice card | needs sample line | voice collides with X>

EXPOSITION AUDIT
  Info-dump candidates:
    - <beat>: <alternative delivery proposal>
  Pacing: <reading-length budget concerns>

EMOTIONAL <-> GAMEPLAY ALIGNMENT
  Mismatches:
    - Beat <X>: emotional <Y> vs gameplay <Z>
  Recommendations:

BRANCHING
  Model:                   <stated and assessed>
  State tracked:           <listed>
  QA combinatorial cost:   <estimate>
  Fallback path:           <present | missing>

PIPELINE & TOOLING
  Dialogue format:         <stated | needs decision>
  String externalization:  <yes | NO — must address>
  Editor's pass:           <scheduled | not scheduled>
──────────────────────────────────────────────────────────────────────────── -->

<!-- ─── art-direction ──────────────────────────────────────────────────────────
RATINGS (0-10)
  Style in one sentence:    <N> — <rationale>
  References specificity:   <N> — <rationale>
  Color discipline:         <N> — <rationale>
  Silhouette readability:   <N> — <rationale>
  Asset budget realism:     <N> — <rationale>
  Animation language:       <N> — <rationale>
  VFX policy:               <N> — <rationale>
  AI-slop resistance:       <N> — <rationale>

WHAT 10 LOOKS LIKE (per under-9 dimension)
  <dimension>: <one-sentence game-specific 10>

AI-SLOP FLAGS
  - <reference / image>: <issue> — <action>
──────────────────────────────────────────────────────────────────────────── -->

<!-- ─── audio-direction ────────────────────────────────────────────────────────
SFX TAXONOMY
  Categories present:                    <list>
  Missing:                               <list>
  Style-note specificity per category:   <pass | needs detail>

MUSIC STRUCTURE
  Stated:          <model>
  Composer:        <named | open>
  Adaptive system: <yes | no>
  Concerns:

MIX PRIORITY
  Policy stated:         <yes | NO — propose default>
  Recommended policy:    <list>

TOOLING
  Choice:        <FMOD | Wwise | engine-native | undecided>
  Fit with plan: <good | mismatch>

LOUDNESS TARGETS
  Stated: <yes | NO — propose defaults>

DIEGETIC POLICY
  Stated: <yes | NO — propose policy>

ACCESSIBILITY CHECKLIST
  - Subtitles default ON:             <pass | fail>
  - Closed captions:                  <pass | fail>
  - Independent bus sliders:          <pass | fail>
  - Mono-output option:               <pass | fail>
  - Visual cues for off-screen audio: <pass | fail>
──────────────────────────────────────────────────────────────────────────── -->

<!-- ─── level-design ───────────────────────────────────────────────────────────
MACRO STRUCTURE
  <Stated structure; confirm or push back>

TENSION GRAPH
  <Beat-by-beat or per-region table with tension / skill demand / narrative density>
  Monotony zones:  <list>
  Spike clusters:  <list>
  Hollow middles:  <list>

CRITICAL PATH / SIDE CONTENT
  Estimated ratio: <X%/Y%>
  Concerns:

NAVIGATION AUDIT
  Spaces with unclear wayfinding:
    - <space>: <missing signposting | sight line | breadcrumb>

GATING LOGIC
  Dependency depth:    <shallow | deep | risky>
  Soft-lock risks:     <list>
  Backtracking burden: <stated>

HERO SHOTS & REST BEATS
  Planned hero shots: <count and quality>
  Rest beats:         <present | missing>
──────────────────────────────────────────────────────────────────────────── -->

<!-- ─── tech-design ───────────────────────────────────────────────────────────
ENGINE
  Engine + version:       <stated | needs decision>
  Breaking-change risks:  <stated | identified>

STATE MACHINES
  Player:     <present | proposed diagram below>
  Enemy/AI:   <present | proposed diagram below>
  Dialog:     <present | proposed diagram below>
  Save:       <present | proposed diagram below>
  Game state: <present | proposed diagram below>

  [ASCII diagrams here for any proposed]

DATA FLOW
  <Traced path with flags>
  Concerns: <list>

FRAME BUDGET
  Per-platform targets: <stated | proposed table>
  Concerns:

SAVE FORMAT
  Format:           <stated | needs decision>
  Version field:    <yes | NO — must add>
  Migration policy: <stated | NO — must add>
  Atomic writes:    <yes | NO — must add>

ASSET PIPELINE
  Naming convention:         <stated>
  Atlas strategy:            <stated>
  Per-platform compression:  <stated | gap>
  Source asset VCS:          <stated | gap>

CROSS-PLATFORM ABSTRACTION
  - Input:        <abstracted | leaked>
  - Save:         <abstracted | leaked>
  - Achievements: <abstracted | leaked>
  - Networking:   <n/a | abstracted | leaked>

TEST STRATEGY
  <Stated, with gaps>

CONSOLE-SPECIFIC
  - Switch: <covered | gap>
  - PS5:    <covered | gap>
  - Xbox:   <covered | gap>
──────────────────────────────────────────────────────────────────────────── -->

---

<!-- TOP FINDINGS (all disciplines)
     creative-director uses RECOMMENDATION above instead of this block.
     All other /plan-* skills use "TOP 3 [DISCIPLINE] RISKS" — write it as:
       TOP 3 <DISCIPLINE> RISKS / TOP 3 FINDINGS (game-design uses this label)
-->

TOP 3 {{DISCIPLINE}} RISKS
  1. <most-load-bearing issue>
  2.
  3.

---

<!-- DESIGN DOC EDITS (all disciplines) -->

DESIGN DOC EDITS
  <Specific edits to the source design doc, or "no edits — supply new section yourself">

<!-- Offer to apply edits on confirmation. Do not apply without explicit developer go-ahead. -->
