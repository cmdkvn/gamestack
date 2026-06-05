# gamestack — Godot addon

> Foundation + extended release (v0.2.0). State observation, screenshot capture, input dispatch, snapshot/restore, and tagged breakpoints. Same HTTP contract as the Unity SDK so the same `/playtest` scenarios run unchanged.

This Godot addon exposes a loopback-only HTTP server that the gamestack `/playtest`, `/perf-benchmark`, and `/game-feel-audit` skills use to drive a running Godot 4.x build. The contract matches the Unity SDK endpoint-for-endpoint.

## Install

### Option A — copy into your project

Copy `addons/gamestack/` from this directory into your Godot project's `addons/` folder.

### Option B — clone the gamestack repo and symlink

```bash
git clone https://github.com/alliance/gamestack.git ~/src/gamestack
cd YOUR_GODOT_PROJECT
ln -s ~/src/gamestack/engines/godot/addons/gamestack addons/gamestack
```

### Then in Godot

1. Open your project.
2. **Project > Project Settings > Plugins**.
3. Find `gamestack` and set the Status to **Enable**.
4. The `GameStack` autoload singleton is registered automatically.
5. Press **Play**. The server starts on `http://127.0.0.1:7332/`.

## Endpoints

Same as the Unity SDK; default port `7332` (Unity uses `7331`).

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness check + endpoint list |
| `GET` | `/state` | Engine + tagged values (registered via `GameStack.expose()`) |
| `POST` | `/screenshot` | PNG (or JPEG) of the current viewport |
| `POST` | `/input` | Dispatch `InputEvent`s to subscribers of `GameStack.input_injector.on_input` |
| `POST` | `/snapshot` | Capture state into an in-memory snapshot; returns ID |
| `GET` | `/snapshots` | List stored snapshot IDs |
| `POST` | `/restore` | Restore a snapshot by ID (`{ "id": "..." }`) |
| `POST` | `/breakpoint` | Manage pause filter + pause/resume |

## Exposing state for `/state`

GDScript has no attribute syntax, so state is registered explicitly via callables. Drop this into any node's `_ready()`:

```gdscript
extends Node

var health: int = 100
var score: int = 0

func _ready() -> void:
    GameStack.expose(self, "hp", "player", Callable(self, "get_hp"))
    GameStack.expose(self, "score", "match", Callable(self, "get_score"))

func get_hp() -> int: return health
func get_score() -> int: return score
```

`GET /state` will include:

```json
{
  "scene": "Main",
  "fps": 60,
  "frameTimeMs": 16.67,
  "tagged": {
    "player": { "hp": 100 },
    "match":  { "score": 0 }
  }
}
```

Registration is automatically cleaned up when the node leaves the tree.

Supported value types: `bool`, `int`, `float`, `String`, `StringName`, `Vector2`, `Vector3`, `Vector4`, `Quaternion`, `Color`, `Rect2`, `Dictionary`, `Array`. Other types fall back to `str(value)`.

## Input

`POST /input` accepts the same `InputEventBatch` shape as the Unity SDK:

```json
{
  "events": [
    { "device": "Keyboard", "action": "Press", "control": "Space" },
    { "device": "Gamepad",  "action": "Value", "control": "Horizontal", "value": -1.0 }
  ]
}
```

Each event is emitted on the `GameStack.input_injector.on_input` signal. Subscribe and map to your game's input model:

```gdscript
func _ready() -> void:
    GameStack.input_injector.on_input.connect(_on_input)

func _on_input(event_data: Dictionary) -> void:
    if event_data.device == "Keyboard" and event_data.control == "Space" and event_data.action == "Press":
        player.jump()
```

## Snapshot / restore

`POST /snapshot` captures:
- `Engine.time_scale`.
- Current scene name.
- All exposed values (via the callables registered with `GameStack.expose`).
- Custom payloads from nodes registered via `GameStack.register_snapshotable(node)`.

`POST /restore` restores `Engine.time_scale` and invokes `_gamestack_restore_snapshot()` on each registered snapshotable.

For custom state (lists, nested dictionaries, transient runtime state), implement three methods on your node:

```gdscript
func _gamestack_snapshot_key() -> String:
    return "inventory"

func _gamestack_capture_snapshot() -> Variant:
    return { "items": items.duplicate() }

func _gamestack_restore_snapshot(payload) -> void:
    if payload is Dictionary:
        items = payload.get("items", [])
```

Then `GameStack.register_snapshotable(self)` in `_ready()`.

Snapshots are **in-memory only** — for live test sessions, not the player's save system.

## Breakpoints

Call from game code at semantic checkpoints:

```gdscript
GameStack.hit("after-boss-spawn")
GameStack.hit("on-death")
GameStack.hit("before-save")
```

`POST /breakpoint` manages the filter:

```json
{ "action": "add-pause",   "tag": "after-boss-spawn" }
{ "action": "remove-pause","tag": "after-boss-spawn" }
{ "action": "clear-pause" }
{ "action": "resume" }
{ "action": "step" }
{ "action": "pause-now" }
{ "action": "status" }
```

Wildcard tag `"*"` pauses on every hit. The response always includes `isPaused`, `lastPausedAt`, `pauseOnTags`, and `recentHits`.

## Configuration

Create a `GameStackConfig` Resource and assign it to the `GameStack` autoload's `config` property. Defaults:

| Property | Default |
|---|---|
| `port` | 7332 |
| `enabled` | true |
| `loopback_only` | true |
| `state_provider_cap` | 2000 |
| `screenshot_format` | `"png"` |
| `screenshot_jpeg_quality` | 85 |

To disable the server in exports, set `enabled = false` in the config used by the exported build, or gate the autoload registration with an `if OS.is_debug_build():` check.

## Security

The server binds to `127.0.0.1` only by default. **Do not** set `loopback_only = false` unless you understand the implications — exposing the server externally lets anyone on your network read state, inject input, and trigger snapshots / restores.

The server is editor-friendly by default. For shipping builds, disable the plugin or set `config.enabled = false`.

## Threading

GDScript's `_process()` runs on the main thread, so the HTTP server reads connections inside its `_process()` and handles requests inline. The Unity SDK's `MainThreadDispatcher` equivalent is not needed here — everything is already on the main thread.

## Tests

A small self-test scene script lives at `tests/test_gamestack.gd`. It covers:
- State register/unregister
- Snapshot round-trip (time scale + custom payload)
- Breakpoint pause/resume/wildcard/recent-hits
- Input dispatch counts

To run: create a scene with this script attached to the root Node, press Play, watch the console.

## Driving the SDK from the playtest-daemon

The [`gamestack-playtest-daemon`](../../bin/impl/playtest-daemon/README.md) CLI walks scenario JSON files against this SDK end to end. Same scenario format as the Unity side; only the endpoint port flips.

```bash
# Headless Godot build that exposes the SDK on port 7332.
gamestack-playtest-daemon --scenario skills/playtest/scenarios/00-sdk-smoke.json --engine godot

# Explicit endpoint when bound elsewhere.
gamestack-playtest-daemon --scenario scenarios/level1.json --endpoint http://localhost:7332
```

Pair the daemon with [`gamestack-game-benchmark`](../../bin/impl/game-benchmark/README.md) (also `--engine godot`) when you want perf data from the same run.

## Versioning

| Version | Scope |
|---|---|
| **0.2.0** | Foundation + extended in a single release: `/state`, `/screenshot`, `/health`, `/input`, `/snapshot`, `/restore`, `/snapshots`, `/breakpoint`, Samples |
| 0.3.0+ | Tracks gamestack repo versions; consult `CHANGELOG.md` |

The Godot SDK ships at v0.2.0 — feature parity with the Unity SDK at the same version. The two SDKs receive new features together going forward.

## License

MIT. See the gamestack repository root.
