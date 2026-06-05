import { existsSync, readFileSync } from "node:fs";
import { HttpClient, HttpError } from "../shared/http-client.ts";
import { isoDate } from "../shared/format.ts";

export interface EngineStatePerf {
  scene?: string;
  fps?: number;
  frameTimeMs?: number;
  drawCalls?: number;
  batches?: number;
  gcAllocBytes?: number;
  memoryMB?: number;
  /** Optional vendored profiler fields. */
  [key: string]: unknown;
}

export interface SampleSnapshot {
  t: number; // ms since start
  fps?: number;
  frameTimeMs?: number;
  drawCalls?: number;
  batches?: number;
  gcAllocBytes?: number;
  memoryMB?: number;
}

export interface Aggregates {
  durationMs: number;
  sampleCount: number;
  fps: NumericStat;
  frameTimeMs: NumericStat;
  drawCalls: NumericStat;
  batches: NumericStat;
  gcAllocBytesPerFrame: NumericStat;
  memoryMBPeak: number;
}

export interface NumericStat {
  count: number;
  mean: number;
  min: number;
  max: number;
  p99: number;
  p999: number; // 0.1th-percentile-from-top → bottom 0.1%
}

export interface BenchmarkInput {
  endpoint: string;
  durationSeconds: number;
  intervalMs: number;
  scenario: string;
  platform: string;
  baseline?: BenchmarkReport;
  fetcher?: () => Promise<EngineStatePerf>;
}

export interface BenchmarkReport {
  generatedAt: string;
  scenario: string;
  platform: string;
  endpoint: string;
  captureMethod: "engine-sdk";
  durationSeconds: number;
  scene?: string;
  aggregates: Aggregates;
  baselineCompare?: Diff[];
  regressions: Diff[];
  notes: string[];
}

export interface Diff {
  metric: string;
  current: number;
  baseline: number;
  deltaAbs: number;
  deltaPct: number | null;
  verdict: "PASS" | "REGRESSED" | "IMPROVED";
}

const REGRESSION_THRESHOLDS = {
  fpsAvgPctDrop: 0.05,
  frameTimeP99PctRise: 0.10,
  drawCallsPctRise: 0.10,
  gcAllocAny: true,
  memoryPctRise: 0.05,
};

export async function runBenchmark(input: BenchmarkInput): Promise<BenchmarkReport> {
  const fetcher = input.fetcher ?? defaultFetcher(input.endpoint);
  const samples: SampleSnapshot[] = [];
  const start = Date.now();
  let scene: string | undefined;
  const notes: string[] = [];

  const deadline = start + input.durationSeconds * 1000;
  while (Date.now() < deadline) {
    try {
      const state = await fetcher();
      if (state.scene && !scene) scene = state.scene;
      samples.push({
        t: Date.now() - start,
        fps: numOrUndef(state.fps),
        frameTimeMs: numOrUndef(state.frameTimeMs),
        drawCalls: numOrUndef(state.drawCalls),
        batches: numOrUndef(state.batches),
        gcAllocBytes: numOrUndef(state.gcAllocBytes),
        memoryMB: numOrUndef(state.memoryMB),
      });
    } catch (err) {
      notes.push(`fetch failed at t+${Date.now() - start}ms: ${(err as Error).message}`);
      if (err instanceof HttpError && err.status === 0) {
        // Network error: bail rather than spin to deadline.
        break;
      }
    }
    await new Promise((r) => setTimeout(r, input.intervalMs));
  }

  const aggregates = aggregate(samples);
  const baselineCompare = input.baseline ? diffAgainstBaseline(aggregates, input.baseline.aggregates) : undefined;
  const regressions = baselineCompare ? baselineCompare.filter((d) => d.verdict === "REGRESSED") : [];

  return {
    generatedAt: isoDate(),
    scenario: input.scenario,
    platform: input.platform,
    endpoint: input.endpoint,
    captureMethod: "engine-sdk",
    durationSeconds: input.durationSeconds,
    scene,
    aggregates,
    baselineCompare,
    regressions,
    notes,
  };
}

function numOrUndef(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function defaultFetcher(endpoint: string): () => Promise<EngineStatePerf> {
  const client = new HttpClient(endpoint);
  return async () => client.get<EngineStatePerf>("/state", { timeoutMs: 1000 });
}

export function aggregate(samples: SampleSnapshot[]): Aggregates {
  const fps = collect(samples, (s) => s.fps);
  const ft = collect(samples, (s) => s.frameTimeMs);
  const dc = collect(samples, (s) => s.drawCalls);
  const bt = collect(samples, (s) => s.batches);
  const gc = collect(samples, (s) => s.gcAllocBytes);
  const mem = collect(samples, (s) => s.memoryMB);

  const sortedAsc = (arr: number[]) => [...arr].sort((a, b) => a - b);
  const percentile = (sorted: number[], p: number) => {
    if (sorted.length === 0) return 0;
    const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * p)));
    return sorted[idx]!;
  };

  const stat = (arr: number[]): NumericStat => {
    if (arr.length === 0) return { count: 0, mean: 0, min: 0, max: 0, p99: 0, p999: 0 };
    const sorted = sortedAsc(arr);
    const sum = arr.reduce((a, b) => a + b, 0);
    return {
      count: arr.length,
      mean: sum / arr.length,
      min: sorted[0]!,
      max: sorted[sorted.length - 1]!,
      p99: percentile(sorted, 0.99),
      p999: percentile(sorted, 0.999),
    };
  };

  return {
    durationMs: samples.length > 0 ? samples[samples.length - 1]!.t - samples[0]!.t : 0,
    sampleCount: samples.length,
    fps: stat(fps),
    frameTimeMs: stat(ft),
    drawCalls: stat(dc),
    batches: stat(bt),
    gcAllocBytesPerFrame: stat(gc),
    memoryMBPeak: mem.length > 0 ? Math.max(...mem) : 0,
  };
}

function collect<T extends keyof SampleSnapshot>(samples: SampleSnapshot[], pick: (s: SampleSnapshot) => number | undefined): number[] {
  const out: number[] = [];
  for (const s of samples) {
    const v = pick(s);
    if (typeof v === "number" && Number.isFinite(v)) out.push(v);
  }
  return out;
}

export function diffAgainstBaseline(current: Aggregates, baseline: Aggregates): Diff[] {
  const diffs: Diff[] = [];

  const push = (metric: string, cur: number, base: number, isRegression: (curr: number, baseline: number) => boolean, isImprovement: (curr: number, baseline: number) => boolean) => {
    const deltaAbs = cur - base;
    const deltaPct = base !== 0 ? deltaAbs / base : null;
    let verdict: Diff["verdict"] = "PASS";
    if (isRegression(cur, base)) verdict = "REGRESSED";
    else if (isImprovement(cur, base)) verdict = "IMPROVED";
    diffs.push({ metric, current: cur, baseline: base, deltaAbs, deltaPct, verdict });
  };

  push(
    "Avg FPS",
    current.fps.mean,
    baseline.fps.mean,
    (c, b) => b > 0 && (b - c) / b > REGRESSION_THRESHOLDS.fpsAvgPctDrop,
    (c, b) => b > 0 && (c - b) / b > REGRESSION_THRESHOLDS.fpsAvgPctDrop,
  );
  push(
    "99th-pct frame time (ms)",
    current.frameTimeMs.p99,
    baseline.frameTimeMs.p99,
    (c, b) => b > 0 && (c - b) / b > REGRESSION_THRESHOLDS.frameTimeP99PctRise,
    (c, b) => b > 0 && (b - c) / b > REGRESSION_THRESHOLDS.frameTimeP99PctRise,
  );
  push(
    "Draw calls / frame",
    current.drawCalls.mean,
    baseline.drawCalls.mean,
    (c, b) => b > 0 && (c - b) / b > REGRESSION_THRESHOLDS.drawCallsPctRise,
    (c, b) => b > 0 && (b - c) / b > REGRESSION_THRESHOLDS.drawCallsPctRise,
  );
  push(
    "GC alloc / frame (bytes)",
    current.gcAllocBytesPerFrame.mean,
    baseline.gcAllocBytesPerFrame.mean,
    (c, b) => REGRESSION_THRESHOLDS.gcAllocAny && c > b,
    (c, b) => c < b,
  );
  push(
    "Peak memory (MB)",
    current.memoryMBPeak,
    baseline.memoryMBPeak,
    (c, b) => b > 0 && (c - b) / b > REGRESSION_THRESHOLDS.memoryPctRise,
    (c, b) => b > 0 && (b - c) / b > REGRESSION_THRESHOLDS.memoryPctRise,
  );

  return diffs;
}

export function loadBaseline(path: string): BenchmarkReport | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as BenchmarkReport;
  } catch {
    return null;
  }
}
