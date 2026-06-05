#!/usr/bin/env bun
import { existsSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { resolve, join } from "node:path";
import { ArgError, parseArgv, parseCommonOptions } from "../shared/args.ts";
import { GAMESTACK_CLI_VERSION } from "../shared/version.ts";
import { emitReport } from "../shared/report.ts";
import { aggregate, type FeedbackEntry, type Aggregate } from "./aggregate.ts";
import { renderMarkdown } from "./render.ts";

const HELP = `gamestack-skill-feedback — aggregate /skill-feedback log into per-skill useful-rates

Usage:
  gamestack-skill-feedback [options]

Reads .gamestack/skill-feedback.jsonl from the project (and optionally
~/.gamestack/skill-feedback.jsonl), groups entries by skill, and reports:
  - useful-rate per skill (useful / total)
  - top reasons for not-useful verdicts
  - newest and oldest entries per skill

Local-only. No network. No transmission.

Options:
  --project <path>       Project root (default: cwd). Reads <project>/.gamestack/skill-feedback.jsonl.
  --include-global       Also include ~/.gamestack/skill-feedback.jsonl (unscoped entries).
  --window <duration>    Only include entries within the window (e.g. 7d, 30d, 90d, all). Default: 30d.
  --skill <name>         Restrict the report to a single skill.
  --format <md|json|both> Output format (default: md).
  --out <path>           Write report to <path>. Without --out, stdout.
  -h, --help             Show this help.
  -v, --version          Print version.

Exit codes:
  0   Report produced (even if empty).
  1   No matching entries found (when --skill specified and that skill has no entries).
  2   Invalid args or unreadable log.
  127 bun not installed.

Examples:
  gamestack-skill-feedback                              # last 30 days for this project
  gamestack-skill-feedback --window=90d --include-global
  gamestack-skill-feedback --skill critique --format=json --out=critique-feedback.json
`;

function parseWindow(raw: string): number | "all" {
  if (raw === "all") return "all";
  const m = raw.match(/^(\d+)d$/);
  if (!m) throw new ArgError(`--window must be 'all' or '<N>d' (got '${raw}')`);
  return Number(m[1]) * 24 * 60 * 60 * 1000;
}

function loadEntries(path: string): FeedbackEntry[] {
  if (!existsSync(path)) return [];
  if (!statSync(path).isFile()) return [];
  const raw = readFileSync(path, "utf8");
  const entries: FeedbackEntry[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed.skill === "string" && typeof parsed.verdict === "string" && typeof parsed.at === "string") {
        entries.push(parsed as FeedbackEntry);
      }
    } catch {
      // Skip malformed lines; the log is append-only and a partial write would only affect one entry.
    }
  }
  return entries;
}

async function main(argv: string[]): Promise<number> {
  let parsed;
  try {
    parsed = parseArgv(argv, ["include-global"]);
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
    process.stdout.write(`gamestack-skill-feedback ${GAMESTACK_CLI_VERSION}\n`);
    return 0;
  }

  let window: number | "all";
  try {
    window = parseWindow(parsed.get("window") ?? "30d");
  } catch (err) {
    if (err instanceof ArgError) {
      process.stderr.write(`error: ${err.message}\n\n${HELP}`);
      return 2;
    }
    throw err;
  }

  const projectRoot = resolve(common.project);
  const projectLog = join(projectRoot, ".gamestack", "skill-feedback.jsonl");
  const globalLog = join(homedir(), ".gamestack", "skill-feedback.jsonl");
  const includeGlobal = parsed.has("include-global");

  const allEntries: FeedbackEntry[] = [
    ...loadEntries(projectLog),
    ...(includeGlobal ? loadEntries(globalLog) : []),
  ];

  const skillFilter = parsed.get("skill");

  const cutoff = window === "all" ? 0 : Date.now() - window;
  const filtered = allEntries.filter((e) => {
    const t = Date.parse(e.at);
    if (Number.isNaN(t)) return false;
    if (t < cutoff) return false;
    if (skillFilter && e.skill !== skillFilter) return false;
    return true;
  });

  const summary: Aggregate = aggregate(filtered);
  summary.window = window === "all" ? "all" : `${window / (24 * 60 * 60 * 1000)}d`;
  summary.project = projectRoot;
  summary.sources = [
    projectLog,
    ...(includeGlobal ? [globalLog] : []),
  ];

  const markdown = renderMarkdown(summary);
  emitReport({ markdown, json: summary }, { format: common.format, out: common.out });

  if (skillFilter && summary.skills.length === 0) return 1;
  return 0;
}

main(process.argv.slice(2))
  .then((code) => process.exit(code))
  .catch((err) => {
    process.stderr.write(`fatal: ${(err as Error).stack ?? err}\n`);
    process.exit(2);
  });
