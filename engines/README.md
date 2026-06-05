# Engine SDKs

Engine-side packages that expose a localhost state/action API for gamestack's `/playtest`, `/game-feel-audit`, `/perf-benchmark`, and related skills to drive a real running build.

**Unity SDK v0.2.0 shipped. Godot SDK v0.2.0 shipped at feature parity.**

| Engine | Port (default) | Status |
|---|---|---|
| Unity | 7331 | v0.2.0 — `/state`, `/screenshot`, `/health`, `/input`, `/snapshot`, `/restore`, `/snapshots`, `/breakpoint` |
| Godot 4.x | 7332 | v0.2.0 — same contract |
| Unreal | n/a | Post-v1 |

## Planned structure

```
engines/
├── unity/      # UPM package (com.alliance.gamestack)
│   ├── package.json
│   ├── Runtime/
│   └── Editor/
└── godot/      # Godot addon
    └── addons/gamestack/
```

## API surface (planned)

A loopback-only HTTP (Unity) or WebSocket (Godot) server with these endpoints:

| Endpoint | Purpose |
|---|---|
| `GET /state` | Current scene, player transform, FPS, frame budget, active dialog node, save slot, custom-tagged game state |
| `POST /input` | Synthesized button/axis/mouse events fed through the engine's input system |
| `POST /snapshot` and `POST /restore` | Save-fuzz API |
| `POST /screenshot` | Capture frame + depth + UI layer for visual analysis |
| `POST /breakpoint` | Pause at a tagged location for inspection |

**Security defaults:** loopback-only, editor-only by default (a build flag exposes it in dev builds). No network exposure without explicit opt-in.

## Why two SDKs first

Unity and Godot cover ~95% of solo indie narrative-game developers. Unreal lands post-v1 (the API surface is the same; the implementation differs).

See [`docs/PLAN.md`](../docs/PLAN.md) for the implementation timeline.
