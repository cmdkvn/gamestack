# gamestack engine SDKs

Two packages, one contract. The Unity SDK and the Godot SDK expose the same HTTP API so the same scenarios drive both engines. This document is the cross-engine reference — what the SDK is for, what the contract is, and where the two implementations diverge. For the full per-engine spec, follow the cross-links.

## What the SDKs are for

A gamestack engine SDK is a small server that lives inside your running game and lets gamestack skills drive it. [`/playtest`](../skills/playtest/SKILL.md) uses it to walk scenarios end to end. [`/critique --lens=perf`](../skills/critique/SKILL.md) uses it to capture frame data tagged with the player's actual situation. [`/critique --lens=feel`](../skills/critique/SKILL.md) uses it to fire a verb a hundred times and watch the response. Without the SDK, those skills degrade to static analysis — they read the code instead of running it, and miss the bugs that only show up in motion.

The SDK is not a save system. It is not a debugger. It does not ship in your retail build. It is the interface between your game and the rest of gamestack, and its single job is to make a running build inspectable, drivable, and reproducible from outside.

## Why two implementations

Unity and Godot cover roughly 95% of solo indie narrative-game developers. Building both gets the SDK into the hands of nearly every gamestack user. Unreal lands post-v1 — the contract is portable, but the implementation is heavier and the user count is thinner at the solo end. Three implementations of the same contract is one engineering project. One implementation that "works on the others later" is two engineering projects, and the second one never happens.

The HTTP contract is identical across engines. The implementation differs where the engine's idioms differ — Unity has attributes and worker threads, Godot has duck typing and a single-threaded event loop. The cross-engine contract is what stays; the per-engine ergonomics are what change.

## Why HTTP, not WebSocket

HTTP is request/response. The scenario format is request/response. Adding a streaming transport would solve a problem nobody has. Loopback HTTP is ubiquitous, debuggable with `curl`, profilable with the browser, and survives editor reloads cleanly. WebSocket would buy push-from-game-to-skill, which the contract doesn't use — every state read is initiated by the skill. If a future skill needs streaming, it can be added without rewriting the existing endpoints. For now, request/response is the right shape.

## Endpoints

The contract is eight endpoints. Both SDKs implement all eight at feature parity in v0.2.0. Default ports differ — Unity binds 7331, Godot binds 7332 — so both can run side by side during cross-engine development.

| Method | Path | Purpose | Unity notes | Godot notes |
|---|---|---|---|---|
| `GET` | `/health` | Liveness + endpoint list. | Default port 7331. | Default port 7332. |
| `GET` | `/state` | Scene name, FPS, frame time, plus all tagged values. | Tagged via `[GameStackState]` attribute. | Tagged via `GameStack.expose()` call. |
| `POST` | `/screenshot` | PNG or JPEG of the current frame. | `ScreenCapture` API, marshaled to main thread. | `Viewport.get_texture().get_image()` inline. |
| `POST` | `/input` | Synthesized input events. | Dispatched to `InputInjector.OnInput` (static C# event). | Emitted on `GameStack.input_injector.on_input` (signal). |
| `POST` | `/snapshot` | In-memory snapshot; returns ID. | Captures `[GameStackState]` fields + `IGameStackSnapshotable` payloads. | Captures `expose()` callables + nodes registered via `register_snapshotable`. |
| `GET` | `/snapshots` | List stored snapshot IDs. | Same shape. | Same shape. |
| `POST` | `/restore` | Restore a snapshot by `{ "id": "..." }`. | Restores `Time.timeScale` + tagged + custom. | Restores `Engine.time_scale` + tagged + custom. |
| `POST` | `/breakpoint` | Tag-based pause filter + pause/resume. | `BreakpointProvider.Hit("tag")` at checkpoints. | `GameStack.hit("tag")` at checkpoints. |

Snapshots are in-memory only and lost on app shutdown. They are not the player's save system, and they must not become it. Conflating the two is how save-corruption bugs end up tagged as "works on my machine."

## State exposure

The shape of `/state` is identical in both engines:

```json
{
  "scene": "Level1",
  "fps": 60,
  "frameTimeMs": 16.67,
  "tagged": {
    "default": { "hp": 100 },
    "match":   { "score": 0 }
  }
}
```

The mechanism to populate `tagged` is the only thing that differs.

### Unity — attribute

```csharp
using UnityEngine;
using Gamestack;

public class PlayerController : MonoBehaviour
{
    [GameStackState("hp")]               // tagged.default.hp
    [SerializeField] private int health = 100;

    [GameStackState("score", "match")]   // tagged.match.score
    public int Score { get; private set; }
}
```

The server reflects over loaded `MonoBehaviour`s once per `/state` call and reads each tagged field. No registration step.

### Godot — explicit registration

```gdscript
extends Node

var health: int = 100

func _ready() -> void:
    GameStack.expose(self, "hp", "player", Callable(self, "get_hp"))

func get_hp() -> int: return health
```

GDScript has no attribute syntax, so registration is a method call. The autoload tracks the node and cleans up automatically when it leaves the tree — no manual unregister.

Supported value types overlap heavily (numbers, strings, vectors, colors, quaternions) and both engines fall back to a string representation for anything exotic. See [Unity SDK README](../engines/unity/README.md) and [Godot SDK README](../engines/godot/README.md) for the exact lists.

## Input injection

The `InputEvent` shape is identical:

```json
{
  "events": [
    { "device": "Keyboard", "action": "Press", "control": "Space" },
    { "device": "Gamepad",  "action": "Value", "control": "Horizontal", "value": -1.0 },
    { "device": "Mouse",    "action": "Move",  "x": 540, "y": 320 }
  ]
}
```

Devices: `Keyboard`, `Mouse`, `Gamepad`, `Touch`, `Custom`. Actions: `Press`, `Release`, `Value`, `Move`, `Custom`. The SDK does not interpret these — it forwards them. Your game subscribes to a single channel and translates events into whatever your input model expects (Input System actions, axis values, command structs). One translation layer; not one per scenario.

### Unity — static event

```csharp
private void OnEnable()  => InputInjector.OnInput += Handle;
private void OnDisable() => InputInjector.OnInput -= Handle;

private void Handle(InputEvent e)
{
    if (e.device == InputDevice.Keyboard && e.control == "Space" && e.action == InputAction.Press)
        player.Jump();
}
```

The unsubscribe in `OnDisable` is not optional. A static-event subscription that outlives its publisher is the canonical Unity signal-leak family bug — `/code-review-gamestack` will catch it, but writing it correctly the first time is cheaper.

### Godot — signal

```gdscript
func _ready() -> void:
    GameStack.input_injector.on_input.connect(_on_input)

func _on_input(event_data: Dictionary) -> void:
    if event_data.device == "Keyboard" and event_data.control == "Space" and event_data.action == "Press":
        player.jump()
```

Godot's signal teardown happens when the node frees, so no explicit disconnect is required. If you connect from both `_ready()` and `_enter_tree()`, you'll get double-fires — that's the leak family in this engine, and `/bug-hunt` has a worked example.

The `/input` response includes `eventsAccepted`, `subscriberCount`, and `errorCount` so the calling skill can detect "events sent into the void" before the scenario assertion fails three steps later.

## Snapshot / restore

`POST /snapshot` returns a generated ID. `POST /restore` with that ID puts the world back. Both engines capture time scale, scene name, and all exposed state. The bring-your-own-state hook is where the engines diverge.

### Unity — interface

```csharp
public class Inventory : MonoBehaviour, IGameStackSnapshotable
{
    public string SnapshotKey => "inventory";
    [SerializeField] private int playerHp = 100;
    public object CaptureSnapshot() => new Dictionary<string, object> { ["hp"] = playerHp };
    public void RestoreSnapshot(object payload)
    {
        if (payload is Dictionary<string, object> d && d.TryGetValue("hp", out var hp))
            playerHp = System.Convert.ToInt32(hp);
    }
}
```

Components implementing `IGameStackSnapshotable` are discovered automatically. Implement the three members; the SDK does the rest.

### Godot — duck typing

```gdscript
func _ready() -> void:
    GameStack.register_snapshotable(self)

func _gamestack_snapshot_key() -> String:
    return "inventory"

func _gamestack_capture_snapshot() -> Variant:
    return { "hp": player_hp }

func _gamestack_restore_snapshot(payload) -> void:
    if payload is Dictionary:
        player_hp = payload.get("hp", 100)
```

GDScript doesn't have interfaces, so the contract is method names. Implement the three methods, call `register_snapshotable(self)` in `_ready()`, and the SDK invokes them as needed. The cost of duck typing is silent failure when a name is misspelled — `_gamestack_captre_snapshot` will not raise; it will simply not be called. The Godot SDK tests cover the round trip but they cannot catch a typo in your code.

A snapshot that captures the player's HP and restores it later is the building block for the save-fuzz scenario in [`05-cert-save-fuzz.json`](../skills/playtest/scenarios/05-cert-save-fuzz.json). If your game has state worth restoring, the SDK is the place to wire it.

## Breakpoints

Breakpoints are not debugger breakpoints. They're tagged checkpoints in your game code that gamestack can choose to pause on. The game decides what's worth tagging; the skill decides which tags to listen for.

### Unity

```csharp
BreakpointProvider.Hit("after-boss-spawn");
BreakpointProvider.Hit("on-death");
BreakpointProvider.Hit("before-save");
```

### Godot

```gdscript
GameStack.hit("after-boss-spawn")
GameStack.hit("on-death")
GameStack.hit("before-save")
```

The `/breakpoint` endpoint manages the filter:

```json
{ "action": "add-pause",    "tag": "after-boss-spawn" }
{ "action": "remove-pause", "tag": "after-boss-spawn" }
{ "action": "clear-pause" }
{ "action": "resume" }
{ "action": "status" }
```

Wildcard tag `"*"` pauses on every hit — useful for stepping through a noisy region once and never again. Every response includes `isPaused`, `lastPausedAt`, `pauseOnTags`, and `recentHits`, which is what the `assert_recent_breakpoint` step type reads.

When to use them in a scenario: anywhere you need the world to be at a *known* point before a screenshot or assertion. "After the boss has fully spawned" is not a wall-clock duration; it's a semantic event. Sleeping for 3 seconds and hoping the spawn animation finished is the flake source you'll spend half a Friday debugging. A breakpoint at the end of the spawn coroutine pauses on the actual event and lets the scenario continue when ready. See the pattern in [scenarios/README.md](../skills/playtest/scenarios/README.md).

## Threading model

This is where the two engines genuinely differ, and where most cross-engine confusion comes from.

**Unity.** HTTP requests arrive on a worker thread provided by the `HttpListener`. Almost every Unity API is main-thread-only — touching `Transform`, calling `ScreenCapture`, reflecting over `MonoBehaviour`s, or modifying `Time.timeScale` from a worker thread is undefined behavior. The SDK ships an internal `MainThreadDispatcher` that the request handlers use to marshal work back. The marshaling is invisible to your code, but it does mean every request adds a frame of latency in the worst case — the worker enqueues, the main thread picks up next `Update`, the response is built, and the worker writes it back.

**Godot.** The HTTP server runs inside `_process()` on the main thread. Connections are accepted and requests handled inline. There's no marshaling because there's nowhere to marshal *to* — everything is already on the main thread. The cost is that a slow request handler blocks the frame. The benefit is that there's no thread-affinity class of bug.

Why the difference matters: in Unity, your snapshot capture runs on the main thread regardless, so your `CaptureSnapshot()` method can call any Unity API safely. In Godot, the same is true for an unrelated reason. If you ever port custom snapshot logic from one engine to the other, the API surface is identical, but the implicit "what thread am I on?" question has a different answer. Document the assumption; don't rely on it staying invariant if a future Unity SDK version moves to async handlers.

## Security defaults

Both SDKs bind to `127.0.0.1` by default. Both ship with a `loopback_only` config flag that must be explicitly disabled to listen on other interfaces. Don't.

If you turn off `loopback_only` in a shipping build, anyone on the same network can read your state, inject input, snapshot and restore — including hostile networks at conferences, on co-working WiFi, or on a hotel guest network. There is no authentication on the SDK because there is no plausible threat model for an authenticated localhost contract; the moment you expose it externally, the absence of auth becomes the threat model.

For shipping builds, the rule is simpler: turn the whole server off. In Unity, set `Enabled = false` on the config asset for the shipped build, or wrap the server GameObject behind `#if UNITY_EDITOR || GAMESTACK_DEV_BUILD`. In Godot, set `config.enabled = false` on the exported config, or gate the autoload with `if OS.is_debug_build():`. The SDK does not need to ship in your release binary, and it should not.

Cert builds in particular should never include the SDK. The endpoints have no place in a console submission; if a tester finds them, they'll fail your cert. Build configurations for cert targets must exclude the package.

## Driving the SDK from outside

Two CLIs and one skill drive the SDK in practice.

[`gamestack-playtest-daemon`](../bin/impl/playtest-daemon/README.md) walks a scenario JSON file end to end, posts to the endpoints, captures step results, and exits non-zero on assertion failures. Use it in CI for regression smoke. The same scenario JSON drives Unity (`--engine unity`) and Godot (`--engine godot`); only the default port changes.

[`gamestack-game-benchmark`](../bin/impl/game-benchmark/README.md) captures frame-rate, frame-time distribution, draw calls, GC allocations, and peak memory while a scenario runs. Pair with the daemon to get perf data tagged with the player's actual situation rather than synthetic stress.

[`/playtest`](../skills/playtest/SKILL.md) is the interactive driver. It probes `/health`, picks scenarios based on the game's production phase, runs them against the SDK, and files findings as P0/P1/P2 with regression scenarios for any confirmed bug. Offline (no SDK reachable), it degrades to static analysis and tags findings `OFFLINE-MAYBE`.

The contract those three rely on is the nine step primitives documented in [scenarios/README.md](../skills/playtest/scenarios/README.md). New primitives are a contract change that touches all three — don't invent them ad hoc.

## Adding a new engine

A third SDK — Unreal is the post-v1 candidate — needs to ship the same eight endpoints with the same request/response shapes. Cross-engine scenarios are the leverage; an Unreal SDK that gets 95% of the contract right and 5% subtly wrong forces every scenario to fork.

The work is roughly:

1. **Lift the HTTP layer.** A localhost server with the eight endpoints. Use whatever the engine's idiomatic HTTP library is — `FHttpServerModule` for Unreal, `tiny_http` for a Bevy SDK. Match request and response JSON shapes byte for byte against the Unity and Godot reference responses.
2. **Pick the state-exposure idiom.** Attribute-driven (Unity), call-driven (Godot), or registration-driven (likely Unreal `UFUNCTION` reflection). The mechanism is engine-shaped; the resulting `/state` payload must not be.
3. **Wire input and snapshot through engine-native channels.** Input goes through whatever the engine's input pipeline is — input maps, action mappings, `InputComponent` bindings. Snapshots use whatever serialization the engine offers (reflection in Unreal, manual capture in Bevy). The contract is in/out; the engine's job is the inside.
4. **Decide the threading story explicitly.** Document it the way this file documents Unity and Godot. A handler that touches engine state from the wrong thread is a flaky-scenario factory.
5. **Match the security defaults.** Loopback-only, editor-by-default, explicit opt-in for exposure, never in shipping.
6. **Pass the existing scenarios.** Run [`00-sdk-smoke.json`](../skills/playtest/scenarios/00-sdk-smoke.json) first. Then the five phase scenarios. If they pass unchanged, the contract works. If they don't, the contract is what to fix — not the scenarios.

A new SDK that ships at v0.2.0 feature parity from day one is one engineering project. A new SDK that ships at v0.1 and chases parity over three releases is three engineering projects. Plan accordingly.
