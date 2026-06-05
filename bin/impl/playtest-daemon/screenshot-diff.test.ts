import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runScreenshotDiff } from "./screenshot-diff.ts";

function makeTmp(): string {
  return mkdtempSync(join(tmpdir(), "gamestack-screenshot-diff-"));
}

// A pair of distinct "PNG" payloads. We don't validate PNG format anywhere in
// the diff code path — it's byte-level — so this is enough for behavior tests.
const PNG_A = Buffer.from("\x89PNG\r\n\x1a\nAAAAAAAA".repeat(64), "binary");
const PNG_B = Buffer.from("\x89PNG\r\n\x1a\nBBBBBBBB".repeat(64), "binary");

describe("runScreenshotDiff", () => {
  // The daemon seeds its "seen" set from the watch dir at start, then waits for a
  // NEW file to appear. The tests below drop the fresh frame after invocation
  // (via setTimeout) to simulate the developer hitting their screenshot hotkey
  // mid-step.
  function dropAfter(delayMs: number, dst: string, payload: Buffer): void {
    setTimeout(() => writeFileSync(dst, payload), delayMs);
  }

  test("no-baseline verdict on first run", async () => {
    const tmp = makeTmp();
    const watchDir = join(tmp, "screenshots");
    const baselineDir = join(tmp, "baseline");
    const runDir = join(tmp, "run");
    mkdirSync(watchDir, { recursive: true });
    dropAfter(100, join(watchDir, "frame-1.png"), PNG_A);

    const report = await runScreenshotDiff({
      scenarioName: "test",
      steps: [{ name: "title-screen" }],
      watchDir,
      baselineDir,
      runDir,
      threshold: 0.05,
      waitTimeoutMs: 2_000,
      pollIntervalMs: 50,
      onPrompt: () => {},
      onProgress: () => {},
    });

    expect(report.steps).toHaveLength(1);
    expect(report.steps[0]!.verdict).toBe("no-baseline");
    expect(report.passed).toBe(true);
  });

  test("pass when capture matches baseline byte-for-byte", async () => {
    const tmp = makeTmp();
    const watchDir = join(tmp, "screenshots");
    const baselineDir = join(tmp, "baseline");
    const runDir = join(tmp, "run");
    mkdirSync(watchDir, { recursive: true });
    mkdirSync(baselineDir, { recursive: true });
    writeFileSync(join(baselineDir, "01-title-screen.png"), PNG_A);
    dropAfter(100, join(watchDir, "fresh.png"), PNG_A);

    const report = await runScreenshotDiff({
      scenarioName: "test",
      steps: [{ name: "title-screen" }],
      watchDir,
      baselineDir,
      runDir,
      threshold: 0.05,
      waitTimeoutMs: 2_000,
      pollIntervalMs: 50,
      onPrompt: () => {},
      onProgress: () => {},
    });

    expect(report.steps[0]!.verdict).toBe("pass");
    expect(report.steps[0]!.delta).toBe(0);
    expect(report.passed).toBe(true);
  });

  test("fail when capture differs beyond threshold", async () => {
    const tmp = makeTmp();
    const watchDir = join(tmp, "screenshots");
    const baselineDir = join(tmp, "baseline");
    const runDir = join(tmp, "run");
    mkdirSync(watchDir, { recursive: true });
    mkdirSync(baselineDir, { recursive: true });
    writeFileSync(join(baselineDir, "01-boss-room.png"), PNG_A);
    dropAfter(100, join(watchDir, "fresh.png"), PNG_B);

    const report = await runScreenshotDiff({
      scenarioName: "test",
      steps: [{ name: "boss-room" }],
      watchDir,
      baselineDir,
      runDir,
      threshold: 0.05,
      waitTimeoutMs: 2_000,
      pollIntervalMs: 50,
      onPrompt: () => {},
      onProgress: () => {},
    });

    expect(report.steps[0]!.verdict).toBe("fail");
    expect(report.steps[0]!.delta).toBeGreaterThan(0.05);
    expect(report.passed).toBe(false);
  });

  test("missing-capture verdict when no new file lands within timeout", async () => {
    const tmp = makeTmp();
    const watchDir = join(tmp, "screenshots");
    const baselineDir = join(tmp, "baseline");
    const runDir = join(tmp, "run");
    mkdirSync(watchDir, { recursive: true });

    const report = await runScreenshotDiff({
      scenarioName: "test",
      steps: [{ name: "title-screen" }],
      watchDir,
      baselineDir,
      runDir,
      threshold: 0.05,
      waitTimeoutMs: 200,
      pollIntervalMs: 50,
      onPrompt: () => {},
      onProgress: () => {},
    });

    expect(report.steps[0]!.verdict).toBe("missing-capture");
    expect(report.passed).toBe(false);
  });
});
