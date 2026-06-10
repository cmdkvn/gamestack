# gamestack-web-bridge

The host half of the gamestack web SDK. A browser page cannot host an HTTP server, so the web SDK splits in two: the browser-side client ([`engines/web/src/gamestack-client.js`](../../../engines/web/src/gamestack-client.js)) connects out to this bridge over a loopback WebSocket (`ws://127.0.0.1:7334/__client`), and the bridge hosts the eight gamestack HTTP endpoints that `/playtest` and `gamestack-playtest-daemon` already speak — same contract as the Unity (7331), Godot (7332), and iOS (7333) SDKs.

## Install

```bash
brew install bun                                 # runtime; one-time
gamestack/bin/gamestack-web-bridge --help
```

## Usage

```bash
# Terminal 1 — start the bridge.
gamestack-web-bridge

# Browser — open the game; the SDK client connects to the bridge automatically.

# Terminal 2 — drive it.
curl -s http://127.0.0.1:7334/health
curl -s http://127.0.0.1:7334/state
gamestack-playtest-daemon --scenario skills/playtest/scenarios/00-sdk-smoke.json --engine web
```

### Flags

| Flag | Default | Notes |
|---|---|---|
| `--port <n>` | 7334 | HTTP + WebSocket port. Loopback only (127.0.0.1). |

### Behavior

- One game client at a time — a newer WebSocket connection replaces the older one (page reloads reconnect cleanly).
- `GET /health` always answers 200 and reports `clientConnected` + the client's hello `clientVersion`; every other endpoint answers 503 until a game client connects.
- `POST /screenshot` decodes the client's base64 PNG and replies with raw `image/png` bytes.
- Named snapshot ids (`POST /snapshot {"id": "smoke-pre"}`) are honored via a bridge-side alias map — Unity/Godot accept explicit ids but the browser client always generates its own, and scenarios like `00-sdk-smoke` restore by name. Aliases clear when the client disconnects (snapshots live in the page's memory).
- Client errors surface as 500, request timeouts as 504 (5s default; 15s for screenshots).

### Exit codes

| Code | Meaning |
|---|---|
| 0 | Clean exit (help / version / SIGINT). |
| 2 | Invalid args. |
| 127 | bun not installed (reported by the shim). |

## Tests

```bash
cd bin/impl && bun test web-bridge
```
