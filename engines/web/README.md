# gamestack — web SDK (browser client)

> v0.1.0 — state observation, screenshot capture, input dispatch, snapshot/restore, and tagged breakpoints for browser games. Same HTTP contract as the Unity, Godot, and iOS SDKs so the same `/playtest` scenarios run unchanged.

This package exposes the gamestack engine SDK contract for games that run in a browser — Phaser, Three.js, PixiJS, or vanilla canvas. gamestack skills — `/playtest`, `/critique --lens=feel`, `/critique --lens=perf` — drive it over the same eight endpoints as the Unity ([`../unity/`](../unity/)), Godot ([`../godot/`](../godot/)), and iOS ([`../ios/`](../ios/)) SDKs. Default port: `7334`.

## Two halves: client + bridge

A browser page cannot host an HTTP server, so the web SDK is split in two. **The client** (`src/gamestack-client.js`, this directory) is a zero-dependency ES module your game imports; it owns all game-side state — exposed getters, input subscribers, snapshots, breakpoints — and connects OUT to the bridge over a loopback WebSocket (`ws://127.0.0.1:7334/__client`). **The bridge** (`gamestack-web-bridge`, a CLI in the gamestack repo's `bin/`) hosts the eight HTTP endpoints on `127.0.0.1:7334` and forwards each request to the page over that WebSocket using a `{ id, op, payload }` → `{ id, ok, payload }` protocol.

The external contract stays plain HTTP — request/response, curl-able, the same scenario JSON the other engines run — so the reasoning in [ENGINES.md — Why HTTP, not WebSocket](../../docs/ENGINES.md#why-http-not-websocket) holds unchanged. The WebSocket is internal plumbing between the bridge and the page, not part of the contract; nothing outside the SDK pair ever speaks it.

## Install

Copy [`src/gamestack-client.js`](src/gamestack-client.js) into your project and import it. There is no npm package — same copy-the-addon posture as the Godot SDK. One file, no dependencies, no build step.

```bash
cp engines/web/src/gamestack-client.js YOUR_GAME/src/gamestack-client.js
```

## Quickstart — vanilla canvas

```js
import GameStack from "./gamestack-client.js";

GameStack.connect({
  scene: () => currentScreen,        // () => string, re-read per request
  canvas: () => canvas,              // () => HTMLCanvasElement, for /screenshot
});
GameStack.expose("hp", () => player.hp, "player");
GameStack.onInput((e) => {
  if (e.device === "Keyboard" && e.control === "Space" && e.action === "Press") player.jump();
});
GameStack.hit("level-loaded");       // semantic checkpoint for /breakpoint
```

## Quickstart — Phaser 3

```js
import GameStack from "./gamestack-client.js";

const game = new Phaser.Game({ /* ... */ render: { preserveDrawingBuffer: true } });
game.events.once("ready", () => {
  GameStack.connect({
    scene: () => game.scene.getScenes(true)[0]?.scene.key ?? "boot",
    canvas: () => game.canvas,
  });
  GameStack.expose("hp", () => player.hp, "player");
  GameStack.onInput((e) => {
    if (e.device === "Keyboard" && e.control === "Space" && e.action === "Press") player.jump();
  });
});
```

A full annotated hookup (input translation, Snapshotable, pause handlers, `hit()`) lives in [`samples/basic/sample-gamestack-hookup.js`](samples/basic/sample-gamestack-hookup.js); open [`samples/basic/index.html`](samples/basic/index.html) from a static server to see it run.

## Endpoints

Served by the bridge; answered by this client. Same shapes as the other SDKs; default port `7334` (Unity `7331`, Godot `7332`, iOS `7333`).

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness check + endpoint list (answered by the bridge itself) |
| `GET` | `/state` | Scene, FPS, frame time, plus values registered via `GameStack.expose()` |
| `POST` | `/screenshot` | PNG of the registered canvas via `toDataURL` |
| `POST` | `/input` | Dispatch input events to `GameStack.onInput()` subscribers |
| `POST` | `/snapshot` | Capture state into an in-memory snapshot; returns ID |
| `GET` | `/snapshots` | List stored snapshot IDs |
| `POST` | `/restore` | Restore a snapshot by ID (`{ "id": "..." }`) |
| `POST` | `/breakpoint` | Manage pause filter + pause/resume |

## Exposing state for `/state`

JavaScript has no attribute syntax, so state is registered explicitly via getters — the same call-driven idiom as Godot:

```js
GameStack.expose("hp", () => player.hp, "player");
GameStack.expose("score", () => match.score, "match");
```

`GET /state` returns:

```json
{
  "scene": "Level1",
  "fps": 60,
  "frameTimeMs": 16.67,
  "tagged": {
    "player": { "hp": 100 },
    "match":  { "score": 0 }
  }
}
```

Getters are re-read on every request; a getter that throws becomes a `"<error: …>"` string value rather than failing the request. Values must be JSON-able (numbers, strings, booleans, plain objects/arrays). `fps` and `frameTimeMs` come from a rolling 60-frame `requestAnimationFrame` window.

## Input

`POST /input` accepts the same event batch shape as the other SDKs:

```json
{
  "events": [
    { "device": "Keyboard", "action": "Press", "control": "Space" },
    { "device": "Gamepad",  "action": "Value", "control": "Horizontal", "value": -1.0 }
  ]
}
```

Each event is forwarded verbatim to every `GameStack.onInput()` subscriber. Translate into your game's input model in one place (see the sample's `CONTROL_TO_KEY` map). The response's `eventsAccepted` / `subscriberCount` / `errorCount` fields let the calling skill detect events sent into the void. `onInput` returns an unsubscribe function — call it when the subscribing screen goes away.

## Snapshot / restore

`POST /snapshot` captures:
- A deep copy of all exposed values (by group).
- Custom payloads from each `GameStack.registerSnapshotable({ key, capture, restore })` registration.

```js
GameStack.registerSnapshotable({
  key: "inventory",
  capture: () => ({ items: [...inventory.items] }),
  restore: (payload) => { inventory.items = payload.items; },
});
```

**Restore semantics:** `POST /restore` calls each Snapshotable's `restore()` with its captured payload. Exposed values are **not** written back — they are getter-derived live reads of your game state, so there is nothing to write to. If a value must round-trip through `/restore`, it belongs in a Snapshotable; the captured copy of exposed values exists for inspection and diffing only.

Snapshots are **in-memory only** and lost on page reload — for live test sessions, not the player's save system.

## Breakpoints

Call from game code at semantic checkpoints:

```js
GameStack.hit("after-boss-spawn");
GameStack.hit("player-died");
GameStack.hit("before-save");
```

Wire pause/resume once — the right pause semantics are yours (flag your game loop, `scene.pause()`, stop your physics tick):

```js
GameStack.setPauseHandlers({
  pause:  () => { paused = true; },
  resume: () => { paused = false; },
});
```

`POST /breakpoint` manages the filter:

```json
{ "action": "add-pause",    "tag": "player-died" }
{ "action": "remove-pause", "tag": "player-died" }
{ "action": "clear-pause" }
{ "action": "pause-now" }
{ "action": "resume" }
{ "action": "status" }
```

Wildcard tag `"*"` pauses on every hit. The response always includes `isPaused`, `lastPausedAt`, `pauseOnTags`, and `recentHits` (the last 50 hit tags as plain strings — the same wire format as the Godot/Unity SDKs so the playtest daemon's `assert_recent_breakpoint` step works cross-engine). Timestamps are tracked internally but not exposed on the wire.

## WebGL screenshot gotcha

`/screenshot` uses `canvas.toDataURL("image/png")`. On a **WebGL** canvas the drawing buffer is cleared after compositing, so `toDataURL` returns a blank/black image unless the context was created with `{ preserveDrawingBuffer: true }` (in Phaser: `render: { preserveDrawingBuffer: true }`; in Three.js: `new WebGLRenderer({ preserveDrawingBuffer: true })`) or the capture happens in the same `requestAnimationFrame` callback that drew the frame. 2D canvas contexts are unaffected. If your screenshots come back black, this is why. A second failure cause: **cross-origin assets taint the canvas** — if your game draws images, videos, or other resources from a different origin, the browser marks the canvas tainted and `toDataURL` throws a `SecurityError`. Serve all assets same-origin, or ensure the asset server sends `Access-Control-Allow-Origin: *` headers and the image elements use `crossOrigin = "anonymous"`.

## Security

The bridge binds to `127.0.0.1` only — nothing is reachable from the network. The client side of the equation is keeping `GameStack.connect()` out of shipped builds: an idle client costs a reconnect timer, but production pages should not be dialing loopback WebSockets at all. Gate the call behind a dev flag:

```js
// Vite / modern bundlers:
if (import.meta.env?.DEV) GameStack.connect({ scene: () => "Level1", canvas: () => canvas });

// No bundler:
const DEV = true; // flip to false (or strip the block) for release builds
if (DEV) GameStack.connect({ scene: () => "Level1", canvas: () => canvas });
```

Same posture as the other SDKs: the SDK does not need to ship in your release build, and it should not.

## Running

1. Terminal 1: `gamestack-web-bridge` — hosts the eight endpoints on `127.0.0.1:7334` and waits for a page.
2. Terminal 2 (sample): `cd engines/web/samples/basic && python3 -m http.server 8000`, then open `http://localhost:8000` in a browser. The client connects to the bridge automatically (one `console.info` on success).
3. Drive it: [`/playtest`](../../skills/playtest/SKILL.md), or by hand — `curl http://127.0.0.1:7334/health`.

No bridge running? The game runs identically — the client warns once in the console and keeps retrying quietly (1s backoff doubling to 10s).

## Validation status

The web SDK pair ships at v0.1.0, validated against a fake client in `bun` tests plus this module's unit coverage. **Live validation against a real shipped browser game is still pending** — the first real title using the web SDK will surface bugs the fake doesn't catch.

## Versioning

| Version | Scope |
|---|---|
| **0.1.0** | Full eight-endpoint contract: `/health`, `/state`, `/screenshot`, `/input`, `/snapshot`, `/snapshots`, `/restore`, `/breakpoint`, samples |
| 0.2.0+ | Tracks gamestack repo versions; consult `CHANGELOG.md` |

## License

MIT. See the gamestack repository root.
