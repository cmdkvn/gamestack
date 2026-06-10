# gamestack engine SDKs

Four packages, one contract. The Unity SDK, the Godot SDK, the iOS Swift Package, and the web SDK (a browser client paired with the `gamestack-web-bridge` CLI) expose the same HTTP API so the same scenarios drive all four engines. This document is the cross-engine reference — what the SDK is for, what the contract is, and where the implementations diverge. For the full per-engine spec, follow the cross-links.

## Which engine should I pick?

If you already have an engine, skip this — gamestack detects what you're using and adapts. If you're choosing fresh:

- **Never built a game, or want the fastest path to something playable → web.** Nothing to install — the AI writes and runs everything, and the SDK is a copy-in client file plus the `gamestack-web-bridge` CLI.
- **2D game, and you want a real editor and native builds → Godot.** Free, light, and the beginner-friendliest editor of the group.
- **Console targets, a big asset store, or heavyweight 3D → Unity.** The most common indie path to consoles; the cost is editor weight.
- **AAA-style 3D, or you come from C++ → Unreal.** The gamestack SDK for it lands post-v1; the skills still work, and `/playtest` falls back to screenshot-diff mode.
- **iPhone-first → iOS native** (SpriteKit / SceneKit / Metal). The shortest distance to the App Store, at the price of shipping nowhere else.

## What the SDKs are for

A gamestack engine SDK is a small server that lives inside your running game and lets gamestack skills drive it. [`/playtest`](../skills/playtest/SKILL.md) uses it to walk scenarios end to end. [`/critique --lens=perf`](../skills/critique/SKILL.md) uses it to capture frame data tagged with the player's actual situation. [`/critique --lens=feel`](../skills/critique/SKILL.md) uses it to fire a verb a hundred times and watch the response. Without the SDK, those skills degrade to static analysis — they read the code instead of running it, and miss the bugs that only show up in motion.

The SDK is not a save system. It is not a debugger. It does not ship in your retail build. It is the interface between your game and the rest of gamestack, and its single job is to make a running build inspectable, drivable, and reproducible from outside.

## Why four implementations

Unity and Godot cover roughly 95% of solo indie narrative-game developers. The iOS Swift Package extends the SDK contract to native iOS games (SpriteKit / SceneKit / Metal / RealityKit / SwiftUI / UIKit) — a meaningful slice of the casual / narrative iOS App Store catalog that doesn't ship through Unity or Godot. The web SDK covers browser games (Phaser, Three.js, PixiJS, vanilla canvas) — both the zero-install path beginner projects start on and a real shipping target in its own right. Building all four gets the SDK into the hands of nearly every gamestack user. Unreal lands post-v1 — the contract is portable, but the implementation is heavier and the user count is thinner at the solo end.

The HTTP contract is identical across engines. The implementation differs where the engine's idioms differ — Unity has attributes and worker threads, Godot has duck typing and a single-threaded event loop, iOS native has Swift property wrappers and the main run loop is owned by `UIApplication`, and a browser page can't host a server at all, which is why the web SDK splits into a page-side client plus the `gamestack-web-bridge` process. The cross-engine contract is what stays; the per-engine ergonomics are what change.

## Why HTTP, not WebSocket

HTTP is request/response. The scenario format is request/response. Adding a streaming transport would solve a problem nobody has. Loopback HTTP is ubiquitous, debuggable with `curl`, profilable with the browser, and survives editor reloads cleanly. WebSocket would buy push-from-game-to-skill, which the contract doesn't use — every state read is initiated by the skill. If a future skill needs streaming, it can be added without rewriting the existing endpoints. For now, request/response is the right shape.

## Endpoints

The contract is eight endpoints. All four SDKs implement all eight at feature parity. Default ports differ — Unity binds 7331, Godot binds 7332, iOS binds 7333, web binds 7334 — so all four can run side by side during cross-engine development.

| Method | Path | Purpose | Unity notes | Godot notes | iOS notes |
|---|---|---|---|---|---|
| `GET` | `/health` | Liveness + endpoint list. | Default port 7331. | Default port 7332. | Default port 7333. |
| `GET` | `/state` | Scene name, FPS, frame time, plus all tagged values. | Tagged via `[GameStackState]` attribute. | Tagged via `GameStack.expose()` call. | Tagged via `@GameStackState("key")` property wrapper. Also surfaces iOS app state, thermal state, low-power mode. |
| `POST` | `/screenshot` | PNG or JPEG of the current frame. | `ScreenCapture` API, marshaled to main thread. | `Viewport.get_texture().get_image()` inline. | Key window snapshot via `UIView.drawHierarchy(in:afterScreenUpdates:)`. |
| `POST` | `/input` | Synthesized input events. | Dispatched to `InputInjector.OnInput` (static C# event). | Emitted on `GameStack.input_injector.on_input` (signal). | Dispatched to `InputInjector.shared` subscribers (closure-based). iOS does not allow synthesizing native `UITouch` from outside the framework — the game subscribes and translates. |
| `POST` | `/snapshot` | In-memory snapshot; returns ID. | Captures `[GameStackState]` fields + `IGameStackSnapshotable` payloads. | Captures `expose()` callables + nodes registered via `register_snapshotable`. | Captures `@GameStackState` fields + `GameStackSnapshotable` conformers registered via `SnapshotProvider.shared.register`. |
| `GET` | `/snapshots` | List stored snapshot IDs. | Same shape. | Same shape. | Same shape. |
| `POST` | `/restore` | Restore a snapshot by `{ "id": "..." }`. | Restores `Time.timeScale` + tagged + custom. | Restores `Engine.time_scale` + tagged + custom. | Restores tagged values + custom Snapshotable payloads. |
| `POST` | `/breakpoint` | Tag-based pause filter + pause/resume. | `BreakpointProvider.Hit("tag")` at checkpoints. | `GameStack.hit("tag")` at checkpoints. | `BreakpointProvider.shared.hit(tag:)`; developer wires pause/resume handlers (e.g., toggle `SKScene.isPaused`). |

**Web notes** (kept out of the table so it stays readable). Default port 7334, served by `gamestack-web-bridge` rather than by the page — see [Web SDK](#web-sdk) below. `/state` values are tagged via `GameStack.expose(key, getter)` — call-driven, like Godot. `/screenshot` captures the registered canvas via `canvas.toDataURL()`; on a WebGL canvas that comes back black unless the context was created with `preserveDrawingBuffer: true` — see [the gotcha](../engines/web/README.md#webgl-screenshot-gotcha). `/input` events are relayed to a `GameStack.onInput()` subscription handler — like iOS, the SDK can't synthesize native browser events, so the game subscribes and translates. Everything else matches the other SDKs shape-for-shape.

Snapshots are in-memory only and lost on app shutdown (page reload, for web). They are not the player's save system, and they must not become it. Conflating the two is how save-corruption bugs end up tagged as "works on my machine."

## State exposure

The shape of `/state` is identical across engines:

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

### iOS native — property wrapper

```swift
import GameStack

final class Player {
    @GameStackState("hp") var hp: Int = 100              // tagged.default.hp
    @GameStackState("score", "match") var score: Int = 0 // tagged.match.score
}
```

The `@GameStackState` property wrapper auto-registers with the global registry on init and unregisters on deinit. `/state` walks the registry and returns the current value of every live registration. No reflection required (Swift's runtime reflection is limited and slow); the property wrapper is the registration mechanism.

The web SDK's idiom is getter registration — `GameStack.expose("hp", () => player.hp, "player")` — call-driven like Godot's; see [`engines/web/README.md`](../engines/web/README.md#exposing-state-for-state).

Supported value types overlap heavily (numbers, strings, vectors, colors, quaternions) and all four SDKs fall back to a string representation for anything exotic. See [Unity SDK README](../engines/unity/README.md), [Godot SDK README](../engines/godot/README.md), [iOS SDK README](../engines/ios/README.md), and [web SDK README](../engines/web/README.md) for the exact lists.

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

### iOS native — subscription closure

```swift
final class GardenScene: SKScene {
    private var inputToken: InputInjector.SubscriptionToken?

    override func didMove(to view: SKView) {
        super.didMove(to: view)
        inputToken = InputInjector.shared.subscribe { [weak self] event in
            switch event.action {
            case "jump":  self?.player.jump()
            case "shoot": self?.player.shoot()
            default:      break
            }
        }
    }
}
```

iOS does not allow synthesizing native `UITouch` / `UIEvent` from outside the system frameworks — doing so is an App Store rejection risk and a private-API call. The iOS SDK works around this with a subscription closure: the game subscribes to `InputInjector.shared` and translates injected events the same way it translates real touches. `[weak self]` is required (the closure is stored long-lived; strong-self capture leaks the scene). The returned `SubscriptionToken` retains the registration; let it fall out of scope to unsubscribe.

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

### iOS native — protocol conformance

```swift
final class World: GameStackSnapshotable {
    var snapshotKey: String { "world" }
    var score: Int = 0

    func captureSnapshot() -> [String: Any] {
        ["score": score]
    }
    func restoreSnapshot(_ payload: [String: Any]) {
        if let s = payload["score"] as? Int { score = s }
    }
}

// Register on load:
SnapshotProvider.shared.register(world)
```

Swift has interfaces (protocols), so the contract is named — there is no duck-typing failure mode like Godot's. Misspelling a method name is a compile error, not a silent no-op. The trade-off is the explicit `register(_:)` call: the SDK can't auto-discover Snapshotables the way Unity's reflection does. Register once when the world loads; the registration weakly references the object so deallocating the world removes it from the snapshot set automatically.

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

### iOS native

```swift
BreakpointProvider.shared.setHandlers(
    pause:  { scene.isPaused = true },
    resume: { scene.isPaused = false })

// Anywhere in game code:
BreakpointProvider.shared.hit(tag: "after-boss-spawn")
BreakpointProvider.shared.hit(tag: "on-death")
BreakpointProvider.shared.hit(tag: "before-save")
```

The pause / resume handlers are developer-supplied because the right pause semantics depend on the framework: SpriteKit uses `SKScene.isPaused`, SceneKit uses `SCNView.isPlaying = false`, SwiftUI games typically toggle a `@State var paused` driving the view body. Set the handlers once in your scene's `didMove(to:)` (or equivalent), then call `hit(tag:)` at semantic checkpoints.

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

This is where the engines genuinely differ, and where most cross-engine confusion comes from.

**Unity.** HTTP requests arrive on a worker thread provided by the `HttpListener`. Almost every Unity API is main-thread-only — touching `Transform`, calling `ScreenCapture`, reflecting over `MonoBehaviour`s, or modifying `Time.timeScale` from a worker thread is undefined behavior. The SDK ships an internal `MainThreadDispatcher` that the request handlers use to marshal work back. The marshaling is invisible to your code, but it does mean every request adds a frame of latency in the worst case — the worker enqueues, the main thread picks up next `Update`, the response is built, and the worker writes it back.

**Godot.** The HTTP server runs inside `_process()` on the main thread. Connections are accepted and requests handled inline. There's no marshaling because there's nowhere to marshal *to* — everything is already on the main thread. The cost is that a slow request handler blocks the frame. The benefit is that there's no thread-affinity class of bug.

**iOS.** The HTTP server is an `NWListener` running on a private dispatch queue. Request handlers marshal to `DispatchQueue.main.async` before touching any UIKit / SpriteKit / SceneKit state, because every Apple UI framework is main-thread-only and the consequence of touching one off-main is the same as Unity's — undefined behavior, often a crash, sometimes silent state corruption. Screenshot capture goes through `UIView.drawHierarchy(in:afterScreenUpdates:)` which itself must be main-thread. The marshaling is invisible to your code; like Unity, it adds up to one runloop tick of latency. Custom `captureSnapshot()` implementations run on the main thread; you can call any UI framework safely.

**Web.** The HTTP server lives in the bridge — a separate process — so it can never touch your game's thread. The client answers each forwarded request on the page's JavaScript event loop, which is single-threaded by construction, like Godot: no marshaling, no thread-affinity bugs, and a slow getter or `captureSnapshot()` blocks the frame the way any long task on the event loop does.

Why the difference matters: in every engine, your snapshot capture runs on the main thread regardless, so your capture / restore code can call any framework safely. If you port custom snapshot logic across the engines, the API surface is identical, but the implicit "what thread am I on?" question has the same answer for the wrong reason in each — the SDK marshals for you. Don't rely on that staying invariant; explicit `MainActor` / `DispatchQueue.main.async` / equivalents in your own code makes the assumption visible.

## iOS Swift Package

The iOS SDK ships as a Swift Package. Install via SPM (preferred) or vendor the directory. See [`engines/ios/README.md`](../engines/ios/README.md) for the full walkthrough including the `Samples/Basic/` SpriteKit hookup example.

Quickstart:

```swift
// Your Package.swift (or Xcode's Add Package Dependencies):
.package(url: "https://github.com/cmdkvn/gamestack.git", from: "1.0.0"),

// Then in your target:
.target(name: "MyGame", dependencies: [
    .product(name: "GameStack", package: "gamestack"),
]),
```

Bootstrap in your app entry point:

```swift
import GameStack

@main
struct MyGameApp: App {
    init() {
        #if DEBUG
        GameStack.shared.start()
        #endif
    }
    var body: some Scene { /* ... */ }
}
```

The `#if DEBUG` is load-bearing — the iOS SDK refuses to bind on non-loopback interfaces in release builds even if you configure it to, but the cleaner posture is to keep the entire server out of TestFlight / App Store binaries via `#if DEBUG`. See [`engines/ios/README.md`](../engines/ios/README.md#security) for the full security model.

The sample at [`engines/ios/Samples/Basic/SampleGameStackHookup.swift`](../engines/ios/Samples/Basic/SampleGameStackHookup.swift) shows the minimum SpriteKit + `@GameStackState` + Snapshotable + breakpoint wiring; copy from there into a new project.

## Web SDK

A browser page cannot host an HTTP server, so the web SDK is two halves. The **client** (`engines/web/src/gamestack-client.js`) is a zero-dependency ES module your game imports; it owns all game-side state — exposed getters, input subscribers, snapshots, breakpoints. The **bridge** ([`gamestack-web-bridge`](../bin/impl/web-bridge/README.md), a CLI) owns the eight HTTP endpoints on `127.0.0.1:7334` and forwards each request to the page over an internal WebSocket. The page connects *out* to the bridge; nothing connects in to the page.

Doesn't the WebSocket contradict [Why HTTP, not WebSocket](#why-http-not-websocket)? No. The external contract is still plain HTTP — scenarios, CLIs, and `curl` speak request/response to the bridge exactly as they do to the other three SDKs. The WebSocket is internal transport between the bridge and the page, invisible to everything outside the SDK pair.

Install is copy-the-file: drop `engines/web/src/gamestack-client.js` into your project and import it — no npm package, no build step, same copy-the-addon posture as the Godot SDK. Full walkthrough, framework quickstarts, and the annotated sample: [`engines/web/README.md`](../engines/web/README.md).

One behavioral note: Unity and Godot honor an explicit snapshot id in the `POST /snapshot` body, while the web client always generates its own ids. The bridge keeps an alias map from requested id to generated id, so the external HTTP contract still honors requested ids — net behavior matches the other SDKs and existing scenarios run unchanged.

Ship posture matches the other SDKs: gate `GameStack.connect()` behind a dev flag (`if (import.meta.env?.DEV)` under Vite, or a hand-rolled `DEV` constant without a bundler) so production pages never dial loopback WebSockets. The bridge itself binds loopback only.

## Security defaults

All four SDKs bind to `127.0.0.1` by default. Unity, Godot, and iOS ship a `loopback_only` / `loopbackOnly` config flag that must be explicitly disabled to listen on other interfaces — don't. The web bridge has no such flag; it is loopback-only, period.

If you turn off `loopback_only` in a shipping build, anyone on the same network can read your state, inject input, snapshot and restore — including hostile networks at conferences, on co-working WiFi, or on a hotel guest network. There is no authentication on the SDK because there is no plausible threat model for an authenticated localhost contract; the moment you expose it externally, the absence of auth becomes the threat model.

For shipping builds, the rule is simpler: turn the whole server off. In Unity, set `Enabled = false` on the config asset for the shipped build, or wrap the server GameObject behind `#if UNITY_EDITOR || GAMESTACK_DEV_BUILD`. In Godot, set `config.enabled = false` on the exported config, or gate the autoload with `if OS.is_debug_build():`. In iOS, wrap `GameStack.shared.start()` in `#if DEBUG` or set `GAMESTACK_DISABLED=1` in the environment for shipping schemes. In web, gate `GameStack.connect()` behind a dev flag (see [Web SDK](#web-sdk) above). The SDK does not need to ship in your release binary, and it should not.

Cert builds in particular should never include the SDK. The endpoints have no place in a console submission or an App Store submission; if a tester finds them, they'll fail your cert. On iOS specifically, the `NWListener` server is the kind of thing App Review's static analysis will flag as a privacy / network-attack-surface item — leave it out of TestFlight and App Store builds. Build configurations for cert targets must exclude the package.

## Driving the SDK from outside

Two CLIs and one skill drive the SDK in practice.

[`gamestack-playtest-daemon`](../bin/impl/playtest-daemon/README.md) walks a scenario JSON file end to end, posts to the endpoints, captures step results, and exits non-zero on assertion failures. Use it in CI for regression smoke. The same scenario JSON drives Unity (`--engine unity`), Godot (`--engine godot`), and web (`--engine web`); only the default port changes.

[`gamestack-game-benchmark`](../bin/impl/game-benchmark/README.md) captures frame-rate, frame-time distribution, draw calls, GC allocations, and peak memory while a scenario runs. Pair with the daemon to get perf data tagged with the player's actual situation rather than synthetic stress.

[`/playtest`](../skills/playtest/SKILL.md) is the interactive driver. It probes `/health`, picks scenarios based on the game's production phase, runs them against the SDK, and files findings as P0/P1/P2 with regression scenarios for any confirmed bug. Offline (no SDK reachable), it degrades to static analysis and tags findings `OFFLINE-MAYBE`.

The contract those three rely on is the nine step primitives documented in [scenarios/README.md](../skills/playtest/scenarios/README.md). New primitives are a contract change that touches all three — don't invent them ad hoc.

## Adding a new engine

A fifth SDK — Unreal is the post-v1 candidate — needs to ship the same eight endpoints with the same request/response shapes. Cross-engine scenarios are the leverage; an Unreal SDK that gets 95% of the contract right and 5% subtly wrong forces every scenario to fork.

The work is roughly:

1. **Lift the HTTP layer.** A localhost server with the eight endpoints. Use whatever the engine's idiomatic HTTP library is — `FHttpServerModule` for Unreal, `tiny_http` for a Bevy SDK, `NWListener` for the iOS reference if you're adding an Android equivalent. If the runtime can't host a server (the web SDK's situation), pair a client with a bridge process the way `gamestack-web-bridge` does. Match request and response JSON shapes byte for byte against the Unity, Godot, iOS, and web reference responses.
2. **Pick the state-exposure idiom.** Attribute-driven (Unity), call-driven (Godot), property-wrapper-driven (iOS), or registration-driven (likely Unreal `UFUNCTION` reflection). The mechanism is engine-shaped; the resulting `/state` payload must not be.
3. **Wire input and snapshot through engine-native channels.** Input goes through whatever the engine's input pipeline is — input maps, action mappings, `InputComponent` bindings, subscription closures. Snapshots use whatever serialization the engine offers (reflection in Unreal, manual capture in Bevy, protocol conformance in Swift). The contract is in/out; the engine's job is the inside.
4. **Decide the threading story explicitly.** Document it the way this file documents Unity, Godot, and iOS. A handler that touches engine state from the wrong thread is a flaky-scenario factory.
5. **Match the security defaults.** Loopback-only, editor-by-default, explicit opt-in for exposure, never in shipping. On platforms with store-cert (App Store, console partners), defaulting to disabled in release builds is mandatory, not optional.
6. **Pass the existing scenarios.** Run [`00-sdk-smoke.json`](../skills/playtest/scenarios/00-sdk-smoke.json) first. Then the five phase scenarios. If they pass unchanged, the contract works. If they don't, the contract is what to fix — not the scenarios.

A new SDK that ships at v0.2.0 feature parity from day one is one engineering project. A new SDK that ships at v0.1 and chases parity over three releases is three engineering projects. Plan accordingly.
