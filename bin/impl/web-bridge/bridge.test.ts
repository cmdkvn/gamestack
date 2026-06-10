import { describe, test, expect, afterEach } from "bun:test";
import { startBridge, type BridgeHandle } from "./bridge.ts";
import { GAMESTACK_CLI_VERSION } from "../shared/version.ts";

// ---------------------------------------------------------------- helpers ---

/** Sentinel a fake-client handler returns to mean "never reply" (timeout tests). */
const NO_REPLY = Symbol("no-reply");

/** 1x1 transparent PNG. */
const PNG_1X1_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

interface FakeClientOptions {
  /** Send a one-way hello (no id) right after connecting. */
  helloVersion?: string;
  /** op -> payload-producing handler. Throw to make the client reply ok:false. */
  handlers?: Record<string, (payload: unknown) => unknown>;
}

interface FakeClient {
  ws: WebSocket;
  /** Every {id, op, payload} request the bridge sent us. */
  received: Array<{ id: string; op: string; payload: unknown }>;
  close(): void;
  /** Resolves when the socket closes (e.g. the bridge replaced us). */
  closed: Promise<void>;
}

/** A browser-less stand-in for engines/web/src/gamestack-client.js. */
async function fakeClient(port: number, opts: FakeClientOptions = {}): Promise<FakeClient> {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/__client`);
  const received: Array<{ id: string; op: string; payload: unknown }> = [];
  let resolveClosed!: () => void;
  const closed = new Promise<void>((r) => { resolveClosed = r; });
  ws.onclose = () => resolveClosed();
  ws.onmessage = (evt) => {
    const msg = JSON.parse(String(evt.data)) as { id: string; op: string; payload: unknown };
    received.push(msg);
    const handler = opts.handlers?.[msg.op];
    let reply: Record<string, unknown>;
    if (!handler) {
      reply = { id: msg.id, ok: false, error: `unknown op: ${msg.op}` };
    } else {
      try {
        const payload = handler(msg.payload);
        if (payload === NO_REPLY) return;
        reply = { id: msg.id, ok: true, payload };
      } catch (err) {
        reply = { id: msg.id, ok: false, error: (err as Error).message };
      }
    }
    ws.send(JSON.stringify(reply));
  };
  await new Promise<void>((resolve, reject) => {
    ws.onopen = () => resolve();
    ws.onerror = () => reject(new Error("fake client failed to connect"));
  });
  if (opts.helloVersion !== undefined) {
    ws.send(JSON.stringify({ op: "hello", payload: { version: opts.helloVersion } }));
  }
  return { ws, received, close: () => ws.close(), closed };
}

/** Poll until cond() is true (connection + hello arrive asynchronously). */
async function until(cond: () => boolean | Promise<boolean>, timeoutMs = 2000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await cond()) return;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error("condition not reached within timeout");
}

const bridges: BridgeHandle[] = [];
const clients: FakeClient[] = [];

function bridge(opts: Parameters<typeof startBridge>[0] = {}): BridgeHandle {
  const b = startBridge({ port: 0, ...opts });
  bridges.push(b);
  return b;
}

async function client(port: number, opts: FakeClientOptions = {}): Promise<FakeClient> {
  const c = await fakeClient(port, opts);
  clients.push(c);
  return c;
}

afterEach(async () => {
  for (const c of clients.splice(0)) c.close();
  for (const b of bridges.splice(0)) await b.stop();
});

const http = (port: number, path: string, init?: RequestInit) =>
  fetch(`http://127.0.0.1:${port}${path}`, init);

const post = (port: number, path: string, body: unknown) =>
  http(port, path, { method: "POST", body: JSON.stringify(body) });

// ------------------------------------------------------------------ tests ---

describe("gamestack-web-bridge", () => {
  test("/health with no client: 200, ok:true, engine web, 8 endpoints", async () => {
    const b = bridge();
    const res = await http(b.port, "/health");
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.ok).toBe(true);
    expect(body.engine).toBe("web");
    expect(body.version).toBe(GAMESTACK_CLI_VERSION);
    expect(body.clientVersion).toBe(null);
    expect(body.clientConnected).toBe(false);
    expect(body.endpoints).toEqual([
      "/health", "/state", "/screenshot", "/input",
      "/snapshot", "/snapshots", "/restore", "/breakpoint",
    ]);
  });

  test("/state with no client: 503 no game client connected", async () => {
    const b = bridge();
    const res = await http(b.port, "/state");
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "no game client connected" });
  });

  test("with a client: /health reflects connection + hello version; /state relays verbatim", async () => {
    const state = {
      scene: "Level1",
      fps: 60,
      frameTimeMs: 16.67,
      tagged: { default: { hp: 100 } },
    };
    const b = bridge();
    await client(b.port, { helloVersion: "0.1.0-test", handlers: { state: () => state } });

    await until(async () => {
      const h = await (await http(b.port, "/health")).json() as Record<string, unknown>;
      return h.clientConnected === true && h.clientVersion === "0.1.0-test";
    });
    expect(b.clientConnected()).toBe(true);

    const res = await http(b.port, "/state");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(state);
  });

  test("POST /input forwards the events array and relays the client's counts", async () => {
    const events = [
      { device: "Keyboard", action: "Press", control: "Space" },
      { device: "Keyboard", action: "Release", control: "Space" },
    ];
    let seen: unknown = null;
    const b = bridge();
    await client(b.port, {
      handlers: {
        input: (payload) => {
          seen = payload;
          return { eventsAccepted: 2, subscriberCount: 1, errorCount: 0 };
        },
      },
    });
    await until(() => b.clientConnected());

    const res = await post(b.port, "/input", { events });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ eventsAccepted: 2, subscriberCount: 1, errorCount: 0 });
    expect(seen).toEqual({ events });
  });

  test("snapshot -> snapshots -> restore round-trip against stateful handlers", async () => {
    const snaps = new Set<string>();
    let counter = 0;
    const b = bridge();
    await client(b.port, {
      handlers: {
        snapshot: () => {
          const id = `snap-${++counter}`;
          snaps.add(id);
          return { id };
        },
        snapshots: () => ({ ids: [...snaps] }),
        restore: (payload) => {
          const id = (payload as { id?: string }).id ?? "";
          if (!snaps.has(id)) throw new Error(`unknown snapshot id: ${id}`);
          return { restored: true, id };
        },
      },
    });
    await until(() => b.clientConnected());

    const snapRes = await post(b.port, "/snapshot", {});
    expect(snapRes.status).toBe(200);
    expect(await snapRes.json()).toEqual({ id: "snap-1" });

    const listRes = await http(b.port, "/snapshots");
    expect(listRes.status).toBe(200);
    expect(await listRes.json()).toEqual({ ids: ["snap-1"] });

    const restoreRes = await post(b.port, "/restore", { id: "snap-1" });
    expect(restoreRes.status).toBe(200);
    expect(await restoreRes.json()).toEqual({ restored: true, id: "snap-1" });
  });

  test("named snapshot ids round-trip even though the web client generates its own", async () => {
    // gamestack-client.js ignores requested snapshot ids (always snap-N), but
    // Unity/Godot honor them and 00-sdk-smoke restores by name — the bridge
    // must alias requested ids to client ids.
    const snaps = new Set<string>();
    let n = 0;
    const b = bridge();
    await client(b.port, {
      handlers: {
        snapshot: () => {
          const id = `snap-${++n}`; // requested id ignored, like the real client
          snaps.add(id);
          return { id };
        },
        snapshots: () => ({ ids: [...snaps] }),
        restore: (payload) => {
          const id = (payload as { id?: string }).id ?? "";
          if (!snaps.has(id)) throw new Error(`unknown snapshot id: ${id}`);
          return { restored: true, id };
        },
      },
    });
    await until(() => b.clientConnected());

    const snapRes = await post(b.port, "/snapshot", { id: "smoke-pre" });
    expect(snapRes.status).toBe(200);
    expect(await snapRes.json()).toEqual({ id: "smoke-pre" });

    const listRes = await http(b.port, "/snapshots");
    expect(await listRes.json()).toEqual({ ids: ["smoke-pre"] });

    const restoreRes = await post(b.port, "/restore", { id: "smoke-pre" });
    expect(restoreRes.status).toBe(200);
    expect(await restoreRes.json()).toEqual({ restored: true, id: "smoke-pre" });
  });

  test("POST /breakpoint {action:status} relays breakpoint status", async () => {
    const status = { isPaused: false, lastPausedAt: null, pauseOnTags: [], recentHits: [] };
    let seen: unknown = null;
    const b = bridge();
    await client(b.port, {
      handlers: {
        breakpoint: (payload) => {
          seen = payload;
          return status;
        },
      },
    });
    await until(() => b.clientConnected());

    const res = await post(b.port, "/breakpoint", { action: "status" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(status);
    expect(seen).toEqual({ action: "status" });
  });

  test("POST /screenshot decodes dataBase64 into raw PNG bytes", async () => {
    const b = bridge();
    await client(b.port, {
      handlers: { screenshot: () => ({ format: "png", dataBase64: PNG_1X1_BASE64 }) },
    });
    await until(() => b.clientConnected());

    const res = await post(b.port, "/screenshot", { format: "png" });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("image/png");
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(bytes.length).toBeGreaterThan(0);
    expect([...bytes.slice(0, 4)]).toEqual([137, 80, 78, 71]);
  });

  test("client that never replies: 504 within ~requestTimeoutMs", async () => {
    const b = bridge({ requestTimeoutMs: 50 });
    await client(b.port, { handlers: { state: () => NO_REPLY } });
    await until(() => b.clientConnected());

    const started = Date.now();
    const res = await http(b.port, "/state");
    const elapsed = Date.now() - started;
    expect(res.status).toBe(504);
    expect(await res.json()).toEqual({ error: "client request timed out: state" });
    expect(elapsed).toBeLessThan(500);
  });

  test("client replying ok:false surfaces as 500 with the client's error", async () => {
    const b = bridge();
    await client(b.port, {
      handlers: {
        state: () => { throw new Error("no canvas registered"); },
      },
    });
    await until(() => b.clientConnected());

    const res = await http(b.port, "/state");
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "no canvas registered" });
  });

  test("a second client replaces the first; old socket is closed", async () => {
    const b = bridge();
    const first = await client(b.port, { handlers: { state: () => ({ scene: "A" }) } });
    await until(() => b.clientConnected());

    await client(b.port, { handlers: { state: () => ({ scene: "B" }) } });
    await first.closed; // bridge must close the replaced socket
    await until(() => b.clientConnected());
    expect(b.clientConnected()).toBe(true);

    const res = await http(b.port, "/state");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ scene: "B" });
  });

  test("404 unknown endpoint, 405 method mismatch, 400 invalid JSON body", async () => {
    const b = bridge();
    await client(b.port, { handlers: { input: () => ({ eventsAccepted: 0, subscriberCount: 0, errorCount: 0 }) } });
    await until(() => b.clientConnected());

    const notFound = await http(b.port, "/nope");
    expect(notFound.status).toBe(404);
    expect(await notFound.json()).toEqual({ error: "unknown endpoint" });

    const wrongMethod = await http(b.port, "/input"); // GET on a POST route
    expect(wrongMethod.status).toBe(405);

    const badJson = await http(b.port, "/input", { method: "POST", body: "{not json" });
    expect(badJson.status).toBe(400);
    expect(await badJson.json()).toEqual({ error: "invalid JSON body" });
  });
});
