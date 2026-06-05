#!/usr/bin/env bun
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { ArgError, parseArgv, parseCommonOptions } from "../shared/args.ts";
import { GAMESTACK_CLI_VERSION } from "../shared/version.ts";
import { defaultReportPath, emitReport } from "../shared/report.ts";
import { runSuite } from "./runner.ts";
import { validateSuite, type Suite } from "./types.ts";
import { renderMarkdown } from "./render.ts";
import { AnthropicChatClient } from "./anthropic-client.ts";

const HELP = `gamestack-model-benchmark — cross-model prompt benchmark

Usage:
  gamestack-model-benchmark --suite <path> [options]

Runs a curated prompt suite against several Claude models and scores responses
on contains / notContains / regex / word-count expectations. Outputs a per-case
verdict + per-model summary (pass rate, mean latency, mean output tokens).

Required:
  --suite <path>          JSON suite file. See the README for the schema.

Options:
  --models <a,b,c>        Override the model list (comma-separated).
  --max-tokens <n>        Override per-case max_tokens (default 1024 unless suite says otherwise).
  --cache-system          Enable prompt caching on the system prompt (faster cost-effective reruns; biases latency).
  --api-key <key>         Anthropic API key (or set ANTHROPIC_API_KEY).
  --format <md|json|both> Output format (default: md).
  --out <path>            Write report to <path>. Without --out the report goes to stdout.
  --strict                Exit 1 if any model's pass rate < 100% (default: only failure when all models are <50%).
  -h, --help              Show this help.
  -v, --version           Print version.

Exit codes:
  0   All models pass the threshold.
  1   Models fell below the pass threshold.
  2   Invalid args / suite.
  3   Missing API key.
  127 bun not installed.

Examples:
  gamestack-model-benchmark --suite suites/asset-audit.json
  gamestack-model-benchmark --suite suite.json --models claude-opus-4-7,claude-sonnet-4-6 --format json --out bench.json
`;

async function main(argv: string[]): Promise<number> {
  let parsed;
  try {
    parsed = parseArgv(argv, ["strict", "cache-system"]);
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
    process.stdout.write(`gamestack-model-benchmark ${GAMESTACK_CLI_VERSION}\n`);
    return 0;
  }

  const suitePath = parsed.get("suite");
  if (!suitePath) {
    process.stderr.write("error: --suite is required\n\n");
    process.stderr.write(HELP);
    return 2;
  }
  const suiteAbs = resolve(suitePath);
  if (!existsSync(suiteAbs) || !statSync(suiteAbs).isFile()) {
    process.stderr.write(`error: suite file not found: ${suiteAbs}\n`);
    return 2;
  }

  let suite: Suite;
  try {
    const raw = JSON.parse(readFileSync(suiteAbs, "utf8"));
    const validated = validateSuite(raw);
    if (!validated.ok) {
      process.stderr.write(`error: invalid suite:\n  - ${validated.errors.join("\n  - ")}\n`);
      return 2;
    }
    suite = validated.suite;
  } catch (err) {
    process.stderr.write(`error: failed to parse suite: ${(err as Error).message}\n`);
    return 2;
  }

  const modelsOverride = parsed.get("models");
  if (modelsOverride) {
    suite = { ...suite, models: modelsOverride.split(",").map((s) => s.trim()).filter(Boolean) };
  }
  const maxTokens = parsed.get("max-tokens");
  if (maxTokens) {
    const n = Number(maxTokens);
    if (!Number.isFinite(n) || n <= 0) {
      process.stderr.write("error: --max-tokens must be a positive number\n");
      return 2;
    }
    suite = { ...suite, maxTokens: n };
  }

  const apiKey = parsed.get("api-key") ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    process.stderr.write("error: ANTHROPIC_API_KEY not set (or pass --api-key)\n");
    return 3;
  }

  const client = new AnthropicChatClient(apiKey);
  const cacheSystem = parsed.has("cache-system");

  const report = await runSuite(suite, client, { cacheSystem });

  const markdown = renderMarkdown(report);
  const defaultJsonPath = defaultReportPath(process.cwd(), "playtest/model-benchmark", `bench-${slug(suite.name)}`, "json");
  emitReport({ markdown, json: report }, { format: common.format, out: common.out, defaultJsonPath });

  const strict = parsed.has("strict");
  if (strict) {
    if (report.summaries.some((s) => s.passRate < 1)) return 1;
  } else {
    if (report.summaries.every((s) => s.passRate < 0.5)) return 1;
  }
  return 0;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (err) => {
    process.stderr.write(`error: ${(err as Error).stack ?? err}\n`);
    process.exit(2);
  },
);
