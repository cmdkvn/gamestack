#!/usr/bin/env bun
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { ArgError, parseArgv, parseCommonOptions } from "../shared/args.ts";
import { GAMESTACK_CLI_VERSION } from "../shared/version.ts";
import { defaultReportPath, emitReport } from "../shared/report.ts";
import { runCertCheck } from "./check.ts";
import { renderMarkdown } from "./render.ts";
import type { Engine } from "../shared/engine.ts";
import type { Platform } from "../shared/cert-categories.ts";

const PLATFORM_KEYS: ReadonlyArray<Platform> = ["ps5", "xbox", "switch"];

const HELP = `gamestack-cert-checklist — platform cert readiness checklist

Usage:
  gamestack-cert-checklist --platform <ps5|xbox|switch|all> [options]

This CLI walks the high-failure-rate categories from PS5 TRC, Xbox TCR/XR, and
Switch lotcheck, looks for code/config evidence in the project, and emits a per-
platform verdict (PASS / PASS_CODE_ONLY / NEEDS_LIVE_TEST / FAIL_P0 / FAIL_P1 / N/A).

It is NOT a substitute for the NDA-protected checklist. The CLI emits a reminder
to download the current checklist from the platform's developer portal before
submission.

Required:
  --platform <name>       ps5, xbox, switch, or all (comma-separated list supported).

Options:
  --project <path>        Project root (default: current working directory).
  --format <md|json|both> Output format (default: md).
  --out <path>            Write report to <path>. Without --out the report goes to stdout.
  --engine <name>         Override engine detection (unity, godot, unreal, gamemaker, bevy, web).
  --strict                Exit non-zero on FAIL_P1 as well as FAIL_P0 (default: P0 only).
  -h, --help              Show this help.
  -v, --version           Print version.

Exit codes:
  0   No FAIL_P0 (and no FAIL_P1 in --strict mode).
  1   FAIL_P0 present (or FAIL_P1 in --strict mode).
  2   Invalid args or unreadable project.

Examples:
  # Audit a Unity project for all three consoles.
  gamestack-cert-checklist --project ./games/bridge-keeper --platform all

  # CI gate before cert submission.
  gamestack-cert-checklist --project . --platform switch --format json --out cert.json --strict
`;

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
    process.stdout.write(`gamestack-cert-checklist ${GAMESTACK_CLI_VERSION}\n`);
    return 0;
  }

  const platformArg = parsed.get("platform");
  if (!platformArg) {
    process.stderr.write("error: --platform is required\n\n");
    process.stderr.write(HELP);
    return 2;
  }
  const platforms = parsePlatformArg(platformArg);
  if (platforms === null) {
    process.stderr.write(
      `error: --platform must be one of ${PLATFORM_KEYS.join(", ")} or 'all' (or a comma-separated list). Got '${platformArg}'.\n`,
    );
    return 2;
  }

  const projectRoot = resolve(common.project);
  if (!existsSync(projectRoot) || !statSync(projectRoot).isDirectory()) {
    process.stderr.write(`error: --project is not a directory: ${projectRoot}\n`);
    return 2;
  }

  const engineOverride = parsed.get("engine");
  if (engineOverride && !["unity", "godot", "unreal", "gamemaker", "bevy", "web", "unknown"].includes(engineOverride)) {
    process.stderr.write(`error: unknown engine '${engineOverride}'\n`);
    return 2;
  }

  const report = runCertCheck({
    projectRoot,
    platforms,
    engineHint: engineOverride as Engine | undefined,
  });

  const markdown = renderMarkdown(report);
  const defaultJsonPath = defaultReportPath(projectRoot, "playtest/cert-readiness", "cert-checklist", "json");

  emitReport({ markdown, json: report }, { format: common.format, out: common.out, defaultJsonPath });

  const isStrict = parsed.has("strict");
  let failing = 0;
  for (const pr of report.platforms) {
    failing += pr.counts.FAIL_P0;
    if (isStrict) failing += pr.counts.FAIL_P1;
  }
  return failing > 0 ? 1 : 0;
}

function parsePlatformArg(arg: string): Platform[] | null {
  const lower = arg.toLowerCase();
  if (lower === "all") return [...PLATFORM_KEYS];
  const parts = lower.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
  const result: Platform[] = [];
  for (const p of parts) {
    if (PLATFORM_KEYS.includes(p as Platform)) {
      if (!result.includes(p as Platform)) result.push(p as Platform);
    } else {
      return null;
    }
  }
  return result.length > 0 ? result : null;
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (err) => {
    process.stderr.write(`error: ${(err as Error).stack ?? err}\n`);
    process.exit(2);
  },
);
