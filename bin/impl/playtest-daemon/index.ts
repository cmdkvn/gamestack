#!/usr/bin/env bun
import { existsSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { ArgError, parseArgv, parseCommonOptions } from "../shared/args.ts";
import { GAMESTACK_CLI_VERSION } from "../shared/version.ts";
import { emitReport } from "../shared/report.ts";
import { loadScenario, runScenario } from "./runner.ts";
import { renderMarkdown } from "./render.ts";
import { renderScreenshotDiffMarkdown, runScreenshotDiff, type ScreenshotStep } from "./screenshot-diff.ts";

const HELP = `gamestack-playtest-daemon — broker between Claude Code and a running engine build

Usage:
  gamestack-playtest-daemon --scenario <path> [options]

Loads a scenario JSON (schema documented at gamestack/skills/playtest/scenarios/README.md),
connects to the engine SDK at \`<endpoint>\`, executes setup → steps → teardown,
and records a per-step run log to <run-dir>/run.json. Exits non-zero on any
failed assertion or timeout in setup/steps; teardown failures don't fail the run.

Required:
  --scenario <path>       Scenario JSON file.

Options:
  --mode <sdk|screenshot-diff>
                          Default 'sdk' (uses the engine SDK endpoint). 'screenshot-diff'
                          is zero-SDK: watches a directory for PNG files the developer
                          drops there manually and diffs each against a baseline.
  --watch-dir <path>      (screenshot-diff) Directory to watch for new PNGs.
                          Default: <project>/playtest/screenshots/.
  --baseline-dir <path>   (screenshot-diff) Baseline directory.
                          Default: <project>/playtest/baseline/<scenario>/.
  --threshold <0..1>      (screenshot-diff) Byte-delta threshold above which a step fails.
                          Default: 0.05 (5%).
  --wait-timeout <s>      (screenshot-diff) Seconds to wait for a new PNG per step.
                          Default: 120.
  --endpoint <url>        (sdk mode) Override scenario.endpoint.
  --engine <unity|godot>  (sdk mode) Sets default port (7331 / 7332).
  --run-dir <path>        Where to write run.json + screenshots
                          (default: <project>/playtest/playtest-<scenario>-<ts>/).
  --project <path>        Project root (default: cwd).
  --format <md|json|both> Output format for the summary report (default: md).
  --out <path>            Write summary report to this path. Without --out, stdout.
  --continue-on-failure   (sdk mode) Override scenario default to continue after step failures.
  -h, --help              Show this help.
  -v, --version           Print version.

Exit codes:
  0   Scenario passed.
  1   Scenario failed (assertion / timeout) or duration budget exceeded.
  2   Invalid args, malformed scenario, or unreadable file.
  127 bun not installed.

Examples:
  gamestack-playtest-daemon --scenario skills/playtest/scenarios/00-sdk-smoke.json
  gamestack-playtest-daemon --scenario my-scenario.json --engine godot --format json --out run.json
`;

interface ScenarioStepLike {
  type: string;
  name?: string;
  label?: string;
  step?: string;
  baseline_filename?: string;
}

function extractScreenshotSteps(scenario: { steps?: ScenarioStepLike[] }): ScreenshotStep[] {
  const out: ScreenshotStep[] = [];
  let n = 0;
  for (const s of scenario.steps ?? []) {
    if (s.type === "screenshot") {
      n++;
      out.push({
        name: s.name ?? s.label ?? s.step ?? `screenshot-${String(n).padStart(2, "0")}`,
        baseline_filename: s.baseline_filename,
      });
    }
  }
  return out;
}

async function main(argv: string[]): Promise<number> {
  let parsed;
  try {
    parsed = parseArgv(argv, ["continue-on-failure"]);
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
    process.stdout.write(`gamestack-playtest-daemon ${GAMESTACK_CLI_VERSION}\n`);
    return 0;
  }

  const scenarioPath = parsed.get("scenario");
  if (!scenarioPath) {
    process.stderr.write("error: --scenario is required\n\n");
    process.stderr.write(HELP);
    return 2;
  }
  const scenarioAbs = resolve(scenarioPath);
  if (!existsSync(scenarioAbs) || !statSync(scenarioAbs).isFile()) {
    process.stderr.write(`error: scenario file not found: ${scenarioAbs}\n`);
    return 2;
  }

  let scenario;
  try {
    scenario = loadScenario(scenarioAbs);
  } catch (err) {
    process.stderr.write(`error: ${(err as Error).message}\n`);
    return 2;
  }
  if (parsed.has("continue-on-failure")) scenario.continue_on_failure = true;

  const engineRaw = parsed.get("engine");
  const engine = engineRaw && (engineRaw === "unity" || engineRaw === "godot") ? engineRaw : "unity";

  const projectRoot = resolve(common.project);

  const slug = scenario.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = parsed.get("run-dir")
    ? resolve(parsed.get("run-dir")!)
    : join(projectRoot, "playtest", `playtest-${slug}-${ts}`);

  const mode = parsed.get("mode") ?? "sdk";
  if (mode !== "sdk" && mode !== "screenshot-diff") {
    process.stderr.write(`error: --mode must be 'sdk' or 'screenshot-diff' (got '${mode}')\n`);
    return 2;
  }

  if (mode === "screenshot-diff") {
    const watchDir = resolve(parsed.get("watch-dir") ?? join(projectRoot, "playtest", "screenshots"));
    const baselineDir = resolve(
      parsed.get("baseline-dir") ?? join(projectRoot, "playtest", "baseline", slug),
    );
    const threshold = Number(parsed.get("threshold") ?? "0.05");
    if (!(threshold >= 0 && threshold <= 1)) {
      process.stderr.write(`error: --threshold must be in [0, 1] (got '${threshold}')\n`);
      return 2;
    }
    const waitTimeoutS = Number(parsed.get("wait-timeout") ?? "120");
    const steps = extractScreenshotSteps(scenario as { steps?: ScenarioStepLike[] });
    if (steps.length === 0) {
      process.stderr.write(
        `error: scenario '${scenario.name}' has no 'screenshot' steps. ` +
          `Add at least one screenshot step before using --mode=screenshot-diff.\n`,
      );
      return 2;
    }
    const report = await runScreenshotDiff({
      scenarioName: scenario.name,
      steps,
      watchDir,
      baselineDir,
      runDir,
      threshold,
      waitTimeoutMs: waitTimeoutS * 1000,
      pollIntervalMs: 500,
      onPrompt: (step, i, total) => {
        process.stdout.write(`\nStep ${i + 1} of ${total} — ${step.name}\n`);
        process.stdout.write(`  When this step's frame is on screen, drop a PNG into ${watchDir}\n`);
      },
      onProgress: (msg) => {
        process.stdout.write(`  · ${msg}\n`);
      },
    });
    const markdown = renderScreenshotDiffMarkdown(report);
    writeFileSync(join(runDir, "summary.md"), markdown);
    const defaultJsonPath = join(runDir, "summary.json");
    emitReport({ markdown, json: report }, { format: common.format, out: common.out, defaultJsonPath });
    return report.passed ? 0 : 1;
  }

  const report = await runScenario({
    scenario,
    runDir,
    endpoint: parsed.get("endpoint") ?? undefined,
    engine,
  });

  const markdown = renderMarkdown(report);
  const defaultJsonPath = join(runDir, "summary.json");
  // Always persist a copy alongside run.json for easier human inspection.
  writeFileSync(join(runDir, "summary.md"), markdown);
  emitReport({ markdown, json: report }, { format: common.format, out: common.out, defaultJsonPath });

  return report.passed ? 0 : 1;
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (err) => {
    process.stderr.write(`error: ${(err as Error).stack ?? err}\n`);
    process.exit(2);
  },
);
