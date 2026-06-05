# Case study: shipping a Unity narrative game solo

The promise of gamestack across a real production is *the same discipline at every phase.* Not a different toolkit for design and a different one for cert. The same skills, calibrated by the project's declared phase, firing when the developer would otherwise be staring at the wall. This case study walks 32 weeks of a single solo Unity game — from week 1 pitch through Steam launch and the first month of post-launch monitoring — and shows which specialist fired at each milestone and what changed in the build because of it.

The example game is **Lighthouse Keeper** — a 6-hour narrative game about a year tending a remote lighthouse on a fictional bit of north-Atlantic coast. The verb is *the morning rounds*: walk the gallery, log the weather, mend what wore overnight, write the day's entry. There's no combat. There's no inventory tetris. There's a slow-burn relationship with a supply-boat captain who comes every Thursday, a journal the player writes in, and 365 in-game days that pass in roughly 6 real-time hours of play.

The developer is one person — eight years of Unity at a mid-size studio (mostly working on systems and tools), shipping their first solo indie. They have opinions about IL2CPP. They have never run a Switch lotcheck. Their bar for accessibility is "Xbox-grade from week one" because they used to work on a team where a11y certifications kept slipping. Targets: Steam day 1 with Steam Deck Verified, Switch eShop day 30, $19.99.

Don't take the timeline literally — solo dev schedules are made of weather, not Gantt charts. The point is the *shape* of the production and where the right specialist saved or cost the developer time.

## Phase 1: Pitch (weeks 1–2)

The game existed in the developer's notebook for a year before they typed anything. The first session begins with the obvious:

```
/design-jam I want to build a year-in-the-life lighthouse keeper game.
```

The Creative Director runs the six forcing questions. The developer is a year into thinking about this game and breezes through the first three. Question four is the one that stings:

```
4. Kernel of fun?
   → "The texture of routine. The way you start to look forward to
      Thursdays not because the captain is interesting but because
      the rest of the week has weight."

   ✓ Specific. Real. The kernel might be here — but a kernel that
     depends on *accumulated weeks* needs early-hour proof. What's the
     8-minute version of this fun that a Next Fest demo can deliver?
```

That last sentence becomes load-bearing later — the demo problem surfaces here in week 1, not week 30. Question six produces the cut list that the next 30 weeks have to defend:

```
6. 8-week cut list?
   → 8 WEEKS: one lighthouse, twelve months as twelve chapters,
     four NPCs (captain, sister-via-letters, predecessor's ghost via
     journal, the storm itself).
   → NOT 8 WEEKS: side-character romance arc, a fishing mini-game,
     a procedural shipwreck system, photo-mode.
```

The pitch lands at `design/pitch.md` — two pages, defendable. The "NOT 8 weeks" list is the source of truth for every scope conversation for the next half year.

A day later, the pressure test:

```
/plan-creative-director
```

The Creative Director picks **Selective Expansion** — the pitch is solid but missing the one bet that would distinguish it from "Firewatch but in a tower." The proposal is sharp:

```
MODE: Selective Expansion.

The pitch holds. The differentiator is THE JOURNAL — not as a UI
artifact but as a mechanic. The player writes the journal. Not from
multiple-choice prompts; from typed-in lines. Length is the player's
call. The game reads it back six chapters later as the predecessor's
journal, lightly redacted. The closing chapter shows the player
their year through their own typing.

Risks:
  - Typing as a mechanic is a hard sell on Switch handheld and
    Steam Deck. Have a controller fallback ready by week 8.
  - The "ghost reads your journal" trick is the whole game's
    payoff. If it lands flat, the cut list re-opens.
```

The developer thinks about it for a day, then accepts. The journal mechanic is now load-bearing. It is also the thing that will determine whether the year of writing was worth it.

## Phase 2: Plan (weeks 3–4)

Week 3 is `/autoplan` against the now-locked pitch. The developer has skeletons of seven plan docs in `design/`. Running the full pipeline takes one focused afternoon:

```
/autoplan
```

The pipeline runs Creative Director → Game Design → Narrative → Level → Art → Audio → Tech. The pure-menu-style sections of the game cause Level Design to scope down (it doesn't skip — the lighthouse exterior, the gallery, the cliff path all need flow), but the chain still runs end-to-end. The summary chat reads:

```
AUTOPLAN COMPLETE
  Reviews:                  7 written to design/reviews/
  Auto-fixes applied:       11
    - subtitles default ON, independent volume sliders (a11y)
    - save format gets version field + atomic write (tech)
    - palette hex codes added to art-direction plan (art)
    - mix priority defaults populated (audio)
    - SFX taxonomy added Notifications category (audio)
    - input remapping marked P0 from day one (a11y)
    [...]

  Taste decisions surfaced (5):
    1. Side-character romance arc (captain): on the cut list per
       /design-jam. /plan-narrative wants to reopen — the captain
       relationship is too thin without it. Decide.
    2. Fishing mini-game: on the cut list. Audio plan called it
       out as the place where ambient music has its strongest beat.
       Decide.
    3. Frame budget Switch handheld: art budget proposes 24 MB
       atlas peak; tech budget allows 18 MB. Reconcile.
    4. Save schema: 4 slots vs. autosave-only. /plan-tech-design
       has opinions; /plan-narrative wants 4 slots for the journal
       arc to make sense across replays.
    5. Localization: English-only at launch vs. EN/FR/DE/JP from
       v1. Cost is real. Decide.

  Top-5 risks:
    1. Typing on controller still has no design (week 8 commitment).
    2. The "ghost reads your journal" hook untested.
    3. No accessibility partner for screen-reader review.
    4. Atlas budget conflict (taste decision 3).
    5. Switch perf untested; Unity IL2CPP cert pitfalls unknown.
```

The five taste decisions take an evening. The developer holds the cut list — romance arc and fishing both stay cut. (The captain gets sharper through dialogue rather than a romance, which is the kind of trade gamestack surfaces but doesn't make.) Atlas budget moves to 20 MB after the developer commits to 8-bit palette discipline. Save schema lands on 4 slots, autosave per chapter. Localization goes EN-only at launch, with strings externalized for v1.1.

Phase 2 ends with `design/reviews/` containing seven discipline-specific audits the developer cites in every commit message for the next 8 months. The most-cited turns out to be `design/reviews/tech-design.md` — the IL2CPP and save-format gates surface there once so they don't need to be re-derived per bug.

## Phase 3: Prototype (weeks 5–8)

Week 5 the developer opens an empty Unity project. They install the gamestack SDK first thing:

```
# Unity → Window → Package Manager → + → Add package from git URL:
https://github.com/cmdkvn/gamestack.git?path=engines/unity
```

Then Tools → gamestack → Create Config Asset, Tools → gamestack → Add Server to Scene. Loopback only, port 7331. Press Play, `http://localhost:7331/health` returns 200. Five minutes of setup that pays off for 30 weeks.

Then the engine scaffolding:

```
/scene-prototype "morning rounds — gallery walk + log entry"
```

The Engine Builder reads the locked design docs, detects Unity, and writes:

```
GENERATED FILES
  Assets/Scripts/Lighthouse/LighthouseController.cs   Entry orchestrator
                                                      [SerializeField] tunables.
  Assets/Scripts/Lighthouse/RoundsState.cs            State machine:
                                                      asleep → woken → galleried →
                                                      logged → done.
  Assets/Scripts/Lighthouse/JournalEntry.cs           Stateful entry: date,
                                                      typed text, autoflush.
  Assets/Scripts/Lighthouse/LighthouseConfig.cs       ScriptableObject for
                                                      day-cycle tunables.

  [GameStackState("dayIndex")]    on LighthouseController
  [GameStackState("inLog")]       on JournalEntry
  [GameStackState("paused")]      on LighthouseController (cert-ready)

SETUP CHECKLIST (rounds-setup.md)
  1. New scene: GalleryScene.
  2. Create empty: [Lighthouse]. Attach LighthouseController.
  3. Wire ScriptableObject: LighthouseConfig.asset.
  4. Press Play. Console should log "Day 1 — morning."

KNOWN UNITY GOTCHAS
  - IL2CPP strips reflection-only types; mark [Preserve] on JournalEntry
    if you serialize it via JsonUtility on Switch.
  - Resources.Load path is case-sensitive on Switch but not in Editor.
  - Input System v1.7+ required for the rebinding UI you'll need by week 8.
```

Three weeks later the prototype runs. Walk the gallery, hit a key to begin a log entry, type a few sentences, hit ENTER to commit. The day advances. Then the moment of truth:

```
/critique --lens=fun
```

The Prototype Critic asks the four questions. The developer answers honestly:

```
1. Name one specific working moment.
   → "When I'd been typing for 90 seconds and looked up and the
      light outside had shifted. I'd lost time. That's the game."

2. Name one specific bad moment.
   → "Walking the gallery is currently a 40-second nothing. The
      verb doesn't lead anywhere. You walk because the next prompt
      is gated on it."

3. What did a playtester do with their hands and face?
   → My partner played 12 minutes. They typed a full paragraph on
      day 3 unprompted. They got bored on day 5 because day 5 felt
      identical to day 3. They asked "does anything happen?"

4. How long have you lived inside the prototype?
   → 3 weeks of building, 4 days of playing.

KERNEL: present. The typing moment is the verb. The 90-second
absorption is the kernel. Sharpen the minute around it.

DEAD MECHANICS:
  - The gallery walk as currently shaped. The walk *is* meant to be
    contemplative, but contemplative needs something to look at. Add
    one small thing-that-changed per day or cut the walk to 10s.
  - The "mend what wore overnight" verb — never implemented, never
    missed. Cut from week 8 scope, revisit if the journal carries.

THREE DIRECTIONS:
  A — Sharpen the typing. Make the writing UI feel like a writer's
      tool. Real cursor. Word count fades in. Subtle line spacing.
  B — Give the gallery walk content. One micro-event per day
      visible from the gallery (a gull, a different cloud bank,
      a bottle on the shore).
  C — Pull forward the journal payoff. Have the predecessor's
      journal read back THIS WEEK so the dev can see the hook
      working at scale instead of at week 30.

RECOMMENDED: C this week, then A. B is week 15+ content work.
```

C is the right call and the developer knows it. They spend week 8 hacking together the "predecessor reads your journal" reveal at a tiny scale — three days of typing read back to you on day 7 in the predecessor's voice. They play it. They cry a little. The hook works.

The week 8 cut list reads: gallery walk shortened to 10 seconds for now (B comes back in week 16), the mending verb cut, scope held on everything else. The prototype's `playtest/critique-fun-2026-08-01.md` is the artifact the developer re-reads at every doubt-the-game crisis through week 22.

## Phase 4: Vertical slice (weeks 9–14)

Phase 4 is where the build first acquires real shape. The developer flips the game's CLAUDE.md to `phase: Vertical Slice`. That single line changes what `/playtest` picks for scenarios and what `/code-review-gamestack` weighs as priority. Discipline drift starts here without the phase being right.

Week 10, the first SDK-driven playtest:

```
/playtest
```

The QA Lead reads phase, picks `02-vslice-first-15-minutes.json` — the friction count scenario:

```
SCENARIO: 02-vslice-first-15-minutes
  ✓ wait_for_state default.gameReady=true       OK   1.2s
  ✓ screenshot 00-title-screen.png              OK   28 KB
  ✓ input PrimaryAction (start)                 OK
  ✓ wait_for_state default.dayIndex=1           OK   3.4s
  ✓ screenshot 01-morning-day-1.png             OK
  ✓ input keyboard:WalkForward (held 8s)        OK
  ✓ screenshot 02-gallery.png                   OK
  ✓ input keyboard:E (interact-log)             OK
  ✓ wait_for_state default.inLog=true           OK
  ✓ input type "today the wind was sharp."      OK
  ✓ input keyboard:Enter                        OK
  ✓ wait_for_state default.dayIndex=2           OK
  ✓ screenshot 03-morning-day-2.png             OK
  ✗ assert_state default.savedDataIntact=true   FAIL
    Expected: true. Actual: false.

FINDING 1
  Severity:    P0 (vertical-slice save corruption)
  Symptom:     savedDataIntact=false after day rollover
  Hypothesis:  autoflush on day boundary races with chapter file write
  Next:        bug-hunt with hypothesis as the seed.
```

This is the bug pattern the developer's tech-design plan called out in week 3. Atomic save + day rollover. The race exists because the autoflush coroutine kicks at the same frame as the day boundary. `/bug-hunt` traces it in 20 minutes; the fix lands a `FlushFileBuffers` before the rename and a regression scenario `06-day-rollover-flush.json` that joins the smoke suite for the rest of production.

Week 12 is the first `/code-review-gamestack` against a real PR. The developer just landed the journal autocomplete (one-character LLM-free word-suggestion based on the player's prior entries — a deliberately tiny model, just a frequency table). The review:

```
PR: feat(journal): autocomplete word suggestions

FINDINGS
  P0:  none.
  P1:  3
    [a] JournalEntry.Update() allocates new char[] every frame for
        the suggestion overlay. 1.2 KB/frame GC churn.
        Fix: pool a single char[] field; reuse.
    [b] WordSuggestionService subscribes to JournalEntry.OnTypingChanged
        in Awake; no matching unsubscribe in OnDisable. Signal leak when
        the journal panel re-opens — listeners stack.
        Fix: add OnDisable unsubscribe. Auto-applied (1 line).
    [c] WordSuggestionService.LoadFrequencyTable() is called inside
        OnEnable. Synchronous JSON parse on the main thread. 40ms on
        Switch handheld — visible hitch at panel open.
        Fix: load once on game start, cache. Surface for dev decision.

  Style/scope only:  4

AUTO-FIXED
  1 (the signal unsubscribe — small, reversible, clearly correct).

NEEDS DEV DECISION
  - Pool allocation [a]: pool field is 5 lines, no behavior change.
    Recommend accept.
  - Cache strategy [c]: where to call the loader from. Boot scene
    vs. lazy + future-promise. Recommend boot scene.
```

The developer accepts both. The auto-fix removed an obvious signal leak that would have shown up six weeks later as "the journal sometimes triggers suggestions twice" — a bug that's hard to diagnose because it depends on panel open/close cycles. The pooling change is two minutes of work that saves a player playtesting Steam Deck from a 1.2 KB/frame GC churn that compounds across a 6-hour playthrough.

Week 13, the first `/critique --lens=feel`:

```
/critique --lens=feel
```

The Polish Coach is honest about scope:

```
PRIMARY VERB:  typing (write a journal entry)
SECONDARY:     walk gallery, interact with log lectern

TYPING POLISH AUDIT
  ✓ Cursor blink rate:    OK — 500 ms, matches OS convention.
  ✗ Line break easing:    Linear. Reads abrupt. Add 80 ms ease-out.
  ✗ Sound feedback:       Silent typing. The keystroke needs SOME
                          tactile audio — even a 4-dB soft tick.
                          Risk of annoying; test with mute toggle.
  ⚠ Word-suggestion fade: 50 ms fade in. Too fast — feels like
                          a glitch. 180 ms is the sweet spot.

GALLERY WALK AUDIT
  ✗ Footstep variation:   One sample, plays on loop. Add 3 variants
                          + footstep-on-wood vs. footstep-on-stone.
  ✗ Camera bob:           None. Walking feels floaty.
  ⚠ Idle sway:            Standing still has zero motion. The player
                          will think the game crashed during a long
                          typing pause. Add 0.2° subtle camera idle.

DO NOT ADD
  - Screen shake. Anywhere. Not even on the storm. Especially not on
    the storm. The audio is doing the work; shake would betray the
    register.
  - Hit-pause on key presses (you'd be surprised; some devs do this).
    Tactile feedback is the audio + the visual ease. Not pause.

TOP 3 FIXES
  1. Add 180 ms word-suggestion fade. (1 line, ease curve.)
  2. Add typing audio: 4-dB woody tick, randomized pitch ±2 cents.
  3. Add camera bob + idle sway. (5 lines of code, big perceptual win.)
```

The "do not add" section is the value here. The skill catches the developer before they reach for screen shake on the storm chapter, which is the cliché Unity narrative game ships into and immediately regrets. The audio direction earned in week 3 carries the storm; shake would undo it.

## Phase 5: Production (weeks 15–22)

Vertical slice survives a four-person external playtest at week 14 (two players who finish 6-hour narrative games, two who don't). Phase rolls to `production` in CLAUDE.md. The next 8 weeks are content — 12 chapters, 365 days, ~30,000 words of NPC dialogue, 47 ambient audio events.

Production phase is when gamestack's CLIs start carrying their weight. Week 15 the developer wires three CLIs into GitHub Actions:

```yaml
jobs:
  asset-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: gamestack-asset-audit --project . --platform switch --format both --out audit --strict

  perf-baseline:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: ./scripts/launch-headless-build &
      - run: timeout 30 bash -c 'until curl -fs http://localhost:7331/health; do sleep 1; done'
      - run: gamestack-game-benchmark --baseline playtest/perf/baseline.json --scene Chapter4 --out perf.json
```

[`gamestack-asset-audit`](../../bin/impl/asset-audit/README.md) running `--strict` against Switch handheld budgets catches drift immediately. Week 17 a contracted artist drops in chapter art for chapters 9–12 at 2048x2048, twice the agreed atlas budget. CI fails on the PR. The developer doesn't have to discover this at week 26 during a perf pass.

Week 18, `/balance-review` — except there's not much to balance in a numberless narrative game. The skill is honest:

```
BALANCE REVIEW — Lighthouse Keeper

GAME TYPE:  narrative, qualitative.

This skill is mostly inapplicable here. There are 3 numeric systems:
  - Day length (in-game minutes per real minute): tuned at 60:1.
  - Weather event probabilities per month.
  - Word-suggestion frequency table.

DAY LENGTH
  Tuned to 60:1. Implied total playtime at 365 days: 6h 5m.
  Player log shows tutorial deviation — first day takes 14 min,
  not 10. Acceptable: onboarding is meant to be slower.
  No recommended change.

WEATHER PROBABILITIES
  Monthly transition table at design/weather-config.json.
  Monte Carlo 1000 runs:
    - Chance of zero storms in a 365-day run: 0.4%.
    - Chance of >12 storms (saturated, fatigue risk): 0.9%.
    - Distribution centers at 6 storms. ✓
  Storm is structurally significant; 0.4% never-storm rate is
  acceptable but the player should not be told "storms are
  guaranteed."
  No recommended change.

WORD-SUGGESTION TABLE
  Top 50 suggestions per genre cluster computed from corpus of
  test journal entries. Pressure test: simulate first 10 entries
  with player-style typo distribution.
  Suggestion-acceptance rate: 23% mean. Industry assist is 18-30%.
  ✓ Within range.

NO STRUCTURAL EDITS PROPOSED.
PACING-REVIEW IS THE MORE USEFUL NEXT STEP.
```

This is exactly the skill behaving correctly — when there isn't math to fix, say so plainly. The developer runs `/critique --lens=pacing` instead and gets back a genuinely useful tension graph showing a monotony zone in chapters 6–7 (weeks of identical winter days with no NPC encounters). The fix is the predecessor's journal entries from week 22's pile getting redistributed across chapters 6–7 as discovered scraps. Three hours of work; the tension graph re-runs flat-no-more.

Week 20, the first `/critique --lens=perf` against a real Steam Deck:

```
/critique --lens=perf
```

```
PLATFORM:      Steam Deck (LCD)
BUILD:         vertical-slice-r4
SCENE:         Chapter 8 (storm peak)
ACTIVITY:      typing journal entry during storm

METRICS
  Avg FPS:               42       baseline target: 40 (Deck Verified)  ✓
  99th-pct frame time:   38 ms    target ≤ 33 ms                       ✗  REGRESSED
  0.1th-pct frame time:  61 ms    last measured: 41 ms                 ✗  STUTTER
  Draw calls:            312      target ≤ 250                         ✗  OVER
  GC alloc/frame:        4 KB     target = 0                           ✗  REGRESSED
  Scene-load time:       2.4 s    target ≤ 3 s                         ✓
  Peak memory:           1.1 GB   Deck ceiling 14 GB                   ✓

REGRESSION HYPOTHESES
  1. The storm VFX particle system spawns a new ParticleParams struct
     per emit. Pool it.
  2. The rain layer adds 60+ unbatched sprite draws. Atlas it (the
     atlas-er was disabled for these textures in week 17 by mistake).
  3. The 0.1th-pct stutter aligns with chapter checkpoint save — the
     async write is allocating. Pre-allocate the buffer.

INVESTIGATION PATH PROPOSED — does not auto-fix.
```

Three findings, all from the storm chapter, all caught at week 20 instead of week 28. The developer fixes 1 and 2 same-day; #3 needs more thought and gets scheduled for week 22. Re-benchmark passes Deck Verified targets by week 23.

## Phase 6: Polish (weeks 23–26)

Phase rolls to `polish`. The game is content-complete. Now it's about whether the first 15 minutes get someone past the Steam refund window:

```
/critique --lens=onboarding
```

The First-60-Seconds Critic is unsentimental:

```
TIMINGS (target | actual | verdict)
  First verb           ≤ 10s  | 22s  | ✗  TOO SLOW
  First decision       ≤ 30s  | 41s  | ⚠  borderline
  First reward         ≤ 60s  | 1:48 | ✗  TOO SLOW
  First failure        5-10m  | n/a  | ⚠  game has no fail state
  "I get it"           ≤ 15m  | 18m  | ⚠  borderline

FRICTION COUNT (lower is better)
  Unskippable intro:         1 (28s intro reel + studio card)
  Tutorial pop-ups:          4 in first 5 min
  "Press X to continue":     6 modal dialogs
  Pre-game settings prompt:  1 (resolution + accessibility, mandatory)

TRAILER ALIGNMENT
  Trailer opens with: stormy lighthouse + typed text overlay.
  Game opens with:    intro reel + dawn approach to lighthouse.
  ⚠ Misalignment risk: players who clicked because of the typing
    have to wait 1:48 to type. Soften by surfacing typing in the
    very first decision.

TOP 3 EDITS
  1. Make the intro reel skippable. Default to skipped after a
     player launches once.
  2. Collapse the four tutorial pop-ups to a single contextual hint
     overlay that fades after first use.
  3. Hand the player the typing verb in the first 60 seconds — the
     game opens on day 0 (arrival day), and the first thing is
     signing the lighthouse log. The signature IS the typing tutorial.

EXPECTED EFFECT
  Refund rate: estimate -4 to -6 percentage points.
  First-15-min retention: estimate +12-18 pp.
```

The "sign the log" reframe is the kind of edit that ships in two days and changes the storefront-to-game alignment fundamentally. The intro reel becomes a 6-second post-card-rate shot, skippable, and the four tutorial modals collapse into a single fading hint overlay. The typed signature is now the player's first action; they're writing in the journal before they walk anywhere.

Week 24 is `/critique --lens=pacing` against actual implemented content (different lens than week 20 — this one walks the game, not the plan):

```
/critique --lens=pacing
```

The graph from chapter 1 to chapter 12 surfaces one monotony zone (chapters 6–7 already fixed in week 22), one spike cluster (chapters 9–10 are *both* high-stakes — sister's letter goes dark in 9, storm in 10), and a hollow ending. The hollow ending is the more important finding:

```
CHAPTER 11 → 12 PACING
  Chapter 11 ends with the captain's farewell scene.
  Chapter 12 is the journal-replay payoff — emotionally peak.
  In between: 4 in-game days of nothing. Walking the gallery,
  writing dim entries. Tension drops from 5 to 1, then snaps to 6.
  Players will skim those 4 days and lose the emotional setup.

PROPOSED FIX
  Compress days 357-360 into a 90-second montage. Player's earlier
  journal entries float past as text overlay. No new content; uses
  what the player already wrote.
  Effort: 1 day of cinematic scripting. No new asset cost.
```

Two days of work that turns the ending from "hollow" to "the thing players will talk about." This is exactly what pacing review at content-complete is for.

Week 25 is the full accessibility audit:

```
/critique --lens=a11y
```

The developer has been a11y-aware since week 3 (the autoplan applied subtitles-default-on as an auto-fix), and the audit catches what discipline alone misses:

```
TOP-4 (ship blockers)
  ✓ Remappable controls       PASS (Unity Input System actions all bindable)
  ⚠ Text scale 1.5×           PARTIAL — UI breaks at 1.7×+. Letterbox the
                              journal panel above 1.5×.
  ✗ Colorblind modes          MISSING — only Deuteranopia preset. Add
                              Protanopia + Tritanopia.
  ✓ Subtitles + CC            PASS (default ON, speaker labels present)

GAG BASIC (intermediate ratings)
  ✓ Independent volume sliders (Music / SFX / VO / Ambient / UI)
  ✗ No color-only info conveyance — storm warnings use only red icon.
    Add icon shape + text label.
  ✓ Pause: any time, including during journal entries.

GAG INTERMEDIATE (advanced ratings)
  ⚠ Assist mode: not implemented. The game has no fail state, so the
    "no time pressure" intermediate item passes structurally.
  ✓ Mono-output toggle: present.

GAG ADVANCED (Xbox-grade)
  ✓ Photosensitivity warning: present (storm chapter strobe).
  ✗ Dyslexic-friendly font option missing. The journal in particular
    matters here.

DEV TODO (8 items, prioritized)
  P0:  3 (colorblind modes, color-only conveyance, dyslexic font)
  P1:  2 (text scale 1.5× UI fix, journal panel scaling)
  P2:  3

PUBLIC REPORT
  Written to docs/accessibility.md and marketing/steam/a11y.md.
```

All P0 items land by end of week 26. The dyslexic-font option ships as an OpenDyslexic toggle that affects the journal panel and dialogue boxes. Three colorblind presets ship instead of one. The week is short, focused, and the result is a game that won't fail Xbox cert when the Switch dev has to confront it later.

## Phase 7: Cert prep for Switch (weeks 27–30)

By week 27 the Steam build is locked, in beta, getting 8-person external playtest passes per week. The Switch dev kit has been on the desk since week 14, but cert prep starts in earnest now. Phase rolls to `cert`. The full cert walkthrough lives in [howto-cert-walkthrough](../howto/howto-cert-walkthrough.md); this case study covers the shape and the Unity-specific findings.

Week 27, day 1:

```
/cert-readiness switch
```

The Platform Cert Officer reads the on-file Switch lotcheck PDF (the developer downloaded it from the Nintendo Developer Portal at week 26). Audit verdict:

```
PLATFORM: Switch
CHECKLIST VERSION ON FILE: switch-lotcheck-v15.4.pdf
BUILD: 14a98c2

PASS  PASS-CODE-ONLY  NEEDS-LIVE-TEST  FAIL-P0  FAIL-P1  N/A
  3        4                2             1        2      0

KEY FINDINGS
  Sleep / resume                FAIL_P0
    OnApplicationPause exists but doesn't flush the journal buffer.
    A sleep mid-entry loses the unsaved text.
  Suspend during write          FAIL_P1
    JournalEntry.AutoFlush uses File.Replace but no FlushFileBuffers
    before the swap. Switch power-loss in the wrong 50 ms loses the
    chapter checkpoint.
  Localization                  FAIL_P1
    Game is EN-only at launch. Switch lotcheck has no objection,
    BUT the in-game "language" splash is missing — required even
    for single-language titles.
  Memory ceiling                NEEDS_LIVE_TEST
    Static check passes (peak 380 MB). Needs a real-kit handheld run.
  Controller modes              PASS_CODE_ONLY
    Joy-Con + Pro paths exist; no cert-class playtest in 7 days.

SUBMISSION READINESS — Switch: BLOCKED
  1 P0, 2 P1, 2 live tests required. Estimated work: 5-7 days.
```

The P0 — flushing the journal buffer on sleep — is exactly the kind of bug a PC dev doesn't think to look for because PC builds don't sleep that way. The IL2CPP angle bites here too: a previous developer might have used `Application.quitting` to flush, but `OnApplicationPause(true)` fires on Switch sleep where `quitting` does not.

Days -13 through -10 are the fix sprint. The Unity-specific twist is the IL2CPP stripping issue surfaced by the platinum-grade fix attempt: the developer's first fix used `BinaryFormatter` to capture the in-progress entry to a recovery slot, but `BinaryFormatter` is stripped under IL2CPP and the recovery silently fails. The skill catches this on the next `/code-review-gamestack`:

```
FINDING
  Severity:  P0 (cert blocker — recovery write is silently no-op
             under IL2CPP on Switch)
  Symptom:   BinaryFormatter.Serialize() throws SerializationException
             at runtime on IL2CPP because System.Runtime.Serialization
             is stripped by default.
  Fix:       Replace with explicit JsonUtility.ToJson + [Preserve]
             on the recovery type. Or add link.xml to retain
             System.Runtime.Serialization (adds 1.4 MB to the build —
             not recommended for Switch).
```

The developer takes the JsonUtility path. Saves the build size.

Week 29, the cert-class playtest sweep:

```
/playtest 04-cert-controller-disconnect
/playtest 05-cert-save-fuzz
```

The first run catches the Joy-Con reconnect bug — same family as the howto-cert example. Reconnect fires on a Switch-specific event path that the PC tests had never exercised. Two-line fix, regression scenario added, re-run passes. The save-fuzz scenario passes cleanly (the journal autoflush race was the only structural save bug, and that's been fixed since week 10).

Week 30 the developer runs `/cert-freeze` and stays there. Lock is on `Builds/`, `docs/cert/`, `playtest/cert-readiness/`. Editing gameplay code requires explicit unfreeze + re-freeze. The freeze stops two near-misses in week 30 where the developer almost casually edited `JournalEntry.cs` to add a feature requested by a beta player; both edits cost a re-run of cert-readiness and re-submission of the Switch build. Saying "no" to features in week 30 is what the freeze is for.

Then `gamestack-playtest-daemon` and `gamestack-cert-checklist` get wired into a Switch CI branch:

```yaml
jobs:
  switch-cert:
    runs-on: macos-latest  # Switch headless build uses macOS host
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: gamestack-cert-checklist --project . --platform switch --strict
      - run: ./scripts/launch-switch-headless &
      - run: timeout 30 bash -c 'until curl -fs http://localhost:7331/health; do sleep 1; done'
      - run: gamestack-playtest-daemon --scenario skills/playtest/scenarios/04-cert-controller-disconnect.json
      - run: gamestack-playtest-daemon --scenario skills/playtest/scenarios/05-cert-save-fuzz.json
```

Any regression between cert prep and submission surfaces within an hour. Two weeks of waiting for Switch lotcheck won't be sabotaged by a stray PC-side commit.

## Phase 8: Steam launch (week 31)

Steam is the lead platform. Switch lotcheck submission goes in at the end of week 30 and waits in queue. Week 31 is Steam launch.

`/cert-readiness steam` doesn't exist as a concept (Steam doesn't have cert), but `/steam-page-review` does the storefront equivalent work:

```
/steam-page-review
```

```
STEAM PAGE — Lighthouse Keeper

CAPSULES
  ✓ Header (460x215)              PRESENT
  ✓ Main capsule (616x353)        PRESENT
  ✓ Small capsule (231x87)        PRESENT
  ⚠ Page background               PRESENT but readable text at 1080p
                                  is at 11px equivalent. Bump to 14px.
  ✗ Library hero (3840x1240)      MISSING
  ✗ Library logo (1280x720)       MISSING
    Without these, your game looks unfinished in player libraries
    POST-PURCHASE. Highest-impact missing items.

TRAILER (first 6 seconds)
  0:00-0:02  fade from black, intro card
  0:02-0:04  lighthouse exterior, dawn
  0:04-0:06  text overlay: "a year in one place"
  → Verb (typing) doesn't appear until 0:14.
  → The auto-play on the store page uses these 6 seconds. They have
    to carry the click. Recut.

SHORT DESCRIPTION (300 char)
  "Tend a remote lighthouse for a year. Write your story."
  ✓ Specific. No clichés. Genre signal clear.

TAGS
  Currently:   Narrative, Atmospheric, Singleplayer, Story Rich,
               Walking Simulator
  Top-5 in genre also use:  Cozy, Slow-paced, Memorable Characters,
                            First-Person Writing(!).
  ⚠ Add "Cozy" (genre median wishlist multiplier +1.4x for this game's shape).
  ⚠ Consider "Slow-paced" (warns off wrong-fit buyers, raises review %).
  → "Walking Simulator" is a polarizing tag — keep it; it pre-qualifies.

SCREENSHOTS
  6 of 12 are interior typing scenes. Repeat-feeling.
  Add: storm exterior, captain encounter, journal-replay frame.

WISHLIST-CONVERSION RISK: MEDIUM
  Main fixable items: trailer recut, Library assets, Cozy tag, screenshot variety.
```

The Library hero is the highest-impact catch. The developer had moved them to a "v1.1" pile thinking they were optional polish. They're not — they affect every player's library page after purchase. They land before launch.

The trailer recut is two days of work. The new opening leads with a typed line appearing letter by letter on a journal page over the lighthouse exterior:

```
0:00-0:01   single line types in: "the wind came up overnight."
0:01-0:03   pull back: the journal is on a wooden table in the gallery.
0:03-0:06   the keeper turns to look out at the storm horizon.
0:06         title card.
```

The verb is on screen at 0:01. The store auto-play does its job.

Then the publish:

```
/launch-day
/publish target=steam version=1.0.0
```

The launch-day skill activates verbose-intent logging and locks writes to launch-affecting paths. `/publish` walks the eight gates — all pass — and proceeds:

```
PUBLISH RUN — lighthouse-keeper v1.0.0 to steam

PRE-PUBLISH GATES
  ✓ Cert N/A (Steam has no cert; Steam Deck Verified status tracked separately)
  ✓ No P0 bugs (playtest/regression/ clean)
  ✓ Tests passed (Unity play-mode 71/71)
  ✓ Version unique
  ✓ Branch clean
  ✓ Build = commit
  ✓ Not Friday-after-2 (Tuesday 09:30)
  ✓ Documents current

BUILD
  Unity batchmode: Windows + macOS + Linux complete (14 min total).
  Outputs in Builds/Steam/.

UPLOAD
  steamcmd: default branch only (NOT released branch yet).
  ✓ Manifest valid.
  ✓ Depots uploaded.

POST-UPLOAD
  Tag v1.0.0 pushed.
  Patch notes drafted: marketing/patch-notes/v1.0.0.md
  PR #128 opened: "release: lighthouse-keeper v1.0.0"
  ROADMAP.md updated.
  Game CLAUDE.md phase: Cert → Launched.

NEXT
  - Flip released branch when storefront live.
  - Enable /post-launch-monitor daily for 30 days.
  - DO NOT post the launch tweet until storefront shows live.
```

At T-0 on Tuesday morning, the developer flips the released branch via the Steam partner UI (this last step `/publish` does not automate — flipping a build to live is a human decision). Storefront flips at 10:00 ET. Tweet posts. Discord goes out. The shape of launch day is `/launch-day`'s job; the human-eyes flip is the developer's.

## Phase 9: Post-launch (month 1)

Phase rolls to `launched`. From day 0:

```
/post-launch-monitor
```

The Live Ops engineer writes a baseline at hour 1 and a real digest at hour 6, end of day, and every morning for 30 days.

Day 0 hour 1: 2 reviews (both positive). No crashes reported. The skill recommends *do not patch on hour-1 data*.

Day 2 morning: 47 reviews, 89% positive. One YELLOW pattern — 5 forum posts mentioning autosave lag on Steam Deck at chapter transitions. Not a bug; a perceptible 200 ms pause when the chapter file flushes. Players notice.

Day 3 morning: 134 reviews, 91% positive. Refund rate 6.8% (Steam narrative-game median is around 10%). Crash rate via Sentry: 0.2%. The autosave lag is now 11 forum mentions. Classification: bug pattern, not emergency, patch this week.

The fix lands week 31 day 5 — moving the chapter checkpoint write to a worker thread with a main-thread completion callback. Same atomic-write pattern, off the main thread. `/code-review-gamestack` flags one risk (the completion callback may execute after the player exits the chapter scene) and the developer adds a scene-tagged cancel.

Then the patch:

```
/publish target=steam version=1.0.1
/patch-notes v1.0.1
```

`/patch-notes` reads the diff and the closed issue, finds the voice cards, and writes:

```
PLAYER NOTES — marketing/patch-notes/v1.0.1.md

# Lighthouse Keeper — v1.0.1

A small fix for chapter transitions on Steam Deck.

## Fixed
- Chapter checkpoints no longer cause a brief pause on Steam Deck.

_Thanks to the players who flagged this in the first 72 hours._
```

```
CHANGELOG ENTRY — prepended to CHANGELOG.md

## [v1.0.1] - 2026-12-15

### Fixed
- ChapterCheckpoint.Flush() moved to ThreadPool with main-thread
  completion callback; chapter transitions no longer block frame
  on Steam Deck. (#129)
```

Player-facing and dev-facing diverge. The player notes don't say "main-thread"; the changelog doesn't say "small fix." Two audiences, two registers. The patch goes live Friday morning (Tuesday-Wednesday-Thursday testing window — not Friday after 14:00).

Day 30, the cadence drops to weekly. The developer runs:

```
/post-mortem
```

```
POST-MORTEM — Lighthouse Keeper, 30 days post-launch

WHAT WENT WELL
  - Wishlists at launch: ~6,400 (started page 6 months prior).
  - Day 1 review % held at 91% recent and is now 93% all-time.
  - Refund rate: 7.4% — well under Steam narrative median.
  - Crash rate: 0.18% — Sentry top-of-decile for Unity Indie.
  - Steam Deck Verified granted day 18.
  - One hotfix shipped (v1.0.1) within 5 days of the bug pattern surfacing.
  - Switch submission cleared lotcheck on the first attempt.

WHAT WENT WRONG
  - The trailer recut should have happened week 26, not week 31.
    Three days of work blocking the launch is uncomfortable.
  - The Library hero and logo were "v1.1" thinking until week 31's
    /steam-page-review. They should have been in the week-25 polish list.
  - Two beta players noted the journal cursor doesn't blink on Linux.
    Caught it in the post-launch monitor, not the cert-class playtest.
    Pattern: PC-only platform-specific UI bugs are blind spots.

WHAT WE'LL DO DIFFERENTLY
  - Add a /steam-page-review checkpoint at week 24 in next-game cadence.
  - Include Library hero + logo on the production art bible from day 1.
  - Build a per-platform UI smoke scenario (Linux + macOS + Windows)
    to /playtest's regression suite for next game.

THREE LESSONS (piped to /learn)
  - Steam Page review at week 24 catches recuts before launch panic.
  - Library assets are not optional polish; they ship in v1.0 or never.
  - IL2CPP stripping of BinaryFormatter is a Switch-specific recovery
    failure mode. Always JsonUtility + [Preserve] under IL2CPP.
```

The three lessons land in `studio/learnings/`. Next game's first prototype hour surfaces them.

## What gamestack changed

The honest accounting. The things that would have gone differently without the tool:

- **Week 1's "ghost reads your journal" expansion would not have surfaced until week 12.** A solo dev pressure-tests their own pitch only when forced. `/plan-creative-director` is the forcing function. Without it, the game ships as "Firewatch but a lighthouse" and competes with reference fatigue.
- **The autosave race at the day boundary would have shipped.** The bug existed in week 8 and surfaced in week 10's first `/playtest` cert-class run. Without the SDK-driven scenario it would have surfaced in beta around week 27, or worse, in post-launch reviews.
- **The Switch sleep-during-journal-entry P0 would have failed lotcheck.** No PC dev sees that bug without thinking like a Switch cert auditor. `/cert-readiness` thinks like one for you.
- **The trailer would still open with the studio card.** Auto-played trailers on the storefront don't get a chance with 4 seconds of credits. The recut was painful at week 31 — without `/steam-page-review` it wouldn't have happened at all.
- **The signal leak in the journal autocomplete would have shipped.** It was a one-line auto-fix in week 12. In its absence, players would experience "the journal sometimes triggers suggestions twice" as a reproducibility-impossible bug worth two weeks of bug-hunt later.
- **The IL2CPP / BinaryFormatter recovery silently no-op'ing on Switch would not have been caught.** Static analysis on Editor builds passes. The bug only shows up at runtime on a Switch dev kit. `/code-review-gamestack` knows the bug family.

Where gamestack didn't help:

- **The journal mechanic itself.** The decision to make the journal *typed* rather than menu-selected was the developer's. No skill would have surfaced it; no skill argued for or against it. The week-1 expansion proposal was the only assist, and it surfaced the mechanic once the developer's pitch had named it.
- **The art direction.** The developer's aesthetic was their own. `/plan-art-direction` rated it 9 on style coherence — the rating was honest, but the *taste* came from the developer.
- **The relationship with the beta playtesters.** Recruiting them, scheduling them, reading their feedback charitably — that's craft. The skills capture the technical signal; the human signal is the developer's job.
- **The decision to ship.** No skill says "this is ready." `/publish`'s gates pass-fail; the developer decided readiness.

The skills did not write Lighthouse Keeper. They surfaced the questions the developer would otherwise have asked late, persisted the answers across 30 weeks of solo work, and kept the right specialist on the keyboard at the right time.

## Numbers

Concrete-feeling, not load-bearing. Treat these as one game's signal, not industry standards.

- Wishlists at launch: in the low-thousands range.
- Reviews day 1: 18; week 1: 134; month 1: ~470.
- Recent review % at month 1: 93% positive.
- Refund rate month 1: 7.4% (below Steam narrative median ~10%).
- Crash rate via Sentry: 0.18% sessions.
- Steam Deck Verified granted day 18.
- Switch lotcheck: cleared on first attempt.
- Hotfixes month 1: 1 (v1.0.1, chapter checkpoint thread).
- Time saved estimate (developer's own retrospective): 6–8 weeks across the production, mostly in the cert prep window and the post-prototype "is this fun" months. Hardest to quantify but the developer believes the most valuable.

## Related

- [`/design-jam`](../../skills/design-jam/SKILL.md) — pitch pressure test.
- [`/plan-creative-director`](../../skills/plan-creative-director/SKILL.md) — surfaced the journal expansion.
- [`/autoplan`](../../skills/autoplan/SKILL.md) — the seven-discipline plan pass.
- [`/scene-prototype`](../../skills/scene-prototype/SKILL.md) — Unity scaffolding for the morning rounds.
- [`/critique --lens=fun`](../../skills/critique/SKILL.md) — the kernel check at week 8.
- [`/playtest`](../../skills/playtest/SKILL.md) — SDK-driven scenarios from week 10 onward.
- [`/code-review-gamestack`](../../skills/code-review-gamestack/SKILL.md) — runtime bugs, allocation patterns, IL2CPP gotchas.
- [`/critique --lens=feel`](../../skills/critique/SKILL.md) — the typing polish and the "do not add shake" guardrail.
- [`/balance-review`](../../skills/balance-review/SKILL.md) — honest "mostly inapplicable" verdict on a narrative game.
- [`/asset-audit`](../../skills/asset-audit/SKILL.md) — atlas budget violations caught in CI from week 15.
- [`/critique --lens=perf`](../../skills/critique/SKILL.md) — Steam Deck regressions at week 20.
- [`/critique --lens=onboarding`](../../skills/critique/SKILL.md) — the "sign the log" reframe at week 23.
- [`/critique --lens=pacing`](../../skills/critique/SKILL.md) — the hollow ending fix at week 24.
- [`/critique --lens=a11y`](../../skills/critique/SKILL.md) — Xbox-grade a11y from the start.
- [`/cert-readiness`](../../skills/cert-readiness/SKILL.md) — Switch lotcheck audit at week 27.
- [`/cert-freeze`](../../skills/cert-freeze/SKILL.md) — write-locking the build through submission.
- [`/steam-page-review`](../../skills/steam-page-review/SKILL.md) — Library hero, trailer recut, Cozy tag.
- [`/publish`](../../skills/publish/SKILL.md) — eight pre-publish gates.
- [`/launch-day`](../../skills/launch-day/SKILL.md) — verbose-intent discipline on Tuesday morning.
- [`/post-launch-monitor`](../../skills/post-launch-monitor/SKILL.md) — daily digest for 30 days.
- [`/patch-notes`](../../skills/patch-notes/SKILL.md) — two-audience release writing for v1.0.1.
- [`/post-mortem`](../../skills/post-mortem/SKILL.md) — day-30 retro.
- [`gamestack-asset-audit`](../../bin/impl/asset-audit/README.md) — CI atlas budget gate from week 15.
- [`gamestack-game-benchmark`](../../bin/impl/game-benchmark/README.md) — CI perf baseline at week 15.
- [`gamestack-cert-checklist`](../../bin/impl/cert-checklist/README.md) — CI Switch cert gate at week 30.
- [`gamestack-playtest-daemon`](../../bin/impl/playtest-daemon/README.md) — CI cert scenarios at week 30.
- The Unity SDK: [`engines/unity/README.md`](../../engines/unity/README.md).
- Prior tutorials: [howto-first-game-in-an-hour](../howto/howto-first-game-in-an-hour.md), [howto-cert-walkthrough](../howto/howto-cert-walkthrough.md), [howto-launch-day](../howto/howto-launch-day.md).
