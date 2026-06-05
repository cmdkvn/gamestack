#!/usr/bin/env bun
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { ArgError, parseArgv, parseCommonOptions } from "../shared/args.ts";
import { GAMESTACK_CLI_VERSION } from "../shared/version.ts";
import { defaultReportPath, emitReport } from "../shared/report.ts";
import { runLint } from "./lint.ts";
import { renderMarkdown } from "./render.ts";

const HELP = `gamestack-skill-lint — regression validator for SKILL.md files + scenario JSON

Usage:
  gamestack-skill-lint [--gamestack <path>] [options]

Walks the gamestack repo and validates every SKILL.md (frontmatter, required sections,
cross-link integrity) plus every playtest scenario JSON (schema, known step types).
Also catches the README-inside-.claude-dirs trap.

Options:
  --gamestack <path>   Gamestack repo root (default: cwd if it looks like one,
                       otherwise auto-detect from this CLI's install location).
  --format <md|json|both>  Output format (default: md).
  --out <path>         Write report to <path>. Without --out, stdout.
  --warn-as-error      Exit 1 on WARNs as well as ERRORs (default: ERRORs only).
  -h, --help           Show this help.
  -v, --version        Print version.

Exit codes:
  0   No findings above threshold.
  1   At least one finding above threshold (CI fail).
  2   Invalid args or unreachable repo.
  127 bun not installed.

Examples:
  # From inside the gamestack repo.
  gamestack-skill-lint

  # CI gate with strictest threshold.
  gamestack-skill-lint --warn-as-error --format json --out lint.json
`;

async function main(argv: string[]): Promise<number> {
  let parsed;
  try {
    parsed = parseArgv(argv, ["warn-as-error"]);
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
    process.stdout.write(`gamestack-skill-lint ${GAMESTACK_CLI_VERSION}\n`);
    return 0;
  }

  const gamestackArg = parsed.get("gamestack");
  const gamestackRoot = gamestackArg
    ? resolve(gamestackArg)
    : detectGamestackRoot(process.cwd()) ?? resolve(import.meta.dir, "../../..");

  if (!existsSync(gamestackRoot) || !statSync(gamestackRoot).isDirectory()) {
    process.stderr.write(`error: gamestack root not found: ${gamestackRoot}\n`);
    return 2;
  }
  if (!existsSync(`${gamestackRoot}/skills`)) {
    process.stderr.write(`error: ${gamestackRoot} does not contain a skills/ directory\n`);
    return 2;
  }

  const report = runLint({ gamestackRoot, warnAsError: parsed.has("warn-as-error") });

  const markdown = renderMarkdown(report);
  const defaultJsonPath = defaultReportPath(gamestackRoot, "playtest/skill-lint", "skill-lint", "json");
  emitReport({ markdown, json: report }, { format: common.format, out: common.out, defaultJsonPath });

  return report.passed ? 0 : 1;
}

function detectGamestackRoot(start: string): string | null {
  let cur = start;
  for (let i = 0; i < 8; i++) {
    if (existsSync(`${cur}/skills`) && existsSync(`${cur}/setup`)) return cur;
    const parent = resolve(cur, "..");
    if (parent === cur) break;
    cur = parent;
  }
  return null;
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (err) => {
    process.stderr.write(`error: ${(err as Error).stack ?? err}\n`);
    process.exit(2);
  },
);
