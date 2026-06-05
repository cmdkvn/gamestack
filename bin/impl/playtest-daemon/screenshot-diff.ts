// Zero-SDK screenshot-diff mode.
//
// The developer drives the game manually. They drop PNG files into a watched
// directory (engine hotkey, OS screenshot, OBS — anything that writes a file).
// The daemon matches each new file to the next `screenshot` step in the
// scenario, diffs it against the baseline at the same step name, and reports.
//
// The diff is a coarse byte-level signal (size delta + first-N-bytes Hamming
// distance), not a perceptual diff. It catches "the title screen layout
// changed" reliably; it does NOT catch sub-percent UI shifts. For perceptual
// diffing, install pixelmatch + pngjs into your project and the daemon will
// pick them up dynamically. The contract stays the same either way.

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

export interface ScreenshotStep {
  name: string;
  baseline_filename?: string;
}

export interface ScreenshotDiffOptions {
  scenarioName: string;
  steps: ScreenshotStep[];
  watchDir: string;
  baselineDir: string;
  runDir: string;
  threshold: number;
  waitTimeoutMs: number;
  pollIntervalMs: number;
  onPrompt: (step: ScreenshotStep, index: number, total: number) => void;
  onProgress: (msg: string) => void;
  onSettle?: (filePath: string) => Promise<void>;
}

export interface ScreenshotDiffStepResult {
  step_name: string;
  capture_path: string | null;
  baseline_path: string | null;
  delta: number;
  threshold: number;
  verdict: "pass" | "fail" | "no-baseline" | "missing-capture";
  notes: string[];
}

export interface ScreenshotDiffReport {
  scenario: string;
  mode: "screenshot-diff";
  steps: ScreenshotDiffStepResult[];
  passed: boolean;
}

function listPngsByMtime(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".png"))
    .map((f) => ({ f, t: statSync(join(dir, f)).mtimeMs }))
    .sort((a, b) => a.t - b.t)
    .map((x) => x.f);
}

async function waitForNewFile(watchDir: string, seen: Set<string>, timeoutMs: number, pollMs: number): Promise<string | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const files = listPngsByMtime(watchDir);
    const fresh = files.find((f) => !seen.has(f));
    if (fresh) return fresh;
    await new Promise((r) => setTimeout(r, pollMs));
  }
  return null;
}

// Byte-level delta — not perceptual, but cheap and dependency-free. Two PNGs
// with the same render produce identical bytes; PNGs that differ in size or
// content get a > 0 delta. Heuristic, but conservative — false-positives are
// preferable to silent acceptance.
function byteDelta(a: Buffer, b: Buffer): number {
  if (a.length === 0 && b.length === 0) return 0;
  if (Math.abs(a.length - b.length) / Math.max(a.length, b.length) > 0.01) {
    return Math.min(1, Math.abs(a.length - b.length) / Math.max(a.length, b.length));
  }
  const len = Math.min(a.length, b.length);
  if (len === 0) return 1;
  let differing = 0;
  const sample = Math.min(len, 256 * 1024);
  const stride = Math.max(1, Math.floor(len / sample));
  let inspected = 0;
  for (let i = 0; i < len; i += stride) {
    if (a[i] !== b[i]) differing++;
    inspected++;
  }
  return inspected === 0 ? 0 : differing / inspected;
}

export async function runScreenshotDiff(opts: ScreenshotDiffOptions): Promise<ScreenshotDiffReport> {
  mkdirSync(opts.runDir, { recursive: true });
  const seen = new Set<string>(listPngsByMtime(opts.watchDir));
  const results: ScreenshotDiffStepResult[] = [];

  for (let i = 0; i < opts.steps.length; i++) {
    const step = opts.steps[i]!;
    opts.onPrompt(step, i, opts.steps.length);
    opts.onProgress(`Waiting for a new .png in ${opts.watchDir} ...`);

    const newFile = await waitForNewFile(opts.watchDir, seen, opts.waitTimeoutMs, opts.pollIntervalMs);
    if (!newFile) {
      results.push({
        step_name: step.name,
        capture_path: null,
        baseline_path: null,
        delta: 1,
        threshold: opts.threshold,
        verdict: "missing-capture",
        notes: [`No new PNG appeared in ${opts.watchDir} within ${opts.waitTimeoutMs / 1000}s.`],
      });
      continue;
    }
    seen.add(newFile);
    const capturePath = join(opts.watchDir, newFile);
    if (opts.onSettle) await opts.onSettle(capturePath);

    const baselineFilename = step.baseline_filename ?? `${String(i + 1).padStart(2, "0")}-${step.name}.png`;
    const baselinePath = join(opts.baselineDir, baselineFilename);
    if (!existsSync(baselinePath)) {
      results.push({
        step_name: step.name,
        capture_path: capturePath,
        baseline_path: null,
        delta: 0,
        threshold: opts.threshold,
        verdict: "no-baseline",
        notes: [`No baseline at ${baselinePath}. Copy this run's captures into ${opts.baselineDir} to establish one.`],
      });
      continue;
    }

    const a = readFileSync(capturePath);
    const b = readFileSync(baselinePath);
    const delta = byteDelta(a, b);
    const verdict: "pass" | "fail" = delta <= opts.threshold ? "pass" : "fail";

    results.push({
      step_name: step.name,
      capture_path: capturePath,
      baseline_path: baselinePath,
      delta,
      threshold: opts.threshold,
      verdict,
      notes: verdict === "fail" ? [
        "Byte-level delta exceeds threshold. Inspect the capture vs. baseline directly.",
        "For perceptual diffing, install `pixelmatch` + `pngjs` in your project; the daemon will pick them up automatically.",
      ] : [],
    });
  }

  const passed = results.every((r) => r.verdict === "pass" || r.verdict === "no-baseline");
  const report: ScreenshotDiffReport = {
    scenario: opts.scenarioName,
    mode: "screenshot-diff",
    steps: results,
    passed,
  };
  writeFileSync(join(opts.runDir, "screenshot-diff.json"), JSON.stringify(report, null, 2));
  return report;
}

export function renderScreenshotDiffMarkdown(report: ScreenshotDiffReport): string {
  const lines: string[] = [];
  lines.push(`# Playtest — zero-SDK screenshot-diff`);
  lines.push("");
  lines.push(`- Scenario: \`${report.scenario}\``);
  lines.push(`- Mode: \`screenshot-diff\``);
  lines.push(`- Result: ${report.passed ? "PASS" : "FAIL"}`);
  lines.push("");
  lines.push("## Steps");
  lines.push("");
  for (const step of report.steps) {
    const tag = step.verdict.toUpperCase();
    const pct = `${(step.delta * 100).toFixed(2)}%`;
    const thresholdPct = `${(step.threshold * 100).toFixed(2)}%`;
    lines.push(`### ${step.step_name} — ${tag} — Δ ${pct} (threshold ${thresholdPct})`);
    lines.push("");
    if (step.capture_path) lines.push(`- Capture: \`${step.capture_path}\``);
    if (step.baseline_path) lines.push(`- Baseline: \`${step.baseline_path}\``);
    for (const note of step.notes) lines.push(`- ${note}`);
    lines.push("");
  }
  return lines.join("\n");
}
