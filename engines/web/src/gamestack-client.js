/**
 * gamestack web SDK — browser client (v0.1.0).
 *
 * One half of the web SDK pair. A browser page cannot host an HTTP server, so
 * this module connects OUT to the `gamestack-web-bridge` CLI over a loopback
 * WebSocket (ws://127.0.0.1:7334/__client). The bridge hosts the eight
 * gamestack HTTP endpoints (/health /state /screenshot /input /snapshot
 * /snapshots /restore /breakpoint) and forwards each request to this client as
 * a { id, op, payload } message; the client replies { id, ok, payload } or
 * { id, ok: false, error }. The external contract stays plain HTTP — see
 * docs/ENGINES.md.
 *
 * Zero dependencies, framework-agnostic (Phaser / Three / Pixi / vanilla).
 * The game runs identically when no bridge is present: connection failures are
 * silent auto-reconnects (1s backoff doubling to a 10s cap), with exactly one
 * console.info on first connect and one console.warn on first failure.
 *
 *   import GameStack from "./gamestack-client.js";
 *   GameStack.connect({ scene: () => "Level1", canvas: () => myCanvas });
 */

const DEFAULT_URL = "ws://127.0.0.1:7334/__client";
const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 10000;
const FRAME_WINDOW = 60;
const RECENT_HITS_CAPACITY = 50;

const errMsg = (err) => (err instanceof Error ? err.message : String(err));

class GameStackClient {
  constructor() {
    // Connection.
    this._ws = null; this._url = DEFAULT_URL; this._version = "0.1.0";
    this._shouldRun = false; this._reconnectTimer = null; this._reconnectDelayMs = RECONNECT_BASE_MS;
    this._announcedConnect = false; this._warnedFailure = false;
    // Game-side wiring.
    this._sceneGetter = null; this._canvasGetter = null;
    this._exposed = new Map();        // group -> Map(key -> getter)
    this._inputHandlers = new Set();
    this._snapshotables = new Map();  // key -> { capture, restore }
    this._pauseHandlers = { pause: null, resume: null };
    // Snapshots: in-memory only — a test fixture, not the player's save system.
    // Note: snapshots are never evicted (unlike _recentHits' 50-cap); cleared on page reload.
    this._snapshots = new Map(); this._snapCounter = 0; // "snap-N" -> { exposed, custom }
    // Breakpoints.
    this._pauseOnTags = new Set();
    this._recentHits = [];            // ring buffer of { tag, at } objects (ISO timestamps); wire format serializes as plain tag strings for cross-engine daemon compatibility
    this._isPaused = false; this._lastPausedAt = "";
    // FPS: rolling frame-duration window driven by requestAnimationFrame.
    this._frameDurations = []; this._lastFrameTs = null; this._rafId = null;
  }

  // ------------------------------------------------------------- public API ---

  /**
   * Connect to the bridge and start the FPS sampling loop. Safe to call with no
   * bridge running — the client reconnects quietly in the background forever.
   * @param {object} [options]
   * @param {string} [options.url] WebSocket URL of the bridge's client endpoint.
   * @param {() => string} [options.scene] Returns the current scene/screen name.
   * @param {() => HTMLCanvasElement | null} [options.canvas] Returns the canvas to screenshot.
   * @param {string} [options.version] Game-reported client version (surfaced by the bridge's /health); defaults to the SDK version if the game doesn't pass its own.
   */
  connect({ url = DEFAULT_URL, scene = null, canvas = null, version = "0.1.0" } = {}) {
    this._url = url;
    this._sceneGetter = scene;
    this._canvasGetter = canvas;
    this._version = version;
    this._shouldRun = true;
    this._reconnectDelayMs = RECONNECT_BASE_MS;
    this._startFrameLoop();
    this._open();
  }

  /** Close the bridge connection, cancel reconnects, and stop the FPS loop. */
  disconnect() {
    this._shouldRun = false;
    if (this._reconnectTimer !== null) { clearTimeout(this._reconnectTimer); this._reconnectTimer = null; }
    if (this._ws !== null) { try { this._ws.close(); } catch { /* already closed */ } this._ws = null; }
    this._stopFrameLoop();
  }

  /**
   * Expose a live value for GET /state under tagged[group][key]. The getter is
   * re-read on every state request; exceptions become "<error: …>" values.
   * @param {string} key
   * @param {() => any} getter Returns a JSON-able value.
   * @param {string} [group]
   */
  expose(key, getter, group = "default") {
    if (!key || typeof getter !== "function") return;
    if (!this._exposed.has(group)) this._exposed.set(group, new Map());
    this._exposed.get(group).set(key, getter);
  }

  /**
   * Drop a previously-exposed key.
   * @param {string} key
   * @param {string} [group]
   */
  unexpose(key, group = "default") {
    const bucket = this._exposed.get(group);
    if (!bucket) return;
    bucket.delete(key);
    if (bucket.size === 0) this._exposed.delete(group);
  }

  /**
   * Subscribe to POST /input events. The handler receives each raw event
   * ({ device, action, control, value?, x?, y? }) — translate it into your
   * game's input model. Handler exceptions are counted, never propagated.
   * @param {(event: object) => void} handler
   * @returns {() => void} Unsubscribe function.
   */
  onInput(handler) {
    if (typeof handler !== "function") return () => {};
    this._inputHandlers.add(handler);
    return () => this._inputHandlers.delete(handler);
  }

  /**
   * Register custom state for /snapshot + /restore round-trips. capture() must
   * return a JSON-able value; restore(payload) receives a deep copy of it.
   * @param {{ key: string, capture: () => any, restore: (payload: any) => void }} snapshotable
   */
  registerSnapshotable({ key, capture, restore } = {}) {
    if (!key || typeof capture !== "function" || typeof restore !== "function") return;
    this._snapshotables.set(key, { capture, restore });
  }

  /**
   * Wire the game's pause/resume hooks for POST /breakpoint. The right pause
   * semantics are framework-specific (flag your game loop, scene.pause(), …),
   * so the SDK delegates rather than guessing.
   * @param {{ pause?: () => void, resume?: () => void }} handlers
   */
  setPauseHandlers({ pause, resume } = {}) {
    this._pauseHandlers = { pause: pause ?? null, resume: resume ?? null };
  }

  /**
   * Record a semantic checkpoint (e.g. GameStack.hit("player-died")). If the
   * tag matches an active pause filter (or the "*" wildcard), the game's pause
   * handler fires and /breakpoint status reports isPaused until resume.
   * @param {string} tag
   */
  hit(tag) {
    if (!tag) return;
    this._recentHits.push({ tag, at: new Date().toISOString() });
    if (this._recentHits.length > RECENT_HITS_CAPACITY) this._recentHits.shift();
    if (this._pauseOnTags.has(tag) || this._pauseOnTags.has("*")) this._pause(tag);
  }

  // ------------------------------------------------------------- connection ---

  _open() {
    if (!this._shouldRun || typeof WebSocket === "undefined") return;
    // Fix double-connect leak: detach handlers from any existing socket before
    // creating a new one, so its onclose can't clobber _ws or schedule a rogue reconnect.
    if (this._ws !== null) {
      this._ws.onclose = null;
      this._ws.onerror = null;
      this._ws.onmessage = null;
      this._ws.onopen = null;
      try { this._ws.close(); } catch { /* already closed */ }
      this._ws = null;
    }
    let ws;
    try { ws = new WebSocket(this._url); } catch { this._noteFailure(); this._scheduleReconnect(); return; }
    this._ws = ws;
    ws.onopen = () => {
      this._reconnectDelayMs = RECONNECT_BASE_MS;
      if (!this._announcedConnect) {
        this._announcedConnect = true;
        console.info(`[gamestack] connected to bridge at ${this._url}`);
      }
      // One-way hello (no id) so the bridge can report the client version.
      this._sendRaw(JSON.stringify({ op: "hello", payload: { version: this._version } }));
    };
    ws.onmessage = (evt) => this._onMessage(evt);
    ws.onclose = () => {
      this._ws = null;
      if (this._shouldRun) this._noteFailure();
      this._scheduleReconnect();
    };
    ws.onerror = () => { /* onclose follows and owns the reconnect */ };
  }

  _scheduleReconnect() {
    if (!this._shouldRun || this._reconnectTimer !== null) return;
    this._reconnectTimer = setTimeout(() => { this._reconnectTimer = null; this._open(); }, this._reconnectDelayMs);
    this._reconnectDelayMs = Math.min(this._reconnectDelayMs * 2, RECONNECT_MAX_MS);
  }

  _noteFailure() {
    if (this._warnedFailure) return;
    this._warnedFailure = true;
    console.warn(`[gamestack] bridge not reachable at ${this._url} — running without it (will keep retrying quietly)`);
  }

  // ---------------------------------------------------------------- protocol ---

  _onMessage(evt) {
    let msg;
    try { msg = JSON.parse(evt.data); } catch { return; } // malformed JSON: ignore silently
    if (msg === null || typeof msg !== "object" || !("id" in msg)) return;
    let reply;
    try {
      reply = { id: msg.id, ok: true, payload: this._handleOp(String(msg.op), msg.payload ?? {}) };
    } catch (err) {
      reply = { id: msg.id, ok: false, error: errMsg(err) };
    }
    let raw;
    try { raw = JSON.stringify(reply); }
    catch (err) { raw = JSON.stringify({ id: msg.id, ok: false, error: `unserializable reply: ${errMsg(err)}` }); }
    this._sendRaw(raw);
  }

  _handleOp(op, payload) {
    switch (op) {
      case "state": return this._opState();
      case "screenshot": return this._opScreenshot();
      case "input": return this._opInput(payload);
      case "snapshot": return this._opSnapshot();
      case "snapshots": return { ids: [...this._snapshots.keys()] };
      case "restore": return this._opRestore(payload);
      case "breakpoint": return this._opBreakpoint(payload);
      default: throw new Error(`unknown op: ${op}`);
    }
  }

  _sendRaw(raw) {
    if (this._ws !== null && this._ws.readyState === WebSocket.OPEN) {
      try { this._ws.send(raw); } catch { /* connection died mid-send */ }
    }
  }

  // -------------------------------------------------------------- op handlers ---

  _opState() {
    return {
      scene: this._safeScene(),
      fps: this._fps(),
      frameTimeMs: this._frameTimeMs(),
      tagged: this._collectTagged(false),
    };
  }

  _opScreenshot() {
    const canvas = this._canvasGetter ? this._canvasGetter() : null;
    if (!canvas) throw new Error("no canvas registered — pass canvas: () => HTMLCanvasElement to GameStack.connect()");
    // WebGL note: toDataURL on a WebGL canvas returns a blank/black image unless
    // the context was created with { preserveDrawingBuffer: true }, or the
    // capture happens inside the same requestAnimationFrame callback that drew
    // the frame. 2D canvas contexts are unaffected.
    let dataUrl;
    try { dataUrl = canvas.toDataURL("image/png"); }
    catch (err) { throw new Error(`screenshot failed: ${errMsg(err)}`); }
    return { format: "png", dataBase64: dataUrl.slice(dataUrl.indexOf(",") + 1) };
  }

  _opInput(payload) {
    const events = Array.isArray(payload.events) ? payload.events : [];
    let errorCount = 0;
    for (const event of events) {
      for (const handler of this._inputHandlers) {
        try { handler(event); } catch { errorCount += 1; }
      }
    }
    return { eventsAccepted: events.length, subscriberCount: this._inputHandlers.size, errorCount };
  }

  _opSnapshot() {
    const custom = {};
    for (const [key, snapshotable] of this._snapshotables) {
      try { custom[key] = this._deepCopy(snapshotable.capture()); }
      catch (err) { custom[key] = `<error: ${errMsg(err)}>`; }
    }
    const id = `snap-${++this._snapCounter}`;
    this._snapshots.set(id, { exposed: this._collectTagged(true), custom });
    return { id };
  }

  _opRestore(payload) {
    const id = String(payload.id ?? "");
    const snap = this._snapshots.get(id);
    if (!snap) throw new Error(`unknown snapshot id: ${id}`);
    // Exposed values are NOT restored — they are getter-derived live reads of
    // game state. Only registered Snapshotables own restorable state.
    for (const [key, snapshotable] of this._snapshotables) {
      if (!(key in snap.custom)) continue;
      try { snapshotable.restore(snap.custom[key]); } catch { /* keep restoring the rest */ }
    }
    return { restored: true, id };
  }

  _opBreakpoint(payload) {
    const action = String(payload.action ?? "status");
    const tag = payload.tag === undefined ? "" : String(payload.tag);
    switch (action) {
      case "add-pause": if (tag !== "") this._pauseOnTags.add(tag); break;
      case "remove-pause": this._pauseOnTags.delete(tag); break;
      case "clear-pause": this._pauseOnTags.clear(); break;
      case "resume": this._resume(); break;
      case "pause-now": this._pause(tag !== "" ? tag : "manual"); break;
      case "status": break;
      default: throw new Error(`unknown breakpoint action: ${action}`);
    }
    return {
      isPaused: this._isPaused,
      lastPausedAt: this._lastPausedAt,
      pauseOnTags: [...this._pauseOnTags],
      // Wire format: plain tag strings (matches Godot/Unity; daemon uses hits.includes(step.tag)).
      recentHits: this._recentHits.map(h => h.tag),
    };
  }

  // ------------------------------------------------------------------ helpers ---

  _pause(tag) {
    if (!this._isPaused) { try { this._pauseHandlers.pause?.(); } catch { /* developer handler error */ } }
    this._isPaused = true;
    this._lastPausedAt = tag; // last-matching-tag-wins even if already paused (intentional: useful for status debugging)
  }

  _resume() {
    if (!this._isPaused) return;
    try { this._pauseHandlers.resume?.(); } catch { /* developer handler error */ }
    this._isPaused = false;
  }

  _safeScene() {
    if (!this._sceneGetter) return "";
    try { return String(this._sceneGetter()); } catch (err) { return `<error: ${errMsg(err)}>`; }
  }

  _collectTagged(deepCopy) {
    const tagged = {};
    for (const [group, keys] of this._exposed) {
      const bucket = {};
      for (const [key, getter] of keys) {
        let value;
        try { value = getter(); } catch (err) { value = `<error: ${errMsg(err)}>`; }
        if (!deepCopy) {
          // Coerce undefined → null so /state and /snapshot agree.
          if (value === undefined) value = null;
          // JSON-test each value; a circular ref or non-serializable getter
          // poisons only that key, not the whole reply.
          try { JSON.stringify(value); } catch { value = "<error: unserializable value>"; }
        }
        bucket[key] = deepCopy ? this._deepCopy(value) : value;
      }
      tagged[group] = bucket;
    }
    return tagged;
  }

  _deepCopy(value) {
    if (value === undefined) return null;
    try { return JSON.parse(JSON.stringify(value)); } catch (err) { return `<error: ${errMsg(err)}>`; }
  }

  _startFrameLoop() {
    if (this._rafId !== null || typeof requestAnimationFrame !== "function") return;
    this._lastFrameTs = null;
    const tick = (ts) => {
      if (this._lastFrameTs !== null) {
        this._frameDurations.push(ts - this._lastFrameTs);
        if (this._frameDurations.length > FRAME_WINDOW) this._frameDurations.shift();
      }
      this._lastFrameTs = ts;
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }

  _stopFrameLoop() {
    if (this._rafId !== null) { cancelAnimationFrame(this._rafId); this._rafId = null; }
    this._frameDurations = [];
    this._lastFrameTs = null;
  }

  _meanFrameMs() {
    if (this._frameDurations.length === 0) return 0;
    return this._frameDurations.reduce((sum, d) => sum + d, 0) / this._frameDurations.length;
  }

  _fps() {
    const mean = this._meanFrameMs();
    return mean > 0 ? Math.round(1000 / mean) : 0;
  }

  _frameTimeMs() {
    return Number(this._meanFrameMs().toFixed(2));
  }
}

/** The gamestack web SDK singleton. Import and call GameStack.connect(...). */
export const GameStack = new GameStackClient();
export default GameStack;
