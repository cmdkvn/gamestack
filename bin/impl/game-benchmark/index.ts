#!/usr/bin/env bun
import { resolve } from "node:path";
import { ArgError, parseArgv, parseCommonOptions } from "../shared/args.ts";
import { GAMESTACK_CLI_VERSION } from "../shared/version.ts";
import { defaultReportPath, emitReport } from "../shared/report.ts";
import { loadBaseline, runBenchmark } from "./benchmark.ts";
import { renderMarkdown } from "./render.ts";

const HELP = `gamestack-game-benchmark — cross-engine perf snapshot

Usage:
  gamestack-game-benchmark --scenario <name> [options]

Polls the gamestack engine SDK at \`GET /state\` for a fixed duration, collects
FPS / frame time / draw calls / GC alloc / memory peak, and diffs against a
baseline file (if provided). Regressions exit non-zero so CI can gate on perf.

Default endpoint:
  http://localhost:7331   (Unity SDK)
  http://localhost:7332   (--engine godot)

Required:
  --scenario <name>       Tag for the snapshot (e.g., "level1-walk-loop").

Options:
  --endpoint <url>        Engine SDK endpoint (default: derived from --engine).
  --engine <unity|godot>  Sets default port if --endpoint is omitted (default: unity).
  --platform <name>       Tag for the report (e.g., "pc-mid", "switch-handheld").
  --duration <seconds>    Capture duration (default: 60).
  --interval-ms <n>       Sample interval (default: 100ms).
  --baseline <path>       Baseline JSON to compare against (typically a previous report's JSON).
  --format <md|json|both> Output format (default: md).
  --out <path>            Write report to <path>. Without --out the report goes to stdout.
  --strict                Exit 1 on any regression (default: exit 1 only on FPS / frame-time / memory regressions).
  -h, --help              Show this help.
  -v, --version           Print version.

Exit codes:
  0   No regressions above threshold.
  1   Regressions detected.
  2   Invalid args.
  127 bun not installed.

Examples:
  gamestack-game-benchmark --scenario level1-walk --duration 60
  gamestack-game-benchmark --scenario combat --engine godot --baseline baselines/combat.json --format json --out perf.json
`;

const STRICT_REGRESSION_METRICS = new Set([
  "Avg FPS",
  "99th-pct frame time (ms)",
  "Peak memory (MB)",
  "Draw calls / frame",
  "GC alloc / frame (bytes)",
]);

const DEFAULT_REGRESSION_METRICS = new Set(["Avg FPS", "99th-pct frame time (ms)", "Peak memory (MB)"]);

async function main(argv: string[]): Promise<number> {
  let parsed;
  try {
    parsed = parseArgv(argv, ["strict"]);
  } catch (err) {
    process.stderr.write(`error: ${(err as Error).message}\n`);
    return 2;
  }

  let common;
  try {
    common = parseCommonOptions(parsed);
  } catch (err) {
    if (err instanceof ArgError) {
      process.stderr.write(`error: ${err.message}\n\n${HELP}`);
      return 2;
    }
    throw err;
  }

  if (common.showHelp) {
    process.stdout.write(HELP);
    return 0;
  }
  if (common.showVersion) {
    process.stdout.write(`gamestack-game-benchmark ${GAMESTACK_CLI_VERSION}\n`);
    return 0;
  }

  const scenario = parsed.get("scenario");
  if (!scenario) {
    process.stderr.write("error: --scenario is required\n\n");
    process.stderr.write(HELP);
    return 2;
  }

  const engine = (parsed.get("engine") ?? "unity").toLowerCase();
  if (engine !== "unity" && engine !== "godot") {
    process.stderr.write(`error: --engine must be 'unity' or 'godot' (got '${engine}')\n`);
    return 2;
  }
  const endpoint = parsed.get("endpoint") ?? (engine === "godot" ? "http://localhost:7332" : "http://localhost:7331");

  const durationSeconds = Number(parsed.get("duration") ?? "60");
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    process.stderr.write("error: --duration must be a positive number\n");
    return 2;
  }
  const intervalMs = Number(parsed.get("interval-ms") ?? "100");
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
    process.stderr.write("error: --interval-ms must be a positive number\n");
    return 2;
  }

  const platform = parsed.get("platform") ?? "(unspecified)";

  let baseline = undefined;
  const baselinePath = parsed.get("baseline");
  if (baselinePath) {
    baseline = loadBaseline(resolve(baselinePath)) ?? undefined;
    if (!baseline) {
      process.stderr.write(`warning: baseline file not readable: ${baselinePath}\n`);
    }
  }

  const report = await runBenchmark({
    endpoint,
    durationSeconds,
    intervalMs,
    scenario,
    platform,
    baseline,
  });

  const markdown = renderMarkdown(report);
  const defaultJsonPath = defaultReportPath(process.cwd(), "playtest/perf-benchmark", `bench-${scenario}`, "json");
  emitReport({ markdown, json: report }, { format: common.format, out: common.out, defaultJsonPath });

  const strict = parsed.has("strict");
  const failureSet = strict ? STRICT_REGRESSION_METRICS : DEFAULT_REGRESSION_METRICS;
  const failing = report.regressions.filter((r) => failureSet.has(r.metric)).length;
  return failing > 0 ? 1 : 0;
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (err) => {
    process.stderr.write(`error: ${(err as Error).stack ?? err}\n`);
    process.exit(2);
  },
);
