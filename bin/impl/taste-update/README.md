# gamestack-taste-update

Persists `/art-shotgun` approvals into a project taste profile so the next exploration round starts from learned preferences instead of a blank slate.

## Install

```bash
brew install bun                                 # runtime; one-time
gamestack/bin/gamestack-taste-update --help
```

## Usage

```bash
# Record a batch of approvals (single object, array, or NDJSON).
gamestack-taste-update --project ./games/bridge-keeper --record round-2-approvals.ndjson

# Print the current profile.
gamestack-taste-update --project ./games/bridge-keeper --show

# Apply time decay so older preferences fade.
gamestack-taste-update --project ./games/bridge-keeper --decay --halflife-days 90
```

### Flags

| Flag | Default | Notes |
|---|---|---|
| `--project <path>` | `$PWD` | Project root; the profile defaults to `<project>/.gamestack/taste.json`. |
| `--profile <path>` | derived | Explicit profile path (overrides `--project`). |
| `--record <events>` | — | Apply approval events from a file (single object / JSON array / NDJSON). Mutually exclusive with `--show` / `--decay`. |
| `--show` | — | Print the current profile. No mutation. |
| `--decay` | — | Apply exponential decay; older `wins`/`losses` halve every `halflife-days`. |
| `--halflife-days <n>` | 90 | Decay halflife. |
| `--format <md\|json\|both>` | `md` | Output format for the report. |
| `--out <path>` | — | Write report to file. |
| `--dry-run` | off | Skip writing the profile back; just print what would change. |

### Exit codes

| Code | Meaning |
|---|---|
| `0` | Success. |
| `2` | Invalid args or malformed event file. |
| `127` | `bun` not installed. |

## Event shape

```json
{
  "subject": "key art — lighthouse keeper",
  "round": 2,
  "date": "2026-06-04",
  "variant": "V3",
  "axisVaried": "lighting",
  "axisValue": "backlit",
  "outcome": "KEEP",
  "confidence": "high",
  "notes": "Rim lighting reads from thumbnail size"
}
```

- `outcome` is `KEEP` (full win), `DISCARD` (loss), or `MIX_IN` (half win — the variant contributed an idea but wasn't the winner).
- Subjects and dates that match the most recent round are collapsed into that round, so a multi-variant approval submitted in one batch reads as one round in the log.

## Emerging signals

After every record / decay operation the CLI recomputes signals:

- An axis value becomes a signal once it has **≥4 total samples** *and* **≥70% win rate**.
- The CLI surfaces the leading value plus how much it leads the runner-up by.

Example:

```
lighting: 'backlit' wins (83% over 6 samples, leads next by 50%)
palette:  'cool'    wins (75% over 8 samples)
```

These are exactly the cues `/art-shotgun` should pre-seed into the next round's prompts.

## What it does NOT do (vs. the `/art-shotgun` skill)

- **Doesn't generate prompts.** Prompt variant generation stays in the interactive skill; this CLI persists what came back from the developer's approval.
- **Doesn't read the art bible.** Negative patterns can be added to the profile directly (or via a future API); the bible is the source of truth for hard stylistic rules.
- **Doesn't run any image generator.** Tool-agnostic by design.

## Where the profile lives

| Path | When |
|---|---|
| `<project>/.gamestack/taste.json` | default — matches `/art-shotgun`'s output location |
| `<project>/marketing/art/taste/profile.json` | acceptable alternative; pass `--profile` |

The profile is JSON. A future Group 13 power tool may add `/taste-snapshot` to bracket profile state across exploratory rounds.

## Related

- `/art-shotgun` — interactive Visual Explorer that produces the events this CLI consumes.
- `/art-bible` — the source of truth for hard stylistic rules (palette, silhouette).
- `gamestack-model-benchmark` — different lens; benchmarks Claude models, not visual variants.
