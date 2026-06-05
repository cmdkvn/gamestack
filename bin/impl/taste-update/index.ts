#!/usr/bin/env bun
import { existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { ArgError, parseArgv, parseCommonOptions } from "../shared/args.ts";
import { GAMESTACK_CLI_VERSION } from "../shared/version.ts";
import { emitReport } from "../shared/report.ts";
import {
  applyDecay,
  emptyProfile,
  loadProfile,
  readEvents,
  recordEvents,
  saveProfile,
  type ApprovalEvent,
} from "./profile.ts";
import { renderMarkdown } from "./render.ts";

const HELP = `gamestack-taste-update — persist /art-shotgun approvals into a project taste profile

Usage:
  gamestack-taste-update [--profile <path>] (--record <events.json> | --show | --decay)

Operates on a JSON taste profile (default: <project>/.gamestack/taste.json). The profile
accumulates per-axis wins/losses across /art-shotgun rounds and surfaces emerging signals
(e.g., "lighting: 'backlit' wins (83% over 6 samples)") that the next round can incorporate.

Required (exactly one):
  --record <path>     Append approval events from <path>. Format: a single ApprovalEvent
                      object, an array of them, or NDJSON (one per line).
  --show              Print the current profile (no mutation).
  --decay             Apply time-based decay (halflife 90 days by default) so older
                      preferences fade in favor of recent ones.

Options:
  --project <path>     Project root (default: cwd). Used to locate .gamestack/.
  --profile <path>     Explicit path to taste.json (overrides --project derivation).
  --format <md|json|both>  Output format for the report (default: md).
  --out <path>         Write report to <path>. Without --out, prints to stdout.
  --halflife-days <n>  Decay half-life (default 90; only used with --decay).
  --dry-run            Show what would change without writing the profile back.
  -h, --help           Show this help.
  -v, --version        Print version.

ApprovalEvent shape:
  {
    "subject": "key art — lighthouse keeper",
    "round": 2,
    "date": "2026-06-04",
    "variant": "V3",
    "axisVaried": "lighting",
    "axisValue": "backlit",
    "outcome": "KEEP" | "DISCARD" | "MIX_IN",
    "confidence": "high" | "medium" | "low",   // optional
    "notes": "Rim lighting reads from thumbnail size"
  }

Exit codes:
  0   Success.
  2   Invalid args or malformed event file.

Examples:
  gamestack-taste-update --record approvals.ndjson
  gamestack-taste-update --show --format json --out taste.json
  gamestack-taste-update --decay --halflife-days 60
`;

async function main(argv: string[]): Promise<number> {
  let parsed;
  try {
    parsed = parseArgv(argv, ["show", "decay", "dry-run"]);
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
    process.stdout.write(`gamestack-taste-update ${GAMESTACK_CLI_VERSION}\n`);
    return 0;
  }

  const projectRoot = resolve(common.project);
  if (!existsSync(projectRoot) || !statSync(projectRoot).isDirectory()) {
    process.stderr.write(`error: --project is not a directory: ${projectRoot}\n`);
    return 2;
  }

  const profilePath = parsed.get("profile")
    ? resolve(parsed.get("profile")!)
    : join(projectRoot, ".gamestack", "taste.json");

  const recordPath = parsed.get("record");
  const isShow = parsed.has("show");
  const isDecay = parsed.has("decay");
  const dryRun = parsed.has("dry-run");

  const modeCount = [recordPath !== undefined, isShow, isDecay].filter(Boolean).length;
  if (modeCount === 0) {
    process.stderr.write("error: exactly one of --record / --show / --decay is required\n\n");
    process.stderr.write(HELP);
    return 2;
  }
  if (modeCount > 1) {
    process.stderr.write("error: --record / --show / --decay are mutually exclusive\n");
    return 2;
  }

  let profile = loadProfile(profilePath);

  if (recordPath !== undefined) {
    let events: ApprovalEvent[];
    try {
      events = readEvents(resolve(recordPath));
    } catch (err) {
      process.stderr.write(`error: failed to read events from ${recordPath}: ${(err as Error).message}\n`);
      return 2;
    }
    if (events.length === 0) {
      process.stderr.write("warning: no events found in input file\n");
    }
    profile = recordEvents(profile, events);
    if (!dryRun) saveProfile(profilePath, profile);
  } else if (isDecay) {
    const halfLifeDays = Number(parsed.get("halflife-days") ?? "90");
    if (!Number.isFinite(halfLifeDays) || halfLifeDays <= 0) {
      process.stderr.write("error: --halflife-days must be a positive number\n");
      return 2;
    }
    profile = applyDecay(profile, { halfLifeDays });
    if (!dryRun) saveProfile(profilePath, profile);
  }

  const markdown = renderMarkdown(profile);
  emitReport(
    { markdown, json: profile },
    { format: common.format, out: common.out, defaultJsonPath: profilePath },
  );

  return 0;
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (err) => {
    process.stderr.write(`error: ${(err as Error).stack ?? err}\n`);
    process.exit(2);
  },
);
