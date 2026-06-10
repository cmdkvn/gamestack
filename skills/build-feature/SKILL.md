---
name: build-feature
description: Gameplay Engineer skill — implements a planned feature or mechanic end-to-end in the project's engine (Unity, Godot, Unreal, GameMaker, Bevy, iOS native, web). Takes the locked design + an assembled scene or codebase, writes the actual gameplay code (input, state, collision, feedback), verifies it compiles/runs, then routes the diff through /code-review-gamestack and /playtest. Use when a mechanic exists in the design doc but not in the build — "implement the jump", "make enemies chase", "build the planting verb". The skill that turns plans into a playable build.
---

# build-feature

[`/scene-prototype`](../scene-prototype/SKILL.md) deliberately stops at clean TODOs — scaffolding that compiles but does nothing. This skill fills them. It takes one named feature from the design docs and implements it end-to-end: input, state, collision, feedback, wired into the existing scene or codebase, verified to compile and run, then routed through review and playtest. One feature per invocation. The unit of work is the smallest playable increment — not "the combat system," but "pressing Space makes the character jump."

## When to fire

Use when a mechanic exists on paper but not in the build. Trigger phrases:
- `/build-feature <feature>`
- "Implement the jump"
- "Make enemies chase the player"
- "Make the player able to plant seeds"
- "Build the dash"

Prerequisites:
- `gamestack/state.json` must exist. If it doesn't, redirect per [`_state-conventions.md`](../_state-conventions.md).
- The feature should be traceable to `design/mechanics.md` or the pitch. If it isn't in any design doc, say so plainly and offer two paths: proceed anyway (the developer's call — before implementing, capture a 2–3 line mini-spec from them: the verb, its rules, the failure case — and include it under FEATURE in the output; that's the traceability record), or run [`/plan-game-design`](../plan-game-design/SKILL.md) first so the mechanic gets designed before it gets built. Don't silently invent design.

If the request is actually several features ("implement movement, combat, and inventory"), pick the first, say which one, and queue the rest under NEXT.

## The lens

A feature is done when a player can do the thing — not when the code looks right. Three tests, applied in order:

1. **Playable:** there is a definition of done in one player-observable sentence, written before any code, and the build now satisfies it.
2. **Verified:** the engine's check command actually ran and its actual output is in the report. "It should work" is not a state this skill is allowed to end in.
3. **Reviewed:** the diff has been through the [`/code-review-gamestack`](../code-review-gamestack/SKILL.md) rubric before it's handed back.

Smallest playable increment wins every tie. A jump with a placeholder rectangle and a beep that verifiably works beats a full movement system that "mostly compiles."

## Process

### Step 1 — read state + design

Read `gamestack/state.json` per [`_state-conventions.md`](../_state-conventions.md): `engine`, `phase`, `experience`, `review_mode`. Honor the experience posture rules from that file for everything that follows. If `engine` is missing or `unknown`, detect from marker files (`Assets/` → Unity, `project.godot` → Godot, `*.uproject` → Unreal, `*.yyp` → GameMaker, `Cargo.toml` with `bevy` → Bevy, `*.xcodeproj` / `Package.swift` → iOS native, `package.json` with phaser/three/pixi → web) and record what you detected.

Then read the design inputs:
- `design/mechanics.md` — what the feature *is*: the verb, its rules, its edge cases.
- `design/tech-design.md` — architectural conventions. These are binding. If the plan says "no singletons," this feature doesn't introduce one.
- `design/pitch.md` — why the feature matters, so the implementation serves the kernel of fun rather than a literal reading of one line.

### Step 2 — locate insertion points

Read the existing code before writing any. Find where the feature attaches:
- A scene-prototype kit's TODOs (`// TODO: implement movement`) — the most common case.
- Existing scripts, scenes, input maps, state machines.

List the files that will change and why, before changing them. Note which of the files you're about to touch have uncommitted developer changes (`git status`) — this is the revert baseline if Step 6 fails. If the insertion point doesn't exist at all (no scene, no scaffold), say so and recommend [`/scene-prototype`](../scene-prototype/SKILL.md) first — implementing a mechanic into a void produces orphan code.

### Step 3 — define done, before coding

Write one sentence, player-observable, that the build will satisfy when this run ends:

> "Pressing Space makes the character leave the ground and land."

Not "implement jump physics." If you can't write the sentence, the feature is too big — split it and implement the first slice, queue the rest under NEXT. The sentence goes in the output block as `DONE =` and is the contract for Step 6's verification and Step 7's playtest script.

### Step 4 — implement

Write the gameplay code: input handling, state changes, collision, and at least one piece of player feedback (the thing moves, flashes, or makes a sound — a mechanic with no feedback is untestable by a human).

- Respect `design/tech-design.md` conventions throughout.
- Placeholder assets are fine — colored rects, primitive meshes, generated beeps. Note every placeholder explicitly so [`/source-assets`](../source-assets/SKILL.md) can replace them later.
- Match the codebase's existing patterns. This skill extends the build; it doesn't restyle it.

### Step 5 — editor steps

Anything that cannot be expressed as a file edit (wiring an inspector field, adding a node to a scene the engine owns, assigning an input action in project settings) gets an explicit numbered walkthrough block in the output — never "wire it up in the editor."

- `experience: beginner` — narrate click-by-click with no assumed menu knowledge ("In Godot: open the Scene panel on the left → right-click `Player` → Attach Script → ...").
- Web engine — there are no editor steps. Everything is a file edit; skip this block and put the run command in the PLAY IT block of the output.

### Step 6 — verify (mandatory, never skipped)

Run the engine's check and report the ACTUAL output. Never claim the feature works without evidence — the verification command and its real result go in the output block verbatim (trimmed to the relevant lines).

| Engine | Verification |
|---|---|
| Unity | `dotnet build` on the generated solution must be clean. If no solution exists on disk, say so, and give exact steps to compile-in-editor and confirm a clean Console. Do not mark VERIFICATION as passed on their behalf. |
| Godot | `godot --headless --check-only` (or per-script `--check-only <path>`) parse pass. |
| Web | Two tiers. Tier 1 — the mechanical floor, run it and show the output: syntax/build check (`node --check` per file, or the project's bundler / `tsc` build if one exists), start the dev server, `curl -sI http://localhost:<port>` for a 200. Tier 2 — there is no browser from here: hand the developer the URL and the DONE sentence to confirm; VERIFICATION stays `PENDING — developer confirms: <steps>` until they do. Never confirm browser behavior on their behalf. |
| Bevy | `cargo check` clean. |
| iOS native | `swift build` (SwiftPM) or `xcodebuild -quiet` clean. |
| Unreal / GameMaker | No reliable headless check from here — say so honestly, give the exact in-editor compile steps, and ask the developer to paste the result. Do not mark VERIFICATION as passed on their behalf. |

If verification fails: fix and re-run. If it can't be fixed this run, say so plainly, revert, and report the run as failed — a broken build is worse than no feature (see What NOT to do). Revert means: delete files this run created; restore files this run edited to their pre-run content — via git only if the file was clean at Step 2's baseline, otherwise by undoing your own edits specifically. Never discard the developer's own uncommitted work.

### Step 7 — review + playtest handoff (mandatory)

Apply the [`/code-review-gamestack`](../code-review-gamestack/SKILL.md) rubric to the new diff — the engine-specific bug families (per-frame allocation, signal/event leaks, off-thread API calls, tick-order assumptions), with `[P0]`/`[P1]`/`[P2]`/`[taste]` severity tags, filtered by `review_mode`. This is the quick pass that catches what you just wrote; it doesn't replace a standalone review before merge.

Posture:
- `beginner` — `[AUTO]`-with-explanation: fix what the rubric catches, one-sentence explanation per fix — the diff is this run's own fresh code, so fixing it is self-correction, not editing the developer's work. Don't hand a beginner a findings list to act on. `[taste]` findings are never auto-applied — surface them as questions even for beginners.
- `intermediate` / `expert` — `[PROPOSE]` findings as usual; they can read a diff.

`review_mode: lean` filters what's reported (`[P0]`/`[P1]`), not what's fixed — in beginner `[AUTO]` mode still fix the `[P2]`s you find; list them in one line each.

Then route to playtest:
- Engine SDK installed and reachable → recommend [`/playtest`](../playtest/SKILL.md).
- No SDK → emit a 3–5 step manual playtest script under PLAY IT, derived from the DONE sentence and the mechanic's edge cases. Include at least one negative check: "Press Space twice mid-air — you should NOT double-jump."

### Step 8 — state write-back

Per [`_state-conventions.md`](../_state-conventions.md): append a `recent_runs` entry (`outcome: "ok"`; `"error"` if Step 6 ended in a revert; `"bailed"` if the run ended on a redirect — no state.json, undesigned feature declined, no scaffold). Never touch `phase` — shipping a feature doesn't move the project to vertical-slice; the developer decides that via `/gamestack`.

## Experience posture

The general rules live in [`_state-conventions.md`](../_state-conventions.md). The deltas specific to this skill:

- **beginner** — explain each new file and function in one plain sentence as you go ("`player_jump.gd` is the script that listens for the Space key and pushes the character upward"). Leave **zero** TODOs for the developer — the feature is fully implemented or the run reports failure.
- **expert** — where the design doc doesn't settle an architecture choice (event vs. polling, who owns the state, component vs. inheritance), flag it as a `[taste]` question in the review findings instead of deciding silently. Experts want to see the fork in the road, not discover it later.

## Output format

```
ENGINE: <from state.json or detected>
FEATURE: <name>
DONE = <one player-observable sentence>

FILES TOUCHED
  - <file>: <what changed and why>
  - ...

PLACEHOLDERS (for /source-assets)
  - <asset>: <what stands in for it>

EDITOR STEPS (if any)
  1. <step>
  2. ...

VERIFICATION
  $ <command>
  <actual output, trimmed to the relevant lines>
  (when only the developer can confirm: PENDING — developer confirms: <numbered steps>)

REVIEW FINDINGS
  [P0|P1|P2|taste] <finding> — <fixed (one-sentence why) | proposed>
  (or: rubric pass clean)

PLAY IT
  <run /playtest, or the 3–5 step manual script with expected results>

NEXT
  <next feature from the design, or the recommended next skill>
```

## What NOT to do

- **One feature only.** No scope creep — the second mechanic goes under NEXT, not into this diff.
- **No unrelated refactors.** If the surrounding code offends you, note it for `/code-review-gamestack`; don't rewrite it here.
- **Never change design docs.** If the design is wrong or ambiguous, surface it; the design is input, not output.
- **Never skip verification or the review pass.** Not for "trivial" features, not when short on context. A report without VERIFICATION output (or an explicit PENDING with developer steps) is an invalid run.
- **Don't leave the build broken.** If verification fails and can't be fixed this run, say so plainly and revert. A clean build with one less feature beats a broken build with one more.
- **No binary asset emission** (textures, audio files, prefab YAML, .uasset). Placeholders are code-generated primitives; real assets come from [`/source-assets`](../source-assets/SKILL.md).

## Engine-specific guidance

Implementation-stage gotchas — the scaffolding-stage equivalents live in [`/scene-prototype`](../scene-prototype/SKILL.md).

### Unity
- Check which input system the project uses (`Input.GetKey` legacy vs. `InputSystem` package) before writing input code — mixing them silently fails.
- Physics in `FixedUpdate()`, input sampling in `Update()`. Don't read `GetKeyDown` in `FixedUpdate()` — it drops presses.
- New per-frame logic must be allocation-free; cache `GetComponent` results in `Awake`/`OnEnable`.

### Godot
- Movement on `CharacterBody2D/3D` belongs in `_physics_process(delta)` with `move_and_slide()`; multiply by `delta` for anything frame-rate-dependent outside built-in velocity.
- Prefer input actions (`Input.is_action_just_pressed("jump")`) over raw keycodes — and add the action to the Input Map (an editor step; narrate it).
- New signal connections need a disconnection story if either end can be freed.

### Web (Phaser / Three / Pixi / vanilla)
- Drive the loop from the framework's tick (`update(time, delta)` / `requestAnimationFrame`), never `setInterval`.
- Keyboard state goes through listeners that set flags, not per-frame `keydown` polling — and scale all movement by delta time.

### Bevy
- New behavior = new system; register it in the feature's `Plugin`, not `main`. Order against existing systems explicitly if it reads what they write.

### iOS native
- SpriteKit input lands in `touchesBegan`/`UIKeyCommand`; state ticks in `update(_:)`. Don't force-unwrap node lookups — `guard let` and fail loudly.

## Handoff

After `/build-feature`:
- [`/code-review-gamestack`](../code-review-gamestack/SKILL.md) — a deeper standalone pass before commit/merge; Step 7's rubric pass is the floor, not the ceiling.
- [`/playtest`](../playtest/SKILL.md) — drive the build for real once the feature (or a few) is in.
- [`/critique --lens=fun`](../critique/SKILL.md) — after 2–3 features, check the kernel: is the verb actually fun, or just implemented?
- [`/source-assets`](../source-assets/SKILL.md) — replace the placeholders noted in the output.
- `/build-feature` again — the next mechanic from `design/mechanics.md`.
