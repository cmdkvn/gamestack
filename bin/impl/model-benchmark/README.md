# gamestack-model-benchmark

Cross-model prompt benchmarks for gamestack workflows. Runs a curated prompt suite against several Claude models, scores responses on contains / regex / word-count expectations, and writes a comparison report. Local results only — the CLI does not upload runs anywhere.

## Install

```bash
brew install bun                                 # runtime; one-time
export ANTHROPIC_API_KEY="sk-ant-..."            # or pass --api-key
gamestack/bin/gamestack-model-benchmark --help
```

## Usage

```bash
# Run a suite against the models declared inside it.
gamestack-model-benchmark --suite suites/asset-audit.json

# Override the models and emit JSON for CI ingest.
gamestack-model-benchmark --suite suite.json \
  --models claude-opus-4-7,claude-sonnet-4-6,claude-haiku-4-5 \
  --format json --out bench.json

# Fail the build if any model isn't 100%.
gamestack-model-benchmark --suite suite.json --strict
```

### Flags

| Flag | Default | Notes |
|---|---|---|
| `--suite <path>` | — required — | JSON suite file (schema below). |
| `--models <a,b,c>` | from suite | Override the model list. |
| `--max-tokens <n>` | suite or `1024` | Per-case `max_tokens`. |
| `--cache-system` | off | Enable prompt caching on the system prompt (cheaper reruns; biases latency comparisons). |
| `--api-key <key>` | `$ANTHROPIC_API_KEY` | API key. |
| `--format <md\|json\|both>` | `md` | Output format. |
| `--out <path>` | — | Write report to file. |
| `--strict` | off | Exit 1 unless every model passes 100% of cases. |

### Exit codes

| Code | Meaning |
|---|---|
| `0` | All models passed the threshold. |
| `1` | Below threshold. Default = all models < 50%. `--strict` = any model < 100%. |
| `2` | Invalid args or suite. |
| `3` | Missing API key. |
| `127` | `bun` not installed. |

## Suite schema

```json
{
  "name": "asset-audit-coverage",
  "description": "Does the model know the basics of per-platform asset audit?",
  "models": ["claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5"],
  "maxTokens": 512,
  "cases": [
    {
      "id": "switch-handheld-budget",
      "system": "You are a Technical Artist auditing a Unity game for Switch handheld.",
      "prompt": "Top 3 things to check first?",
      "expected": {
        "contains": ["atlas", "texture", "audio"],
        "notContains": ["NDA-protected"],
        "wordCountMin": 40,
        "wordCountMax": 400,
        "matches": [{ "pattern": "\\bcompression\\b" }]
      }
    }
  ]
}
```

Every check is independent. A case passes only when *all* checks pass.

### Available expectations

| Check | Behavior |
|---|---|
| `contains` | Substring must appear (case-insensitive). |
| `notContains` | Substring must NOT appear. |
| `matches` | Regex must match (`flags` default to `i`). |
| `notMatches` | Regex must NOT match. |
| `wordCountMin` / `wordCountMax` | Word-count bounds on the response. |
| `tags` | Free-form taxonomic tags. Pass-through; appears in JSON. |

## Winner selection

The CLI picks one winner per run based on:
1. Higher pass rate.
2. Tie? Lower mean latency wins.

The winner is informational. CI gates should rely on `--strict` and exit codes, not the winner field.

## What it does NOT do (vs. a hypothetical reflective skill)

- **Doesn't auto-write suites.** The developer authors prompts that match the team's actual workflows.
- **Doesn't upload results anywhere.** Local files only. Aggregation across runs is up to the team's own dashboards.
- **Doesn't tune prompts.** Use the `/learn` reflective skill (Group 13) for prompt improvement.

## Example CI usage

```yaml
# .github/workflows/model-benchmark.yml
on:
  workflow_dispatch:
  schedule: [{ cron: "0 5 * * 1" }]   # Monday 5am
jobs:
  bench:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun --version
      - env: { ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }} }
        run: gamestack-model-benchmark --suite suites/regression.json --format json --out bench.json
      - if: always()
        uses: actions/upload-artifact@v4
        with: { name: model-bench, path: bench.json }
```

## Related

- `/claude-api` (Claude Code built-in) — for building Claude-API-using apps with the right caching / migration patterns.
- `/learn` (Group 13 reflect skill) — persistent learnings; pair with this CLI to track regression suites over time.
