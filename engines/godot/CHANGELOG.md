# Changelog

All notable changes to the gamestack Godot addon. Follows [Semantic Versioning](https://semver.org/).

## [0.2.0] — 2026-06-04

Initial Godot SDK release, shipping at Unity SDK feature parity rather than starting from v0.1.0.

### Added
- Godot 4.x addon at `addons/gamestack/`.
- `GameStack` autoload singleton (registered automatically when the plugin is enabled).
- `GameStackConfig` Resource for port, loopback toggle, screenshot format, state provider cap.
- HTTP/1.1 server built on `TCPServer` (no third-party dependency). Loopback-only by default. Runs inside the autoload's `_process()` loop — all handling is on the main thread, so no dispatcher is required.
- `GET /health` — liveness + endpoint list.
- `GET /state` — scene name, FPS, engine version, platform, plus all values registered via `GameStack.expose()`.
- `POST /screenshot` — PNG or JPEG of the root viewport, via `viewport.get_texture().get_image()`.
- `POST /input` — emits the `GameStack.input_injector.on_input` signal once per event. Same `InputEventBatch` shape as the Unity SDK.
- `POST /snapshot` — captures `Engine.time_scale`, current scene, exposed values, and custom payloads from registered snapshotables. Returns the snapshot ID.
- `GET /snapshots` — lists stored snapshot IDs.
- `POST /restore` — restores `Engine.time_scale` and invokes `_gamestack_restore_snapshot()` on each registered snapshotable.
- `POST /breakpoint` — manages a tag-based pause filter (`add-pause`, `remove-pause`, `clear-pause`, `resume`, `step`, `pause-now`, `status`). Wildcard `"*"` pauses on every hit.
- `GameStack.expose(node, key, namespace, callable)` for explicit state registration. Auto-cleans up on `tree_exiting`.
- `GameStack.register_snapshotable(node)` for nodes implementing `_gamestack_snapshot_key`, `_gamestack_capture_snapshot`, `_gamestack_restore_snapshot`.
- `GameStack.hit(tag)` API for semantic breakpoint checkpoints.
- Self-test scene at `tests/test_gamestack.gd` covering state, snapshot, breakpoint, and input.
- `samples/basic/sample_gamestack_hookup.gd` demonstrating the full integration.

### Compatibility
- The HTTP wire contract matches the Unity SDK at `gamestack/engines/unity@0.2.0` — the same `/playtest` scenarios under `gamestack/skills/playtest/scenarios/` run unchanged.
- Default port differs: Godot `7332`, Unity `7331`. Set the scenario's `endpoint` field to choose.

### Notes
- Snapshot storage is in-memory only by design (for live test sessions, not the player's save system).
- Input dispatch is event-based, not Godot Input Map integration. Subscribers translate `InputEvent`s into their game's input model.
- GDScript lacks attribute syntax, so state contributors use explicit `expose()` calls instead of the Unity SDK's `[GameStackState]` attribute.
