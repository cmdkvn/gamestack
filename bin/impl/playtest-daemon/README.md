# gamestack-playtest-daemon

Broker between Claude Code and a running engine build. Loads a scenario JSON, executes it against the gamestack engine SDK, records a per-step run log, and exits non-zero on assertion failure or timeout.

The daemon is the heaviest of the gamestack CLIs because it walks the full `/playtest` scenario format. Same 9 step primitives, same JSON shape, just packaged for CI / scripted use.

## Install

```bash
brew install bun                                 # runtime; one-time
gamestack/bin/gamestack-playtest-daemon --help
```

The daemon requires the gamestack engine SDK to be running inside the target game build:
- Unity SDK at `http://localhost:7331` (default)
- Godot SDK at `http://localhost:7332`
- Web SDK (`gamestack-web-bridge`) at `http://localhost:7334`

## Usage

```bash
# Run the SDK smoke scenario against a running Unity build.
gamestack-playtest-daemon --scenario skills/playtest/scenarios/00-sdk-smoke.json

# Run a custom scenario against Godot with explicit run-dir.
gamestack-playtest-daemon \
  --scenario games/my-game/playtest/scenarios/level1.json \
  --engine godot \
  --run-dir games/my-game/playtest/runs/$(date +%Y%m%d-%H%M%S) \
  --format both \
  --out games/my-game/playtest/runs/latest/report

# CI: run cert-class scenario and fail the build on any assertion miss.
gamestack-playtest-daemon --scenario scenarios/05-cert-save-fuzz.json --format json --out save-fuzz.json
```

### Flags

| Flag | Default | Notes |
|---|---|---|
| `--scenario <path>` | — required — | JSON scenario file. |
| `--endpoint <url>` | scenario.endpoint or derived | Override the SDK endpoint. |
| `--engine <unity\|godot\|web>` | `unity` | Sets default port (7331 / 7332 / 7334) when no endpoint is set. |
| `--run-dir <path>` | derived | Where to write `run.json` + screenshots. |
| `--project <path>` | `$PWD` | Project root used to derive `--run-dir` if not set. |
| `--format <md\|json\|both>` | `md` | Output format for the summary report. |
| `--out <path>` | — | Write the summary report to this path. `run.json` + `summary.md` always go in `--run-dir`. |
| `--continue-on-failure` | scenario default | Continue executing steps after a failure. |

### Exit codes

| Code | Meaning |
|---|---|
| `0` | Scenario passed (all `ok` / `skipped`). |
| `1` | Scenario failed (failed assertion, timeout, or duration budget exceeded). |
| `2` | Invalid args, malformed scenario, or unreadable file. |
| `127` | `bun` not installed. |

## Scenario format

The schema is documented at `gamestack/skills/playtest/scenarios/README.md`. Nine step primitives:

| Type | Effect |
|---|---|
| `wait` | Sleep N seconds. |
| `wait_for_state` | Poll `GET /state` until `tagged.<key>` matches `expected_value`. |
| `input` | POST batch of `InputEvent`s to `/input`. |
| `screenshot` | POST `/screenshot`; write PNG to `<run-dir>/<filename>`. |
| `snapshot` | POST `/snapshot`; capture returned id. |
| `restore` | POST `/restore` with `{ "id": "..." }`. |
| `breakpoint` | POST `/breakpoint` with `{ "action", "tag"? }`. |
| `assert_state` | Read `/state` and fail if the tagged value doesn't match. |
| `assert_recent_breakpoint` | Read `/breakpoint` and fail if `recentHits` doesn't include the tag. |

**Don't add new primitives in this CLI without updating the scenario format spec and the 6 reference scenarios that ship with the `/playtest` skill.** The format is a contract.

## Output

Every run produces:

```
<run-dir>/
├── run.json          # full machine-readable result
├── summary.md        # human-readable summary
└── <screenshot files>
```

`run.json` has the full per-step result array with `state_after` snapshots for `wait_for_state` and `assert_state` steps. CI dashboards should ingest `run.json`; humans should read `summary.md`.

## What it does NOT do (vs. the `/playtest` skill)

- **Doesn't author scenarios.** The skill defines the playtest discipline and recommends what to test at each production phase; the daemon executes whatever scenario you point it at.
- **Doesn't choose a winner across scenarios.** It runs one scenario per invocation. Stitch invocations together in CI for a full sweep.
- **Doesn't launch the engine.** It expects a running build with the SDK reachable. Pair with your launcher of choice (Unity batchmode, Godot `--headless`, etc.).
- **Doesn't restart the engine on assertion failure.** Teardown runs, the daemon exits, and CI decides next steps.
- **Doesn't gate on perf.** Pair with `gamestack-game-benchmark` for the perf side; this daemon's focus is functional / cert assertions.

## Example CI usage

```yaml
jobs:
  playtest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - name: Launch headless build (your job)
        run: ./scripts/launch-headless-build &
      - name: Wait for SDK health
        run: timeout 30 bash -c 'until curl -fs http://localhost:7331/health; do sleep 1; done'
      - name: Run cert save-fuzz scenario
        run: gamestack-playtest-daemon --scenario scenarios/05-cert-save-fuzz.json --format json --out save-fuzz.json
      - if: always()
        uses: actions/upload-artifact@v4
        with: { name: playtest, path: playtest/playtest-*/ }
```

## Related

- `/playtest` — interactive QA Lead skill that recommends scenarios per production phase.
- `gamestack-game-benchmark` — pair to gate perf at the same time as functional assertions.
- `gamestack-cert-checklist` — picks up scenario runs from `playtest/playtest-*/` to elevate cert categories to PASS.
- `gamestack-asset-audit` — different lens; the daemon doesn't read project files.
