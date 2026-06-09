---
name: code-review-gamestack
description: Senior Gameplay Engineer skill — finds runtime bugs that pass CI but blow up in production. Game-specific patterns for Unity, Godot, Unreal, GameMaker, Bevy, iOS / Swift (SpriteKit / SceneKit / Metal / RealityKit). Catches allocation in Update(), off-thread API calls, signal/event leaks, retain cycles, frame-budget violations, tick-order assumptions, save-data corruption patterns. Auto-fixes the obvious. Use when reviewing game code before a playtest, before a commit, or before a merge. Named with the gamestack suffix so it doesn't collide with Claude Code's general-purpose /code-review command.
---

# code-review-gamestack

This skill scans for the bug families that CI doesn't catch — the ones that crash the game on a specific input sequence two weeks after launch, or silently corrupt the save file on power loss. Engine-specific patterns for Unity, Godot, Unreal, GameMaker, Bevy, and iOS native (Swift / SpriteKit / SceneKit / Metal / RealityKit). The review is rigorous, not exhaustive — five high-priority findings beat fifty bikeshed comments.

## When to fire

Use when the user says any of:
- "Review my code"
- "Code review"
- "Are there any bugs in this?"
- "Check this script before playtest"
- "What's wrong with this?"
- `/code-review-gamestack [path]`

If no path is given, review the changes since the last commit (`git diff HEAD~1` or unstaged changes).

## Review mode

Honor `project.review_mode` from `gamestack/state.json` (default: `normal`). Implementation contract: [`docs/STATE.md#review-mode`](../../docs/STATE.md#review-mode).

1. Check `.gamestack/scratch/review-mode-override` first; read + delete if present.
2. Otherwise read `project.review_mode` from state.json. Default `normal`.
3. Tag every finding with `[P0]`, `[P1]`, `[P2]`, or `[taste]` in its header line.
4. Filter or expand the output per the mode table below.

How each mode shapes the family scan:

| Mode | Which families | Per-finding output |
|---|---|---|
| `lean` | Family 1, Family 2, Family 3, AND any `[P0]`/`[P1]` findings from subsystem-specific families (8, 10, 11) when those subsystems appear in the diff. Max 5 findings total. | One-line summary + the line range. No suggested fix prose. |
| `normal` | All 11 families. | Full finding: pattern matched, why it's a bug, suggested fix. Current behavior. |
| `intense` | All 11 families + a regression-risk cross-check on each `[P0]`/`[P1]` finding: "if the suggested fix is applied as-is, what could go wrong?" Confidence rating (high/med/low). | Full finding + the cross-check + confidence. |

Severity calibration for this skill:

| Tag | What earns it |
|---|---|
| `[P0]` | Crashes the game, corrupts saves, off-thread main-API call, allocation in a hot path on a memory-constrained target (Switch/mobile) |
| `[P1]` | Frame-budget violation, signal/event leak with long-lived owners, tick-order bug, missing await on a fire-and-forget Task |
| `[P2]` | Magic number that should be a constant, unused private field, naming inconsistency that doesn't change behavior |
| `[taste]` | "I'd structure this differently" — only flag if it's a maintainability concern worth raising |

## Process

### Step 1 — orient on engine

Detect the engine before reviewing — the bugs you look for depend on it.

| Marker files | Engine | Language |
|---|---|---|
| `Assets/`, `ProjectSettings/`, `*.unity`, `Library/` | **Unity** | C# (sometimes Bolt / Visual Scripting) |
| `project.godot`, `*.tscn`, `*.gd` | **Godot** | GDScript or C# |
| `*.uproject`, `Source/`, `*.uasset`, `Content/` | **Unreal** | C++ or Blueprint |
| `*.yyp`, `*.gmx`, `*.gmproject` | **GameMaker** | GML |
| `Cargo.toml` containing `bevy` dependency | **Bevy** | Rust |
| `package.json` with phaser / three / pixi / babylon | **Web engine** | JS / TS |
| `*.xcodeproj`, `*.xcworkspace`, `Package.swift` with iOS target, `*.swift` under `Sources/`, `Info.plist`, `project.pbxproj` | **iOS native** | Swift (sometimes Objective-C) |
| Otherwise | **engine-agnostic** | review general runtime issues |

When iOS native is detected, identify the rendering framework in use (SpriteKit / SceneKit / Metal / RealityKit / SwiftUI / UIKit) — it changes which bug families apply most. Multiple frameworks can coexist in one project.

Note the detected engine in your opening line of the report. See Step 1b for per-file subsystem detection (which may fire additional subsystem-specific families in Step 2).

### Step 1b — detect subsystems within the engine

Some bug families apply only to a specific subsystem within an engine — shader code, ECS systems, AR scenes, networked replication. After Step 1 determines the engine, run a per-file scan over the diff and tag each file with its subsystem (if any). The result drives which subsystem-specific families fire in Step 2.

**Per-file detection rules** (apply in order; first match wins for a given file):

| Signal | Detected subsystem |
|---|---|
| Engine is Unity AND file extension is `.shader` / `.cginc` / `.hlsl` / `.compute` | **Unity Shader** |
| Engine is Unity AND file body contains a `Shader "` ShaderLab opener | **Unity Shader** |
| File extension is `.gdshader` (Godot 4 native) | **Godot Shader** |
| File extension is `.shader` AND `project.godot` is present in the repo | **Godot Shader** |
| File body contains `shader_type spatial;` / `shader_type canvas_item;` / `shader_type particles;` / `shader_type sky;` / `shader_type fog;` (Godot 4 shader_type opener) | **Godot Shader** |
| Engine is iOS native AND file extension is `.swift` | **iOS native** (already covered by Family 8) |
| Otherwise | (no subsystem tag for this file — only general families apply) |

After scanning every file in the diff, aggregate into a set of subsystems present. The aggregate drives which subsystem families fire in Step 2:

- If "Unity Shader" is in the set → Family 10 fires, scoped to the Unity Shader files only.
- If "Godot Shader" is in the set → Family 11 fires, scoped to the Godot Shader files only.
- If "iOS native" is in the set → Family 8 fires (existing behavior).

**Report-header line.** After the engine line, add a `Subsystems detected (this diff):` line listing each detected subsystem with the file count. Use `MonoBehaviour` as the implicit label for "Unity engine but no specific subsystem detected" files; analogous defaults for other engines (`GDScript` for Godot, `Swift app` for iOS native non-shader, etc.).

Example:
```
Engine:    Unity 6000.0.31f1
Subsystems detected (this diff): Unity Shader (3 files), MonoBehaviour (8 files)
```

If no subsystem is detected anywhere in the diff, write `Subsystems detected: (general only)`.

### Step 2 — scan the diff for runtime bug families

Walk the diff (file by file) and look for these patterns in order of severity. Subsystem-specific families (8 for iOS native, 10 for Unity Shader, 11 for Godot Shader) fire only when their corresponding subsystem appears in Step 1b's per-file detection; they apply only to the files of that subsystem.

#### Family 1 — Per-frame allocation
Worst on Switch and mobile; common on every engine.
- `new` keyword inside `Update()`, `FixedUpdate()`, `LateUpdate()`, `_process()`, or `_physics_process()`.
- LINQ (`Where`, `Select`, `ToList`, `OrderBy`) on hot paths.
- `string +=` or `String.Format` inside per-frame methods (use `StringBuilder` or string interning).
- Closures inside per-frame methods that capture local variables (allocates a closure object per frame).
- `Camera.main`, `GetComponent<T>()`, `Find*` called every frame instead of cached in `Awake`/`OnEnable`.

Why it matters: GC spikes cause frame drops. Switch in particular is unforgiving — a single 5ms GC pause is a cert smell.

#### Family 2 — Off-thread engine API calls (Unity)
- Unity engine APIs (`Transform`, `GameObject`, `Component.*Find*`) called from `Task.Run`, `ThreadPool`, `async void` paths.
- Most Unity APIs are main-thread only. Calling from a worker silently corrupts state or crashes.
- Exceptions that ARE thread-safe: `UnityWebRequest` (mostly), `Mathf`, `Job System` / `Burst` jobs, `JsonUtility` (data-only).

#### Family 3 — Coroutine and signal leaks
- **Unity:** `StartCoroutine` without storing the handle, then no `StopCoroutine` in `OnDisable` / `OnDestroy`.
- **Godot:** `connect(...)` without a matched `disconnect(...)` where the source outlives the target. Use `CONNECT_ONE_SHOT` for fire-and-forget.
- Subscribing to **static or singleton events** without unsubscribing — most common cause of "stale ghost listeners after scene reload."
- `+=` on a C# event without a `-=` somewhere visible.

#### Family 4 — Frame-budget violations
- Heavy loops in `Update()` with no time-slicing (`Physics.Raycast` over hundreds of items, expensive material setup, terrain generation).
- `Instantiate` or `Destroy` of complex prefabs per-frame — use pooling.
- Synchronous I/O on the main thread (`File.ReadAllText`, `JsonUtility.FromJson` on big payloads, blocking network calls).
- `Camera.RenderToTexture` calls on the main thread without budgeting.

#### Family 5 — Tick-order assumptions
- A script in `Update()` reading state that another script writes in `LateUpdate()` — non-deterministic.
- Animation events firing assuming `Animator.Update` ran before script `Update` — not guaranteed without `Script Execution Order` overrides.
- Inter-script dependencies that rely on `Awake`/`Start` ordering — fragile.

#### Family 6 — Save-data and serialization
- Public `[SerializeField]` field gets renamed without `[FormerlySerializedAs]` — silently loses data on existing saves.
- Save format has no version field — first patch breaks every existing save.
- Save is taken in a destruction callback (`OnDestroy`, `OnApplicationQuit`) without protection against partial writes.
- File writes to the save location without atomic temp-file + rename — power loss = corrupted save = cert failure on PS5/Xbox/Switch.

#### Family 7 — Input and controller hygiene
- `Input.GetKey(KeyCode.X)` with no controller-button equivalent — accessibility violation + console cert blocker.
- Hold-to-press mechanics with no toggleable alternative — accessibility violation.
- Cursor-locked states without an explicit unlock path on focus loss — players can't alt-tab.
- Direct `Input.*` calls instead of the new Input System action map — fragile when remapping is added.

#### Family 8 — iOS / Swift-specific (SpriteKit / SceneKit / Metal / RealityKit / UIKit / SwiftUI)

This family fires only when the engine is `iOS native`. Each sub-pattern below maps to a runtime bug class that App Review or the Crashes panel in Xcode Organizer will eventually find. Catch them in review instead.

- **Retain cycles in `@escaping` closures.** Any closure capturing `self` inside an `@escaping` parameter (`URLSession`, `DispatchQueue.main.asyncAfter`, `Timer`, custom completion handlers) needs `[weak self]` or `[unowned self]`. Strong-self capture inside an escaping closure stored on a long-lived object (a scene, a view controller, a service) is the canonical iOS leak.
- **Strong `delegate` references.** `var delegate: SomeProtocol?` should almost always be `weak var delegate: SomeProtocol?`. Strong delegate references form a retain cycle between the parent and the delegate. `weak` requires the protocol be `AnyObject`-constrained (`protocol Foo: AnyObject`).
- **Force-unwraps (`!`) in production code paths.** Every `try!`, `as!`, IUO (`String!`), and trailing `!` on an `Optional` is a crash-on-bad-input waiting for a player. Optional-binding (`guard let`, `if let`) or default values (`??`) are the fix. The whitelist exception is `@IBOutlet` properties wired in storyboards — those legitimately use IUO.
- **UIKit / SwiftUI on a background thread.** Any UIKit (`UIView`, `UIImageView`, anything starting with `UI`) or SwiftUI `@State` / `@Published` mutation outside the main thread is undefined behavior. Look for UI calls inside `URLSession` completion handlers, `Task.detached`, `DispatchQueue.global().async`, or any `async` function not marked `@MainActor`. Fix with `DispatchQueue.main.async { ... }`, `await MainActor.run { ... }`, or `@MainActor` annotation.
- **`CADisplayLink` leaks.** A `CADisplayLink` retains its target. If you don't call `displayLink.invalidate()` in `deinit` (or when leaving the scene), the target is retained forever and the deinit never runs. Same applies to `CVDisplayLink` (less common in iOS, but flag it).
- **Background task without `endBackgroundTask`.** `UIApplication.shared.beginBackgroundTask(...)` returns a token that MUST be passed to `endBackgroundTask(_:)` when the work finishes OR when the system fires the expiration handler. Missing the `endBackgroundTask` call is a watchdog-kill bug; iOS terminates the app and the player loses progress.
- **`Timer.scheduledTimer` strong self-capture.** `Timer.scheduledTimer(withTimeInterval:repeats:block:)` retains its block target. Capture `[weak self]` inside the block. Even better: use `DispatchSourceTimer` for fine-grained lifecycle control.
- **`NotificationCenter` observers not removed.** `NotificationCenter.default.addObserver(...)` with a selector requires a paired `removeObserver(...)` in `deinit` (or earlier). The block-based variant retains the block; capture `[weak self]` AND remove the token in `deinit`. The implicit-token form (`addObserver(forName:object:queue:using:)`) returns an `NSObjectProtocol` you must store and remove.
- **In-app purchase receipt validated client-side.** Receipt validation in-app (parsing the receipt locally, comparing the bundle ID, calling `verifyReceipt` on Apple's URL from the device) is the canonical jailbreak-bypass vector. Validation must happen on a server you control, or via StoreKit 2's `Transaction.currentEntitlements` async stream (which is server-validated by Apple). Any `Bundle.main.appStoreReceiptURL`-based local validation in the diff is a P0 finding.
- **`Documents` vs `Caches` directory misuse.** `FileManager.SearchPathDirectory.documentDirectory` is for user-generated content the player would expect to back up to iCloud and would be upset to lose. `.cachesDirectory` is for derived data the system can purge under storage pressure. Saving the player's save file to Caches loses the save when iOS reclaims storage; saving a downloaded asset cache to Documents inflates iCloud backup size and gets App Review complaints. Cross-reference the path with the data's character.
- **`didReceiveMemoryWarning` not handled.** `UIApplication.didReceiveMemoryWarningNotification` (or `UIViewController.didReceiveMemoryWarning()`) is iOS asking you to free what you can before the system kills the process. A game with texture caches, audio buffers, or large scene state and no memory-warning handler ships with a P1 OOM-kill bug — usually first surfaces in Instruments Allocations during long sessions.
- **App lifecycle: `applicationWillResignActive` / `sceneWillResignActive` not saving state.** When iOS sends the app to background, the developer has ~5 seconds to persist state before the process can be suspended (or killed under memory pressure). Saves taken in `applicationWillTerminate` are unreliable — that callback often doesn't fire before kill. Save on `WillResignActive` / `DidEnterBackground` with atomic file writes.
- **`GameKit` / `StoreKit` lifecycle leaks.** `GKMatchmaker`, `GKLocalPlayer.local.authenticateHandler`, `SKPaymentQueue.default().add(observer:)` all install long-lived references. Remove observers (`SKPaymentQueue.default().remove(observer:)`) on teardown; clear the auth handler if the player signs out.

#### Family 10 — Unity Shaders (ShaderLab / HLSL / Compute)

This family fires only when at least one file in the diff is detected as Unity Shader (Step 1b). Checks apply only to those shader files; standard C# files in the same diff go through Families 1-7, 9.

- **`[P0]` Dynamic branching on a uniform without `static const` or `multi_compile`.** Mobile GPU compilers (Adreno, Mali) often emit both sides of a dynamic branch, killing the perf benefit. Use `static const bool USE_X = ...;` set from compile-time defines, OR split into variants via `#pragma multi_compile _ USE_X`.
- **`[P0]` Derivatives (`ddx` / `ddy` / `fwidth`) inside a conditional block.** Behavior is undefined when control flow is non-uniform across the warp/wavefront. Move derivatives outside the conditional, or compute screen-space gradients explicitly.
- **`[P1]` Sampler state inferred instead of declared.** Unity's auto-generated samplers (e.g., `sampler_MainTex_repeat`) depend on the `.meta` file's `wrapMode` / `filterMode`. Cross-file coupling is fragile. Declare `SamplerState sampler_MyTex` explicitly with the wrap/filter mode the shader requires.
- **`[P1]` `_MainTex` hardcoded when the project's render pipeline is URP or HDRP.** URP uses `_BaseMap`; HDRP uses `_BaseColorMap`. A shader bound to `_MainTex` breaks `SpriteRenderer` and `MeshRenderer` integration on non-built-in pipelines. Use the pipeline-appropriate name OR `#pragma multi_compile _ UNITY_PIPELINE_URP UNITY_PIPELINE_HDRP` and alias accordingly.
- **`[P1]` Half-precision (`half` or `fixed`) used for world-space coordinates.** `fixed` is ~7 mantissa bits, `half` is ~10. World positions need `float`. World-space `> ~1024` units shows quantization on mobile. Reserve `half` for colors, normals, and intermediates in `[-1, 1]`-ish range.
- **`[P1]` Compute shader `[numthreads(...)]` exceeds platform max.** Mali caps workgroups at 256-512; Tegra (Switch) at 1024. Hardcoded `[numthreads(1024,1,1)]` on Switch silently fails. Either query `SystemInfo.maxComputeWorkGroupSizeX` at runtime and dispatch accordingly, OR add `#if UNITY_SWITCH` guard with a smaller variant.
- **`[P1]` Missing `LOD <n>` directive on a multi-platform shader.** Without `LOD`, the fallback chain on lower-tier devices is unpredictable. Set explicit LODs (100 fallback, 200/300 higher quality).
- **`[P2]` sRGB / linear sampling mismatch.** Texture imported as `sRGB (Color Texture)` but sampled with operations in linear space without `pow(c, 2.2)` (or vice-versa). Washed-out or overly-dark output. Comment which colorspace each sampler input expects at the top of the shader.
- **`[P2]` `#pragma multi_compile FOO BAR` without underscore-default.** When no keyword is set, the shader silently fails to compile in some contexts. Prefer `#pragma multi_compile _ FOO BAR` so the unset case is explicit.

#### Family 11 — Godot Shaders (.gdshader / GLSL-ish)

This family fires only when at least one file in the diff is detected as Godot Shader (Step 1b). Checks apply only to those shader files; standard GDScript / C# files in the same diff go through Families 1-7, 9.

- **`[P0]` `texture()` call inside an `if` / `else` with a screen-derived or uniform condition.** Same warp-divergence rule as Unity's `ddx` / `ddy` constraint. Sample outside the branch and pick the result inside.
- **`[P1]` Missing `render_mode` directive at the top.** Without an explicit `render_mode unshaded;` (or another), the shader inherits Godot's default lit pipeline — expensive for what's meant to be a flat shader. Be explicit.
- **`[P1]` `SCREEN_TEXTURE` sampled in an opaque-queue material.** Godot populates `SCREEN_TEXTURE` only for transparent-queue materials; opaque materials read garbage (or last-frame). Either move the material to transparent (`render_mode unshaded, blend_mix;`) or restructure to avoid `SCREEN_TEXTURE`.
- **`[P1]` `varying` written in only some branches of the vertex stage.** Godot 4's shading language requires every code path in the vertex shader to write to a declared `varying`. A conditional write yields undefined behavior in the fragment stage. Initialize at declaration or write unconditionally.
- **`[P2]` `UV2` / second-color attribute referenced without a guarantee the mesh provides it.** Reading `UV2` from a `MeshInstance3D` whose mesh has only one UV channel returns zero — silent rendering bug. Document the prerequisite at the top of the shader (e.g., `// Requires mesh with UV2 channel; use ArrayMesh.add_surface_from_arrays with ARRAY_TEX_UV2`).
- **`[P2]` Default precision not declared for mobile-targeted shaders.** Godot 4 defaults to `highp` on desktop, `mediump` on mobile. A shader needing `highp` on mobile (world positions, large UV ranges) without `precision highp float;` becomes a mobile-only artifact bug.

#### Family 9 — Engine-agnostic patterns
- Magic numbers without comment explaining intent (acceleration, timing thresholds, attack windows).
- Hardcoded file paths that break on case-sensitive filesystems (macOS, Linux differ from Windows).
- Mutable static state shared across scenes — survives reload, causes ghost bugs.
- Empty `catch` blocks swallowing exceptions silently.
- `// TODO: fix later` on a hot path. Don't ship those.

### Step 3 — categorize each finding

The developer is reviewing solo. There is no second pair of eyes to catch a bad auto-fix. **Default to surfacing, not editing.**

Tag every finding with one of:

- **`[PROPOSE]`** *(default)* — describe the fix and the diff, but do **not** apply it. The developer applies after reading. This covers almost every finding the skill produces, including: events subscribed without unsubscribe, save fields renamed without `[FormerlySerializedAs]`, missing `CancellationToken`s, suspicious tick-order assumptions, every `[ASK]`-style design call from the old taxonomy, and most `[AUTO]`-style mechanical fixes.
- **`[AUTO]`** — reserved for the narrow whitelist below. The fix is mechanical, local, behavior-preserving, and easily reverted via the same diff in reverse. **Apply the fix directly and report it.** Whitelist:
  - `string +=` inside a per-frame method → `StringBuilder` (purely a perf rewrite).
  - `GetComponent<T>()` / `FindObjectOfType<T>()` / `Camera.main` called per-frame → cache the lookup into an `Awake` / `OnEnable` field (purely a perf rewrite).
  - LINQ `Where` / `Select` over a `List<T>` per frame → equivalent `for` loop building into a pre-allocated buffer.
  - Empty `catch { }` → `catch (Exception ex) { Debug.LogException(ex); }` (still surface to the developer because empty catches usually hide a real bug; the autofix only makes the swallow visible).
  - **Nothing involving Godot signal connect / disconnect, nothing changing serialized field names, nothing changing input handling, nothing touching save format, nothing changing thread affinity, nothing modifying a public API surface.** Those are always `[PROPOSE]`.
- **`[FLAG]`** — a smell, not a bug. Report with severity but don't fix and don't propose a fix — the developer's call whether the smell merits investigation.

If you're unsure whether a finding qualifies for `[AUTO]`, it doesn't. Default `[PROPOSE]`.

Group findings by file. For each finding give:
- File and line number.
- The pattern that triggered the flag (e.g., `Family 1: per-frame allocation`).
- Why it's a problem on the detected engine.
- The fix (applied for `[AUTO]`; proposed diff for `[PROPOSE]`; description for `[FLAG]`).

### Step 4 — completeness sweep

Before declaring the review done, ask yourself:
- Did I check every `OnEnable`/`OnDisable` symmetry?
- Did I check every save/load symmetry?
- Did I check for empty `catch { }` that swallow exceptions?
- Did I check whether async/awaited tasks have `CancellationToken`s?
- Did I check for `is_instance_valid()` guards before Godot `await` resumes?

If any were applicable and you didn't check, do another pass.

## Output format

### Minimal shape

A minimal report shape (the engine and mode go in the report header so the reader knows the calibration):

```
Engine:     <detected>
Subsystems: <comma-separated list, e.g., "Unity Shader (3), MonoBehaviour (8)"; or "(general only)">
Mode:       <lean | normal | intense>

Findings:
  · [P0] <file>:<line> — <one-line summary>
       <body / suggested fix in normal+>
  · [P1] ...
  · [P2] ...

Summary: <N> [P0], <N> [P1], <N> [P2]<, <N> [taste] in normal+>
```

Findings are ordered by severity (`[P0]` first), then by file path. In `lean` mode, only `[P0]` and `[P1]` findings appear and the summary line truncates accordingly.

### Full shape

```
ENGINE:      <detected engine>
SUBSYSTEMS:  <comma-separated; or "(general only)" if none detected>
DIFF SCOPE:  <range of commits / unstaged changes>

[AUTO]    N findings applied (whitelist only)
[PROPOSE] N findings surfaced for your review (default)
[FLAG]    N smells reported

── findings ──────────────────────────────────────

<file>:<line>  [AUTO | PROPOSE | FLAG]
  Pattern:  <family>.<subcategory>
  Why:      <one sentence>
  Action:   <auto-fixed | proposed diff | smell>
  Detail:   <applied edit, or proposed diff, or smell description>

...
```

## Engine-specific cheat sheet

### Unity (C#)
- `Update()`: no `new`, no LINQ, no `GetComponent`, no `Find`.
- `OnDisable()`: must unsubscribe every event subscribed in `OnEnable()`.
- Coroutines: store the handle, stop in `OnDisable`.
- Threading: stay on the main thread for `Transform`/`GameObject`. Use the Job System for parallel CPU work.
- `[SerializeField] private` over `public` for inspector-exposed fields.
- **Shaders:** float for world-space positions; declare sampler state explicitly; URP/HDRP use `_BaseMap` (not `_MainTex`); no derivatives in conditional blocks; compute thread groups capped at 256 on Mali (1024 on desktop).

### Godot 4.x (GDScript or C#)
- `_process(delta)`: no `instantiate()`, no signal connection per frame.
- Signals: `connect()` must have a matched `disconnect()` in `_exit_tree()`, OR use `CONNECT_ONE_SHOT`.
- Free vs. queue_free: prefer `queue_free()` to avoid mid-frame deletion bugs.
- `await` semantics: a node freed mid-await crashes — guard with `if not is_instance_valid(self): return`.
- C# bindings: dispose `Godot.Object` subclasses explicitly to avoid native-side leaks.
- **Shaders:** explicit `render_mode`; `SCREEN_TEXTURE` is transparent-queue only; declare `precision highp float;` for mobile world-space; vertex `varying` must be written unconditionally.

### Unreal 5 (C++ / Blueprint)
- UObject lifecycle: use `TWeakObjectPtr` for cross-actor references.
- Timer handles must be cleared in `EndPlay`.
- `BeginPlay` order isn't deterministic — use `OnConstruction` for setup that must precede play.
- Replication: server-only logic must have `if (HasAuthority())` gates.
- Reflection-tagged properties (`UPROPERTY`) must be on `UObject` heirs to participate in GC.

### GameMaker (GML)
- `Create` event: initialize every instance variable (no implicit `undefined`).
- `Destroy` event: clean up data structures (`ds_list_destroy`, `ds_map_destroy`) you created.
- State across rooms: use globals sparingly; prefer `persistent` objects.
- `with()` blocks: confirm you don't accidentally enter no-instance state (`with(noone)` is a no-op trap).

### Bevy (Rust)
- System order: explicit `before()` / `after()` for systems with dependencies.
- `Query` filters: panics on conflicting access; design queries to be disjoint.
- `Commands` are deferred to the end of the schedule — don't expect them mid-system.
- Resource access via `Res<T>` vs `ResMut<T>` — borrow-check at runtime.

### iOS native (Swift / SpriteKit / SceneKit / Metal / RealityKit)
- `@escaping` closures: capture `[weak self]` unless the closure provably outlives nothing that owns it.
- `var delegate: T?` → `weak var delegate: T?` (and `protocol T: AnyObject`).
- No `try!` / `as!` / IUO outside `@IBOutlet`. `guard let` or `??` the rest.
- UI mutation on the main thread only — `DispatchQueue.main.async { ... }` or `@MainActor`. SwiftUI `@State` and `@Published` are not thread-safe.
- `CADisplayLink`, `Timer`, `NotificationCenter` observers: invalidate / remove in `deinit`.
- `beginBackgroundTask` is always paired with `endBackgroundTask` — including from the expiration handler.
- IAP receipt validation server-side (or via StoreKit 2's `Transaction.currentEntitlements`). Never client-only.
- `Documents` = user data (backed up to iCloud). `Caches` = derived (purgeable). Don't swap.
- Save state on `WillResignActive` / `DidEnterBackground` with atomic writes. Don't rely on `WillTerminate`.
- `applicationDidReceiveMemoryWarning` (UIKit) / `MXMemoryMetric` signal: free caches, drop textures, downgrade scene fidelity.
- SpriteKit: `SKAction.repeatForever` on a node keeps the action alive — call `removeAllActions()` before releasing the node reference.
- SceneKit / RealityKit: `SCNNode` / `Entity` parent retains children; orphan a subtree by calling `removeFromParent()` before letting your reference drop, or it lives on in the scene graph.
- Metal: `MTLCommandBuffer` retains its encoders until committed; never hold one across frames.

### Web (Phaser / Three.js / PixiJS / Babylon)
- `requestAnimationFrame` callbacks: guard against page hidden state (`document.visibilityState`).
- WebGL context loss: handle the `webglcontextlost` event with restore logic.
- Audio context: must resume on a user gesture (page-load autoplay is blocked).
- Use `OffscreenCanvas` for worker-side rendering, not the main canvas.

## What NOT to do

- **Don't review style.** "Use camelCase here" or "prefer `var`" belongs in a linter, not a senior code review.
- **Don't suggest features.** Code review is correctness and runtime safety. Not design.
- **Don't bikeshed.** If both options work, the existing one wins.
- **Don't auto-fix anything that could change game behavior.** Caching `GetComponent` is safe. Refactoring how an input is read is not — that's `[PROPOSE]`. When in doubt, `[PROPOSE]`.
- **Don't expand the `[AUTO]` whitelist on the fly.** If a finding looks like it should be auto-fixed but isn't in the whitelist, that's a signal the whitelist needs review — log it as `[PROPOSE]` and flag it in the report for the maintainer.
- **Don't pile on.** Five high-priority findings are useful. Fifty are noise that hides the real bugs.
- **Don't review code outside the diff** unless you suspect a finding in the diff has roots elsewhere.

## When to bail

If the diff is empty, the engine is genuinely unrecognizable, or the user pointed you at a path that doesn't contain game code, say so and ask for clarification. Don't fabricate a review of code you haven't read.

## Handoff

Findings from `/code-review-gamestack` often feed into:
- `/bug-hunt` (post-M2) — when an `[ASK]` reveals an underlying bug worth investigating deeply.
- `/playtest` (post-M2) — once the review passes, drive a real session to confirm the fix doesn't introduce regressions.
- `/critique --lens=perf` (post-M2) — when Family 1 or 4 findings are dense, run a perf snapshot before and after the fixes to confirm impact.
