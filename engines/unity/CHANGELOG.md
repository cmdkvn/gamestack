# Changelog

All notable changes to the gamestack Unity package will be documented here. This package follows [Semantic Versioning](https://semver.org/).

## [0.1.0] — 2026-06-04

### Added
- Initial foundation release.
- `GameStackServer` MonoBehaviour with loopback-only HTTP server.
- `GameStackConfig` ScriptableObject for port, enable toggle, loopback enforcement, state depth, screenshot scale/format.
- `[GameStackState]` attribute for tagging fields and properties exposed via `/state`.
- `GET /state` — scene name, FPS, time, plus all `[GameStackState]`-tagged data.
- `POST /screenshot` — PNG or JPEG frame capture.
- `GET /health` — server liveness check.
- Editor menu items under **Tools → gamestack** for creating the config asset, adding the server to the scene, and opening the status window.
- `GameStackEditorWindow` showing live server status.
- EditMode tests in `Tests/Editor/`.
- Newtonsoft.Json dependency for serialization.

### Security
- Loopback-only by default.
- Server respects the config's `Enabled` toggle for shipping builds.

## [0.2.0] — 2026-06-04

### Added
- **`POST /input`** — accepts an `InputEventBatch` JSON payload; routes events to subscribers of `InputInjector.OnInput`. Per-event subscriber exceptions are isolated.
- **`POST /snapshot`** — captures the current world's `[GameStackState]`-tagged fields plus `IGameStackSnapshotable` payloads. Optional `id` in the body for explicit naming.
- **`GET /snapshots`** — lists snapshot IDs currently in-memory.
- **`POST /restore`** — restores a snapshot by ID; tagged fields and `IGameStackSnapshotable.RestoreSnapshot` are invoked on the main thread.
- **`POST /breakpoint`** — manages a tag-based pause filter. Actions: `add-pause`, `remove-pause`, `clear-pause`, `resume`, `step`, `pause-now`, `status`.
- **`IGameStackSnapshotable`** — interface for custom snapshot payloads (lists, nested objects, transient state that doesn't fit the `[GameStackState]` pattern).
- **`BreakpointProvider.Hit(tag)`** — call in game code at semantic checkpoints. If the tag matches an active pause filter, the game pauses (`Time.timeScale = 0`) until `Resume` is called.
- **Samples~/Basic** — a `SampleGameStackHookup` + `SampleSnapshotable` pair showing the full integration pattern.

### Tests
- `InputInjectorTests` — subscriber invocation, exception isolation, batch dispatch.
- `SnapshotProviderTests` — capture / restore round-trip for tagged fields, time scale, and `IGameStackSnapshotable`.
- `BreakpointProviderTests` — pause filter, wildcard, resume, event firing order.

### Notes
- Snapshot storage is **in-memory only** by design. Snapshots are for live test sessions, not for player save data.
- Input injection is **event-based**, not Input System integration. Subscribers translate `InputEvent`s into their game's input model. Direct Unity Input System integration lands in a future release.

## [0.1.0] — 2026-06-04
