# gamestack — Unity package

> Extended release (v0.2.0). State observation, screenshot capture, **input injection**, **snapshot/restore**, and **tagged breakpoints**. Live `/playtest` integration (Group 8 of the implementation plan) is next.

This Unity Package Manager (UPM) package exposes a loopback-only HTTP server that gamestack skills (`/playtest`, `/game-feel-audit`, `/perf-benchmark`) use to drive a running Unity build. It's the Unity half of the engine-SDK contract; the Godot equivalent ships in v0.3.0.

## Install

### Option A — UPM via Git URL

In Unity, open **Window → Package Manager → + → Add package from git URL** and paste:

```
https://github.com/alliance/gamestack.git?path=engines/unity
```

### Option B — Vendor into your project

Copy `engines/unity/` from this repo into your project's `Packages/` folder.

## Setup

1. **Tools → gamestack → Create Config Asset.** Creates `Assets/GameStackConfig.asset`. Default port is 7331; default is loopback-only; default is enabled.
2. **Tools → gamestack → Add Server to Scene.** Creates a `[gamestack:Server]` GameObject with the `GameStackServer` component. Drag your config asset into the Config slot.
3. **Press Play.** Open `http://localhost:7331/health` in a browser to verify.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness check + list of available endpoints |
| `GET` | `/state` | JSON snapshot of game state (scene, FPS, time, plus all `[GameStackState]`-tagged fields/properties) |
| `POST` | `/screenshot` | PNG or JPEG of the current frame |
| `POST` | `/input` | Dispatch synthesized input events to `InputInjector.OnInput` subscribers (batch of `InputEvent`s in the body) |
| `POST` | `/snapshot` | Capture current state into an in-memory snapshot; returns the snapshot ID |
| `GET` | `/snapshots` | List currently stored snapshot IDs |
| `POST` | `/restore` | Restore a snapshot by ID (body: `{ "id": "..." }`) |
| `POST` | `/breakpoint` | Manage tag-based pause filter and pause/resume state |

## Tagging fields for `/state`

Decorate any field or property on a `MonoBehaviour` with `[GameStackState("key")]` to expose it in the `/state` response. Optional second argument is a namespace.

```csharp
using UnityEngine;
using Alliance.Gamestack;

public class PlayerController : MonoBehaviour
{
    [GameStackState("hp")]               // appears at tagged.default.hp
    [SerializeField] private int health = 100;

    [GameStackState("score", "match")]   // appears at tagged.match.score
    public int Score { get; private set; }
}
```

The `/state` response will include:
```json
{
  "scene": "Level1",
  "fps": 60,
  "frameTimeMs": 16.67,
  "tagged": {
    "default": { "hp": 100 },
    "match": { "score": 0 }
  }
}
```

Supported value types: `bool`, `int`, `long`, `float`, `double`, `string`, `Vector2`, `Vector3`, `Quaternion`, `Color`, `Enum`, and anything else via `.ToString()`.

## Security

By default, the server binds to `localhost` only and rejects external traffic. **Do not** turn off `LoopbackOnly` unless you know what you're doing — exposing this server externally lets anyone on your network drive your game.

In shipping builds, disable the server via the config's `Enabled` toggle, or wrap the server GameObject behind a `#if UNITY_EDITOR || GAMESTACK_DEV_BUILD` define.

## Input injection

`POST /input` accepts a batch of `InputEvent`s:

```json
{
  "events": [
    { "device": "Keyboard", "action": "Press", "control": "Space" },
    { "device": "Gamepad",  "action": "Value", "control": "Horizontal", "value": -1.0 },
    { "device": "Mouse",    "action": "Move",  "x": 540, "y": 320 }
  ]
}
```

Events are dispatched to subscribers of `InputInjector.OnInput`. The subscriber translates the event into the game's input model — for example:

```csharp
private void OnEnable()  => InputInjector.OnInput += Handle;
private void OnDisable() => InputInjector.OnInput -= Handle;
private void Handle(InputEvent e)
{
    if (e.device == InputDevice.Keyboard
        && e.control == "Space"
        && e.action == InputAction.Press)
    {
        player.Jump();
    }
}
```

The response includes `eventsAccepted`, `subscriberCount`, and `errorCount` so the calling skill can verify the events reached at least one handler.

## Snapshot / restore

`POST /snapshot` captures:
- Scene name + build index.
- `Time.timeScale`.
- All `[GameStackState]`-tagged fields and properties.
- Custom data from any component implementing `IGameStackSnapshotable`.

Snapshots are kept **in memory only** and lost on app shutdown — they're for live test sessions, not the player's save system. `GET /snapshots` lists IDs; `POST /restore` with `{ "id": "..." }` restores.

For custom state that doesn't fit the `[GameStackState]` pattern (lists, nested objects, transient runtime state), implement `IGameStackSnapshotable`:

```csharp
public class Inventory : MonoBehaviour, IGameStackSnapshotable
{
    public string SnapshotKey => "inventory";
    public List<string> Items = new();
    public object CaptureSnapshot() => new Dictionary<string, object> { ["items"] = new List<string>(Items) };
    public void RestoreSnapshot(object payload)
    {
        if (payload is Dictionary<string, object> d
            && d["items"] is IEnumerable<object> items)
        {
            Items = items.Select(o => o.ToString()).ToList();
        }
    }
}
```

## Breakpoints

The game calls `BreakpointProvider.Hit("tag")` at semantic checkpoints (e.g. `"after-boss-spawn"`, `"before-save"`, `"on-death"`). gamestack consults its pause-tag filter:
- If the tag matches → pause (`Time.timeScale = 0`).
- Otherwise → log the hit, continue.

`POST /breakpoint` controls the filter:

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

## Threading

HTTP requests arrive on a worker thread. The package marshals Unity API calls back to the main thread via an internal `MainThreadDispatcher` so reflection over `MonoBehaviour`s, `ScreenCapture`, snapshot operations, and breakpoint state changes are safe.

## Tests

EditMode tests live in `Tests/Editor/`. Run via Unity Test Runner: **Window → General → Test Runner**.

Test coverage includes the config defaults, attribute reflection, input dispatch + exception isolation, snapshot round-trip (time scale, tagged fields, `IGameStackSnapshotable`), and breakpoint pause/resume/event ordering.

## Driving the SDK from the playtest-daemon

The [`gamestack-playtest-daemon`](../../bin/impl/playtest-daemon/README.md) CLI walks scenario JSON files against this SDK end to end. It exits non-zero on assertion failures or timeouts and writes a per-step run log to `<run-dir>/run.json` plus a markdown summary.

```bash
# Headless Unity build that exposes the SDK on port 7331 (default).
gamestack-playtest-daemon --scenario skills/playtest/scenarios/00-sdk-smoke.json --engine unity

# Same against an explicit endpoint (when the SDK is bound to a non-default port).
gamestack-playtest-daemon --scenario scenarios/level1.json --endpoint http://localhost:7331
```

Pair the daemon with [`gamestack-game-benchmark`](../../bin/impl/game-benchmark/README.md) when you want perf data from the same run.

## Versioning

| Version | Scope |
|---|---|
| 0.1.0 | Foundation: server, `/state`, `/screenshot`, editor menus |
| **0.2.0** | **Input injection (`/input`), savestate (`/snapshot`, `/restore`, `/snapshots`), breakpoints (`/breakpoint`), Samples~/Basic** |
| 0.3.0+ | Tracks gamestack repo versions; consult `CHANGELOG.md` |

## License

MIT. See the gamestack repository root.
