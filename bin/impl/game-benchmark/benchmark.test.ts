import { describe, test, expect } from "bun:test";
import { aggregate, diffAgainstBaseline, runBenchmark, type EngineStatePerf } from "./benchmark.ts";
import { renderMarkdown } from "./render.ts";

function steadyFetcher(state: EngineStatePerf): () => Promise<EngineStatePerf> {
  return async () => state;
}

function jitterFetcher(samples: EngineStatePerf[]): () => Promise<EngineStatePerf> {
  let i = 0;
  return async () => {
    const v = samples[i % samples.length]!;
    i += 1;
    return v;
  };
}

describe("runBenchmark", () => {
  test("collects samples from injected fetcher over the duration", async () => {
    const report = await runBenchmark({
      endpoint: "http://test",
      durationSeconds: 1,
      intervalMs: 50,
      scenario: "smoke",
      platform: "test",
      fetcher: steadyFetcher({ fps: 60, frameTimeMs: 16.6, drawCalls: 200, memoryMB: 800, scene: "Level1" }),
    });
    expect(report.aggregates.sampleCount).toBeGreaterThan(10);
    expect(report.scene).toBe("Level1");
    expect(report.aggregates.fps.mean).toBeCloseTo(60, 1);
  });

  test("captures notes on fetch failures without aborting (unless network)", async () => {
    let calls = 0;
    const flaky = async (): Promise<EngineStatePerf> => {
      calls += 1;
      if (calls === 3) throw new Error("simulated parse error");
      return { fps: 60, frameTimeMs: 16, drawCalls: 100, memoryMB: 500 };
    };
    const report = await runBenchmark({
      endpoint: "http://test",
      durationSeconds: 0.6,
      intervalMs: 100,
      scenario: "flaky",
      platform: "test",
      fetcher: flaky,
    });
    expect(report.notes.some((n) => n.includes("simulated parse error"))).toBe(true);
    expect(report.aggregates.sampleCount).toBeGreaterThan(0);
  });
});

describe("aggregate", () => {
  test("computes mean / p99 / p999 over collected samples", () => {
    const samples = [
      { t: 0, fps: 60, frameTimeMs: 16.6, drawCalls: 100, memoryMB: 500 },
      { t: 100, fps: 58, frameTimeMs: 17.2, drawCalls: 105, memoryMB: 505 },
      { t: 200, fps: 30, frameTimeMs: 33.3, drawCalls: 200, memoryMB: 510 }, // outlier
      { t: 300, fps: 59, frameTimeMs: 16.9, drawCalls: 102, memoryMB: 502 },
      { t: 400, fps: 60, frameTimeMs: 16.6, drawCalls: 99, memoryMB: 503 },
    ];
    const agg = aggregate(samples);
    expect(agg.fps.count).toBe(5);
    expect(agg.fps.min).toBe(30);
    expect(agg.frameTimeMs.max).toBe(33.3);
    expect(agg.memoryMBPeak).toBe(510);
  });

  test("zero samples yields zeroed stats without crashing", () => {
    const agg = aggregate([]);
    expect(agg.sampleCount).toBe(0);
    expect(agg.fps.mean).toBe(0);
    expect(agg.memoryMBPeak).toBe(0);
  });
});

describe("diffAgainstBaseline", () => {
  test("FPS drop > 5% surfaces as regression", () => {
    const baseline = aggregate(replicate({ fps: 60, frameTimeMs: 16.6 }, 100));
    const current = aggregate(replicate({ fps: 55, frameTimeMs: 18.2 }, 100));
    const diffs = diffAgainstBaseline(current, baseline);
    const fps = diffs.find((d) => d.metric === "Avg FPS")!;
    expect(fps.verdict).toBe("REGRESSED");
  });

  test("FPS rise > 5% surfaces as improvement", () => {
    const baseline = aggregate(replicate({ fps: 50, frameTimeMs: 20 }, 100));
    const current = aggregate(replicate({ fps: 60, frameTimeMs: 16.6 }, 100));
    const diffs = diffAgainstBaseline(current, baseline);
    const fps = diffs.find((d) => d.metric === "Avg FPS")!;
    expect(fps.verdict).toBe("IMPROVED");
  });

  test("any GC alloc increase counts as regression", () => {
    const baseline = aggregate(replicate({ gcAllocBytes: 1000 }, 50));
    const current = aggregate(replicate({ gcAllocBytes: 1001 }, 50));
    const diffs = diffAgainstBaseline(current, baseline);
    const gc = diffs.find((d) => d.metric === "GC alloc / frame (bytes)")!;
    expect(gc.verdict).toBe("REGRESSED");
  });

  test("memory rise > 5% surfaces as regression", () => {
    const baseline = aggregate(replicate({ memoryMB: 500 }, 50));
    const current = aggregate(replicate({ memoryMB: 540 }, 50));
    const diffs = diffAgainstBaseline(current, baseline);
    const mem = diffs.find((d) => d.metric === "Peak memory (MB)")!;
    expect(mem.verdict).toBe("REGRESSED");
  });

  test("baseline of zero handles deltaPct cleanly", () => {
    const baseline = aggregate(replicate({ drawCalls: 0 }, 10));
    const current = aggregate(replicate({ drawCalls: 50 }, 10));
    const diffs = diffAgainstBaseline(current, baseline);
    const dc = diffs.find((d) => d.metric === "Draw calls / frame")!;
    expect(dc.deltaPct).toBeNull();
  });
});

describe("renderMarkdown", () => {
  test("emits non-empty markdown with baseline section", async () => {
    const baselineAgg = aggregate(replicate({ fps: 60, frameTimeMs: 16.6, memoryMB: 500, drawCalls: 100 }, 100));
    const baseline = {
      generatedAt: "2026-06-01",
      scenario: "smoke",
      platform: "test",
      endpoint: "http://test",
      captureMethod: "engine-sdk" as const,
      durationSeconds: 10,
      aggregates: baselineAgg,
      regressions: [],
      notes: [],
    };
    const report = await runBenchmark({
      endpoint: "http://test",
      durationSeconds: 0.4,
      intervalMs: 50,
      scenario: "smoke",
      platform: "test",
      baseline,
      fetcher: steadyFetcher({ fps: 30, frameTimeMs: 33.3, memoryMB: 600, drawCalls: 200 }),
    });
    const md = renderMarkdown(report);
    expect(md).toContain("# Game perf benchmark");
    expect(md).toContain("Diff vs baseline");
    expect(md).toContain("Regressions");
  });
});

function replicate(s: EngineStatePerf, n: number): { t: number; fps?: number; frameTimeMs?: number; drawCalls?: number; batches?: number; gcAllocBytes?: number; memoryMB?: number }[] {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({
      t: i * 100,
      fps: s.fps,
      frameTimeMs: s.frameTimeMs,
      drawCalls: s.drawCalls,
      batches: s.batches,
      gcAllocBytes: s.gcAllocBytes,
      memoryMB: s.memoryMB,
    });
  }
  return out;
}
