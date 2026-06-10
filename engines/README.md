# Engine SDKs

Engine-side packages that expose a loopback-only state/action HTTP server. gamestack skills — `/playtest`, `/critique --lens=feel`, `/critique --lens=perf`, and related — talk to this server to drive a real running build.

| Engine | Port | Status | Package |
|---|---|---|---|
| Unity (UPM) | 7331 | v0.2.0 — shipped | [`unity/`](unity/) |
| Godot 4.x (addon) | 7332 | v0.2.0 — shipped | [`godot/`](godot/) |
| iOS (Swift Package) | 7333 | v0.1.0 — shipped | [`ios/`](ios/) |
| Web (bridge + browser client) | 7334 | v0.1.0 — shipped | [`web/`](web/) |
| Unreal (UPlugin) | — | planned post-v1 | — |

All four shipped SDKs implement the same contract; only the port and the host-language idioms differ. `/playtest` scenarios run unchanged across engines.

## Layout

```
engines/
├── unity/                       # UPM package (com.gamestack)
│   ├── package.json
│   ├── Runtime/
│   └── Editor/
├── godot/                       # Godot addon
│   └── addons/gamestack/
├── ios/                         # Swift Package
│   ├── Package.swift
│   ├── Sources/GameStack/
│   └── Tests/GameStackTests/
└── web/                         # bridge + browser client (beginner golden path)
    ├── gamestack-web-bridge.ts  #   loopback bridge (port 7334)
    └── client/                  #   browser-side SDK
```

## API surface

A loopback-only HTTP/1.1 server with these endpoints:

| Endpoint | Purpose |
|---|---|
| `GET /state` | Current scene, player transform, FPS, frame budget, active dialog node, save slot, custom-tagged game state. |
| `GET /health` | Liveness probe used by `gamestack-playtest-daemon`. |
| `POST /input` | Synthesized button / axis / touch events fed through the engine's input system. |
| `POST /snapshot` and `POST /restore` | Save-fuzz API. |
| `GET /snapshots` | List in-memory snapshots. |
| `POST /screenshot` | Capture a frame for visual analysis or screenshot-diff playtest mode. |
| `POST /breakpoint` | Pause at a tagged location for inspection. |

**Security defaults:** loopback-only (`127.0.0.1`), editor / development-build only. The server refuses non-loopback clients. No network exposure without explicit opt-in.

## Why four SDKs first

Unity and Godot cover the bulk of solo indie work for PC / console / web targets. iOS (Swift / SpriteKit / SceneKit / Metal / RealityKit) is the next platform where a sufficient solo indie audience exists outside the Unity/Godot wrappers. Web (the `gamestack-web-bridge` + browser client pair) is the beginner golden path — no engine to install, a game runs in the browser the same day. Unreal lands post-v1 — the API surface is identical; only the implementation differs.

## Zero-SDK alternative

If installing the engine SDK isn't worth the friction yet, `/playtest --mode=screenshot-diff` watches a directory the developer manually populates and diffs against baselines. See [`../docs/ZERO-SDK-PLAYTEST.md`](../docs/ZERO-SDK-PLAYTEST.md).

## Validation status

The shipped SDKs are validated end-to-end against an in-process `Bun.serve()` fake plus their own unit-test suites; the web SDK is validated against a fake client in the bun tests under `web/`. **Live engine validation against a real shipped game is still pending** — the first real Unity / Godot / iOS / web title using gamestack will surface engine-side bugs the fake doesn't catch.

See [`../docs/ENGINES.md`](../docs/ENGINES.md) for the user-facing install walkthrough and [`../docs/PLAN.md`](../docs/PLAN.md) for the implementation timeline.
