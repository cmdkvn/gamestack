# gamestack skill catalog

Deep-dives on every gamestack skill. Each entry is a short essay on the role the skill simulates — the lens it brings, when to invoke it, and a concrete example of what a session looks like.

The catalog mirrors the pipeline gamestack is built around:

**Pitch → Plan → Build → Review → Playtest → Ship → Reflect** — plus six **power tools** that change *how* Claude works (pause before destructive ops, restrict writes, verbose launch-day logging).

## Reading order

If you're new to gamestack:

1. **Start with [`/design-jam`](../skills/design-jam/SKILL.md)** — the entry skill. Even reading the deep-dive below is useful for thinking about a game idea.
2. **Then [`/find-the-fun`](../skills/find-the-fun/SKILL.md)** — the framing it uses (kernel + dead mechanics + three directions) shows up across other gamestack skills.
3. **Then [`/code-review-gamestack`](../skills/code-review-gamestack/SKILL.md)** — the engine-detection + bug-family taxonomy is reused by [`/bug-hunt`](../skills/bug-hunt/SKILL.md), [`/balance-review`](../skills/balance-review/SKILL.md), and [`/perf-benchmark`](../skills/perf-benchmark/SKILL.md).

The deep-dives are intentionally readable as standalone essays on the role each skill simulates. Even if you never invoke `/design-jam` in a session, reading it is a fast tour of the Creative Director's job.

## Voice

Skills are senior, opinionated, and skeptical. They push back rather than validate. The polite answer to "is this fun?" when it isn't is *"no, here's why, here's what to try next."* If a deep-dive below reads as upbeat marketing, that's a bug — file it.

---

## Pitch

### `/design-jam` — Creative Director

> Six forcing questions that pressure-test the idea before any code or art.

**When to fire.** New game idea, prototype pivot, or any "I want to build a..." conversation. Also the right entry point when the developer can't decide between two directions — the questions force the choice. If a pitch survives `/design-jam`, the rest of the planning pipeline has something concrete to work with.

**The lens.** Six questions, no shortcuts: (1) Core verb in three words. (2) One-screen pitch — a single page a stranger could read. (3) Target player + what they currently do instead. (4) Kernel of fun — the moment the game pays off. (5) Two X-meets-Y references that actually overlap. (6) An 8-week cut list — what would you ship if you had two months. Each question kills the vague answers the previous one let through.

**What a session looks like.** Developer says "cozy farming with combat." `/design-jam` walks them through:

- Core verb is "tending" — combat conflicts.
- Target player currently plays Stardew + Disco Elysium.
- Kernel of fun is the *texture* of plant growth, not the combat.
- 8-week cut: combat goes. The game is about disease propagation in crops.

The pitch leaves the session sharper than it arrived. Code can start.

**Related.** [`/plan-creative-director`](../skills/plan-creative-director/SKILL.md) right after — for the 10-star version of the now-locked pitch. [`/find-the-fun`](../skills/find-the-fun/SKILL.md) once a build exists. [`/plan-game-design`](../skills/plan-game-design/SKILL.md) when mechanics need locking.

---

### `/find-the-fun` — Prototype Critic

> Run on an early prototype to identify the kernel of fun (if any), surface dead mechanics, and recommend three sharpening directions.

**When to fire.** A build exists, at least one human has touched it, and the developer can't tell if it's working. Trigger phrases include "is my prototype fun?" and "what should I focus on next?" Do not use without a build — redirect to `/design-jam` if the developer is still in pitch.

**The lens.** The skill asks four questions before forming any opinion: one specific working moment, one specific bad moment, what a playtester did with their hands and face, and how long the developer has lived inside the prototype. If question one returns nothing concrete, the kernel isn't there yet and saying so plainly is the kindest move. Every implemented mechanic that hasn't produced a working moment gets tagged dead. Dead mechanics dilute the live ones.

**What a session looks like.** Developer pushes a 3-month roguelite prototype. The working moment: a parry that snaps the camera. The dead moments: a crafting tree, three weapon classes, and a hub town nobody returns to. `/find-the-fun` proposes:

- A — Deepen: build five parry variations and playtest each.
- B — Cut and rebuild: strip everything that isn't the parry.
- C — Add the minute: surround the parry with anticipation and consequence.

Recommends B. Names the next playtester: someone who has finished Sekiro.

**Related.** [`/design-jam`](../skills/design-jam/SKILL.md) when the kernel isn't there and the premise needs re-challenging. [`/plan-creative-director`](../skills/plan-creative-director/SKILL.md) when the prototype works and it's time to scope up the bigger version. [`/game-feel-audit`](../skills/game-feel-audit/SKILL.md) once polish phase begins.

---

## Plan

### `/plan-creative-director` — Creative Director

> Rethinks the design doc from "is this the most interesting version of this game?" Four modes auto-selected by signals in the plan.

**When to fire.** After `/design-jam` has produced a design doc and the developer is about to commit to building. The skill is the gate between pitch and production — run it before the codebase grows past throwaway. If no doc exists, redirect to `/design-jam` first.

**The lens.** Four modes, picked from signals: **Scope-Up** when the pitch is timid and generic; **Selective Expansion** when the pitch is solid but missing the one bet that would distinguish it; **Hold Scope** when the shape is right and only risks need surfacing; **Reduction** when the feature list is multi-genre, multi-platform, and clearly 24 months of solo work. When between two modes, pick the more disciplined one. Every critique ends in a concrete next action — no critic without a recommendation.

**What a session looks like.** Developer presents a "cozy survival craft sim with optional combat and roguelike runs." Mode detection: Reduction. The skill walks the feature list and asks "does the kernel survive without this?" for each item. Combat goes. Roguelike runs go. What's left is a survival craft sim with a single dominant fantasy and an 8-week vertical slice. Proposes specific edits to `design/pitch.md`. Waits for confirmation before applying.

**Related.** [`/design-jam`](../skills/design-jam/SKILL.md) when no doc exists yet. [`/plan-game-design`](../skills/plan-game-design/SKILL.md) immediately after to lock the mechanics of the scoped version. [`/autoplan`](../skills/autoplan/SKILL.md) for the full multi-discipline pass.

---

### `/plan-game-design` — Lead Game Designer

> Locks the core loop and pressure-tests the mechanics plan. Plots the player's skill curve and kills dead mechanics at the plan stage so they don't get built.

**When to fire.** Mechanics are documented but not yet implemented. After `/design-jam` and `/plan-creative-director`, before significant engine work begins. If mechanics already ship in a prototype, use `/find-the-fun` instead — this skill is for what's still cheap to cut.

**The lens.** The chain is core loop → skill curve → progression → difficulty → win/loss → replay value. Each link gets articulated and checked against the next. The hour-10 mid-game row of the skill-curve table is where indie plans most often go vague — pressing on it is the value of this skill. Three well-tuned mechanics beat ten loosely-related ones; complexity is not depth.

**What a session looks like.** Developer's tactics-RPG plan lists eight mechanics. The skill articulates the 30-second loop ("move unit, trigger overwatch reaction, spend AP, end turn") and fills the skill-curve table. Hour 10+ reads identically to Hour 5 — plateau. Three mechanics (crafting, dialog choices, weather) don't connect to the loop. Output: cut the three, propose two specific Hour 10+ unlocks (faction switching, combined-arms synergies), surface "no stated difficulty model" as the top finding.

**Related.** [`/plan-creative-director`](../skills/plan-creative-director/SKILL.md) when scope decisions resurface. [`/plan-tech-design`](../skills/plan-tech-design/SKILL.md) next to confirm the systems are architecturally realistic. [`/balance-review`](../skills/balance-review/SKILL.md) once numbers exist in configs.

---

### `/plan-narrative` — Narrative Designer

> Pressure-tests the story plan for voice consistency, exposition pacing, branching mechanics, and emotional beats.

**When to fire.** Beats and characters are outlined but dialogue isn't written. If only a logline exists, redirect to `/design-jam`. If dialogue is drafted, use `/dialogue-review` instead — this skill catches structural problems early, before 30 hours of voice drift accumulate.

**The lens.** Five failure modes: voice drift across long writing periods, info-dumps disguised as dialogue, emotional beats out of phase with gameplay, branching combinatorics that explode in QA, and hardcoded English strings that block localization. Every major character needs a voice card: three adjectives and a sample line that nobody else could plausibly say. "Karma" is not a state system; "+1 trust with Marin, tracked per chapter" is.

**What a session looks like.** Developer's detective game tracks three suspects and four endings. The skill audits voice cards — the detective and a witness read the same. Flags an info-dump in Beat 4 (motive monologue) and proposes splitting it across three environmental finds. Estimates branching QA at 12 path combinations and asks whether the developer can test all of them solo; if not, proposes a canonical-path fallback. Surfaces that strings are not externalized — top finding.

**Related.** [`/plan-creative-director`](../skills/plan-creative-director/SKILL.md) when narrative scope resurfaces. [`/dialogue-write`](../skills/dialogue-write/SKILL.md) once beats are locked. [`/dialogue-review`](../skills/dialogue-review/SKILL.md) after the first draft to audit voice in practice.

---

### `/plan-level-design` — Level Designer

> Pressure-tests world/level design for pacing, navigation, encounter rhythm, and gating logic. Builds a tension graph from the plan.

**When to fire.** Level layouts are sketched or blocked out but not playable end to end. If no level structure exists yet, redirect to `/plan-game-design`. If levels are playable, use `/pacing-review` instead to audit against actual play data.

**The lens.** Pacing is the most-failed dimension in indie games. The skill assigns tension, skill demand, and narrative density (1–10) to each major beat and plots the three lines over the planned runtime. Monotony zones (>15 minutes of similar values), spike clusters (three peaks back-to-back with no rest), and hollow middles get flagged. Wayfinding is designed, not discovered — if the developer can't articulate how the player knows where to go in a given space, that's the finding.

**What a session looks like.** Developer's metroidvania has six regions and a planned 10-hour runtime. The tension graph shows a flat middle third — three regions of similar enemy difficulty and identical gating (key item → door). Critical path estimated at 95%, meaning the game is 6 hours, not 10. Two regions have no stated answer for "how does the player know where to go." Output: propose a hero shot for Region 4, a rest beat after Region 3's boss, and a backtracking-aware sight line in Region 2.

**Related.** [`/plan-game-design`](../skills/plan-game-design/SKILL.md) when dead mechanics surface in specific level contexts. [`/pacing-review`](../skills/pacing-review/SKILL.md) once block-outs are playable.

---

### `/plan-art-direction` — Art Director

> Rates the art direction plan 0-10 across eight dimensions, then edits the plan to reach 10.

**When to fire.** Art direction is documented (style, references, palette, budget) but final assets aren't yet being produced. If only a vague "it'll look like X" exists, redirect to `/design-jam`. If the pipeline is already shipping assets, this skill is too early — the developer is past plan stage.

**The lens.** Eight dimensions, each rated 0–10: style-in-one-sentence, reference specificity, color discipline, silhouette readability, asset budget realism, animation language, VFX policy, and AI-slop resistance. The plan is ready when each scores 8 or higher. Generic vibes like "dark fantasy" score 4 or below — references must name what's being borrowed from each source. AI-slop scan looks for floating fingers, plasticky materials, anachronistic blur, and intricate-pattern-with-no-underlying-logic.

**What a session looks like.** Developer's pixel-art platformer references "Hollow Knight + Hyper Light Drifter." The skill rates: style-in-a-sentence 7, color discipline 4 (no palette hex codes), silhouette readability 9, asset budget 3 (no atlas budget for Switch). Writes the missing palette directly into the plan as an edit proposal, asks the developer to nominate borrowed elements per reference, and flags one Midjourney concept piece with finger anatomy errors — proposes redrawing or committing to the AI look explicitly.

**Related.** [`/plan-creative-director`](../skills/plan-creative-director/SKILL.md) when style direction itself needs rethinking. [`/art-bible`](../skills/art-bible/SKILL.md) once ratings reach 8+ and production-side specification begins. [`/art-shotgun`](../skills/art-shotgun/SKILL.md) for structured visual exploration of specific scenes.

---

### `/plan-audio-direction` — Audio Director

> Pressure-tests the audio plan for SFX taxonomy, adaptive music structure, mix priority, diegetic policy, accessibility, and tooling.

**When to fire.** Audio direction is documented but the pipeline (FMOD/Wwise/engine-native) isn't set up. Indie games that ship with "we'll add audio at the end" universally feel half-finished — the cost of locking taxonomy and music structure at plan stage is hours; the cost of retrofitting them after composition begins is months.

**The lens.** Five things that can't be added late: SFX taxonomy (categories drive thousands of asset decisions), music structure (adaptive vs static affects composition itself), mix priority (without it every sound competes), tooling choice (FMOD vs Wwise vs native locks workflow), and accessibility (subtitles on by default, independent bus sliders, mono output). Loudness targets get proposed if absent — without them the final master breaks every intentional balance.

**What a session looks like.** Developer's narrative adventure plan says "adaptive music, FMOD, voice acted." The skill audits SFX taxonomy — UI and Player categories present, Notifications missing. Pushes for adaptive structure specifics: layered stems vs vertical re-orchestration. Composer is named but no source-file location is stated. Accessibility checklist: subtitles default ON missing, mono-output missing. Both auto-applied as top edits per studio policy. Mix priority proposed as a default the developer can edit.

**Related.** [`/plan-creative-director`](../skills/plan-creative-director/SKILL.md) when audio style itself needs creative-direction input. [`/plan-narrative`](../skills/plan-narrative/SKILL.md) to align music states with emotional beats.

---

### `/plan-tech-design` — Technical Designer

> Locks the architecture: state machines, data flow, frame budget, save format, asset pipeline, cross-platform abstraction.

**When to fire.** Game design is locked (or near it) and the developer is about to commit to engine architecture. Run after `/plan-game-design`, before significant engine work begins. If code is already shipping, use `/code-review-gamestack` instead — this skill is for the choices that are expensive to reverse after the third sprint.

**The lens.** Eight gates: engine + exact version, ASCII state machines for player/AI/dialog/save/game-state, traced data flow (input → state → render with thread and frequency annotations), per-platform frame budgets in milliseconds, save format with version field and atomic writes, asset pipeline (source → import → atlas → runtime), cross-platform abstraction for input/save/achievements, and test strategy. Console-specific items (Switch suspend/resume, DualSense haptics, Quick Resume) get called out now, not at cert.

**What a session looks like.** Developer's plan says "Unity, save to JSON, ship to PC and Switch eventually." The skill flags "Unity" without a version, generates a first-draft player state machine in ASCII from the design doc, proposes a save schema with `version: 1` and a temp-file-rename atomic write, and sets frame budgets at 16.67ms (PC 60) and 33.33ms (Switch handheld 30) with a proposed split. Surfaces three top risks: no test strategy, save-migration policy missing, Switch suspend/resume not addressed.

**Related.** [`/plan-game-design`](../skills/plan-game-design/SKILL.md) when systems-level reconciliation is needed. [`/perf-benchmark`](../skills/perf-benchmark/SKILL.md) to validate frame-budget claims against a real build. [`/cert-readiness`](../skills/cert-readiness/SKILL.md) when nearing ship to audit the console-specific items called out here.

---

### `/autoplan` — Review Pipeline

> Runs Creative Director → Game Design → Narrative → Level → Art → Audio → Tech in order. Auto-detects which apply, applies obvious edits, surfaces only taste decisions.

**When to fire.** A substantial design doc set exists and the developer wants one comprehensive review pass before implementation begins. If only a single discipline changed (e.g., the narrative plan was rewritten), call that `plan-*` skill directly — this skill is for end-to-end coverage, not single-discipline depth.

**The lens.** The developer's attention is the scarcest resource. The pipeline runs seven `plan-*` skills sequentially, collects findings, applies auto-fixes from encoded studio principles (subtitles default ON, save version field, `.meta` committed, frame-budget targets stated), and surfaces only what needs a human call. Cross-discipline reconciliation checks for conflicts: narrative pacing vs level pacing, audio music states vs emotional beats, art asset budget vs tech frame budget, game-design skill curve vs level-design tension graph.

**What a session looks like.** Developer runs `/autoplan` on a vertical-slice-ready design package. The pipeline announces it's skipping `/plan-level-design` (pure-menu game) and runs the other six. Output: Creative Director picked Hold Scope, Game Design flagged a Hour 10+ plateau, Art rated 7 on color discipline (palette hex codes added as auto-fix), Audio added subtitles-default-on as auto-fix, Tech proposed save version field. Cross-discipline conflict: art budget exceeds tech's mobile draw-call ceiling — surfaced as taste decision. Per-discipline reports written to `design/reviews/`. Chat output has 5 taste decisions and top-5 risks, readable in 10 minutes.

**Related.** Any of the seven `plan-*` skills individually when a single discipline needs depth rather than coverage. After autoplan, the per-discipline reports under `design/reviews/` are durable references — cite them in commits and PRs that touch their domain.

---

## Build

### `/art-bible` — Concept Artist

> The production art bible: palette with hex codes, character silhouettes, environment vignettes, naming convention, reference library structure.

**When to fire.** After `/plan-art-direction` rates the plan 8+ on most axes and the developer is ready to produce real assets. Not before — a bible built on a hand-wavy plan is a re-do. The bible exists so a contractor, a junior artist, or an image generator can produce on-spec without a meeting.

**The lens.** Ten sections, four of them load-bearing: style statement in one paragraph, reference library structure with named subfolders, palette as a hex table with slot names, and per-character silhouette tests at the target resolution. The other six (vignettes, naming, animation language, VFX vocabulary, UI conventions, hand-off checklist) build on that foundation. The bible is hand-wave-free or it isn't a bible — every section ships a rule, not a vibe.

**What a session looks like.** Lighthouse-keeper game, `/plan-art-direction` cleared 8+. The skill writes the bible to `design/art-bible.md`: 12-slot palette with `bg-deep`, `fg-key`, `signal-positive` etc., silhouette tests for Marin and Pip at 16x16 (Pip fails — flagged for a color-signature compensation rule), naming pattern `character_marin_default_walk-01.png`, VFX list capped at 10 named effects. Closes with the first batch to produce: hero silhouettes before environment fills.

**Related.** [`/plan-art-direction`](../skills/plan-art-direction/SKILL.md) is the prerequisite — bibles built on weak plans are re-dos. [`/art-shotgun`](../skills/art-shotgun/SKILL.md) for exploring within the bible's constraints. [`/scene-prototype`](../skills/scene-prototype/SKILL.md) once the bible exists and you need engine scaffolding that respects it.

---

### `/art-shotgun` — Visual Explorer

> Structured visual exploration: 4-6 distinct prompt variants per subject, comparison + feedback workflow, persistent taste capture.

**When to fire.** A specific asset needs designing and the developer wants to see options before committing. Key art, character concept, environment vignette, Steam capsule. Skip if the art bible isn't locked — variants without an anchor drift, and you'll explore the wrong space.

**The lens.** One axis per variant. Time of day, lighting, color emphasis, composition, density, stylization, emotion — pick one and hold the others constant. Multi-axis variation produces six different vibes that teach the developer nothing. The skill prompts and structures; the developer runs whatever generator they prefer (Midjourney, GPT Image, SD). The feedback loop is the point: capture what won, what lost, sharpen the next round, and cap at three rounds total. If round three doesn't converge, the subject definition was wrong.

**What a session looks like.** Subject is "Marin in the lighthouse quarters at dawn." Round 1 varies lighting axis: rim, diffuse, silhouette, backlit, direct, ambient. Developer comes back: backlit wins, but cool-cast. Round 2 holds lighting, varies color emphasis. Each round writes to `.gamestack/taste-shotgun.md` and `.gamestack/taste.json`. By round 2, a leading signal (`lighting: backlit`) appears with 4+ samples and 70%+ win rate.

**Related.** [`/art-bible`](../skills/art-bible/SKILL.md) is the prerequisite anchor. [`/plan-art-direction`](../skills/plan-art-direction/SKILL.md) to reopen if exploration reveals the direction itself is wrong. [`gamestack-taste-update`](../bin/impl/taste-update/README.md) is the persistent layer — pipe round events as NDJSON, get time-decayed taste profiles back.

---

### `/scene-prototype` — Engine Builder

> Detects the engine and emits a script skeleton plus setup checklist — Unity C# component, Godot .tscn + GDScript, Unreal class stub, Bevy systems.

**When to fire.** The developer has a locked mockup or design and is staring at an empty Unity hierarchy or Godot scene tree. The kit's goal is the first 30 minutes: drop in the script, wire the inspector slots, press play, see a placeholder render. Push back if the target is vague — a scene prototype on a fuzzy mockup produces a fuzzy kit.

**The lens.** Text artifacts only. The skill never emits binary Unity prefab YAML or Unreal `.uasset` — those formats are version-fragile and editor-coupled. Godot `.tscn` is text-format and stable, so emit it. Everything compiles clean: `dotnet build` for Unity, parse-clean for Godot, `cargo check` for Bevy. Placeholders go inside methods (`// TODO: implement movement`), never as malformed syntax. The kit honors `design/tech-design.md` conventions — no singletons sneaking in if the plan said no singletons.

**What a session looks like.** Detects Unity from `Assets/` + `ProjectSettings/`. Writes `LighthouseScene/LighthouseController.cs` (entry orchestrator with `[SerializeField] private` tunables under `[Header]` groups), `LighthouseConfig.cs` (ScriptableObject), `LighthouseState.cs` (state machine), and `lighthouse-setup.md` listing the GameObject hierarchy to build and the inspector wiring. Ends with the developer's next five steps and known Unity gotchas (IL2CPP stripping, `Resources.Load` path differences).

**Related.** [`/plan-tech-design`](../skills/plan-tech-design/SKILL.md) when the architectural conventions the kit should honor don't yet exist. [`/code-review-gamestack`](../skills/code-review-gamestack/SKILL.md) once the kit is filled in. [`/game-feel-audit`](../skills/game-feel-audit/SKILL.md) once the scene runs and the question is whether it feels right.

---

### `/dialogue-write` — Game Writer

> Produces first-pass dialogue from beats + voice cards. Auto-detects format (Yarn, Ink, Dialogic, engine-native) and emits in that format.

**When to fire.** Narrative beats are locked, voice cards exist, and you need a draft a human editor can revise to final. Not before voice cards — without them, the dialogue drifts on line three. The first pass exists to be revised; producing publishable lines on the first pass wastes effort on dialogue that gets cut.

**The lens.** Voice consistency, subtext over exposition, function plus flavor per line, tight pacing. Every line gets a character tag matching a voice card. No more than two sentences per line. One info per scene maximum — exposition spreads across encounters, never dumps. No invented lore: if a fact isn't in design docs, surface it as an open question rather than fabricate. No `(beat)` or `(pause)` stage directions unless the tool supports them as first-class. The detection lens reads marker files — `*.yarn`, `*.ink`, Dialogic autoload, ScriptableObject patterns — and emits in the project's existing format rather than introducing a new one.

**What a session looks like.** Beat: Marin reveals (without saying so) that they know the storm is coming. Detects Yarn from `*.yarn` files. Drafts three lines to `dialogue/chapter1/marin-storm-warning.yarn`, tags each speaker, adds a NOTES block flagging Pip's line 4 as drifting toward over-articulate. Runtime estimate: 45 seconds at reading pace, within budget.

**Related.** [`/plan-narrative`](../skills/plan-narrative/SKILL.md) when voice cards don't exist yet — that's the gate. [`/dialogue-review`](../skills/dialogue-review/SKILL.md) once the draft is revised, to catch drift before it metastasizes.

---

## Review

### `/code-review-gamestack` — Senior Gameplay Engineer

> Runtime bugs CI misses — allocation in `Update()`, off-thread API calls, signal leaks, save-data corruption. Auto-fixes the obvious.

**When to fire.** Before any playtest. Before a merge to the main branch. Whenever the build runs but feels off. The skill takes a diff (or a path) and walks it with engine-specific bug families in mind — `Update()` allocations in Unity, signal leaks in Godot, async-void in Unreal, tick-order assumptions in Bevy. It auto-fixes obvious issues (missing `[SerializeField]`, unused-event leaks) and surfaces the rest for the developer to triage.

**The lens.** Game runtime bugs differ from web bugs. The reviewer ignores style and indentation; it watches for: per-frame allocations that will spike GC; signal/event subscribers that outlive their publisher; thread-affinity violations (texture upload off the render thread); save-state corruption (writes not atomic, schema migrations that lose data); tick-order assumptions (physics callbacks reading not-yet-updated state). Each finding cites the file and line; each fix proposal is small and reversible.

**What a session looks like.** Run on a Unity PR that adds a particle-burst on hit. The reviewer flags: `Instantiate(prefab)` inside `OnTriggerEnter`, `new Vector3(x, y, z)` in `Update`, and a missing `OnDisable` to unsubscribe from `Health.OnDamaged`. Auto-applies the unsubscribe and the `[SerializeField]` change; surfaces the allocation hot-path for the developer to swap to a pool.

**Why the `-gamestack` suffix.** Claude Code ships a built-in `/code-review`. gamestack's game-specific version coexists rather than shadows it.

**Related.** [`/bug-hunt`](../skills/bug-hunt/SKILL.md) when a finding needs investigation rather than a fix. [`/perf-benchmark`](../skills/perf-benchmark/SKILL.md) when allocations show up at runtime. [`gamestack-asset-audit`](../bin/impl/asset-audit/README.md) when the diff touches importers.

---

### `/bug-hunt` — Debugger

> The Iron Law: no fix without investigation. Traces data flow, names one falsifiable hypothesis, stops after three failed fixes to force a reclassification.

**When to fire.** A reproducible bug whose cause is unclear, or prior fix attempts have made things worse. If the bug isn't reproducible, that's the first finding — make the developer reproduce it before debugging anything. Surface the Iron Law explicitly when the developer asks you to "just try" something; time pressure can override it, but the cost gets logged.

**The lens.** Ten bug families (state machine, tick order, allocation/GC, off-thread, save/serialization, input, signal leak, rendering, audio, engine quirk). Pin the family in the opening line. Trace data flow from producer to symptom before forming a hypothesis. One hypothesis at a time, falsifiable ("Input.GetKeyDown fires twice because OnGUI runs after Update," not "something's wrong with input"). Three strikes and you stop — the family was probably wrong. Don't blame the engine first; it's almost always project code.

**What a session looks like.** Symptom: signal fires twice in Godot. Family: signal leak. Data flow: `_ready()` connects, `_enter_tree()` also connects. Hypothesis: double `connect()` from both lifecycle hooks. Test: log connection count. Confirmed. Fix removes the `_enter_tree()` connect, adds a regression test, appends to `playtest/bug-log.md` with the hypothesis trail.

**Related.** [`/code-review-gamestack`](../skills/code-review-gamestack/SKILL.md) to sweep for related code with the same family of bug. [`/perf-benchmark`](../skills/perf-benchmark/SKILL.md) when the family is allocation or GC and you need numbers to confirm the fix.

---

### `/balance-review` — Systems Designer

> Pulls config tables, runs Monte Carlo, finds dominant strategies and dead choices, proposes specific numeric edits.

**When to fire.** The game has numerical systems (combat, economy, progression, crafting, loot, encounter curves) and balance feels off, or hasn't been pressure-tested before launch, or a major mechanic just changed. Skip for entirely qualitative games — narrative-only without combat or economy. For those, balance is dramatic pacing, which is `/pacing-review`.

**The lens.** Four properties of a balanced system: no dominant strategy, no dead choices, real trade-offs on most decisions, and transparent failure modes when balance breaks. The skill audits one system at a time — cross-system passes come later. If the tables aren't in structured form (JSON, CSV, ScriptableObject), that's the top finding; you can't pressure-test hardcoded constants. Proposed edits are concrete: not "tune weapon B," but "raise weapon B damage 18→23 OR lower cost 50→35; either brings it within 10% of weapon A's cost-effectiveness."

**What a session looks like.** Audit target: combat weapons in a roguelite. Reads `src/Data/weapons.json`. Detects weapon C dominates weapon A (4x damage at 4x cost beats 2x damage at 2.1x cost across all engagement ranges). Flags weapon D as a dead choice — never strictly best. Monte Carlo on drop rates: p10 run completion 14 min, p90 47 min — gap too wide. Writes to `playtest/balance-review/combat-2026-06-04.md` with five prioritized numeric edits.

**Related.** [`/plan-game-design`](../skills/plan-game-design/SKILL.md) if the audit reveals a structural issue rather than a tuning issue. [`/playtest`](../skills/playtest/SKILL.md) to verify the edits in a real session — math says the choices exist, playtest says players see them.

---

### `/dialogue-review` — Narrative Editor

> Audits dialogue for voice drift, info dumps, "as you know" anti-pattern, exposition pacing, and per-node length budgets.

**When to fire.** Dialogue exists in the project and you want it audited before a revision pass. Especially after `/dialogue-write`, but also any time the writing has been drifting through a long chapter. If voice cards are missing, that's the finding — produce them via `/plan-narrative` first. An audit without cards is unreliable.

**The lens.** Five failure modes, priority-ordered: voice drift (the longer the project, the worse it gets), info dumps (backstory as monologue instead of action or environment), "as you know" lines (characters telling each other things both already know), exposition pacing (60-90 second budget per uninterrupted reading block), and length-over-budget (≤20 lines per Yarn node, ≤25 weave entries per Ink knot, ≤30 events per Dialogic timeline). Don't soften the verdict on merged voices — when two characters sound the same, the writing is failing.

**What a session looks like.** Audits `dialogue/chapter1/*.yarn` against voice cards in `design/narrative.md`. Pip and Marin score "strong"; the harbor-master scores "merged with Marin" — same sentence rhythm, same word choices. Flags an info dump at `harbor-meeting.yarn:node_intro` lines 4-9 (six lines of backstory monologue) and proposes splitting across three encounters. Catches one "as you know, the storm always comes after the eclipse" with a rewrite proposal. Top-5 prioritized revisions land in the report.

**Related.** [`/dialogue-write`](../skills/dialogue-write/SKILL.md) for the next beat, with audit findings as guardrails. [`/plan-narrative`](../skills/plan-narrative/SKILL.md) if voice drift is structural — the cards themselves are the problem.

---

### `/asset-audit` — Technical Artist

> Walks the asset tree, measures against per-platform budgets (PC / Switch / mobile / web), flags texture/atlas/audio/mesh/naming violations.

**When to fire.** Before milestone gates (vertical slice, beta, cert) and any time build size feels wrong. Indie builds ship with 8 GB of uncompressed PNGs because nobody atlas-ed the sprite sheets, and Switch projects fail cert because audio bitrates were left at desktop. The CLI wrapper [`gamestack-asset-audit`](../bin/impl/asset-audit/README.md) runs this in CI.

**The lens.** Per-platform budgets vary by an order of magnitude — Switch handheld at 1024x1024 max texture, 256 MB atlas; web portal at 512x512 and 50 MB total load. Always audit against the tightest target; passing the tightest passes the rest. Never auto-rename or auto-resize — asset changes touch importer settings and break references. Surface as proposals. Source files (`.psd`, `.blend`, `.aseprite`) get LFS and don't count toward runtime budget; audit them separately. Unity `.meta` files in `.gitignore` is P0 — surfaces immediately.

**What a session looks like.** Target: Switch handheld. Scans `Assets/`. Finds 14 textures over 1024x1024, three with no compression set, two atlases at 32% packing ratio. Audio: four SFX in stereo at 44.1 kHz that should be mono Vorbis. Naming: 23 violations in `Assets/Sprites/` (spaces, mixed case). Estimated savings: 180 MB. Writes to `playtest/asset-audit/switch-2026-06-04.md` with proposed actions ordered by impact.

**Related.** [`/plan-art-direction`](../skills/plan-art-direction/SKILL.md) when budget violations trace back to a direction that ignored the target platform. [`/cert-readiness`](../skills/cert-readiness/SKILL.md) for the platform-specific cert checks that surface asset-related cert failures. [`/perf-benchmark`](../skills/perf-benchmark/SKILL.md) to confirm budget changes hit the perf budget. [`gamestack-asset-audit`](../bin/impl/asset-audit/README.md) to automate this in CI.

---

## Playtest

### `/game-feel-audit` — Polish Coach

> Audits animation curves, hit-pause, screen-shake, particles, audio, camera response, haptics, and input forgiveness against the strength of the core loop.

**When to fire.** On a working build whose mechanics are mostly locked and the question is "why doesn't this pop?" Also fire when polish is going *on top of* a working prototype — calibrated juice differentiates the indie game that gets screenshotted from the one that doesn't. Don't run this on a non-working prototype; polish never rescues a weak verb.

**The lens.** Eight dimensions, audited per primary verb: animation curves (anticipation / snap / follow-through), hit-pause (30–80 ms on impact, never on minor events), screen-shake budget, particle bursts, layered audio sweeteners, camera response, haptics, and input forgiveness (jump buffer, coyote-time, lenient hitboxes). Crucially, the skill also hunts the inverse — *over-juicing* that masks a weak loop. Constant shake, particle storms on pickups, rumble always-on: these are tells that the verb itself isn't carrying.

**What a session looks like.** Run on a 2D platformer's "wall-jump." The audit flags:

- Linear easing on the wall-push frame — no snap.
- No hit-pause on contact — the wall feels papery.
- Screen-shake fires on *every* jump, not just the wall-jump — shake budget blown.
- No jump buffer; players ragequit at minute 4.
- Coyote-time absent.

Proposed top-3: add 50 ms hit-pause + 4-frame curve snap on wall contact, strip shake from regular jumps, add a 100 ms jump buffer.

**Related.** [`/perf-benchmark`](../skills/perf-benchmark/SKILL.md) after — added VFX/audio can blow the frame budget. [`/playtest`](../skills/playtest/SKILL.md) to drive the audited action live. [`/scene-prototype`](../skills/scene-prototype/SKILL.md) if a missing feedback channel needs a scaffold.

---

### `/pacing-review` — Pacing Designer

> Walks implemented content and builds a tension graph across skill demand, stakes, and density — flagging monotony, spike clusters, hollow middles, fatigue, and narrative misalignment.

**When to fire.** After a content slice exists — vertical slice, beta, or any build where hour 3 starts to feel flat. Pacing is the most-failed dimension in indie games; strong mechanics ship into flat content and die of boredom. For plan-stage tension graphs before content exists, use `/plan-level-design` instead.

**The lens.** Three independent variables that must oscillate on different cycles: skill demand, stakes, and density. When they move together, you get constant boredom or constant exhaustion. The skill segments playtime into 5–10-minute beats, scores each beat 0–5 on the three variables, and renders a three-line ASCII graph. Then it hunts five patterns: monotony zones (3+ flat beats), spike clusters (3+ peaked beats), hollow middles, fatigue compound (rising density without rest), narrative misalignment (emotional beats landing during high-skill demand).

**What a session looks like.** Run on a 4-hour metroidvania's chapter 2. The graph shows density at flat 3 for beats 12–18 — a 35-minute monotony zone of identical enemy encounters in identical corridors. Recommendation: don't *add* content. Cut beats 14–16 entirely and route the player to the boss earlier. The hollow middle is a structural problem, not a content one.

**Related.** [`/plan-level-design`](../skills/plan-level-design/SKILL.md) when monotony traces back to level structure. [`/plan-narrative`](../skills/plan-narrative/SKILL.md) when emotional beats keep landing during fights. [`/onboarding-audit`](../skills/onboarding-audit/SKILL.md) for the first 60 seconds / 15 minutes specifically.

---

### `/onboarding-audit` — First-60-Seconds Critic

> Times new players to first-verb, first-decision, first-reward, first-failure, and first "I get it" — surfaces friction that drives Steam refunds.

**When to fire.** Before launch and before any Next Fest entry. Steam's 2-hour refund window means onboarding determines half of refunds; demos that don't hook in 15 minutes don't earn wishlists. For prototype-stage critique of whether the kernel is fun at all, use `/find-the-fun` — onboarding is about getting the player *to* the fun, not generating it.

**The lens.** Five timed thresholds with genre-adjustable targets: first verb under 10s, first meaningful decision under 30s, first reward under 60s, first failure at 5–10 min, "I get it" by 15 min. Plus a friction count — tutorial pop-ups, unskippable cutscenes, "Press X to continue" prompts, pre-game modals — each one a player-exit candidate. Plus the trailer-to-first-30-seconds alignment check: if the gameplay opening doesn't match the storefront promise, that's launch-disappointment risk.

**What a session looks like.** Run on a narrative-RPG demo. Times: first verb at 47s (target 10s — fail), first reward at 2:30, first failure at 14 min, "I get it" at 28 min. Friction count: 3 unskippable cutscenes, 6 tutorial modals before first combat. Top edit: make the opening cutscene skippable, move controls onto a hint overlay, hand the player a verb in the first screen. Expected effect — refund rate drops from ~18% to ~10%.

**Related.** [`/find-the-fun`](../skills/find-the-fun/SKILL.md) if the kernel itself is unclear. [`/a11y-audit`](../skills/a11y-audit/SKILL.md) for the controller-detection and subtitle-default checks that surface in the first 15 minutes. [`/steam-page-review`](../skills/steam-page-review/SKILL.md) to align the trailer with the improved opening.

---

### `/a11y-audit` — Accessibility Consultant

> Full audit against the Game Accessibility Guidelines (basic, intermediate, advanced), with non-negotiable focus on remapping, text scale, colorblind modes, and subtitles/CC.

**When to fire.** Before launch, before every shipped patch, and during cert prep — especially for Xbox, which has the strictest a11y gate of the three consoles. Also auto-fires near the end of `/autoplan` if no audit has run in 60 days. The output is two files: a developer TODO and a public-facing Steam-page report.

**The lens.** Top-4 ship or it doesn't ship: remappable controls, 1.5×+ text scaling without UI breakage, Deuteranopia/Protanopia/Tritanopia presets plus high-contrast, and subtitles + closed captions with speaker labels and non-dialogue cues. Then the basic-tier GAG checklist (independent volume sliders, no color-only info conveyance, pause), then intermediate (assist mode, save-anywhere, mono-output), then game-specific advanced (photosensitivity warning, dyslexic font, combat slowdown). Failures route to P0 / P1 / P2.

**What a session looks like.** Run on a pixel-art action game shipping to Xbox. Top-4: remapping PASS, text scale FAIL (UI clips at 1.3×), colorblind PARTIAL (only Deuteranopia), subtitles FAIL (default OFF, no speaker labels). All three failures are Xbox cert P0. The dev TODO lists fixes by engine + estimated effort; the public report lists what's in v1.0, what's coming in v1.1, and what doesn't apply.

**Related.** [`/cert-readiness`](../skills/cert-readiness/SKILL.md) — Xbox a11y gates are P0 cert blockers. [`/steam-page-review`](../skills/steam-page-review/SKILL.md) to publish the report alongside the page. [`/playtest`](../skills/playtest/SKILL.md) to drive the build with subtitles ON and colorblind mode engaged.

---

### `/perf-benchmark` — Performance Engineer

> Captures frame rate (avg, 99th, 0.1th), frame-time distribution, draw calls, GC allocations, scene-load time, and peak memory — diffed against a baseline.

**When to fire.** Before and after any perf-sensitive change, at milestone gates, and during cert prep where Switch's 4 GB ceiling is unforgiving. For CI gating use the [`gamestack-game-benchmark`](../bin/impl/game-benchmark/README.md) CLI wrapper; this skill is the interactive version. A perf number without a scenario is meaningless — every snapshot is tagged with scene + player activity + platform + build mode.

**The lens.** Six metrics, mean-and-tail. The 0.1th-percentile frame time catches the stutter that average FPS hides. Draw calls and batches matter on Switch and mobile even when the GPU isn't pinned. GC allocations per frame predict tomorrow's stutter. Scene-load time and peak memory are cert-affecting. Regressions are flagged at -5% avg FPS, +10% 99th-pct frame time, any per-frame allocation increase, +5% memory peak. The skill identifies regressions and proposes investigation paths — it does not fix.

**What a session looks like.** Run on a Unity Switch build after adding a new VFX system. Snapshot: avg FPS 58 (baseline 60, marginal), 99th-pct 24 ms (baseline 18 ms — REGRESSED), GC alloc 12 KB/frame (baseline 0 — REGRESSED). Hypothesis: per-frame `new ParticleParams()` in the burst manager. Investigation path: pool the params struct. The developer fixes; re-snapshot confirms.

**Related.** [`/playtest`](../skills/playtest/SKILL.md) when SDK-driven capture is available. [`/asset-audit`](../skills/asset-audit/SKILL.md) when peak memory is near the platform cap. [`gamestack-game-benchmark`](../bin/impl/game-benchmark/README.md) for CI regression checks. [`/cert-readiness`](../skills/cert-readiness/SKILL.md) — this skill's data feeds the cert memory + boot-time gates.

---

### `/playtest` — QA Lead (SDK-driven)

> Drives a running Unity / Godot build via the gamestack engine SDK — reads `/state`, posts inputs, captures screenshots, save-fuzzes, hits semantic breakpoints, files regression scenarios.

**When to fire.** Whenever there's a build to exercise. The skill is phase-aware: it reads `## Current production phase` from the game's CLAUDE.md and picks scenarios accordingly — first-minute prototyping, friction in vertical slice, juice in polish, controller-disconnect + save-fuzz in cert. If there's no build (only code), the right skills are `/find-the-fun` or `/code-review-gamestack`.

**The lens.** Five scenario primitives: `wait`, `wait_for_state`, `input`, `screenshot`, `snapshot`/`restore`, `breakpoint`, `assert`. The skill probes the SDK at `localhost:7331/health` and either drives live or degrades to static analysis offline (flagging findings as `OFFLINE-MAYBE`). Findings are severity-tagged (P0 crash / cert / save corruption, P1 clear bug, P2 smell). Every confirmed P0/P1 spawns a trimmed regression scenario in `playtest/regression/` that joins the smoke suite.

**What a session looks like.** Cert-phase Switch build. Scenario `05-cert-save-fuzz` runs: snapshot, inject inputs, restore, assert tagged save state matches. Finding: `tagged.player.inventory` empty after restore — P0 save corruption. The skill locates the offending atomic-write code via engine-detection, surfaces a fix proposal (refuses to auto-apply on cert-affecting code), trims the failing steps into `playtest/regression/save-restore-2026-06-04.json`, and recommends re-running after the fix lands.

**Related.** [`/perf-benchmark`](../skills/perf-benchmark/SKILL.md) when a scenario surfaces frame-time regression. [`/cert-readiness`](../skills/cert-readiness/SKILL.md) when running cert-class scenarios. [`gamestack-playtest-daemon`](../bin/impl/playtest-daemon/README.md) for CI sweeps that batch many scenarios.

---

## Ship

### `/cert-readiness` — Platform Cert Officer

> Walks PS5 TRC, Xbox TCR/XR, and Switch lotcheck against the public-knowledge high-failure categories — sleep/resume, controller disconnect, save corruption, network drop, age rating consistency.

**When to fire.** During the Cert production phase and after every patch that touches platform-affecting systems (save, memory, network, input). The skill is NOT a substitute for the NDA-protected checklist on the developer portal — its job is to catch the 80% of public-knowledge categories *before* the developer hits submit. One avoided rejection saves a week.

**The lens.** Per-platform category walks. PS5: trophy completeness (platinum if structure permits), DualSense haptics + adaptive triggers beyond default rumble, sleep/resume during every state. Xbox: Quick Resume (which usually fails as a save-system bug in disguise), profile-switching, accessibility (strictest of the three). Switch: sleep/resume (lotcheck's most-failed item), localization width clipping, 4 GB handheld memory ceiling, age rating consistency across eShop + splash + parental panel. Each finding lands as PASS, PASS_CODE_ONLY, NEEDS_LIVE_TEST, FAIL_P0, FAIL_P1, or N/A.

**What a session looks like.** Pre-submission audit for a Switch indie. Findings: PASS_CODE_ONLY on sleep/resume (the code looks right but no live cert-class playtest run in 30 days), FAIL_P0 on localization clipping (German strings overflow the menu buttons), NEEDS_LIVE_TEST on save-fuzz. Action list: fix the localization clipping, then run `/playtest 04-cert-controller-disconnect` and `05-cert-save-fuzz` on the Switch build before submission. Verdict: Switch NEEDS_WORK, not yet READY.

**Related.** [`/playtest`](../skills/playtest/SKILL.md) for the NEEDS_LIVE_TEST scenarios. [`/code-review-gamestack`](../skills/code-review-gamestack/SKILL.md) for the platform-affecting code paths. [`gamestack-cert-checklist`](../bin/impl/cert-checklist/README.md) for CI regression gating between interactive audits.

---

### `/steam-page-review` — Marketing Lead

> Audits capsule artwork specs, trailer pacing (first 6 seconds critical), short-description hook, tag strategy, screenshots, and Next Fest fit — against current top-sellers in the primary genre.

**When to fire.** 60–90 days before launch, when the coming-soon page goes live, and again before every major update or Next Fest entry. If the game is too early to have any page artifacts, redirect to `/design-jam` or `/art-bible` for the pitch + capsule key art.

**The lens.** Steam shoppers traverse browse → page → above-fold → below-fold; each layer's job is the next click. The skill validates every capsule slot against current Steam specs (Header 460×215 through Library hero 3840×1240 and the often-skipped Library logo), reads the trailer against first-6-second discipline (verb before logo card, no black fade, title overlay by 6s), audits the 300-character short description for clichés and genre-keyword presence, cross-references tags against five top-sellers in the same micro-genre, and rates screenshots for variety + vertical-crop safety.

**What a session looks like.** Pre-launch audit on a co-op survival game. Capsules: Library hero and logo MISSING — game will look unfinished in player libraries post-purchase. Trailer: 4-second studio card opens, verb doesn't show until 0:12 (the first 6 seconds are auto-played in the storefront). Short description leads with "embark on a journey" — pure tax characters. Tags: missing "Co-op" and "Survival Crafting" that all five reference top-sellers use. Wishlist-conversion risk: HIGH. Top edit: cut the studio card, recut the trailer to lead with the build verb in the first 3 seconds.

**Related.** [`/art-shotgun`](../skills/art-shotgun/SKILL.md) for capsule iterations when the main capsule is weak. [`/publish`](../skills/publish/SKILL.md) when the page is launch-ready. [`gamestack-steam-page-check`](../bin/impl/steam-page-check/README.md) for CI validation of capsule sizes and trailer length.

---

### `/publish` — Release Engineer

> Verifies pre-publish gates, bumps semver, builds per target, re-runs the last-mile cert checklist, uploads where automation is safe, opens the patch-notes PR, updates ROADMAP.md.

**When to fire.** When the developer is ready to ship a release — initial launch, patch, or hotfix. Don't fire on uncert'd console builds, builds with failing regression scenarios, or Friday afternoons after 14:00 local time (the skill surfaces a warning and requires explicit `--confirm-friday`). The cost of a launch-weekend rollback is real.

**The lens.** Eight pre-publish gates that *all* must pass: cert green for the target, no failing regression scenarios, tests passing, version not already shipped, working tree clean, build made from a tagged commit, not-Friday-after-2, documents current (README, accessibility report, patch notes). Any failure halts the publish — the skill reports what failed and exits rather than carrying forward. Console partner portals never auto-upload; the skill surfaces the build path and the manual upload checklist because human-eyes review of binary metadata is non-negotiable.

**What a session looks like.** `/publish target=steam version=1.0.1` for a bug-fix patch. Gates: all eight PASS. Version bump from 1.0.0 → 1.0.1 commits atomically. Last-mile cert re-check on accessibility settings + regression smoke pass. Unity batchmode build for Windows + macOS + Linux completes. `steamcmd` uploads to the default branch. Tag `v1.0.1` pushed; patch-notes PR opened with player-facing and dev-facing changelogs. ROADMAP.md and game CLAUDE.md updated. Next recommendation: enable `/post-launch-monitor` for 30 days.

**Related.** [`/cert-readiness`](../skills/cert-readiness/SKILL.md) — the cert gate this skill enforces. [`/patch-notes`](../skills/patch-notes/SKILL.md) to generate the player-facing changelog from the PR body. [`/launch-day`](../skills/launch-day/SKILL.md) for the first shipped release.

---

### `/post-launch-monitor` — Live Ops

> Pulls Steam review sentiment, crash rate, refund rate, player count, top complaints, and wishlist conversion — produces a daily digest flagged GREEN / YELLOW / RED / EMERGENCY.

**When to fire.** Daily for the first 30 days post-launch, then weekly. The skill is for the developer who's too anxious to open the dashboards themselves — pull the data, summarize honestly, surface only the signal worth acting on. If the game hasn't launched (no Shipped entry in ROADMAP.md), the skill redirects.

**The lens.** Six signals against baseline. Recent vs. all-time review % (never averaged — they live in different bands). Crash rate from Backtrace/Sentry if configured, or PROXY via Steam reviews mentioning "crash"/"freeze" if not. Refund rate against Steam's genre median (>12% yellow, >20% red — onboarding broken). Player count decay curve (peak ÷ day-7 retention). Community complaints categorized as bug / design pushback / polish gap / out-of-scope — a loud minority is loud, a majority is data, and the skill refuses to conflate them. Wishlist conversion below 15% routes to `/steam-page-review`.

**What a session looks like.** Day 3 digest. Reviews: 78% recent (94% all-time) — YELLOW, drop driven by 8 new negatives all mentioning save-corruption on Switch. Crash rate via Sentry: 0.4% — GREEN. Refund rate: 14% — YELLOW. Top complaint: "lost my save after sleep mode" 12x — bug, RED. Action: hotfix today on the Switch save-write path; that's the YELLOW review trend's root cause.

**Related.** [`/patch-notes`](../skills/patch-notes/SKILL.md) for the hotfix that follows. [`/post-mortem`](../skills/post-mortem/SKILL.md) after the first 30 days when patterns become history. [`/learn`](../skills/learn/SKILL.md) to fold launch lessons into the studio's playbook for the next game.

---

## Reflect

### `/patch-notes` — Technical Writer

> Drafts player-facing patch notes in the game's voice and a separate dev-facing changelog. Two audiences, two registers.

**When to fire.** Right after a release tag is cut, before posting the update to Steam / itch / consoles. If [`/publish`](../skills/publish/SKILL.md) just ran, the tag is already in `ROADMAP.md` — use that as the range. Don't run mid-development; the inputs (closed issues, merged PRs, playtest runs) aren't settled yet.

**The lens.** Two artifacts, never merged. Player notes match the game's voice (cozy, dry, melodramatic — whatever the voice cards say), lead with what players *feel*, and never bury balance nerfs in corporate hedging. Dev changelog uses Keep-a-Changelog buckets, present tense, one line per change, PR numbers when they exist. The skill reads the diff, closed issues, playtest runs in the window, and the current `CHANGELOG.md` top entry for format precedent. Each commit gets classified by audience (player / dev / both), bucket, and magnitude.

**What a session looks like.** v0.4.2 lands with an audio-mixer refactor and a bow-run nerf. The skill writes:

- Player notes lead with "background music no longer drops out during boss fights" — the mixer change as players experienced it.
- "Heads up" line names the bow nerf in plain words: "bow-only runs are a little harder now."
- Changelog gets `Changed: AudioMixer routing now persists across scene loads (#142)` and `Balanced: bow base damage 14 → 12 (#147)`.
- Localization line flags EN/FR done, JP pending.

The developer posts. The skill never does.

**Related.** [`/publish`](../skills/publish/SKILL.md) cuts the tag this skill summarizes. [`/post-mortem`](../skills/post-mortem/SKILL.md) when the patch fixes an incident worth linking from the dev changelog. [`/learn`](../skills/learn/SKILL.md) to persist voice / format decisions across patches.

---

### `/post-mortem` — Eng Manager

> Weekly retro or post-launch retro. Blameless, specific, actionable. Every "wrong" gets paired with a "differently."

**When to fire.** Every Friday during Production / Polish / Live-Ops. Within 7 days of every launch. If the developer hasn't run one in 30+ days during Production, the skill surfaces that and offers to run one. A solo retro isn't corporate ritual — it's how a one-person studio learns from itself instead of repeating last sprint's slip.

**The lens.** Three rules, in order. Blameless: name the system, not the person (in a solo studio those collapse — that's exactly when the discipline matters). Specific: "build size jumped 240 MB because the LFS migration didn't update `.gitattributes`," not "asset issues." Actionable: every "what went wrong" pairs with a "what we'll do differently" the developer could start tomorrow. The skill reads the week's diff, closed PRs, playtest runs, perf benchmarks, and `ROADMAP.md` items that were supposed to ship. It also includes wins — solo retros that read as failure lists are demoralizing and unsustainable.

**What a session looks like.** Friday retro for week 23:

- Shipped: hit-pause polish (PR #88), three save-bug fixes.
- Started but didn't land: dialogue rewrite — root cause: scope item was sized at 5 days when it was really 12.
- Differently: split scope items larger than 2 days before starting them.
- Wins: save-fuzz scenario caught two regressions before playtest. Earned skill: writing Yarn nodes is faster now.

The two generalizable lessons get piped to [`/learn`](../skills/learn/SKILL.md).

**Related.** [`/learn`](../skills/learn/SKILL.md) for the persistent recall surface. [`/patch-notes`](../skills/patch-notes/SKILL.md) when a launch retro surfaces a follow-up patch. [`/post-launch-monitor`](../skills/post-launch-monitor/SKILL.md) feeds the launch retro's reception data.

---

### `/learn` — Memory

> Persists generalizable lessons (engine quirks, bug patterns, taste, workflow) across sessions. Not an autobiography — a low-noise note-taker.

**When to fire.** "Remember this." "Save this for next time." After a hard-won fix. After a surprising playtest. Auto-fires at the end of [`/post-mortem`](../skills/post-mortem/SKILL.md), [`/bug-hunt`](../skills/bug-hunt/SKILL.md), and [`/art-shotgun`](../skills/art-shotgun/SKILL.md) finalization. Whenever you catch yourself thinking "I'll remember this." (You won't.)

**The lens.** Six types: engine quirk, bug pattern, workflow shortcut, taste preference, process learning, reference fact. If a candidate doesn't fit one cleanly, it's probably not generalizable enough to save. Records are three fields — TYPE, WHEN, LESSON — written so future-you can act without re-deriving context. Sentiment doesn't qualify. Tutorial-shaped knowledge doesn't qualify. Anything already in `CLAUDE.md` doesn't qualify (update the doc instead). Conflicts with existing records get surfaced as `SUPERSEDED-BY` diffs — never silent overwrites.

**What a session looks like.** A bug hunt confirms that iOS save corruption was caused by a mismatched serializer version. The skill writes `studio/learnings/bug-pattern/save-corruption-serializer-version-ios.md`:

```
TYPE:   bug-pattern
WHEN:   2026-06-04; bug-hunt on save-load crash
LESSON: iOS save corruption is always preceded by a serializer
        version mismatch. Bump the version constant and add a
        migration before changing the schema.
```

Next time iOS saves act weird, the lesson surfaces before re-derivation.

**Related.** [`/post-mortem`](../skills/post-mortem/SKILL.md) feeds the 2–3 generalizable lessons per retro. [`/bug-hunt`](../skills/bug-hunt/SKILL.md) confirms patterns worth saving. [`/art-shotgun`](../skills/art-shotgun/SKILL.md) plus [`gamestack-taste-update`](../bin/impl/taste-update/README.md) promote game-confirmed taste signals to studio memory.

---

## Power tools

Power tools change *how* Claude works for the rest of the session rather than producing a one-time artifact. They're behavioral disciplines — Claude reads them at activation, then refuses / pauses / surfaces for every subsequent action.

### `/careful` — Power tool, pause before destructive

> Pauses before destructive or hard-to-reverse operations, surfaces what's lost, asks for explicit confirmation.

**When to fire.** Cert prep, launch week, large refactors, hotfix branches — any stretch where one undo-able mistake costs hours. Trigger phrases: "be careful," "go slow," "this is the prod branch." Stays active for the rest of the session until `/uncareful`. This is behavioral discipline, not an action-taking specialist — it changes how Claude operates for everything that follows, not something Claude *does* once.

**The lens.** Destructive means: `rm -rf`, `push --force`, `reset --hard`, `DROP`, `TRUNCATE`, `kill -9` of long-running jobs, store uploads, sent messages. If unsure, treat as destructive. Reads, tests, builds, formatters — none of those need a pause. Each destructive op gets its own pause; one confirmation doesn't pre-confirm the next. Bundling multiple deletes into one confirmation is forbidden — the user might say yes to two and no to the third.

**What a session looks like.** Developer asks Claude to clean up old playtest runs. Claude is about to run `rm -rf playtest/playtest-2025-*`:

```
CAREFUL — about to delete 14 playtest run directories.

Affects:
  - playtest/playtest-2025-*: ~840 MB of run logs and screenshots
  - includes the vertical-slice playtest from 2025-11-12

What's lost if this goes wrong:
  - The vertical-slice baseline screenshots used by perf-benchmark

Proceed? (yes / no / propose alternative)
```

Developer says "no, keep the November one." Claude re-scopes; no `--force` workaround.

**Related.** [`/freeze`](../skills/freeze/SKILL.md) to narrow the blast radius of *writes*. [`/guard`](../skills/guard/SKILL.md) stacks both. [`/launch-day`](../skills/launch-day/SKILL.md) is the strongest setting that includes this one.

---

### `/freeze` — Power tool, restrict writes to a directory

> Refuses any write outside the named frozen zone, even when asked.

**When to fire.** When the work should stay narrow: one milestone, one feature, one bug, one PR. Direct invocation: `/freeze <path>`. Stays active until [`/unfreeze`](../skills/unfreeze/SKILL.md). Like [`/careful`](../skills/careful/SKILL.md), this is behavioral — Claude *refuses* outside-zone writes for the rest of the session rather than *doing* anything up front.

**The lens.** A path is inside the zone if its absolute path is the frozen path or a subdirectory. Symlinks pointing out are out. Multiple paths can be frozen — each is its own zone. Reads anywhere are fine; this restricts *writes*. The skill explicitly forbids being clever: no staging in a temp file and copying later, no writing contents into a chat message for the user to paste, no tunneling through a Bash one-liner. Refuse and remind.

**What a session looks like.** Developer says `/freeze games/bridge-keeper/`. Later mid-session asks Claude to also update the repo-root README:

```
FREEZE — write refused.
  Target: /Users/dev/myproject/README.md
  Frozen zone: games/bridge-keeper/

To allow this edit:
  - /unfreeze     — leave freeze mode entirely.
  - /freeze games/  — re-freeze around a wider scope.

Suggested alternative: do the README edit after the bridge-keeper work is committed.
```

The README does not get edited. Tests and builds that *read* outside the zone still run.

**Related.** [`/unfreeze`](../skills/unfreeze/SKILL.md) to exit. [`/guard`](../skills/guard/SKILL.md) stacks freeze with [`/careful`](../skills/careful/SKILL.md). [`/cert-freeze`](../skills/cert-freeze/SKILL.md) is the opinionated cert-window version.

---

### `/unfreeze` — Power tool, lift `/freeze`

> Restores normal write access after a scoped milestone or bug is finished.

**When to fire.** The narrow work is done, committed, and the next task legitimately needs to touch the rest of the repo. Direct invocation: `/unfreeze`, or "lift the freeze." If no [`/freeze`](../skills/freeze/SKILL.md) was active, the skill surfaces that as a no-op and continues. This is behavioral — it ends a discipline rather than starting one — and only touches [`/freeze`](../skills/freeze/SKILL.md). If [`/careful`](../skills/careful/SKILL.md), [`/guard`](../skills/guard/SKILL.md), or [`/launch-day`](../skills/launch-day/SKILL.md) are also active, they stay active.

**The lens.** Before the *first* write outside the previously frozen zone, confirm two things: the previously frozen work is committed (or at least staged), and the user actually wants the whole zone lifted rather than one specific file. Writes that were refused during the freeze do not get queued and quietly replayed — they should be re-requested explicitly so the user sees what's about to happen.

**What a session looks like.** Developer finishes the bridge-keeper hotfix and says "unfreeze it":

```
UNFREEZE — lifting the freeze on:
  - games/bridge-keeper/

Writes to the rest of the repo are now permitted again.

Note: /careful is still active. Destructive ops still require confirmation.
```

Claude does not silently apply the README edit that was refused earlier. If the developer still wants it, they ask again.

**Related.** [`/freeze`](../skills/freeze/SKILL.md) to re-narrow. [`/guard`](../skills/guard/SKILL.md) to re-establish the combined setting.

---

### `/guard` — Power tool, `/careful` + `/freeze`

> Combines pause-before-destructive and restrict-writes-to-a-zone in one switch. Standard high-stakes setting.

**When to fire.** Cert prep, hotfix branches, any stretch where mistakes are expensive both in scope and reversibility. Direct invocation: `/guard <path>`. Trigger phrases: "cert prep starts now," "this is the hotfix branch," "scope this change tightly." Stays active until `/unguard` (or until [`/uncareful`](../skills/careful/SKILL.md) and [`/unfreeze`](../skills/unfreeze/SKILL.md) are issued independently). Behavioral, like its two parents — Claude refuses, pauses, and confirms for the rest of the session.

**The lens.** Two checks before every write, in order: is the target inside the frozen zone (else refuse with the FREEZE message), and is the action destructive (if so, run the CAREFUL pause). A destructive op inside the zone still requires confirmation — the freeze doesn't pre-confirm the destruction. The two confirmation surfaces are kept separate, never compressed into one terse message, because each surfaces a different risk.

**What a session looks like.** Hotfix branch for a save-corruption crash. Developer says `/guard games/bridge-keeper/src/Save/`. Claude is asked to delete the old serializer:

- FREEZE check: `src/Save/SerializerV1.cs` is inside the zone. Pass.
- CAREFUL check: deleting a versioned file referenced by save data on disk. Pause.
- Surface what's lost (existing v1 saves become unreadable without a migration).
- Wait for confirm.

The developer reconsiders and writes a migration first.

**Related.** [`/careful`](../skills/careful/SKILL.md) and [`/freeze`](../skills/freeze/SKILL.md) — the parts. [`/cert-freeze`](../skills/cert-freeze/SKILL.md) is the cert-tuned variant. [`/launch-day`](../skills/launch-day/SKILL.md) is the strongest setting that includes this one.

---

### `/cert-freeze` — Power tool, opinionated freeze for cert windows

> [`/freeze`](../skills/freeze/SKILL.md) tuned for cert: locks build / cert directories, keeps [`/careful`](../skills/careful/SKILL.md) on, surfaces a checklist reminder.

**When to fire.** PS5 TRC, Xbox TCR/XR, or Switch lotcheck submission windows — once the build is in the platform's queue and a typo in a script touched at the wrong moment can reset that queue. Direct invocation: `/cert-freeze` (with the curated default zone: `build/`, `dist/`, `docs/cert/`, `playtest/cert-readiness/`, `playtest/playtest-*/`) or `/cert-freeze <path>` to override. Stays active until [`/unfreeze`](../skills/unfreeze/SKILL.md) or `/cert-pass`.

**The lens.** Behavioral — Claude refuses gameplay-code edits for the rest of the session. The skill first verifies the project's `CLAUDE.md` says phase = Cert; if not, it asks before proceeding. Default zone is intersected with paths that actually exist (no false reassurance). On entry it surfaces target platform, location of the NDA-protected checklist, and the verdict from the last [`gamestack-cert-checklist`](../bin/impl/cert-checklist/README.md) run. Mid-cert gameplay fixes have a defined escape hatch — [`/unfreeze`](../skills/unfreeze/SKILL.md) with the resubmission cost stated in concrete terms ("submission queue resets; +1 week"), then re-freeze.

**What a session looks like.** Switch lotcheck submission. Developer runs `/cert-freeze`. Mid-session, asks Claude to fix a typo in a dialogue node:

```
CERT-FREEZE — write refused.
  Target: games/bridge-keeper/src/Dialogue/Act3.yarn
  Frozen zone: build/, docs/cert/, playtest/cert-readiness/

Cost to allow: submission queue resets; +1 week to lotcheck.
To accept: /unfreeze, fix, re-run gamestack-cert-checklist, /cert-freeze.
```

The typo waits for the post-cert patch.

**Related.** [`/cert-readiness`](../skills/cert-readiness/SKILL.md) for the underlying audit. [`/guard`](../skills/guard/SKILL.md) for the general-purpose version. [`gamestack-cert-checklist`](../bin/impl/cert-checklist/README.md) for the CI lens. [`gamestack-playtest-daemon`](../bin/impl/playtest-daemon/README.md) drives the cert-class save-fuzz and controller-disconnect scenarios that move categories from `NEEDS_LIVE_TEST` to `PASS`.

---

### `/launch-day` — Power tool, strongest discipline setting

> [`/guard`](../skills/guard/SKILL.md) plus verbose logging plus a "what could go wrong" surface before every meaningful action. Only on the actual ship day.

**When to fire.** Ship day. Not the day before, not the day after. Direct invocation: `/launch-day` (default freeze zone: `build/`, `marketing/steam/`, `playtest/post-launch-monitor/`, `ROADMAP.md`, `CHANGELOG.md`, `README.md`) or `/launch-day <path>` to override. Stays active until `/post-launch` moves the project phase to Launched. Behavioral and the most aggressive of the power tools — speed is the second-most-important variable today, reversibility is first.

**The lens.** Pre-flight ritual at session start surfaces cert status, last [`gamestack-cert-checklist`](../bin/impl/cert-checklist/README.md) and [`gamestack-steam-page-check`](../bin/impl/steam-page-check/README.md) verdicts, last playtest, and outstanding launch-affecting TODOs. Anything older than 7 days gets called out. Before every write: intent, why now, what could go wrong (concrete, not vague), and the exact roll-back. After every write: a one-line verification of what confirms success. Store-affecting ops (Steam page, console submission, social posts) get an extra "is the rest of launch ready for this?" pause — posting the launch tweet 30 minutes before the build goes live is the classic mistake this catches.

**What a session looks like.** Steam build upload at 9:47 AM:

```
LAUNCH-DAY — about to publish Steam build for v1.0.0.
Why now: cert passed yesterday; Steam page launch-ready since Monday.
What could go wrong: branch published before the partner-side default-branch
  swap, so existing wishlisters get the old build.
Roll-back if it does: revert default branch on Steamworks; takes ~2 min.

Proceed? (yes / no)
```

Developer confirms. Result line follows once the upload verifies. Launch tweet stays drafted, not posted, until the build is live.

**Related.** [`/guard`](../skills/guard/SKILL.md) is the part this strengthens. [`/publish`](../skills/publish/SKILL.md) cuts the version this skill ships. [`/post-launch-monitor`](../skills/post-launch-monitor/SKILL.md) takes over once `/post-launch` lifts launch-day mode. [`/patch-notes`](../skills/patch-notes/SKILL.md) drafts the player-facing announcement of what just shipped.

---

## CLIs

Each interactive skill above has a CI-friendly CLI sibling for the mechanical parts. The CLIs run under [Bun](https://bun.sh) (`brew install bun` once), exit non-zero on regressions, and write markdown + JSON reports.

| CLI | Wraps | What it checks |
|---|---|---|
| [`gamestack-asset-audit`](../bin/impl/asset-audit/README.md) | [`/asset-audit`](../skills/asset-audit/SKILL.md) | Per-platform texture / audio / mesh / atlas / naming audit + Unity `.meta` integrity catastrophes. |
| [`gamestack-cert-checklist`](../bin/impl/cert-checklist/README.md) | [`/cert-readiness`](../skills/cert-readiness/SKILL.md) | PS5 TRC / Xbox TCR-XR / Switch lotcheck high-failure-rate categories with PASS / PASS_CODE_ONLY / NEEDS_LIVE_TEST / FAIL_P0 / FAIL_P1 verdicts. |
| [`gamestack-steam-page-check`](../bin/impl/steam-page-check/README.md) | [`/steam-page-review`](../skills/steam-page-review/SKILL.md) | Capsule dimensions, trailer length, short-description hook, tag strategy, screenshot count, Next Fest fit. Wishlist-conversion risk verdict. |
| [`gamestack-game-benchmark`](../bin/impl/game-benchmark/README.md) | [`/perf-benchmark`](../skills/perf-benchmark/SKILL.md) | Polls engine SDK `/state` for FPS / frame time / draw calls / GC alloc / memory; diffs against a baseline. |
| [`gamestack-playtest-daemon`](../bin/impl/playtest-daemon/README.md) | [`/playtest`](../skills/playtest/SKILL.md) | Broker between Claude Code and a running engine build. Walks the 9 scenario step primitives; per-step run log. |
| [`gamestack-taste-update`](../bin/impl/taste-update/README.md) | [`/art-shotgun`](../skills/art-shotgun/SKILL.md) | Persists per-axis approval events into a project taste profile with exponential time-decay; surfaces emerging signals. |
| [`gamestack-model-benchmark`](../bin/impl/model-benchmark/README.md) | _(reflective tool)_ | Runs a prompt suite against several Claude models; scores responses; picks a winner. Local-only. |

The CLIs are deliberately separate from the skills. Use the skills for milestone-gate audits with a developer at the keyboard. Use the CLIs in CI to fail the build on regressions, so the interactive sessions stay focused on judgment calls.

For developing or extending a CLI, see [`../bin/impl/README.md`](../bin/impl/README.md). For wiring them into CI, each CLI's README has a `.github/workflows/` example.

---

## Multi-host

Skills work across nine AI agent hosts. All hosts share the symlink discovery logic in `hosts/_lib.sh`; per-host scripts wrap it with the correct skill discovery path.

| Host | Skill discovery path | Install |
|---|---|---|
| Claude Code | `~/.claude/skills/<name>/` | `./setup` (auto-detected) |
| Codex CLI | `~/.codex/skills/<name>/` | `./setup --host codex` |
| OpenCode | `$XDG_CONFIG_HOME/opencode/skills/<name>/` | `./setup --host opencode` |
| Cursor | `~/.cursor/skills/<name>/` | `./setup --host cursor` |
| Factory Droid | `~/.factory/skills/<name>/` | `./setup --host factory` |
| Slate | `~/.slate/skills/<name>/` | `./setup --host slate` |
| Kiro | `~/.kiro/skills/<name>/` | `./setup --host kiro` |
| Hermes | `~/.hermes/skills/<name>/` | `./setup --host hermes` |
| GBrain | `~/.gbrain/skills/<name>/` | `./setup --host gbrain` |

Adding another host is ~15 lines. See [`../hosts/_README.md`](../hosts/_README.md).
