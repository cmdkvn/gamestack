import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { HttpClient, HttpError, pollUntil } from "../shared/http-client.ts";
import {
  type AssertRecentBreakpointStep,
  type AssertStateStep,
  type BreakpointStep,
  type InputStep,
  type RestoreStep,
  type Scenario,
  type ScreenshotStep,
  type SnapshotStep,
  type Step,
  type StepResult,
  type StepStatus,
  type WaitForStateStep,
  type WaitStep,
  validateScenario,
} from "../shared/scenario.ts";

const DEFAULT_PORTS: Record<string, number> = { unity: 7331, godot: 7332, web: 7334 };

export interface DaemonOptions {
  scenario: Scenario;
  runDir: string;
  endpoint?: string;
  engine?: "unity" | "godot" | "web";
  /** Override the HttpClient (used by tests). */
  client?: HttpClient;
  /** Optional override clock + sleep — used by tests to avoid real waits. */
  clock?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

export interface RunReport {
  generatedAt: string;
  scenario: Scenario;
  endpoint: string;
  runDir: string;
  startedAt: string;
  finishedAt: string;
  totalElapsedMs: number;
  durationBudgetExceeded: boolean;
  phases: {
    setup: StepResult[];
    steps: StepResult[];
    teardown: StepResult[];
  };
  passed: boolean;
}

export async function runScenario(opts: DaemonOptions): Promise<RunReport> {
  const endpoint =
    opts.endpoint ??
    opts.scenario.endpoint ??
    `http://localhost:${DEFAULT_PORTS[opts.engine ?? "unity"]}`;
  const client = opts.client ?? new HttpClient(endpoint);
  const clock = opts.clock ?? Date.now;
  const sleep = opts.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));

  mkdirSync(opts.runDir, { recursive: true });
  const startedAt = new Date(clock()).toISOString();
  const startTs = clock();
  const budgetMs = (opts.scenario.max_duration_seconds ?? 0) * 1000;
  const continueOnFailure = opts.scenario.continue_on_failure ?? false;

  const ctx: ExecutionContext = {
    client,
    runDir: opts.runDir,
    sleep,
    clock,
    snapshots: new Set<string>(),
    snapshotIdCounter: 0,
    halted: false,
  };

  const setup: StepResult[] = [];
  const steps: StepResult[] = [];
  const teardown: StepResult[] = [];

  await executePhase(opts.scenario.setup ?? [], setup, ctx, continueOnFailure, startTs, budgetMs);
  if (!ctx.halted) {
    await executePhase(opts.scenario.steps, steps, ctx, continueOnFailure, startTs, budgetMs);
  }
  // Teardown always runs, even if halted, to keep the world tidy.
  ctx.halted = false;
  await executePhase(opts.scenario.teardown ?? [], teardown, ctx, true, startTs, budgetMs);

  const totalElapsedMs = clock() - startTs;
  const finishedAt = new Date(clock()).toISOString();
  const durationBudgetExceeded = budgetMs > 0 && totalElapsedMs > budgetMs;

  const passed =
    [...setup, ...steps, ...teardown].every((s) => s.status === "ok" || s.status === "skipped") &&
    !durationBudgetExceeded;

  const report: RunReport = {
    generatedAt: new Date(clock()).toISOString(),
    scenario: opts.scenario,
    endpoint,
    runDir: opts.runDir,
    startedAt,
    finishedAt,
    totalElapsedMs,
    durationBudgetExceeded,
    phases: { setup, steps, teardown },
    passed,
  };

  writeFileSync(join(opts.runDir, "run.json"), JSON.stringify(report, null, 2));
  return report;
}

interface ExecutionContext {
  client: HttpClient;
  runDir: string;
  sleep: (ms: number) => Promise<void>;
  clock: () => number;
  snapshots: Set<string>;
  snapshotIdCounter: number;
  halted: boolean;
}

async function executePhase(
  phase: Step[],
  results: StepResult[],
  ctx: ExecutionContext,
  continueOnFailure: boolean,
  startTs: number,
  budgetMs: number,
): Promise<void> {
  for (const step of phase) {
    if (ctx.halted) {
      results.push(skipResult(step, "halted"));
      continue;
    }
    if (budgetMs > 0 && ctx.clock() - startTs > budgetMs) {
      results.push(skipResult(step, "scenario duration budget exceeded"));
      ctx.halted = true;
      continue;
    }
    const result = await executeStep(step, ctx);
    results.push(result);
    if (result.status !== "ok" && result.status !== "skipped" && !continueOnFailure) {
      ctx.halted = true;
    }
  }
}

function skipResult(step: Step, reason: string): StepResult {
  return {
    step: stepName(step),
    type: step.type,
    status: "skipped",
    elapsed_ms: 0,
    details: { reason },
  };
}

function stepName(step: Step): string {
  if ((step as { step?: string }).step) return (step as { step: string }).step;
  return step.type;
}

async function executeStep(step: Step, ctx: ExecutionContext): Promise<StepResult> {
  const start = ctx.clock();
  try {
    switch (step.type) {
      case "wait":
        return await execWait(step, ctx, start);
      case "wait_for_state":
        return await execWaitForState(step, ctx, start);
      case "input":
        return await execInput(step, ctx, start);
      case "screenshot":
        return await execScreenshot(step, ctx, start);
      case "snapshot":
        return await execSnapshot(step, ctx, start);
      case "restore":
        return await execRestore(step, ctx, start);
      case "breakpoint":
        return await execBreakpoint(step, ctx, start);
      case "assert_state":
        return await execAssertState(step, ctx, start);
      case "assert_recent_breakpoint":
        return await execAssertRecentBreakpoint(step, ctx, start);
    }
  } catch (err) {
    return failResult(step, start, ctx, (err as Error).message);
  }
}

function okResult(step: Step, start: number, ctx: ExecutionContext, details: Record<string, unknown> = {}): StepResult {
  return {
    step: stepName(step),
    type: step.type,
    status: "ok",
    elapsed_ms: ctx.clock() - start,
    details,
  };
}

function failResult(step: Step, start: number, ctx: ExecutionContext, reason: string, status: StepStatus = "fail"): StepResult {
  return {
    step: stepName(step),
    type: step.type,
    status,
    elapsed_ms: ctx.clock() - start,
    details: { reason },
  };
}

async function execWait(step: WaitStep, ctx: ExecutionContext, start: number): Promise<StepResult> {
  await ctx.sleep(step.seconds * 1000);
  return okResult(step, start, ctx, { sleptSeconds: step.seconds });
}

async function execWaitForState(step: WaitForStateStep, ctx: ExecutionContext, start: number): Promise<StepResult> {
  const lookup = step.tagged_key.split(".");
  const result = await pollUntil<Record<string, unknown>>(
    () => ctx.client.get<Record<string, unknown>>("/state", { timeoutMs: 1000 }),
    (state) => deepEquals(navigate(state, ["tagged", ...lookup]), step.expected_value),
    { timeoutMs: step.timeout_seconds * 1000, intervalMs: 100 },
  );
  if (result.timedOut) {
    return failResult(step, start, ctx, `state.${step.tagged_key} did not reach expected value within ${step.timeout_seconds}s`, "timeout");
  }
  return {
    step: stepName(step),
    type: step.type,
    status: "ok",
    elapsed_ms: ctx.clock() - start,
    details: { polledFor: result.elapsedMs },
    state_after: result.value as Record<string, unknown>,
  };
}

async function execInput(step: InputStep, ctx: ExecutionContext, start: number): Promise<StepResult> {
  await ctx.client.post("/input", { events: step.events });
  return okResult(step, start, ctx, { eventCount: step.events.length });
}

async function execScreenshot(step: ScreenshotStep, ctx: ExecutionContext, start: number): Promise<StepResult> {
  const resp = await ctx.client.postRaw("/screenshot", { format: "png" });
  if (!resp.ok) {
    return failResult(step, start, ctx, `screenshot returned HTTP ${resp.status}`);
  }
  const buf = new Uint8Array(await resp.arrayBuffer());
  const outPath = join(ctx.runDir, step.filename);
  mkdirSync(join(ctx.runDir, ...step.filename.split("/").slice(0, -1)), { recursive: true });
  writeFileSync(outPath, buf);
  return {
    step: stepName(step),
    type: step.type,
    status: "ok",
    elapsed_ms: ctx.clock() - start,
    details: { byteCount: buf.length },
    screenshot: outPath,
  };
}

async function execSnapshot(step: SnapshotStep, ctx: ExecutionContext, start: number): Promise<StepResult> {
  const body: Record<string, unknown> = {};
  if (step.id) body.id = step.id;
  const resp = await ctx.client.post<{ id?: string }>("/snapshot", body);
  const id = step.id ?? resp.id ?? `snap-${++ctx.snapshotIdCounter}`;
  ctx.snapshots.add(id);
  return okResult(step, start, ctx, { id });
}

async function execRestore(step: RestoreStep, ctx: ExecutionContext, start: number): Promise<StepResult> {
  if (!step.id) return failResult(step, start, ctx, "restore requires id");
  await ctx.client.post("/restore", { id: step.id });
  return okResult(step, start, ctx, { id: step.id });
}

async function execBreakpoint(step: BreakpointStep, ctx: ExecutionContext, start: number): Promise<StepResult> {
  const body: Record<string, unknown> = { action: step.action };
  if (step.tag) body.tag = step.tag;
  await ctx.client.post("/breakpoint", body);
  return okResult(step, start, ctx, { action: step.action, tag: step.tag });
}

async function execAssertState(step: AssertStateStep, ctx: ExecutionContext, start: number): Promise<StepResult> {
  const state = await ctx.client.get<Record<string, unknown>>("/state", { timeoutMs: 1000 });
  const lookup = step.tagged_key.split(".");
  const value = navigate(state, ["tagged", ...lookup]);

  if (step.expected_range) {
    const num = typeof value === "number" ? value : Number(value);
    const [lo, hi] = step.expected_range;
    if (Number.isFinite(num) && num >= lo && num <= hi) {
      return okWithState(step, start, ctx, state, { value });
    }
    return failResult(step, start, ctx, `expected ${step.tagged_key} in [${lo}, ${hi}], got ${JSON.stringify(value)}`);
  }
  if (deepEquals(value, step.expected_value)) {
    return okWithState(step, start, ctx, state, { value });
  }
  return failResult(
    step,
    start,
    ctx,
    `expected ${step.tagged_key}=${JSON.stringify(step.expected_value)}, got ${JSON.stringify(value)}`,
  );
}

async function execAssertRecentBreakpoint(step: AssertRecentBreakpointStep, ctx: ExecutionContext, start: number): Promise<StepResult> {
  const status = await ctx.client.get<{ recentHits?: string[] }>("/breakpoint", { timeoutMs: 1000 });
  const hits = Array.isArray(status.recentHits) ? status.recentHits : [];
  if (hits.includes(step.tag)) {
    return okResult(step, start, ctx, { hits });
  }
  return failResult(step, start, ctx, `recentHits ${JSON.stringify(hits)} does not include '${step.tag}'`);
}

function okWithState(step: Step, start: number, ctx: ExecutionContext, state: Record<string, unknown>, details: Record<string, unknown>): StepResult {
  return {
    step: stepName(step),
    type: step.type,
    status: "ok",
    elapsed_ms: ctx.clock() - start,
    details,
    state_after: state,
  };
}

function navigate(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const p of path) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function deepEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEquals(v, b[i]));
  }
  if (typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a as object).sort();
    const kb = Object.keys(b as object).sort();
    if (ka.length !== kb.length) return false;
    return ka.every((k, i) => k === kb[i] && deepEquals((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
  }
  return false;
}

export function loadScenario(path: string): Scenario {
  if (!existsSync(path)) throw new Error(`scenario file not found: ${path}`);
  const raw = JSON.parse(readFileSync(path, "utf8"));
  const validated = validateScenario(raw);
  if (!validated.ok) {
    throw new Error("invalid scenario:\n  - " + validated.errors.join("\n  - "));
  }
  return validated.scenario;
}
