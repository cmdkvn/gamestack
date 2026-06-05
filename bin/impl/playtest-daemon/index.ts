#!/usr/bin/env bun
import { existsSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { ArgError, parseArgv, parseCommonOptions } from "../shared/args.ts";
import { GAMESTACK_CLI_VERSION } from "../shared/version.ts";
import { emitReport } from "../shared/report.ts";
import { loadScenario, runScenario } from "./runner.ts";
import { renderMarkdown } from "./render.ts";

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
  --endpoint <url>        Override scenario.endpoint.
  --engine <unity|godot>  Sets default port (7331 for unity, 7332 for godot) when no endpoint is set.
  --run-dir <path>        Where to write run.json + screenshots
                          (default: <project>/playtest/playtest-<scenario>-<ts>/).
  --project <path>        Project root (default: cwd).
  --format <md|json|both> Output format for the summary report (default: md).
  --out <path>            Write summary report to this path. Without --out, stdout.
  --continue-on-failure   Override scenario default to continue after step failures.
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
