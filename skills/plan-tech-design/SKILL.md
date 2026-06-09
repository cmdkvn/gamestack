---
name: plan-tech-design
description: Technical Designer skill — locks the architecture for game systems. Produces ASCII diagrams for state machines (player, AI, dialog), data flow, frame budget allocation, save format schema. Forces hidden technical assumptions into the open before they become hard-to-undo decisions. Use after game design is locked but before significant engine work begins.
---

# plan-tech-design

This skill reads a design doc and predicts which mechanics will be cheap to build and which will eat three months and a refactor. It locks the architecture, surfaces hidden tech assumptions, draws the state machines, and makes sure the plan is buildable inside the constraints of the chosen engine and platform.

## When to fire

Use when game design is locked (or near it) and the developer is about to commit to engine architecture. Trigger phrases:
- "Review the tech design"
- "Lock the architecture"
- "Plan tech design"
- "Is this architecturally sound?"
- `/plan-tech-design`

If game mechanics aren't locked, run `/plan-game-design` first. If the engine project is already in production and you want a code review, use `/code-review-gamestack` instead.

## The lens

A tech design plan is *good enough* when:
1. **Engine + version** are nailed.
2. **State machines** are diagrammed for player, AI, dialog, save state.
3. **Data flow** is traced: input → state → render.
4. **Frame budget** is allocated per platform.
5. **Save format** has a schema with a version field.
6. **Asset pipeline** describes source → import → atlas → runtime.
7. **Cross-platform abstraction** isolates platform code from game code.
8. **Test strategy** is articulated.

This skill walks each in order and surfaces gaps.

## Process

### Step 1 — read the plan

Find `design/tech-design.md`. Read end to end. Note where the plan is concrete vs. hand-waved.

### Step 2 — engine + version

- Is the **engine** named?
- Is the **version** specified (e.g., "Unity 6.0.4" not "Unity")?
- Are the **expected breaking-change risks** between current and ship-time engine versions called out?

A plan that says "Unity" without a version will ship into an engine update mid-production and lose a week. A plan that says "Godot" without 3 vs 4 will ship into a different language ecosystem.

### Step 3 — state machines

For each of these, the plan should have an ASCII diagram (or equivalent):

- **Player state:** idle → moving → jumping → falling → landing → … (game-specific).
- **Enemy / NPC AI:** patrol → alert → engage → recover → die.
- **Dialog system:** ready → presenting → awaiting input → branching → exiting.
- **Save state:** transitions between save points; what happens to in-flight state.
- **Game state:** title → menu → playing → paused → game-over → … .

If any state machine is missing, generate a first-draft ASCII diagram from the design doc and propose it.

### Step 4 — data flow

Trace at least one critical path end to end:

```
Input device → Input abstraction → Game state mutation → Render pipeline → Frame output
                                          ↓
                                   Audio engine → Output
```

For each arrow, ask: what data crosses, on what thread, with what frequency?

Identify any path that:
- Crosses the main thread/worker boundary in an unsafe way.
- Allocates per-frame.
- Goes through a singleton (singletons are a coupling smell; flag).

### Step 5 — frame budget

Per platform, set a target frame rate and frame budget in ms:

| Platform | Target FPS | Frame budget (ms) |
|---|---|---|
| PC (mid-range GPU) | 60 | 16.67 |
| Switch (handheld) | 30 | 33.33 |
| Switch (docked) | 30 or 60 | 33.33 or 16.67 |
| PS5 / Xbox Series X | 60 | 16.67 |
| Mobile (high-end) | 60 | 16.67 |
| Mobile (low-end) | 30 | 33.33 |

Within each budget, propose a split: rendering, physics, AI, scripting, garbage collection. If the plan has none of this, propose defaults and flag the need to validate with `/critique --lens=perf` (M2) early.

### Step 6 — save format

- Is the save **format** chosen (JSON, MessagePack, engine-native, binary custom)?
- Is there a **version field**?
- What happens to a **v1 save loaded in v2**? Migration? Rejection? Best-effort?
- Are **atomic writes** used (temp file + rename) to survive power loss?

Saves are a cert-blocker on all three consoles and a primary source of player rage. Plan-stage diligence here is high-leverage.

### Step 7 — asset pipeline

Trace the path from source asset to runtime asset:

```
Source (Aseprite / Blender / Photoshop) → Engine import (.meta / .import) → Atlas / mip / compression → Runtime
```

Identify:
- **Naming conventions** (kebab vs camel vs snake — consistent?).
- **Atlas strategy** (per-region atlasing? Trim & rotate?).
- **Per-platform compression** (ETC2 on Android, ASTC where supported, BC7 on desktop, DXT5 fallback).
- **Source-asset version control** (LFS? External DAM?).

### Step 8 — cross-platform abstraction

Identify what platform-specific code exists or is planned:

| Concern | Cross-platform abstraction needed? |
|---|---|
| Input (keyboard / mouse / gamepad / touch) | Yes — through a single input action map |
| Save data location | Yes — `Application.persistentDataPath`-style |
| Achievements / trophies | Yes — abstract behind a service interface |
| Networking | Yes (if applicable) |
| IAP / store | Yes (if applicable) |

Anything platform-specific that's NOT behind an abstraction is a refactor waiting to happen the day a new platform is added.

### Step 9 — test strategy

- **Engine play-mode tests** for game logic?
- **Unit tests** on pure-logic code (combat math, save serialization, state transitions)?
- **Integration tests** via the upcoming `/playtest` skill (M2)?
- **Test data fixtures** versioned with the code?

A game with no test strategy plan ships its first regression a week before launch.

### Step 10 — console-specific requirements

If shipping to consoles, the plan should call out:

| Platform | Concern |
|---|---|
| Switch | Handheld vs docked input + perf; suspend/resume; parental controls; controller modes |
| PS5 | DualSense haptic + adaptive triggers; PSN trophies (platinum if structure permits); Quick Resume-like flows |
| Xbox | Achievements; Quick Resume (arbitrary state restore); cloud saves; profile switch |

## Inputs and outputs

**Reads:** `design/tech-design.md` — schema: see [`docs/templates/tech-design.md`](../../docs/templates/tech-design.md).

**Review output:** writes to `design/reviews/plan-tech-design.md` — schema: see [`docs/templates/plan-review.md`](../../docs/templates/plan-review.md).

Offer to apply edits.

## What NOT to do

- **Don't propose a different engine.** Engine choice is a `/plan-creative-director` / `/design-jam` decision, not a tech-design one.
- **Don't write code.** This is a design review. State machines are diagrams, not implementations.
- **Don't dismiss console requirements as "we'll handle that at cert."** Cert is not where you discover Quick Resume isn't implementable in your save system.
- **Don't let perf budgets be "we'll optimize later."** Setting frame-budget allocations forces architecture choices to surface now.

## Handoff

After plan-tech-design:
- Implementation begins with confidence in the architecture.
- `/code-review-gamestack` — as code starts landing, review against the plan.
- `/critique --lens=perf` (M2) — validate frame budget claims against a real build.
- `/cert-readiness` (M3) — when nearing ship, audit against the console-specific items called out here.
- `/autoplan` — for full multi-discipline review.
