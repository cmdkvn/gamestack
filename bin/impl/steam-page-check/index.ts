#!/usr/bin/env bun
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { ArgError, parseArgv, parseCommonOptions } from "../shared/args.ts";
import { GAMESTACK_CLI_VERSION } from "../shared/version.ts";
import { defaultReportPath, emitReport } from "../shared/report.ts";
import { runSteamPageCheck } from "./check.ts";
import { renderMarkdown } from "./render.ts";

const HELP = `gamestack-steam-page-check — Steam store page validator

Usage:
  gamestack-steam-page-check [options]

Validates Steam store page artifacts in <project>/marketing/steam/ (or wherever
--steam-dir points). Reads page.json for metadata (short description, tags,
trailer length, screenshots count). Validates each capsule slot against Steam's
current size spec. Surfaces top edits and a wishlist-conversion risk score.

Options:
  --project <path>        Project root (default: current working directory).
  --steam-dir <path>      Override Steam asset directory. Default search:
                            <project>/marketing/steam/, <project>/marketing/, <project>/steam/.
  --format <md|json|both> Output format (default: md).
  --out <path>            Write report to <path>. Without --out the report goes to stdout.
  --strict                Exit non-zero on MEDIUM or HIGH risk as well as missing-capsule errors.
                          Default exits non-zero only on missing/failed high-impact capsules
                          (main, header).
  -h, --help              Show this help.
  -v, --version           Print version.

Exit codes:
  0   No high-impact violations (and risk is LOW with --strict).
  1   Missing or failed main/header capsule, or --strict and risk is not LOW.
  2   Invalid args.
  127 bun not installed.

Expected layout in <project>/marketing/steam/:
  - page.json                              # metadata; see below
  - header-capsule.png                     # 460×215  (filename hint: "header")
  - small-capsule.png                      # 231×87   (hint: "small")
  - main-capsule.png                       # 1232×706 (hint: "main", "page-capsule")
  - library-capsule.png                    # 600×900  (hint: "library", "library-capsule")
  - library-hero.png                       # 3840×1240 (hint: "library-hero", "hero")
  - library-logo.png                       # 1280×720 (hint: "library-logo", "logo")
  - page-background.png                    # 1438×810 (hint: "page-background", "background")
  - screenshots/*.png                      # one or more screenshots
  - trailer.mp4                            # optional; length is read from page.json

page.json schema (every field is optional except those needed for the checks
you care about):

  {
    "appId": 12345,
    "pageState": "coming-soon" | "live" | "hidden",
    "shortDescription": "string ≤300 chars",
    "longDescription": "string (markdown / BBCode)",
    "tags": ["Indie", "Pixel Art", "Atmospheric", ...],
    "trailerSeconds": 75,
    "trailerHasSubtitles": true,
    "trailerHasStudioCardAtStart": false,
    "trailerFirstSixSecondVerb": true,
    "screenshotsCount": 8,
    "nextFest": { "planned": true, "demoMinutes": 25, "demoEndsOnHook": true }
  }

Examples:
  gamestack-steam-page-check --project ./games/bridge-keeper
  gamestack-steam-page-check --steam-dir ./marketing/v2 --format json --out steam-check.json
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
    process.stdout.write(`gamestack-steam-page-check ${GAMESTACK_CLI_VERSION}\n`);
    return 0;
  }

  const projectRoot = resolve(common.project);
  if (!existsSync(projectRoot) || !statSync(projectRoot).isDirectory()) {
    process.stderr.write(`error: --project is not a directory: ${projectRoot}\n`);
    return 2;
  }

  const steamDirArg = parsed.get("steam-dir");
  const steamDir = steamDirArg ? resolve(steamDirArg) : undefined;

  const report = runSteamPageCheck({ projectRoot, steamDir });
  const markdown = renderMarkdown(report);
  const defaultJsonPath = defaultReportPath(projectRoot, "marketing", "steam-page-check", "json");

  emitReport({ markdown, json: report }, { format: common.format, out: common.out, defaultJsonPath });

  const isStrict = parsed.has("strict");
  const highImpactCapsuleBad = report.capsules.some(
    (c) => (c.slot === "main" || c.slot === "header") && c.verdict !== "PASS",
  );
  const failOnRisk = isStrict && report.wishlistRisk !== "LOW";
  return highImpactCapsuleBad || failOnRisk ? 1 : 0;
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (err) => {
    process.stderr.write(`error: ${(err as Error).stack ?? err}\n`);
    process.exit(2);
  },
);
