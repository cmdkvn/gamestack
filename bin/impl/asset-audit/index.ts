#!/usr/bin/env bun
import { existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { ArgError, parseArgv, parseCommonOptions } from "../shared/args.ts";
import { GAMESTACK_CLI_VERSION } from "../shared/version.ts";
import {
  listAliases,
  listPlatforms,
  resolvePlatform,
} from "../shared/platforms.ts";
import { detectEngine } from "../shared/engine.ts";
import { defaultReportPath, emitReport } from "../shared/report.ts";
import { runAssetAudit } from "./audit.ts";
import { renderMarkdown } from "./render.ts";

const HELP = `gamestack-asset-audit — per-platform asset budget audit

Usage:
  gamestack-asset-audit --platform <name> [options]

Required:
  --platform <name>       Target platform. One of:
                            ${listPlatforms().join(", ")}
                          Aliases: ${Object.entries(listAliases()).map(([k, v]) => `${k}->${v}`).join(", ")}

Options:
  --project <path>        Project root (default: current working directory).
  --format <md|json|both> Output format (default: md). 'both' writes <out>.md + <out>.json
                          and prints markdown to stdout when --out is omitted.
  --out <path>            Write report to <path>. Without --out the report goes to stdout
                          (and when --format=both, the JSON sibling lands in
                          <project>/playtest/asset-audit/asset-audit-YYYY-MM-DD.json).
  --engine <name>         Override engine detection (unity, godot, unreal, gamemaker, bevy, web).
  --strict                Exit non-zero on P0 or P1 findings (default exits non-zero on P0 only).
  -h, --help              Show this help.
  -v, --version           Print version.

Exit codes:
  0   No findings above the failure threshold.
  1   Findings at or above the failure threshold (--strict raises threshold to P1).
  2   Invalid args or unreadable project.

Examples:
  # Audit a Unity project for Switch handheld budgets.
  gamestack-asset-audit --project ./games/bridge-keeper --platform switch-handheld

  # Run in CI, fail on P0+P1.
  gamestack-asset-audit --project . --platform pc-mid --format json --out report.json --strict

This CLI wraps the same lens as the interactive /asset-audit skill (Technical Artist).
For deeper engine-specific analysis (atlas packing, importer settings) use the skill.
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
    process.stdout.write(`gamestack-asset-audit ${GAMESTACK_CLI_VERSION}\n`);
    return 0;
  }

  const platformArg = parsed.get("platform");
  if (!platformArg) {
    process.stderr.write("error: --platform is required\n\n");
    process.stderr.write(HELP);
    return 2;
  }
  const platform = resolvePlatform(platformArg);
  if (!platform) {
    process.stderr.write(
      `error: unknown platform '${platformArg}'.\n  Known: ${listPlatforms().join(", ")}\n  Aliases: ${Object.keys(listAliases()).join(", ")}\n`,
    );
    return 2;
  }

  const projectRoot = resolve(common.project);
  if (!existsSync(projectRoot)) {
    process.stderr.write(`error: project root does not exist: ${projectRoot}\n`);
    return 2;
  }
  let st;
  try {
    st = statSync(projectRoot);
  } catch (err) {
    process.stderr.write(`error: cannot stat project root: ${(err as Error).message}\n`);
    return 2;
  }
  if (!st.isDirectory()) {
    process.stderr.write(`error: --project is not a directory: ${projectRoot}\n`);
    return 2;
  }

  const engineOverride = parsed.get("engine");
  if (engineOverride && !["unity", "godot", "unreal", "gamemaker", "bevy", "web", "unknown"].includes(engineOverride)) {
    process.stderr.write(`error: unknown engine '${engineOverride}'\n`);
    return 2;
  }

  const report = runAssetAudit({
    projectRoot,
    platformKey: platform.key,
    budget: platform.budget,
    engineHint: engineOverride as ReturnType<typeof detectEngine> | undefined,
  });

  const markdown = renderMarkdown(report);
  const defaultJsonPath = defaultReportPath(projectRoot, "playtest/asset-audit", "asset-audit", "json");

  emitReport(
    { markdown, json: report },
    { format: common.format, out: common.out, defaultJsonPath },
  );

  const isStrict = parsed.has("strict");
  const threshold = isStrict ? 2 : 1;
  const failing = report.findings.filter((f) => severityOrdinal(f.severity) < threshold).length;
  if (failing > 0) return 1;
  return 0;
}

function severityOrdinal(s: string): number {
  switch (s) {
    case "P0": return 0;
    case "P1": return 1;
    case "P2": return 2;
    case "INFO": return 3;
    default: return 4;
  }
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (err) => {
    process.stderr.write(`error: ${(err as Error).stack ?? err}\n`);
    process.exit(2);
  },
);
