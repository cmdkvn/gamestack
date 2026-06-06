# gamestack — iOS Swift Package

> v0.1.0. State observation, screenshot capture, input dispatch, snapshot/restore, and tagged breakpoints. Native iOS engines (SpriteKit, SceneKit, Metal, RealityKit, SwiftUI / UIKit games). Also works for Unity / Godot iOS export when the developer wants the same scenario contract on a native build.

This Swift Package exposes a loopback-only HTTP server that gamestack skills (`/playtest`, `/critique --lens=feel`, `/critique --lens=perf`) use to drive a running iOS build. It's the iOS half of the engine-SDK contract; the Unity equivalent lives at [`engines/unity`](../unity/), the Godot equivalent at [`engines/godot`](../godot/). Same endpoints, same JSON shapes — only the port differs.

| Engine | Port | Package |
|---|---|---|
| Unity | 7331 | `engines/unity` (UPM) |
| Godot | 7332 | `engines/godot` (addon) |
| **iOS** | **7333** | **`engines/ios` (Swift Package)** |

## Install

### Option A — Swift Package Manager via Xcode

1. In Xcode: **File → Add Package Dependencies…**
2. Enter the gamestack repo URL: `https://github.com/cmdkvn/gamestack.git`
3. Set the **Package Path** to `engines/ios` (Xcode 15+: add the URL, then choose `engines/ios` as the package target).
4. Add the `GameStack` product to your app target.

### Option B — `Package.swift` dependency

```swift
// Your Package.swift
.package(url: "https://github.com/cmdkvn/gamestack.git", from: "1.0.0"),
// Then in your target:
.target(name: "MyGame", dependencies: [
    .product(name: "GameStack", package: "gamestack"),
]),
```

> Note: `engines/ios` lives inside a multi-engine monorepo. Some SPM workflows need `path: "engines/ios"` rather than a remote URL; in that case, vendor the directory directly into your project.

### Option C — Vendor into your project

Copy `engines/ios/` into your project and add the `Sources/GameStack/` folder as a Swift Package or compile group. This is the lowest-friction path for an existing Xcode project that doesn't use SPM remotes.

## Setup

In your app's startup path (SwiftUI `App.init`, `AppDelegate.application(_:didFinishLaunchingWithOptions:)`, or wherever you bootstrap):

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

Press build & run on Simulator or device. From your dev machine:

```bash
curl http://127.0.0.1:7333/health
```

Should return `{"ok": true, "engine": "ios", "endpoints": [...]}`.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness check + list of available endpoints |
| `GET` | `/state` | JSON snapshot — iOS app state, thermal, low-power, plus every `@GameStackState`-tagged field |
| `POST` | `/screenshot` | PNG or JPEG of the current key-window frame |
| `POST` | `/input` | Dispatch an `InputEventBatch` to `InputInjector.shared` subscribers |
| `POST` | `/snapshot` | Capture all `GameStackSnapshotable` payloads into an in-memory snapshot |
| `GET` | `/snapshots` | List currently stored snapshot IDs |
| `POST` | `/restore` | Restore a snapshot by ID (body: `{"id":"..."}`) |
| `POST` | `/breakpoint` | Configure tag-based pause filter (`{"action":"set-tags","tags":[...]}`) or `{"action":"resume"}` / `{"action":"recent"}` |

## Tagging state for `/state`

Wrap any stored property with `@GameStackState("key")`:

```swift
final class Player {
    @GameStackState("player.hp") var hp: Int = 100
    @GameStackState("player.name") var name: String = "Anonymous"
}
```

The wrapper auto-registers with the global registry on init and unregisters on deinit. `/state` walks the registry and returns the current value of every live registration under the `tagged` key of the response JSON.

Supported types: `Int`, `Double`, `Float`, `CGFloat`, `Bool`, `String`, `[Any]`, `[String: Any]`, `Date` (ISO-8601), `URL`, any `RawRepresentable`. Anything else is coerced to its `String(describing:)` form — the contract is "JSON-serializable best effort, not loss-free."

## Input dispatch

iOS doesn't allow synthesizing native `UIEvent` / `UITouch` from outside the system frameworks (App Store rejection risk). gamestack works around this with a **subscription model**: your game's input layer subscribes to `InputInjector.shared` and reacts to dispatched `InputEvent`s the same way it reacts to native touches.

```swift
final class MyScene: SKScene {
    private var inputToken: InputInjector.SubscriptionToken?

    override func didMove(to view: SKView) {
        super.didMove(to: view)
        inputToken = InputInjector.shared.subscribe { [weak self] event in
            switch event.action {
            case "jump": self?.player.jump()
            case "shoot": self?.player.shoot()
            default: break
            }
        }
    }
}
```

`POST /input` accepts an `InputEventBatch`:

```bash
curl -X POST http://127.0.0.1:7333/input \
  -H 'content-type: application/json' \
  -d '{"events":[{"type":"tap","action":"jump","positionX":100,"positionY":200,"timestamp":0}]}'
```

## Snapshot / restore

Conform any game object to `GameStackSnapshotable`:

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

// Register once on load:
SnapshotProvider.shared.register(world)
```

`POST /snapshot` captures every registered Snapshotable's payload into a named, in-memory snapshot. `POST /restore` invokes `restoreSnapshot` on every registered Snapshotable matching the saved keys. Capacity is bounded (default 16) — oldest gets dropped.

## Breakpoints

Tag-based pause control for semantic checkpoints:

```swift
BreakpointProvider.shared.setHandlers(
    pause: { scene.isPaused = true },
    resume: { scene.isPaused = false })

// Anywhere in game code:
BreakpointProvider.shared.hit(tag: "boss-room-entered")
```

```bash
# Activate the pause filter:
curl -X POST http://127.0.0.1:7333/breakpoint \
  -d '{"action":"set-tags","tags":["boss-room-entered"]}'

# Game pauses on the next hit. Resume:
curl -X POST http://127.0.0.1:7333/breakpoint -d '{"action":"resume"}'
```

## Security

- **Loopback-only by default.** The `NWListener` is bound with `requiredInterfaceType = .loopback`, refusing non-loopback bind requests at the framework level.
- **Non-loopback refused in release builds.** Even if a developer explicitly sets `config.loopbackOnly = false`, the `start()` call refuses unless `#if DEBUG` is true.
- **`enabled` toggle for shipping builds.** Default-disabled in TestFlight / App Store builds by reading `GAMESTACK_DISABLED=1` from the environment, or by wrapping `start()` in `#if DEBUG`.
- **No data transmitted off-device.** The server only responds to requests; it never initiates outbound connections.

## Tests

The package ships with an XCTest suite (`Tests/GameStackTests/`) covering HTTP parsing, state registry, snapshot roundtrip, input dispatch, and breakpoint pause/resume. Run:

```bash
cd engines/ios
swift test
```

(Requires full Xcode, not Command Line Tools only — Apple's CLT lacks `PackageDescription` linking for `swift test`. The tests run cleanly under Xcode's Test Navigator or via `xcodebuild test`.)

## Versioning

The iOS Swift Package follows its own semver (`engines/ios/CHANGELOG.md`). The gamestack repo's root `VERSION` tracks the slash-command catalog, not the engine SDKs — those are versioned independently because they ship to Xcode users who manage updates via SPM.

## Roadmap

- v0.2.x — game-controller (`GCExtendedGamepad`) state reflection through `/state`.
- v0.3.x — Metal frame-debug capture (`MTLCaptureManager`) integration for `/critique --lens=perf`.
- v0.4.x — RealityKit / SwiftUI-specific helpers (component tagging, scene introspection).

Track ongoing work in [`CHANGELOG.md`](CHANGELOG.md).
