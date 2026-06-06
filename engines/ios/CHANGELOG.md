# Changelog

All notable changes to the gamestack iOS Swift package will be documented here. This package follows [Semantic Versioning](https://semver.org/).

## [0.1.0] — 2026-06-05

### Added

- **Swift Package** at `engines/ios/`. Target platforms: iOS 15+, tvOS 15+, Mac Catalyst 15+.
- **`GameStack` singleton** with `start(with:)` / `stop()`. Loopback-only by default; refuses non-loopback bind in release builds.
- **`GameStackConfig`** — declarative knobs (`port`, `enabled`, `loopbackOnly`, `stateMaxDepth`, `screenshotScale`, `screenshotFormat`, `snapshotCapacity`). Convenience initializer reads `GAMESTACK_*` env vars.
- **`HTTPServer`** — `Network.framework`-backed loopback HTTP/1.1 server. No third-party dependencies; minimal HTTP parsing (request line + content-length-bounded body). Default port 7333 (next slot after Unity 7331 and Godot 7332).
- **`GET /state`** — JSON snapshot of iOS-level state (thermal state, low-power mode, application state, window size, processor count) plus every `@GameStackState`-tagged field.
- **`@GameStackState("key")` property wrapper** — Swift equivalent of Unity's `[GameStackState]` attribute and Godot's `tagged.*` dictionary. Registry collects all live registrations on `/state`.
- **`POST /screenshot`** — `UIWindow.drawHierarchy` capture rendered to PNG or JPEG via `UIGraphicsImageRenderer`. Main-thread only.
- **`POST /input`** — accepts an `InputEventBatch` JSON payload; dispatches `InputEvent`s to subscribers of `InputInjector.shared`. Subscription model (not synthesized UIEvents) avoids App Store rejection risk and works across SpriteKit / SwiftUI / SceneKit / Metal input layers.
- **`POST /snapshot`**, **`GET /snapshots`**, **`POST /restore`** — in-memory snapshot store (`SnapshotProvider`, bounded capacity). Game objects conforming to `GameStackSnapshotable` are walked on capture and restore.
- **`POST /breakpoint`** — tag-based pause filter. `BreakpointProvider.shared.hit(tag:)` invoked from game code at semantic checkpoints; gamestack can configure which tags pause via `{"action":"set-tags","tags":[...]}`, resume via `{"action":"resume"}`, list recent hits via `{"action":"recent"}`.
- **XCTest suite** covering HTTP request/response parsing, state registry, snapshot/restore roundtrip, input dispatch, breakpoint pause/resume, recent-hits bounding.
- **Sample SpriteKit hookup** at `Samples/Basic/` — reference code for the five integration points (start, tag state, subscribe to input, conform to Snapshotable, wire pause/resume).

### Security

- Loopback-only (`127.0.0.1`) bind by default via `NWParameters.tcp` with `requiredInterfaceType = .loopback`.
- Refuses non-loopback bind unless `#if DEBUG` is true.
- Refuses to start when `config.enabled == false`. The single-letter env var `GAMESTACK_DISABLED=1` flips that for CI / TestFlight production builds.

### Notes

- The Swift Package is authored against iOS 15 SDK. Tested by inspection on a Command Line Tools-only environment (full Xcode required for `swift test` / `xcodebuild test`).
- `engines/ios` parity with Unity (`engines/unity` v0.2.0) and Godot (`engines/godot` v0.2.0) is the goal of v0.1.0; the contract matches.
- Input injection is a subscription model, not native UIEvent synthesis. This is intentional — synthesizing native touches is an App Store rejection vector. The integration cost is one `InputInjector.shared.subscribe(...)` call per input source.

[0.1.0]: https://github.com/cmdkvn/gamestack/releases/tag/engines%2Fios%2Fv0.1.0
