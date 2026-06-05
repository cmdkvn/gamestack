# gamestack roles catalog

gamestack turns Claude into a virtual game studio. Each slash command embodies a specialist — a Creative Director who pressure-tests pitches, a Polish Coach who hunts under-juiced moments, a Live Ops who reads Steam reviews so you don't have to. The skill catalog in [`./skills.md`](./skills.md) is organized by *skill*, one entry each. This catalog is organized by *role*, because most specialists show up at more than one phase of the pipeline.

Read it as the implicit org chart of the studio behind the keyboard. The Creative Director who pitched the game at week zero is the same Creative Director who looks at the design doc at week six and asks "is this the most interesting version?" Different skill, same job. Knowing who each specialist is — not just what each skill does — makes it easier to know which one to call when you're stuck. Voice is senior, opinionated, and skeptical, same as the rest of the catalog; if a role description below reads as marketing copy, that's a bug — file it.

---

## Pitch

### Creative Director

Names what the game is before any code or art exists. Owns the pitch through its riskiest moment — the gap between "I want to build a game about X" and a doc concrete enough that the rest of the studio can act on it.

- [`/design-jam`](../skills/design-jam/SKILL.md) — six forcing questions (core verb, one-screen pitch, target player, kernel of fun, X-meets-Y references, 8-week cut list) that pressure-test a brand-new idea or pivot.
- [`/plan-creative-director`](../skills/plan-creative-director/SKILL.md) — rereads the design doc once it exists and asks whether it's the *most interesting* version of itself. Four modes auto-selected from signals in the plan: Scope-Up, Selective Expansion, Hold Scope, Reduction.

The two skills represent the role at two distinct moments. `/design-jam` is the Creative Director listening to a verbal pitch — fast, forcing, mostly diagnostic. The output is a sharper sentence and a cut list. `/plan-creative-director` is the same person reading the design doc the developer wrote off the back of that conversation — slower, more surgical, willing to recommend scope changes that re-architect what's been planned. The hand-off rule is strict: the Creative Director never reviews a doc that doesn't exist (`/plan-creative-director` redirects to `/design-jam`), and never re-pitches a doc that's already been pressure-tested (`/design-jam` redirects to `/plan-creative-director`).

How the role thinks. Every game has a kernel — one moment, one verb, one sensation — and everything else is in service of it. The Creative Director's job is to find that kernel before the team builds around the wrong thing. Politeness is not the value-add; "this idea isn't there yet, here's why, here's what to try next" is the kindness. The role treats scope as a moral question: a multi-genre 24-month plan for a solo dev isn't ambitious, it's a slow-motion failure to ship. Reduction is always on the table.

### Prototype Critic

Looks at the first playable build and tells the truth about whether the fun is there. Names the kernel if it exists, kills the mechanics that don't earn their slot, recommends three sharpening directions.

- [`/find-the-fun`](../skills/find-the-fun/SKILL.md) — four diagnostic questions before any opinion forms (one specific working moment, one specific bad moment, what a playtester did with their hands, how long the dev has lived inside the prototype). Returns a kernel verdict, a dead-mechanics list, and three sharpening paths.

How the role thinks. A prototype is a question, not a thesis. The Prototype Critic refuses to praise mechanics that haven't produced a working moment yet — dead mechanics dilute the live ones, and the kindest move is to tag them and propose cuts. If question one ("what's the one specific moment that worked?") returns nothing concrete, the kernel isn't there yet and the role says so plainly. The three sharpening directions are always concrete enough to start tomorrow: a specific verb to deepen, a specific subsystem to strip, a specific minute to surround with anticipation and consequence.

---

## Plan

The plan phase is where most indie games quietly fail — not at concept, not at execution, but in the months between when the wrong mechanics get built. Six plan-stage specialists pressure-test the documents before the build phase makes them expensive to change. They share a discipline: every critique ends in a concrete next action.

### Lead Game Designer

Locks the core loop and plots the player's skill curve from minute 1 to hour 100. Kills dead mechanics at the plan stage so they don't get built.

- [`/plan-game-design`](../skills/plan-game-design/SKILL.md) — articulates the 30-second loop, fills the skill-curve table at minute 1, hour 1, hour 10, hour 100, and pressure-tests progression / difficulty / win-loss / replay against the loop.

How the role thinks. Three well-tuned mechanics beat ten loosely-related ones. Complexity is not depth. The hour-10 mid-game row is where indie plans go vague — pressing on it is the value of the role. If the developer can't say what unlocks at hour 10, the design plateaus there, and the back half of the game will be built on guesswork. The role treats every documented mechanic as guilty until it proves it connects to the loop.

### Narrative Designer

Pressure-tests the story plan before any dialogue is written. Voice cards, exposition pacing, branching mechanics, emotional beats, localization plan.

- [`/plan-narrative`](../skills/plan-narrative/SKILL.md) — audits beats and characters for voice drift, info-dumps, emotional beats out of phase with gameplay, branching combinatorics, and hardcoded English strings.

How the role thinks. Voice drift is the failure mode that compounds over thirty hours of writing. The role insists on a voice card for every major character — three adjectives and a sample line that nobody else could plausibly say — because cards are the only durable defense. "Karma" is not a state system; "+1 trust with Marin, tracked per chapter" is. Narrative without state design becomes narrative without consequence; the role refuses to validate the former.

### Level Designer

Designs world structure and pacing before levels are playable end to end. Builds a tension graph from the plan and flags monotony zones, spike clusters, hollow middles, and gating-dependency hell.

- [`/plan-level-design`](../skills/plan-level-design/SKILL.md) — assigns tension, skill demand, and narrative density (1-10) to each major beat, plots three lines over planned runtime, audits wayfinding.

How the role thinks. Pacing is the most-failed dimension in indie games — strong mechanics ship into flat content and die of boredom at hour 3. The role designs wayfinding rather than discovering it; if the developer can't articulate how the player knows where to go in a space, that's the finding. Critical-path estimates are a forcing function: if the audit says the game is 6 hours and the plan says 10, the missing 4 hours are usually backtracking with no payoff.

### Art Director

Rates the art direction plan 0-10 across eight dimensions and edits the plan to reach 10. Surgical, opinionated, allergic to vibes-only planning.

- [`/plan-art-direction`](../skills/plan-art-direction/SKILL.md) — rates style-in-a-sentence, reference specificity, color discipline, silhouette readability, asset budget realism, animation language, VFX policy, and AI-slop resistance.

How the role thinks. Generic vibes like "dark fantasy" score 4 or below. References must name what's being borrowed from each source — "from Hollow Knight, the silhouette discipline; from Hyper Light Drifter, the palette compression" — not just listed as inspirations. The AI-slop scan is the unsentimental part: floating fingers, plasticky materials, intricate patterns with no underlying logic. The role would rather a small, owned style than an ambitious unowned one.

### Audio Director

Pressure-tests the audio plan before composition or implementation begins. SFX taxonomy, adaptive music structure, mix priority, diegetic policy, accessibility, tooling.

- [`/plan-audio-direction`](../skills/plan-audio-direction/SKILL.md) — audits five things that can't be added late: taxonomy, music structure, mix priority, tooling (FMOD/Wwise/native), accessibility (subtitles on by default, independent bus sliders, mono output).

How the role thinks. Indie games that ship with "we'll add audio at the end" universally feel half-finished. The cost of locking taxonomy and music structure at plan stage is hours; the cost of retrofitting them after composition begins is months. Loudness targets get proposed if absent — without them the final master breaks every intentional balance. Adaptive vs static is a *composition* choice, not just an implementation choice; deferring it means the composer writes the wrong thing.

### Technical Designer

Locks the architecture before significant engine work begins. The role's job is to surface the technical assumptions that, if left implicit, become expensive to reverse after sprint three.

- [`/plan-tech-design`](../skills/plan-tech-design/SKILL.md) — eight gates: engine + exact version, ASCII state machines (player/AI/dialog/save/game-state), traced data flow with thread + frequency annotations, per-platform frame budgets in milliseconds, save format with version field + atomic writes, asset pipeline, cross-platform abstraction, test strategy.

The role doesn't write engine code — it writes the diagrams that constrain engine code. ASCII state machines are deliberately low-fidelity; they force the developer to articulate state, transition, and side-effect in a form that fits on one screen. A state machine that doesn't fit on one screen is too complex for a solo dev to maintain.

How the role thinks. The Technical Designer assumes future-self is a stranger who will read the plan and want to know *why* the choices were made. Save format gets a version field because schema migration without one is data loss. Frame budgets get stated per-platform because "60 fps" without "on which hardware" is wishful thinking. Console-specific items (Switch suspend/resume, DualSense haptics, Quick Resume) get called out at plan time because surfacing them at cert is a week's resubmission cost. The role is allergic to "we'll figure it out" — that phrase is a synonym for "we'll re-architect it under deadline."

### Review Pipeline

Meta-role. Runs the seven plan specialists in sequence, auto-skips the inapplicable, applies obvious fixes from encoded studio principles, and surfaces only the taste decisions and top risks to the developer.

- [`/autoplan`](../skills/autoplan/SKILL.md) — Creative Director → Game Design → Narrative → Level → Art → Audio → Tech, in order, with cross-discipline reconciliation (art budget vs tech frame budget, narrative pacing vs level pacing, audio music states vs emotional beats).

How the role thinks. The developer's attention is the scarcest resource. A pipeline that surfaces every finding from every skill exceeds the developer's review budget and gets ignored. The role's job is curation: which findings need a human call, which can be auto-applied from encoded studio policy (subtitles default ON, save version field, `.meta` committed), and which conflicts between disciplines require taste. Per-discipline reports land under `design/reviews/` as durable references; the chat surface stays short enough to read in 10 minutes.

---

## Build

Build-phase specialists turn locked plans into concrete artifacts: production-grade art bibles, engine scaffolding, first-pass dialogue.

### Concept Artist

Writes the production art bible the rest of the pipeline references. Ten sections, four of them load-bearing: style statement, reference library structure, palette as hex table, per-character silhouette tests.

- [`/art-bible`](../skills/art-bible/SKILL.md) — production-grade asset specification a contractor, junior artist, or image generator can produce on-spec from without a meeting.

How the role thinks. The bible is hand-wave-free or it isn't a bible — every section ships a rule, not a vibe. Palette gets hex codes and slot names because "warm tones" doesn't help an artist who's not in the room. Silhouette tests get run at target resolution because pixel art that reads at 64×64 may collapse at 16×16. The role refuses to start the bible if `/plan-art-direction` hasn't cleared 8+ ratings — bibles built on weak plans are re-dos.

### Visual Explorer

Structured visual exploration. One axis per variant, capture taste, iterate, cap at three rounds.

- [`/art-shotgun`](../skills/art-shotgun/SKILL.md) — 4-6 prompt variants per subject (key art, character concept, scene vignette, Steam capsule), with per-axis isolation and persistent taste capture via the [`gamestack-taste-update`](../bin/impl/taste-update/README.md) CLI.

How the role thinks. Multi-axis variation produces six different vibes that teach the developer nothing. The discipline is one axis at a time — time of day, lighting, color emphasis, composition, density, stylization, emotion — pick one and hold the others constant. The feedback loop is the point: capture what won, what lost, sharpen the next round. If round three doesn't converge, the subject definition was wrong and the role surfaces that rather than running a futile round four.

### Engine Builder

Takes a locked design and emits engine scaffolding. Auto-detects Unity / Godot / Unreal / GameMaker / Bevy from project markers, ships a script skeleton plus a setup checklist for the editor steps that can't be automated.

- [`/scene-prototype`](../skills/scene-prototype/SKILL.md) — Unity C# component, Godot `.tscn` + GDScript, Unreal class stub, Bevy systems. Everything compiles clean.

How the role thinks. Text artifacts only. The role never emits binary Unity prefab YAML or Unreal `.uasset` — those formats are version-fragile and editor-coupled. Godot `.tscn` is text-format and stable, so it's fair game. Placeholders go inside methods (`// TODO: implement movement`), never as malformed syntax. The kit honors `design/tech-design.md` conventions — no singletons sneaking in if the plan said no singletons.

### Game Writer

Drafts first-pass dialogue from beats + voice cards. Auto-detects the project's dialogue format (Yarn, Ink, Dialogic, engine-native) and emits in that format rather than introducing a new one.

- [`/dialogue-write`](../skills/dialogue-write/SKILL.md) — voice-consistent first-pass with character tags, subtext over exposition, ≤2 sentences per line, one info per scene maximum.

How the role thinks. The first pass exists to be revised; producing publishable lines on the first pass wastes effort on dialogue that gets cut. The role refuses to fabricate lore — if a fact isn't in design docs, it surfaces as an open question rather than gets invented. Voice cards are non-negotiable input; without them the dialogue drifts on line three. The role's deference to the project's existing format (Yarn beats Ink if both exist, engine-native beats either if neither has been chosen) is deliberate — introducing a fourth dialogue runtime to a project mid-stream is a self-inflicted month-long detour.

---

## Review

Review-phase specialists catch the bugs CI misses, find the dominant strategies and dead choices in the balance tables, audit asset budgets before milestone gates, and edit drafted dialogue against voice cards.

### Senior Gameplay Engineer

Reviews game code with engine-specific bug families in mind. Auto-fixes the obvious; surfaces the rest for the developer to triage.

- [`/code-review-gamestack`](../skills/code-review-gamestack/SKILL.md) — allocation in `Update()`, off-thread API calls, signal/event leaks, frame-budget violations, tick-order assumptions, save-data corruption patterns. The `-gamestack` suffix avoids collision with Claude Code's built-in `/code-review`.

How the role thinks. Game runtime bugs differ from web bugs. Style and indentation are not the role's concern. Per-frame allocations are. Signal subscribers that outlive their publisher are. Thread-affinity violations (texture upload off the render thread) are. The role auto-applies the small, reversible fixes (missing `[SerializeField]`, unused-event leaks) and surfaces the rest for human judgment — it never auto-edits anything cert-affecting or anything in `Save/`.

### Debugger

The Iron Law: no fix without investigation. Traces data flow, names one falsifiable hypothesis at a time, stops after three failed fixes to force a re-think.

- [`/bug-hunt`](../skills/bug-hunt/SKILL.md) — ten bug families (state machine, tick order, allocation/GC, off-thread, save/serialization, input, signal leak, rendering, audio, engine quirk). Pin the family in the opening line.

How the role thinks. "Just try something" is the path to three days of compounding wrong fixes. The role refuses to propose a fix without a hypothesis that could be falsified by a single test. After three failed fixes in the same family, the role stops and surfaces the count — the family was probably wrong, and continuing to swing at the same family for a fourth time is how silent regressions land. Engine bugs are almost always project code; the role doesn't blame the engine first.

### Systems Designer

For games with numbers (combat, economy, progression, crafting). Pulls config tables, runs Monte Carlo on outcomes, identifies dominant strategies and dead choices, proposes specific numeric edits.

- [`/balance-review`](../skills/balance-review/SKILL.md) — four properties of a balanced system (no dominant strategy, no dead choices, real trade-offs, transparent failure modes); per-system audits with concrete numeric proposals.

How the role thinks. If the tables aren't in structured form (JSON, CSV, ScriptableObject), that's the top finding — you can't pressure-test hardcoded constants. Proposed edits are concrete: not "tune weapon B," but "raise weapon B damage 18→23 OR lower cost 50→35; either brings it within 10% of weapon A's cost-effectiveness." The role audits one system at a time — cross-system passes come later, after the per-system numbers settle.

### Narrative Editor

Audits drafted dialogue for voice consistency, info-dump density, "as you know" anti-pattern, exposition pacing, and per-node length budgets. Reads voice cards as the source of truth.

- [`/dialogue-review`](../skills/dialogue-review/SKILL.md) — five failure modes priority-ordered (voice drift, info dumps, "as you know" lines, exposition pacing, length-over-budget).

How the role thinks. The longer the project, the worse voice drift gets — the role's job is to catch it before it becomes 30 hours of revision. When two characters sound the same, the writing is failing, and the role refuses to soften that verdict. Exposition has a 60-90 second per-block budget; anything denser is an info-dump masquerading as a scene. The role reads voice cards as the source of truth and treats a missing card as a `/plan-narrative` redirect — auditing without cards is unreliable.

### Technical Artist

Walks the project's asset folder before milestone gates and flags per-platform budget violations.

- [`/asset-audit`](../skills/asset-audit/SKILL.md) — per-platform budgets (PC / Switch / mobile / web), atlas waste, audio bitrate mismatches, mesh poly outliers, naming-convention violations, Unity `.meta` integrity catastrophes. CI wrapper: [`gamestack-asset-audit`](../bin/impl/asset-audit/README.md).

How the role thinks. Per-platform budgets vary by an order of magnitude — Switch handheld at 1024×1024 max texture, web portal at 512×512 and 50 MB total load. The role always audits against the tightest target; passing the tightest passes the rest. Never auto-rename, never auto-resize — asset changes touch importer settings and break references. Surface as proposals. Unity `.meta` files in `.gitignore` is P0 — GUID references break across scenes and prefabs.

---

## Playtest

Playtest-phase specialists exercise the build. Game feel, pacing, onboarding, accessibility, performance, and live SDK-driven play.

### Polish Coach

Audits game feel against the strength of the core loop. Hunts both under-juiced and over-juiced moments — juice that masks a weak loop is a polish failure, not a polish success.

- [`/game-feel-audit`](../skills/game-feel-audit/SKILL.md) — eight dimensions per primary verb: animation curves, hit-pause, screen-shake, particles, audio sweeteners, camera response, haptics, input forgiveness (jump buffer, coyote-time).

How the role thinks. Calibrated juice differentiates the indie game that gets screenshotted from the one that doesn't. The inverse is equally true: constant shake, particle storms on pickups, rumble always-on are tells that the verb itself isn't carrying. The role refuses to polish a weak verb — polish never rescues a verb that hasn't earned its slot. Hit-pause sits at 30-80 ms on real impacts and never on minor events; the role treats the shake budget as finite and audits whether it's being spent on the right moments.

### Pacing Designer

Builds a tension graph from implemented content and flags monotony, spike clusters, hollow middles, fatigue compound, and narrative misalignment.

- [`/pacing-review`](../skills/pacing-review/SKILL.md) — segments playtime into 5-10-minute beats, scores each beat 0-5 on skill demand, stakes, and density. Three-line ASCII graph.

How the role thinks. Three variables must oscillate on different cycles: skill demand, stakes, density. When they move together, the game is constantly boring or constantly exhausting. The role's recommendations frequently *cut* content rather than add it — a hollow middle is a structural problem, and routing the player to the next major beat earlier beats stuffing the gap with filler. Pacing is the most-failed indie dimension; strong mechanics ship into flat content and die of boredom at hour 3.

### First-60-Seconds Critic

Times new players to first-verb, first-decision, first-reward, first-failure, "I get it." Compares against genre retention benchmarks.

- [`/onboarding-audit`](../skills/onboarding-audit/SKILL.md) — five timed thresholds (first verb under 10s, first decision under 30s, first reward under 60s, first failure 5-10 min, "I get it" by 15 min) plus a friction count (tutorial modals, unskippable cutscenes, "Press X" prompts) and a trailer-to-first-30-seconds alignment check.

How the role thinks. Steam's 2-hour refund window means onboarding determines half of refunds. Demos that don't hook in 15 minutes don't earn wishlists. The role is about getting the player *to* the fun, not generating it — if the kernel itself is unclear, the role redirects to `/find-the-fun`. Every unskippable element is a player-exit candidate; the role treats the friction count as the leading indicator of refund rate.

### Accessibility Consultant

Full audit against the Game Accessibility Guidelines. Top-4 focus: remapping, text scale, colorblind modes, subtitles/CC.

- [`/a11y-audit`](../skills/a11y-audit/SKILL.md) — basic + intermediate + advanced GAG tiers, with Xbox-tuned P0 routing (Xbox has the strictest a11y cert of the three consoles). Outputs a developer TODO and a public-facing Steam-page report.

How the role thinks. Top-4 ship or it doesn't ship. The role refuses to soften that — text scaling at 1.5× that breaks the UI is a launch blocker, not a v1.1 item. Subtitles default ON is non-negotiable; the cost of changing one config value is hours, the cost of cert resubmission is a week. The role splits findings into two artifacts deliberately: developer TODO is engineering work, public-facing report is marketing work, and they read differently.

### Performance Engineer

Captures perf snapshots and diffs against a baseline. Identifies regressions, proposes investigation paths, never fixes.

- [`/perf-benchmark`](../skills/perf-benchmark/SKILL.md) — frame rate (avg, 99th, 0.1th), frame-time distribution, draw calls, GC allocations, scene-load time, peak memory. Tagged by scene + activity + platform + build mode. CI wrapper: [`gamestack-game-benchmark`](../bin/impl/game-benchmark/README.md).

How the role thinks. A perf number without a scenario is meaningless. Average FPS hides the stutter that the 0.1th-percentile frame time catches; the role measures both. Regressions flag at -5% avg FPS, +10% 99th-pct frame time, any per-frame allocation increase, +5% memory peak. The role proposes hypotheses (per-frame `new ParticleParams()` in the burst manager) and investigation paths (pool the params struct) but stops short of auto-fixing — perf fixes touch hot paths and need human review.

### QA Lead

Drives a running Unity / Godot build via the gamestack engine SDK. Reads `/state`, posts inputs, captures screenshots, save-fuzzes, hits semantic breakpoints, files regression scenarios.

- [`/playtest`](../skills/playtest/SKILL.md) — phase-aware scenario selection (Prototype / Vertical Slice / Production / Polish / Cert / Launched), nine step primitives, degrades to offline static analysis when the SDK isn't installed. CI wrapper: [`gamestack-playtest-daemon`](../bin/impl/playtest-daemon/README.md).

How the role thinks. The QA Lead is the only specialist in the studio who exercises the live build via real inputs. Findings are severity-tagged (P0 crash / cert / save corruption, P1 clear bug, P2 smell). Every confirmed P0/P1 spawns a trimmed regression scenario that joins the smoke suite — the role's permanent contribution is the growing scenario library, not just the per-session bug log. The role refuses to auto-apply fixes on cert-affecting code; that's surfaced and waits for human review.

---

## Ship

Ship-phase specialists move the build from "done" to "live": cert audits, marketing-page reviews, release engineering.

### Platform Cert Officer

Walks PS5 TRC, Xbox TCR/XR, and Switch lotcheck against the public-knowledge high-failure categories. Catches the 80% of common failures *before* the developer hits submit.

- [`/cert-readiness`](../skills/cert-readiness/SKILL.md) — per-platform category walks with PASS / PASS_CODE_ONLY / NEEDS_LIVE_TEST / FAIL_P0 / FAIL_P1 / N/A verdicts. CI wrapper: [`gamestack-cert-checklist`](../bin/impl/cert-checklist/README.md).

How the role thinks. The role is explicit about what it's *not* — it's not a substitute for the NDA-protected checklist on the developer portal. It's the public-knowledge sweep that catches sleep/resume, controller disconnect, save corruption, localization clipping, age rating consistency before the queue accepts a submission that will fail. One avoided rejection saves a week. The role's verdicts are conservative — `PASS_CODE_ONLY` exists because "the code looks right" without a live cert-class playtest in the last 30 days is not the same as `PASS`.

### Marketing Lead

Audits the Steam page against current top-sellers in the primary genre tag. Capsule artwork specs, trailer pacing, short-description hook, tag strategy, screenshots.

- [`/steam-page-review`](../skills/steam-page-review/SKILL.md) — every capsule slot validated against current Steam specs (Header 460×215 through Library hero 3840×1240 and the often-skipped Library logo), trailer audited against first-6-second discipline, tags cross-referenced against five top-sellers in the same micro-genre. CI wrapper: [`gamestack-steam-page-check`](../bin/impl/steam-page-check/README.md).

How the role thinks. Steam shoppers traverse browse → page → above-fold → below-fold; each layer's job is the next click. The first six seconds of the trailer auto-play in the storefront and they're the entire conversion funnel — the role refuses to validate trailers that lead with a studio card or a fade-up. Missing Library hero and Library logo mean the game looks unfinished in player libraries post-purchase; the role flags those as P0. Tag strategy is downstream of competitive analysis, not vibes.

### Release Engineer

Verifies pre-publish gates, bumps semver, builds per target, re-runs the last-mile cert checklist, uploads where automation is safe, opens the patch-notes PR, updates ROADMAP.md.

- [`/publish`](../skills/publish/SKILL.md) — eight pre-publish gates that all must pass: cert green for the target, no failing regression scenarios, tests passing, version not already shipped, working tree clean, build from a tagged commit, not-Friday-after-2-pm, documents current.

How the role thinks. Any failure halts the publish — the role reports what failed and exits rather than carrying forward with a "we'll fix that part." Console partner portals never auto-upload; the role surfaces the build path and the manual upload checklist because human-eyes review of binary metadata is non-negotiable. Friday afternoons are blocked by default for the same reason: the cost of a launch-weekend rollback is real, and "just this once" is exactly the mindset that produces them.

---

## Reflect

Reflect-phase specialists turn the launch into durable studio knowledge. Patch notes, post-mortems, persistent memory.

### Live Ops

Reads Steam reviews so you don't have to. Daily digest of post-launch signal, flagged GREEN / YELLOW / RED / EMERGENCY.

- [`/post-launch-monitor`](../skills/post-launch-monitor/SKILL.md) — six signals against baseline: recent vs all-time review %, crash rate (Backtrace/Sentry or proxy via review mentions), refund rate against Steam's genre median, player count decay, community complaints by category, wishlist conversion.

How the role thinks. The role is for the developer who's too anxious to open the dashboards. Recent vs all-time review % are never averaged — they live in different bands. A loud minority is loud, a majority is data, and the role refuses to conflate them. The digest surfaces only signal worth acting on — a green day reads as one line, a red day reads as the action that needs to ship today. The cadence drops from daily to weekly after the first 30 days, when the patterns stabilize.

### Technical Writer

Drafts player-facing patch notes in the game's voice and a separate dev-facing changelog. Two audiences, two registers, never merged.

- [`/patch-notes`](../skills/patch-notes/SKILL.md) — reads the diff, closed issues, playtest runs in the window, and the current `CHANGELOG.md` top entry for format precedent. Classifies each commit by audience (player / dev / both), bucket, magnitude.

How the role thinks. Player notes match the game's voice (cozy, dry, melodramatic — whatever the voice cards say), lead with what players *feel*, and never bury balance nerfs in corporate hedging. "Bow-only runs are a little harder now" beats "Bow damage values rebalanced for improved variety." Dev changelog uses Keep-a-Changelog buckets, present tense, one line per change, PR numbers when they exist. The role drafts; the developer posts.

### Eng Manager

Weekly retro or post-launch retro. Blameless, specific, actionable. Every "wrong" gets paired with a "differently."

- [`/post-mortem`](../skills/post-mortem/SKILL.md) — reads the week's diff, closed PRs, playtest runs, perf benchmarks, ROADMAP items that were supposed to ship. Names systems, not people. Includes wins.

How the role thinks. A solo retro isn't corporate ritual — it's how a one-person studio learns from itself instead of repeating last sprint's slip. Blameless: name the system, not the person (in a solo studio those collapse, which is exactly when the discipline matters). Specific: "build size jumped 240 MB because the LFS migration didn't update `.gitattributes`," not "asset issues." Solo retros that read as failure lists are demoralizing and unsustainable, so the role insists on wins alongside losses.

### Memory

Persists generalizable lessons across sessions. Engine quirks, bug patterns, taste, workflow shortcuts, process learnings, reference facts.

- [`/learn`](../skills/learn/SKILL.md) — six types, three fields (TYPE, WHEN, LESSON). Auto-fires at the end of `/post-mortem`, `/bug-hunt`, and `/art-shotgun` finalization.

How the role thinks. The role is a low-noise note-taker, not an autobiography. Sentiment doesn't qualify. Tutorial-shaped knowledge doesn't qualify. Anything already in `CLAUDE.md` doesn't qualify — the role updates the doc instead. Conflicts with existing records get surfaced as `SUPERSEDED-BY` diffs, never silent overwrites. The role's value compounds across games — a lesson learned on game one becomes a guardrail for game two.

---

## Power tools

Power tools aren't specialists. They're behavioral disciplines — they change *how* Claude works for the rest of the session rather than producing a one-time artifact. Think of them as house rules the studio adopts during a particular stretch (cert prep, launch day, hotfix branch), not as people you call in.

- [`/careful`](../skills/careful/SKILL.md) — pauses before destructive operations (rm, force-push, drop, store upload), surfaces what's lost, asks for explicit confirmation.
- [`/freeze`](../skills/freeze/SKILL.md) — refuses any write outside a named zone. Reads work anywhere; writes get gated.
- [`/unfreeze`](../skills/unfreeze/SKILL.md) — lifts a `/freeze`. Doesn't replay queued writes; they get re-requested.
- [`/guard`](../skills/guard/SKILL.md) — `/careful` + `/freeze` stacked. Standard high-stakes setting.
- [`/cert-freeze`](../skills/cert-freeze/SKILL.md) — opinionated freeze tuned for cert submission windows. Default zone: `build/`, `dist/`, `docs/cert/`, `playtest/cert-readiness/`. Surfaces resubmission cost in concrete terms when the developer wants to escape.
- [`/launch-day`](../skills/launch-day/SKILL.md) — strongest setting. `/guard` plus verbose logging plus a "what could go wrong" surface before every meaningful action. Only on the actual ship day.

How the discipline thinks. Speed is sometimes the second-most-important variable. Reversibility is sometimes the first. Power tools are the studio's way of saying so out loud — once a power tool is active, Claude refuses, pauses, or confirms for the rest of the session rather than carrying forward by default. The compounding rule is strict: confirming one destructive op does not pre-confirm the next. Bundling deletes into a single confirmation is forbidden. The discipline is the value, and the discipline only works if it's uncomfortable.

---

## Reading the catalog as a hiring guide

There are 32 specialist roles in this catalog. A real studio with one person per role would seat about 20 — some specialists fold together at production scale (the same Narrative Designer often writes the dialogue and edits it; the same Technical Designer often does architecture review). The catalog reads as the implicit org chart of a 20-person studio.

For a solo developer, that's the value of gamestack: the team behind the keyboard. The Creative Director who sat in on the pitch on Tuesday is the same Creative Director who reads the design doc on Friday. The Polish Coach who tunes hit-pause is a different specialist from the Performance Engineer who measures whether the new particles blew the frame budget — and both are different from the QA Lead who drives the build to confirm the fix landed. Each call summons a different lens; the lens is the value.

The implicit hierarchy is flat. There is no producer, no studio head, no scrum master — the developer plays those parts, and the specialists are senior individual contributors who give honest, opinionated answers in their domain. When their judgment conflicts (the Art Director wants more asset budget; the Technical Designer says the frame budget can't take it), the developer adjudicates. The catalog doesn't pretend otherwise.

Use this doc when you're stuck on *who to call*. The skill catalog in [`./skills.md`](./skills.md) answers *what each skill does*. ROLES.md answers *what each specialist on your virtual team is for*. The two read as companions: this one for the question "who do I need right now?", the other for "what will they do once I call them?"
