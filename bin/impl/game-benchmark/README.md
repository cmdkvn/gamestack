# gamestack-game-benchmark

Cross-engine perf snapshot. Polls the gamestack engine SDK (`GET /state`), aggregates FPS / frame time / draw calls / GC alloc / memory peak, and diffs against a baseline. CI-friendly wrapper around the `/perf-benchmark` skill.

## Install

```bash
brew install bun                                 # runtime; one-time
gamestack/bin/gamestack-game-benchmark --help
```

## Usage

```bash
# Capture a 60-second snapshot of the running Unity build.
gamestack-game-benchmark --scenario level1-walk --duration 60

# Run against Godot with a baseline file from yesterday.
gamestack-game-benchmark --scenario combat --engine godot \
  --baseline baselines/combat.json --format json --out perf.json

# CI gate that fails the build on any tracked regression.
gamestack-game-benchmark --scenario smoke --baseline baselines/smoke.json --strict
```

### Flags

| Flag | Default | Notes |
|---|---|---|
| `--scenario <name>` | — required — | Snapshot tag (level / scene / encounter). |
| `--endpoint <url>` | derived | Explicit SDK URL. |
| `--engine <unity\|godot>` | `unity` | Sets default port (7331 vs 7332). |
| `--platform <name>` | `(unspecified)` | Free-form platform tag for the report. |
| `--duration <seconds>` | `60` | Capture duration. |
| `--interval-ms <n>` | `100` | Sample interval. |
| `--baseline <path>` | — | Baseline JSON to diff against. |
| `--format <md\|json\|both>` | `md` | Output format. |
| `--out <path>` | — | Write report to file. |
| `--strict` | off | Exit non-zero on any regression (default fails only on FPS / frame-time / memory). |

### Exit codes

| Code | Meaning |
|---|---|
| `0` | No regressions above threshold. |
| `1` | Regression detected — fail the CI run. |
| `2` | Invalid args. |
| `127` | `bun` not installed. |

## Engine SDK contract

The CLI expects the running build to expose `GET /state` with at least these fields. Any subset works; missing fields are reported as `—` in the snapshot.

```json
{
  "scene": "Level1",
  "fps": 58.3,
  "frameTimeMs": 17.1,
  "drawCalls": 234,
  "batches": 78,
  "gcAllocBytes": 1024,
  "memoryMB": 812.4
}
```

Unity SDK v0.2.0 and Godot SDK v0.2.0 expose `/state` natively. To surface perf-specific metrics, decorate fields on a perf provider:

```csharp
// Unity
[GameStackState("fps", "default")]
public float CurrentFps => 1f / Time.smoothDeltaTime;
```

```gdscript
# Godot
GameStack.expose(self, "fps", "default", func(): return Engine.get_frames_per_second())
```

## Regression thresholds (default)

| Metric | Threshold | Severity |
|---|---|---|
| Avg FPS | -5% drop | REGRESSED |
| 99th-pct frame time | +10% rise | REGRESSED |
| Draw calls / frame | +10% rise | REGRESSED (only in `--strict`) |
| GC alloc / frame | any increase | REGRESSED (only in `--strict`) |
| Peak memory | +5% rise | REGRESSED |

`--strict` raises draw calls and GC alloc to fail thresholds.

## What it does NOT do (vs. the `/perf-benchmark` skill)

- **Doesn't capture in the editor.** Editor overhead is not the shipped number; run a real build.
- **Doesn't fabricate numbers when the SDK is offline.** A failed snapshot surfaces as zero samples + notes; the CLI does not invent data.
- **Doesn't diagnose the root cause.** It surfaces regressions; `/bug-hunt` investigates; the developer fixes.
- **Doesn't break down frame budget by subsystem.** That requires engine-side profiler instrumentation; pair with `/perf-benchmark` for the breakdown.

## Example CI usage

```yaml
# .github/workflows/perf.yml
jobs:
  perf:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - name: Launch build (your job)
        run: ./scripts/launch-headless-build &
      - name: Wait for SDK
        run: timeout 30 bash -c 'until curl -s http://localhost:7331/health; do sleep 1; done'
      - name: Snapshot
        run: gamestack-game-benchmark --scenario smoke --duration 30 --baseline baselines/smoke.json --strict --format json --out perf.json
      - if: always()
        uses: actions/upload-artifact@v4
        with: { name: perf, path: perf.json }
```

## Related

- `/perf-benchmark` — interactive Performance Engineer; this CLI is the CI sibling.
- `/playtest` — runs a scripted scenario; pair the daemon (Group 12) with this CLI to control the scenario while the benchmark captures.
- `gamestack-playtest-daemon` — drives a scenario; useful for setting up consistent game state before benchmarking.
- `/asset-audit` — when peak-memory regressions point at asset bloat.
