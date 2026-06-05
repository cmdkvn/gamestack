# gamestack-skill-feedback

Aggregates the per-skill thumbs-up/down log that the [`/skill-feedback`](../../../skills/skill-feedback/SKILL.md) skill writes. Use this CLI to see which skills are landing and which are drifting — the lowest-rated skills are what the maintainer should rewrite first.

**Local-only.** Reads `<project>/.gamestack/skill-feedback.jsonl` (and optionally `~/.gamestack/skill-feedback.jsonl` with `--include-global`). Nothing is transmitted. The CLI does not call out to any network.

## Install

The CLI is shipped as a Bun script. From the gamestack checkout:

```bash
ln -s "$(pwd)/bin/gamestack-skill-feedback" /usr/local/bin/gamestack-skill-feedback
```

Or run directly: `./bin/gamestack-skill-feedback`.

Bun is required: `brew install bun` (see [bun.sh](https://bun.sh) for other platforms).

## Usage

```bash
gamestack-skill-feedback --window=30d
gamestack-skill-feedback --window=90d --include-global
gamestack-skill-feedback --skill critique --format=json --out=critique.json
gamestack-skill-feedback --window=all
```

## Log format

The `/skill-feedback` skill appends one JSON line per rating to `.gamestack/skill-feedback.jsonl`:

```json
{"at":"2026-06-05T14:22:11Z","skill":"critique","lens":"fun","verdict":"useful","reason":"caught the dead mechanic I'd been defending for two weeks","tags":["surprising-insight"],"run_at":"2026-06-05T14:10:33Z","gamestack_version":"1.0.0"}
```

Verdicts: `useful`, `not-useful`, `mixed`, `bailed-on-me`.

The CLI tolerates malformed lines by skipping them — the log is append-only and a partial write would only affect one entry.

## Report

The Markdown report groups by skill, sorted by volume (descending) then by useful-rate (ascending). Each skill block shows:
- Total rating count.
- useful / not-useful / mixed / bailed breakdown.
- Top 5 reasons cited for `not-useful`.
- Top 5 tags.
- Date range covered.

A verdict label per skill — `landing` (≥75% useful), `mixed` (50–74%), `drifting` (<50%), `low-signal` (<3 ratings).

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Report produced. |
| 1 | No matching entries (when `--skill` filter is set and that skill has no entries). |
| 2 | Invalid args or unreadable log. |
| 127 | Bun is not installed. |

## Privacy

The CLI reads only local files. It does not call out to any network. The skill-feedback log is **not** transmitted to gamestack maintainers automatically — if the developer wants to share aggregates with the maintainer, they can attach the CLI's JSON output to a GitHub issue manually.

## Related

- [`/skill-feedback`](../../../skills/skill-feedback/SKILL.md) — the skill that writes the log.
- [`docs/STATE.md`](../../../docs/STATE.md) — `recent_runs` (the input to `run_at` lookups).
