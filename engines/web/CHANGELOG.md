# Changelog

All notable changes to the gamestack web SDK (browser client). Follows [Semantic Versioning](https://semver.org/).

## [0.1.0] — 2026-06-10

Initial web SDK release: the browser-side client half of the web SDK pair. The HTTP half — the `gamestack-web-bridge` CLI hosting the eight endpoints on port `7334` — ships separately under the gamestack repo's `bin/`.

### Added
- Zero-dependency browser ES module at `src/gamestack-client.js` (no build step, no npm package — copy it into your project).
- `GameStack` singleton connecting OUT to the bridge over a loopback WebSocket (`ws://127.0.0.1:7334/__client`), since a browser page cannot host an HTTP server. Silent auto-reconnect with 1s backoff doubling to a 10s cap; the game runs identically with no bridge present.
- `state` op — scene name, FPS, and mean frame time from a rolling 60-frame `requestAnimationFrame` window, plus all values registered via `GameStack.expose(key, getter, group)`. Getter exceptions become `"<error: …>"` values.
- `screenshot` op — PNG of the registered canvas via `toDataURL("image/png")`. WebGL canvases need `preserveDrawingBuffer: true`.
- `input` op — forwards each event verbatim to `GameStack.onInput(handler)` subscribers; replies with `eventsAccepted` / `subscriberCount` / `errorCount`. Same event shape as the Unity, Godot, and iOS SDKs.
- `snapshot` / `snapshots` / `restore` ops — in-memory snapshots (`snap-1`, `snap-2`, …) capturing a deep copy of exposed values plus custom payloads from `GameStack.registerSnapshotable({ key, capture, restore })`. Restore invokes each Snapshotable's `restore()`; exposed values are live reads and are not written back.
- `breakpoint` op — tag-based pause filter (`add-pause`, `remove-pause`, `clear-pause`, `pause-now`, `resume`, `status`). Wildcard `"*"` pauses on every hit. `recentHits` wire field is plain tag strings (matching Godot/Unity; internal ring buffer still tracks `{ tag, at }` with ISO timestamps).
- `GameStack.hit(tag)` API for semantic breakpoint checkpoints; `GameStack.setPauseHandlers({ pause, resume })` to wire the game's own pause semantics.
- Sample at `samples/basic/` — annotated vanilla-canvas hookup (`sample-gamestack-hookup.js`) plus an `index.html` to run it.

### Compatibility
- The HTTP wire contract (served by `gamestack-web-bridge`) matches the Unity, Godot, and iOS SDKs — the same `/playtest` scenarios under `gamestack/skills/playtest/scenarios/` run unchanged.
- Default port differs: web `7334` (Unity `7331`, Godot `7332`, iOS `7333`). Set the scenario's `endpoint` field to choose.

### Notes
- Snapshot storage is in-memory only by design (for live test sessions, not the player's save system); snapshots are lost on page reload.
- Input dispatch is event-based; subscribers translate events into their game's input model in one place.
- JavaScript lacks attribute syntax, so state contributors use explicit `expose()` calls — the same call-driven idiom as the Godot SDK.
- Validated against a fake client in `bun` tests; live validation against a real shipped browser game is still pending.
