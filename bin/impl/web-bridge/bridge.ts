// gamestack-web-bridge core — the host half of the web SDK.
//
// A browser page cannot host an HTTP server, so the web SDK splits in two:
// engines/web/src/gamestack-client.js connects OUT to this bridge over a
// loopback WebSocket (path /__client), and the bridge hosts the eight
// gamestack HTTP endpoints (/health /state /screenshot /input /snapshot
// /snapshots /restore /breakpoint) that skills and the playtest daemon
// already speak. Each HTTP request becomes a { id, op, payload } message to
// the client; the client replies { id, ok: true, payload } or
// { id, ok: false, error }. The external contract stays plain HTTP — see
// docs/ENGINES.md.

import type { ServerWebSocket } from "bun";
import { GAMESTACK_CLI_VERSION } from "../shared/version.ts";

export interface BridgeOptions {
  /** HTTP + WebSocket port. Default 7334. Use 0 to let the OS pick (tests). */
  port?: number;
  /** Bind address. Default "127.0.0.1" — loopback only, never expose this. */
  hostname?: string;
  /** Per-request timeout for everything except screenshots. Default 5000. */
  requestTimeoutMs?: number;
  /** Screenshot timeout (canvas encode can be slow). Default 15000. */
  screenshotTimeoutMs?: number;
}

export interface BridgeHandle {
  /** Actual bound port (differs from opts.port when 0 was requested). */
  port: number;
  clientConnected(): boolean;
  stop(): void | Promise<void>;
}

const ENDPOINTS = [
  "/health",
  "/state",
  "/screenshot",
  "/input",
  "/snapshot",
  "/snapshots",
  "/restore",
  "/breakpoint",
] as const;

interface Route {
  method: "GET" | "POST";
  op: string;
}

const ROUTES: Record<string, Route> = {
  "/state": { method: "GET", op: "state" },
  "/screenshot": { method: "POST", op: "screenshot" },
  "/input": { method: "POST", op: "input" },
  "/snapshot": { method: "POST", op: "snapshot" },
  "/snapshots": { method: "GET", op: "snapshots" },
  "/restore": { method: "POST", op: "restore" },
  "/breakpoint": { method: "POST", op: "breakpoint" },
};

class NoClientError extends Error {
  constructor() {
    super("no game client connected");
    this.name = "NoClientError";
  }
}

class DisconnectedError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "DisconnectedError";
  }
}

class RequestTimeoutError extends Error {
  constructor(readonly op: string) {
    super(`client request timed out: ${op}`);
    this.name = "RequestTimeoutError";
  }
}

interface Pending {
  resolve: (payload: unknown) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function startBridge(opts: BridgeOptions = {}): BridgeHandle {
  const requestTimeoutMs = opts.requestTimeoutMs ?? 5000;
  const screenshotTimeoutMs = opts.screenshotTimeoutMs ?? 15000;

  let client: ServerWebSocket<unknown> | null = null;
  let clientVersion: string | null = null;
  let idCounter = 0;
  const pending = new Map<string, Pending>();
  // Unity and Godot honor an explicit snapshot id in the POST /snapshot body
  // (00-sdk-smoke restores by name); the web client always generates its own
  // snap-N. Alias requested ids to client ids so named snapshots still work.
  // Cleared whenever the client changes — snapshots live in the page's memory.
  const snapshotAliases = new Map<string, string>(); // requested -> client id

  function rejectAllPending(reason: string): void {
    for (const p of pending.values()) {
      clearTimeout(p.timer);
      p.reject(new DisconnectedError(reason));
    }
    pending.clear();
  }

  function request(op: string, payload: unknown, timeoutMs: number): Promise<unknown> {
    if (client === null) return Promise.reject(new NoClientError());
    const target = client;
    const id = `req-${++idCounter}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new RequestTimeoutError(op));
      }, timeoutMs);
      try {
        target.send(JSON.stringify({ id, op, payload }));
      } catch (err) {
        clearTimeout(timer);
        reject(err as Error);
        return;
      }
      pending.set(id, { resolve, reject, timer });
    });
  }

  async function handleHttp(req: Request, url: URL): Promise<Response> {
    const path = url.pathname;

    if (path === "/health") {
      if (req.method !== "GET") return json(405, { error: "method not allowed" });
      return json(200, {
        ok: true,
        engine: "web",
        version: GAMESTACK_CLI_VERSION,
        clientVersion,
        clientConnected: client !== null,
        endpoints: ENDPOINTS,
      });
    }

    const route = ROUTES[path];
    if (!route) return json(404, { error: "unknown endpoint" });
    if (req.method !== route.method) return json(405, { error: "method not allowed" });

    // POST routes forward their JSON body as the op payload.
    let payload: unknown = {};
    if (route.method === "POST") {
      const text = await req.text();
      if (text.trim() !== "") {
        try {
          payload = JSON.parse(text);
        } catch {
          return json(400, { error: "invalid JSON body" });
        }
      }
    }

    // Translate a named restore id to the client's actual snapshot id.
    let restoredAlias: string | null = null;
    if (route.op === "restore") {
      const requested = (payload as { id?: unknown } | null)?.id;
      if (typeof requested === "string" && snapshotAliases.has(requested)) {
        restoredAlias = requested;
        payload = { ...(payload as object), id: snapshotAliases.get(requested) };
      }
    }

    try {
      const timeoutMs = route.op === "screenshot" ? screenshotTimeoutMs : requestTimeoutMs;
      const reply = await request(route.op, payload, timeoutMs);
      if (route.op === "screenshot") {
        const dataBase64 = (reply as { dataBase64?: unknown } | null)?.dataBase64;
        if (typeof dataBase64 !== "string") {
          return json(500, { error: "client screenshot reply missing dataBase64" });
        }
        const pngBytes = Buffer.from(dataBase64, "base64");
        if (pngBytes.length === 0) {
          return json(500, { error: "client screenshot reply: dataBase64 decoded to empty buffer" });
        }
        if (pngBytes[0] !== 0x89 || pngBytes[1] !== 0x50 || pngBytes[2] !== 0x4e || pngBytes[3] !== 0x47) {
          return json(500, { error: "client screenshot reply: not a valid PNG" });
        }
        return new Response(new Uint8Array(pngBytes), {
          status: 200,
          headers: { "Content-Type": "image/png" },
        });
      }
      if (route.op === "snapshot") {
        const requested = (payload as { id?: unknown } | null)?.id;
        const clientId = (reply as { id?: unknown } | null)?.id;
        if (
          typeof requested === "string" && requested !== "" &&
          typeof clientId === "string" && requested !== clientId
        ) {
          if (snapshotAliases.size >= 1000) {
            const oldest = snapshotAliases.keys().next().value as string;
            snapshotAliases.delete(oldest);
          }
          snapshotAliases.set(requested, clientId);
          return json(200, { ...(reply as object), id: requested });
        }
      }
      if (route.op === "snapshots") {
        const ids = (reply as { ids?: unknown } | null)?.ids;
        if (Array.isArray(ids) && snapshotAliases.size > 0) {
          const reverse = new Map([...snapshotAliases].map(([alias, real]) => [real, alias]));
          return json(200, { ...(reply as object), ids: ids.map((id) => reverse.get(id as string) ?? id) });
        }
      }
      if (route.op === "restore" && restoredAlias !== null && reply !== null && typeof reply === "object") {
        return json(200, { ...(reply as object), id: restoredAlias });
      }
      return json(200, reply ?? null);
    } catch (err) {
      if (err instanceof NoClientError) return json(503, { error: err.message });
      if (err instanceof DisconnectedError) return json(503, { error: err.message });
      if (err instanceof RequestTimeoutError) return json(504, { error: err.message });
      return json(500, { error: (err as Error).message });
    }
  }

  const server = Bun.serve({
    port: opts.port ?? 7334,
    hostname: opts.hostname ?? "127.0.0.1",
    fetch(req, srv) {
      const url = new URL(req.url);
      if (url.pathname === "/__client") {
        if (srv.upgrade(req)) return undefined;
        return json(400, { error: "expected a WebSocket upgrade on /__client" });
      }
      return handleHttp(req, url);
    },
    websocket: {
      open(ws) {
        if (client !== null) {
          // One client at a time: the newest connection wins (e.g. a page
          // reload reconnects before the old socket times out).
          console.log("[gamestack-web-bridge] new game client connected — replacing the previous one");
          const old = client;
          client = null;
          rejectAllPending("client disconnected");
          try { old.close(); } catch { /* already closing */ }
        } else {
          console.log("[gamestack-web-bridge] game client connected");
        }
        client = ws;
        clientVersion = null;
        snapshotAliases.clear();
      },
      message(ws, raw) {
        if (ws !== client) return; // stale socket we already replaced
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(String(raw)) as Record<string, unknown>;
        } catch {
          return; // malformed or non-object JSON: ignore
        }
        if (msg === null || typeof msg !== "object") return;
        if (!("id" in msg)) {
          // One-way client messages. "hello" carries the client version for
          // /health; never reply to id-less messages.
          if (msg.op === "hello") {
            const version = (msg.payload as { version?: unknown } | undefined)?.version;
            if (typeof version === "string") clientVersion = version;
          }
          return;
        }
        const p = pending.get(String(msg.id));
        if (!p) return; // timed out (or never ours)
        pending.delete(String(msg.id));
        clearTimeout(p.timer);
        if (msg.ok === true) {
          p.resolve(msg.payload);
        } else {
          p.reject(new Error(typeof msg.error === "string" ? msg.error : "client error"));
        }
      },
      close(ws) {
        if (ws !== client) return; // a replaced socket finishing its close
        client = null;
        clientVersion = null;
        snapshotAliases.clear();
        rejectAllPending("client disconnected");
        console.log("[gamestack-web-bridge] game client disconnected");
      },
    },
  });

  return {
    port: server.port ?? 0,
    clientConnected: () => client !== null,
    stop: async () => {
      rejectAllPending("bridge stopped");
      // server.stop(true) force-closes the listener and every connection, so
      // never ServerWebSocket.close() here ourselves. Bun (observed on 1.3.14)
      // quirk: if the bridge ever initiated a websocket close (client
      // replacement), the stop(true) promise can spin forever even though the
      // teardown itself completes — so bound the wait instead of trusting it.
      client = null;
      const stopped = server.stop(true);
      let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
      await Promise.race([
        stopped,
        new Promise<void>((r) => { fallbackTimer = setTimeout(r, 250); }),
      ]);
      clearTimeout(fallbackTimer);
    },
  };
}
