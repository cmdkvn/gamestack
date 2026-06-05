# gamestack-asset-audit

Per-platform asset budget audit. CI-friendly wrapper around the lens that the interactive `/asset-audit` skill uses (Technical Artist).

## Install

```bash
brew install bun                                 # runtime; one-time
# Then make sure gamestack/bin/ is on PATH, or invoke the shim directly:
gamestack/bin/gamestack-asset-audit --help
```

## Usage

```bash
gamestack-asset-audit --project ./games/bridge-keeper --platform switch-handheld
```

### Common flags

| Flag | Default | Notes |
|---|---|---|
| `--project <path>` | `$PWD` | Project root. CLI auto-detects engine (Unity / Godot / Unreal / GameMaker / Bevy / web). |
| `--platform <name>` | — required — | One of: `pc-hi`, `pc-mid`, `switch-handheld`, `switch-docked`, `ps5`, `xbox-series-x`, `mobile-hi`, `mobile-lo`, `web`. Aliases: `pc`, `steam`, `switch`, `xbox`, `mobile`, `ios`, `android`, `itch`. |
| `--format <md\|json\|both>` | `md` | Markdown to stdout by default. `json` for CI parsing. `both` writes a `.json` next to the markdown. |
| `--out <path>` | — | If set, writes report to this path. With `--format=both` the CLI writes `<out>.md` and `<out>.json`. |
| `--engine <name>` | auto-detect | Force engine selection: `unity`, `godot`, `unreal`, `gamemaker`, `bevy`, `web`. |
| `--strict` | off | Exit non-zero on P0 *or* P1 findings. Default exits non-zero on P0 only. |

### Exit codes

| Code | Meaning |
|---|---|
| `0` | No findings above threshold. |
| `1` | Findings at or above threshold (use in CI to fail the build). |
| `2` | Invalid args or unreadable project. |
| `127` | `bun` not installed. |

## What it checks

| Check | Surfaces |
|---|---|
| Texture dimensions | Images whose max(width, height) exceeds the platform's texture cap. Also flags non-power-of-two textures (compression formats prefer POT). |
| Uncompressed audio | `.wav` and `.flac` files in the build (should be source-only). |
| Audio in wrong category | Files >1.5 MB in a `sfx/`-style directory (likely misclassified music). |
| Mesh source formats | `.blend`, `.max`, `.3ds` shipping in build. |
| Large meshes | `.fbx`/`.glb`/`.obj` over 10 MB (above typical tri budgets). |
| Naming convention | Spaces, double-underscores, uppercase outside the extension. |
| Unity `.meta` integrity | Missing `.meta` siblings (GUID regen) and `.gitignore` excluding `*.meta` (catastrophic — the whole project's references break). |
| Aggregate texture budget | Total texture bytes vs platform texture-memory cap. |
| Runtime build cap | For `web`: total runtime bytes vs the 50 MB load budget. |

## What it does NOT do (vs. the `/asset-audit` skill)

- **Atlas packing ratio** — requires reading engine-specific atlas formats (`.spriteatlas`, `.tres`). The CLI surfaces atlas candidates as `INFO`; the interactive skill walks them with engine tooling.
- **Audio bitrate parsing** — proper bitrate decoding from MP3/OGG/Opus headers is left to the skill. The CLI catches the most common failure (WAV in build).
- **Triangle counts** — needs engine import settings. The CLI surfaces mesh files by size; the skill reads tri counts via the engine importer.
- **Importer setting audit** — Unity's Crunch compression, Max Size overrides, Audio Force Mono, etc. are out of scope for static-file analysis.

Use the CLI in CI to catch regressions; use the skill for the milestone-gate deep audit.

## Example CI usage

```yaml
# .github/workflows/asset-budget.yml
jobs:
  asset-budget:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: gamestack-asset-audit --platform switch-handheld --format json --out asset-audit.json --strict
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: asset-audit
          path: asset-audit.json
```

## JSON shape

```json
{
  "generatedAt": "2026-06-04",
  "platform": "switch-handheld",
  "budget": { "textureMax": 1024, "totalAtlasMB": 256, "audioBitrateMinKbps": 96, ... },
  "scanRoots": ["Assets"],
  "engine": "unity",
  "projectRoot": "/abs/path",
  "counts": { "files": 1234, "textures": 800, "audio": 80, "meshes": 40, "sourceArtwork": 12 },
  "totals": { "bytes": 1234567890, "textureBytes": ..., "audioBytes": ..., ... },
  "findings": [
    {
      "severity": "P0",
      "category": "critical",
      "relPath": ".gitignore",
      "detail": ".meta files are excluded...",
      "proposal": "..."
    }
  ],
  "proposedActions": [
    { "rank": 1, "action": "Resize to 1024px max dimension (12 files)", "estSavingsBytes": 8400000 }
  ],
  "underBudget": true
}
```

## Related

- `/asset-audit` skill — interactive Technical Artist for milestone-gate audits.
- `/perf-benchmark` skill — confirms asset changes hit the perf budget.
- `/cert-readiness` skill — surfaces asset-related cert blockers (Switch memory ceiling, etc.).
