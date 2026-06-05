import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadScenario, runScenario } from "./runner.ts";
import { validateScenario, type Scenario } from "../shared/scenario.ts";

// Fake engine SDK — minimal Bun HTTP server that mimics gamestack's endpoints.
interface FakeEngineOptions {
  state: Record<string, unknown>;
  evolvingStateAfterMs?: number;
  evolvedState?: Record<string, unknown>;
}

interface FakeEngine {
  port: number;
  url: string;
  inputs: { events: unknown[] }[];
  breakpointHits: string[];
  setState(next: Record<string, unknown>): void;
  stop(): void;
}

function startFakeEngine(opts: FakeEngineOptions): FakeEngine {
  let currentState = opts.state;
  if (opts.evolvingStateAfterMs && opts.evolvedState) {
    setTimeout(() => {
      currentState = opts.evolvedState!;
    }, opts.evolvingStateAfterMs);
  }
  const inputs: { events: unknown[] }[] = [];
  const breakpointHits: string[] = [];
  let snapshotCounter = 0;
  const stored = new Map<string, Record<string, unknown>>();

  const server = Bun.serve({
    port: 0,
    fetch: async (req) => {
      const url = new URL(req.url);
      const path = url.pathname;
      if (req.method === "GET" && path === "/state") {
        return Response.json(currentState);
      }
      if (req.method === "GET" && path === "/health") {
        return Response.json({ status: "ok" });
      }
      if (req.method === "POST" && path === "/input") {
        const body = await req.json() as { events: unknown[] };
        inputs.push(body);
        return Response.json({ ok: true });
      }
      if (req.method === "POST" && path === "/screenshot") {
        const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // truncated; fine for test
        return new Response(png, { headers: { "content-type": "image/png" } });
      }
      if (req.method === "POST" && path === "/snapshot") {
        const body = await req.json().catch(() => ({}));
        const id = (body as { id?: string }).id ?? `snap-${++snapshotCounter}`;
        stored.set(id, JSON.parse(JSON.stringify(currentState)));
        return Response.json({ id });
      }
      if (req.method === "POST" && path === "/restore") {
        const body = await req.json() as { id?: string };
        if (body.id && stored.has(body.id)) {
          currentState = stored.get(body.id)!;
          return Response.json({ ok: true });
        }
        return Response.json({ ok: false }, { status: 404 });
      }
      if (req.method === "POST" && path === "/breakpoint") {
        const body = await req.json() as { action: string; tag?: string };
        if (body.action === "add-pause" && body.tag) breakpointHits.push(body.tag);
        return Response.json({ recentHits: [...breakpointHits], paused: false });
      }
      if (req.method === "GET" && path === "/breakpoint") {
        return Response.json({ recentHits: [...breakpointHits], paused: false });
      }
      return new Response("not found", { status: 404 });
    },
  });

  const port = server.port!;
  return {
    port,
    url: `http://localhost:${port}`,
    inputs,
    breakpointHits,
    setState(next: Record<string, unknown>) { currentState = next; },
    stop() { server.stop(true); },
  };
}

let engine: FakeEngine;
let runDir: string;

beforeAll(() => {
  engine = startFakeEngine({
    state: {
      scene: "TestScene",
      fps: 60,
      time: 0,
      tagged: { default: { gameReady: false, hp: 100, score: 0 } },
    },
    evolvingStateAfterMs: 200,
    evolvedState: {
      scene: "TestScene",
      fps: 60,
      time: 0.5,
      tagged: { default: { gameReady: true, hp: 100, score: 0 } },
    },
  });
  runDir = mkdtempSync(join(tmpdir(), "gamestack-daemon-test-"));
});

afterAll(() => {
  engine.stop();
  if (existsSync(runDir)) rmSync(runDir, { recursive: true, force: true });
});

function baseScenario(overrides: Partial<Scenario>): Scenario {
  return {
    name: "test-scenario",
    phase: "prototype",
    description: "test",
    steps: [],
    ...overrides,
  };
}

describe("runScenario (against fake engine)", () => {
  test("smoke: assert_state on a matching value passes", async () => {
    const report = await runScenario({
      scenario: baseScenario({
        steps: [
          { type: "assert_state", tagged_key: "default.hp", expected_value: 100 } as const,
        ],
      }),
      runDir,
      endpoint: engine.url,
    });
    expect(report.passed).toBe(true);
    expect(report.phases.steps[0]!.status).toBe("ok");
  });

  test("assert_state on a mismatch fails the run", async () => {
    const report = await runScenario({
      scenario: baseScenario({
        steps: [
          { type: "assert_state", tagged_key: "default.hp", expected_value: 50 } as const,
        ],
      }),
      runDir,
      endpoint: engine.url,
    });
    expect(report.passed).toBe(false);
    expect(report.phases.steps[0]!.status).toBe("fail");
  });

  test("assert_state with expected_range honors numeric ranges", async () => {
    const report = await runScenario({
      scenario: baseScenario({
        steps: [
          { type: "assert_state", tagged_key: "default.hp", expected_range: [50, 150] } as const,
        ],
      }),
      runDir,
      endpoint: engine.url,
    });
    expect(report.passed).toBe(true);
  });

  test("wait_for_state polls and resolves once state evolves", async () => {
    // Reset evolving state — make a fresh engine so the timer fires anew.
    const localEngine = startFakeEngine({
      state: { tagged: { default: { gameReady: false } } },
      evolvingStateAfterMs: 150,
      evolvedState: { tagged: { default: { gameReady: true } } },
    });
    try {
      const report = await runScenario({
        scenario: baseScenario({
          steps: [
            { type: "wait_for_state", tagged_key: "default.gameReady", expected_value: true, timeout_seconds: 3 } as const,
          ],
        }),
        runDir,
        endpoint: localEngine.url,
      });
      expect(report.passed).toBe(true);
      expect(report.phases.steps[0]!.status).toBe("ok");
    } finally {
      localEngine.stop();
    }
  });

  test("wait_for_state times out when value never appears", async () => {
    const stuckEngine = startFakeEngine({
      state: { tagged: { default: { gameReady: false } } },
    });
    try {
      const report = await runScenario({
        scenario: baseScenario({
          steps: [
            { type: "wait_for_state", tagged_key: "default.gameReady", expected_value: true, timeout_seconds: 0.3 } as const,
          ],
        }),
        runDir,
        endpoint: stuckEngine.url,
      });
      expect(report.passed).toBe(false);
      expect(report.phases.steps[0]!.status).toBe("timeout");
    } finally {
      stuckEngine.stop();
    }
  });

  test("input step forwards events to /input", async () => {
    const before = engine.inputs.length;
    const report = await runScenario({
      scenario: baseScenario({
        steps: [
          {
            type: "input",
            events: [{ device: "Keyboard", action: "Press", control: "Space" }],
          } as const,
        ],
      }),
      runDir,
      endpoint: engine.url,
    });
    expect(report.passed).toBe(true);
    expect(engine.inputs.length).toBe(before + 1);
    expect(engine.inputs[before]!.events.length).toBe(1);
  });

  test("screenshot writes a file to the run dir", async () => {
    const report = await runScenario({
      scenario: baseScenario({
        steps: [
          { type: "screenshot", filename: "shot.png" } as const,
        ],
      }),
      runDir,
      endpoint: engine.url,
    });
    expect(report.passed).toBe(true);
    expect(existsSync(join(runDir, "shot.png"))).toBe(true);
  });

  test("snapshot + restore round-trip works against the fake engine", async () => {
    const report = await runScenario({
      scenario: baseScenario({
        steps: [
          { type: "snapshot", id: "test-snap" } as const,
          { type: "restore", id: "test-snap" } as const,
        ],
      }),
      runDir,
      endpoint: engine.url,
    });
    expect(report.passed).toBe(true);
  });

  test("breakpoint + assert_recent_breakpoint sees the hit", async () => {
    const report = await runScenario({
      scenario: baseScenario({
        steps: [
          { type: "breakpoint", action: "add-pause", tag: "test-tag" } as const,
          { type: "assert_recent_breakpoint", tag: "test-tag" } as const,
        ],
      }),
      runDir,
      endpoint: engine.url,
    });
    expect(report.passed).toBe(true);
  });

  test("continue_on_failure runs steps after a failure", async () => {
    const report = await runScenario({
      scenario: baseScenario({
        continue_on_failure: true,
        steps: [
          { type: "assert_state", tagged_key: "default.hp", expected_value: 50 } as const, // fails
          { type: "assert_state", tagged_key: "default.hp", expected_value: 100 } as const, // ok
        ],
      }),
      runDir,
      endpoint: engine.url,
    });
    expect(report.passed).toBe(false);
    expect(report.phases.steps[0]!.status).toBe("fail");
    expect(report.phases.steps[1]!.status).toBe("ok");
  });

  test("teardown runs even after a step failure", async () => {
    const report = await runScenario({
      scenario: baseScenario({
        steps: [{ type: "assert_state", tagged_key: "default.hp", expected_value: 50 } as const],
        teardown: [{ type: "snapshot", id: "teardown-snap" } as const],
      }),
      runDir,
      endpoint: engine.url,
    });
    expect(report.passed).toBe(false);
    expect(report.phases.teardown[0]!.status).toBe("ok");
  });

  test("max_duration_seconds budget halts long-running scenarios", async () => {
    const report = await runScenario({
      scenario: baseScenario({
        max_duration_seconds: 0.1,
        steps: [
          { type: "wait", seconds: 0.5 } as const,
          { type: "wait", seconds: 0.5 } as const,
        ],
      }),
      runDir,
      endpoint: engine.url,
    });
    expect(report.durationBudgetExceeded).toBe(true);
    expect(report.passed).toBe(false);
  });

  test("run.json is written to the run dir", async () => {
    await runScenario({
      scenario: baseScenario({
        steps: [{ type: "assert_state", tagged_key: "default.hp", expected_value: 100 } as const],
      }),
      runDir,
      endpoint: engine.url,
    });
    const runJsonPath = join(runDir, "run.json");
    expect(existsSync(runJsonPath)).toBe(true);
    const data = JSON.parse(readFileSync(runJsonPath, "utf8"));
    expect(data.scenario.name).toBe("test-scenario");
    expect(Array.isArray(data.phases.steps)).toBe(true);
  });
});

describe("validateScenario", () => {
  test("accepts a well-formed scenario", () => {
    const r = validateScenario({
      name: "x", phase: "prototype", description: "y",
      steps: [{ type: "wait", seconds: 1 }],
    });
    expect(r.ok).toBe(true);
  });

  test("rejects an unknown step type", () => {
    const r = validateScenario({
      name: "x", phase: "prototype", description: "y",
      steps: [{ type: "teleport", seconds: 1 }],
    });
    expect(r.ok).toBe(false);
  });
});
