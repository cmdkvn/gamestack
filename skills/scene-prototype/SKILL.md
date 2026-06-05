---
name: scene-prototype
description: Engine Builder skill — takes a locked design and emits engine-ready scaffolding. Detects engine (Unity, Godot, Unreal, GameMaker, Bevy), produces script + setup checklist (Unity C# component, Godot .tscn + GDScript, Unreal class stub). The output is meant to be assembled in the editor — it's a head start, not a binary scene file. Use when a design or mockup is locked and you want a code skeleton to start filling in.
---

# scene-prototype

The developer has a locked mockup or design and wants to stop staring at a blank Unity hierarchy or Godot scene tree. This skill detects the engine, produces a script skeleton that captures the structural intent, and writes a setup checklist the developer follows in the editor to assemble the scene. Do NOT try to emit binary prefab/scene files — those formats are brittle and engine-version-dependent. Produce text artifacts the developer assembles.

## When to fire

Use when the developer has a clear target (a scene, a UI screen, a prefab, a level block-out) and wants engine-ready scaffolding. Trigger phrases:
- "Scaffold this scene"
- "Make engine stubs for X"
- "Scene prototype"
- "Build the skeleton for this"
- `/scene-prototype <subject>`

Don't fire if the target is vague — push back and ask for a mockup, a description, or a referenced design doc.

## The lens

A scene prototype is a *kit* — files that compile, expose the right hooks, and document what the developer assembles in the editor. The kit aims for the developer's first 30 minutes:

- They open the engine.
- They drop in the generated script.
- They drag the right assets into the script's inspector slots.
- They press play.
- They see *something* — a placeholder render of the intended scene.

It's not a finished scene. It's the scaffolding that makes the next 4 hours of work productive.

## Process

### Step 1 — detect engine

Mirror `/code-review-gamestack`'s detection:

| Marker files | Engine | Output format |
|---|---|---|
| `Assets/`, `ProjectSettings/`, `*.unity` | **Unity** | C# `MonoBehaviour` + Inspector-driven setup |
| `project.godot`, `*.tscn`, `*.gd` | **Godot** | GDScript + `.tscn` text scene (text-format scenes ARE safe to emit) |
| `*.uproject`, `Source/` | **Unreal** | C++ class stub + Blueprint hint OR Blueprint-only with setup notes |
| `*.yyp`, `*.gmx` | **GameMaker** | GML object event scripts |
| `Cargo.toml` (with `bevy`) | **Bevy** | Rust system + component definitions |
| `package.json` (Phaser / Three / Pixi) | **Web engine** | TypeScript class + setup notes |
| Otherwise | engine-agnostic | Pseudocode + setup checklist |

State the detected engine in the opening line of the output.

### Step 2 — read inputs

- The mockup or description (the developer points you at it, or it's referenced in the prompt).
- `design/mechanics.md` — for player-action semantics.
- `design/art-direction.md` and `design/art-bible.md` — for visual constraints.
- `design/tech-design.md` — for architectural conventions (component structure, state machine pattern).

### Step 3 — identify the structural elements

Walk the mockup and identify:
- **Visual elements** (sprites, meshes, particles, UI elements).
- **Interactive elements** (player-controllable, NPC, pickup, trigger, etc.).
- **Behaviors** (movement, animation states, audio triggers).
- **State** (variables that need to persist across frames, save-state, scene transitions).
- **External hooks** (input, audio middleware, save system).

For each, decide:
- Is this a single component, a hierarchy, or a separate scene?
- Does it need a public field for designer tuning?
- Does it own state or read state?

### Step 4 — emit the kit

#### For Unity:
1. **C# component(s)** — one file per logical responsibility. Use `[SerializeField] private` for tunables, `[Header(...)]` for inspector grouping.
2. **Setup checklist** — markdown file listing the GameObject hierarchy to build, what scripts attach to what, what to wire into the inspector.
3. **No prefab YAML emission** — Unity prefab YAML is version-fragile. Developer assembles in editor.

Example skeleton structure:
```
games/<game>/src/<scene-name>/
├── <SceneName>Controller.cs       # entry point / orchestrator
├── <SceneName>Config.cs            # ScriptableObject for tunables
├── <SceneName>State.cs             # state machine
└── <SceneName>-setup.md            # developer's checklist
```

#### For Godot:
1. **GDScript files** — one per node script.
2. **`.tscn` text scene** — Godot's text scene format IS safe to emit (line-based, human-readable, mostly stable). Use it for the scene tree.
3. **Setup checklist** — pointing out which nodes need scripts attached, which need resources assigned.

Example:
```
games/<game>/src/<scene-name>/
├── <scene_name>.tscn              # scene tree
├── <scene_name>_controller.gd     # entry point
├── <scene_name>_state.gd          # state
└── <scene-name>-setup.md           # checklist
```

#### For Unreal:
1. **C++ class stub** (if developer is C++; otherwise emit a Blueprint setup guide).
2. **Setup checklist** — Unreal's editor-driven workflow benefits from explicit setup steps.
3. **No .uasset emission** — those files are binary and version-fragile.

#### For Bevy:
1. **Rust system + component definitions** in modules.
2. **Plugin registration snippet** for `App::build()`.
3. **Setup checklist** — entity spawning, asset loading.

#### Engine-agnostic:
1. Pseudocode skeleton with clearly labeled engine-binding points (`// ENGINE: load texture here`).
2. Setup checklist describing what each engine would need.

### Step 5 — write the setup checklist

Every kit ships with a `*-setup.md` that the developer can follow line by line:

```
# <Scene Name> setup

## Hierarchy to build
- <NodeName>  → attach <ScriptName>
  - <ChildName>  → attach <OtherScript>
    - <…>

## Inspector wiring (Unity) / Node resources (Godot)
- <ScriptName>.<fieldName>: assign <asset reference>
- ...

## First-run checklist
1. Build the hierarchy above.
2. Wire the inspector fields.
3. Press play.
4. You should see: <expected behavior>.
5. If you see <unexpected outcome>, check: <common gotcha>.

## What this kit does NOT do
- <Things the developer fills in next>
```

### Step 6 — propose the first iteration tasks

End with a short list of the developer's next 5 things, ordered:
1. Assemble the kit.
2. Confirm the first-run behavior.
3. Fill in the first major TODO.
4. Test in isolation.
5. Hand off to the next phase (review / playtest / etc.).

## Output format

```
ENGINE: <detected>
TARGET: <subject>

KIT WRITTEN TO: <path>

FILES PRODUCED
  - <file 1>: <purpose>
  - <file 2>: <purpose>
  - ...

SETUP CHECKLIST: <path to *-setup.md>

WHAT THIS KIT DOES
  - <intentional capabilities, briefly>

WHAT THIS KIT DOES NOT DO (intentional)
  - <gaps the developer fills next>

NEXT 5 STEPS FOR THE DEVELOPER
  1. <action>
  2. ...

KNOWN GOTCHAS
  - <engine-specific thing to watch out for>
```

## What NOT to do

- **Don't emit binary Unity prefab YAML or Unreal `.uasset`.** Those formats are version-fragile and editor-coupled. Always defer assembly to the editor.
- **Don't emit code that doesn't compile.** The kit must be `dotnet build`-clean (Unity), parse-clean (Godot), `cargo check`-clean (Bevy). Use placeholders (`// TODO: implement movement`) inside methods, not malformed syntax.
- **Don't over-scope.** A scene prototype is a 30-minute scaffold, not an MVP. Resist the urge to implement the actual mechanics — leave clean TODOs.
- **Don't bypass conventions from `design/tech-design.md`.** If the plan says "no singletons," your skeleton shouldn't introduce one.
- **Don't emit asset binaries** (textures, audio). Reference paths from the bible and assume the developer will produce or supply them.

## Engine-specific guidance

### Unity
- Prefer `[SerializeField] private` over `public` for inspector fields.
- Use `[Header(...)]` to group related fields.
- `Update()` is allocation-free by default — don't `new` in it.
- Provide a `[CustomEditor]` only if the field grouping is non-trivial; otherwise, default inspector is fine.

### Godot
- Use `@onready var` for node references, not `_ready()` lookups.
- Signals: declare with `signal` and connect via the inspector or in `_ready()`. Document which is preferred for this kit.
- `.tscn` format: include a header `[gd_scene load_steps=N format=3 uid="…"]`. Generate a placeholder UID and tell the developer Godot will regenerate it on first load.

### Unreal
- C++ classes: declare in `.h`, define in `.cpp`. Match Unreal's style (`UCLASS()`, `UPROPERTY()`, `UFUNCTION()`).
- Blueprint-friendly: mark properties with `BlueprintReadWrite` only if the Blueprint user will actually need them.
- Replication: don't introduce `Replicated` properties unless the design calls for multiplayer.

### Bevy
- One file per system. One module per feature area.
- Components are POD; systems are functions taking queries.
- Register systems in a `Plugin` impl, not directly in `main`.

## Handoff

After scene-prototype:
- Developer assembles the kit per the setup checklist.
- `/code-review-gamestack` — once the kit is filled in, review the new code.
- `/playtest` (M2) — once the scene is playable, drive it via the engine SDK for a real check.
- `/scene-prototype` again — for the next scene.
