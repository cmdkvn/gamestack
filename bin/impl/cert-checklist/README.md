# gamestack-cert-checklist

Platform certification readiness checklist. CI-friendly wrapper around the lens that the interactive `/cert-readiness` skill uses (Platform Cert Officer).

> **Important.** This CLI is NOT a substitute for the NDA-protected TRC / TCR / lotcheck. It covers the public-knowledge high-failure-rate categories that account for ~80% of indie cert rejections. Always download the current platform checklist from the developer portal before submission. The CLI emits this reminder at the top of every report.

## Install

```bash
brew install bun                                 # runtime; one-time
gamestack/bin/gamestack-cert-checklist --help
```

## Usage

```bash
gamestack-cert-checklist --project ./games/bridge-keeper --platform all
gamestack-cert-checklist --project . --platform ps5,switch
gamestack-cert-checklist --project . --platform xbox --strict
```

### Common flags

| Flag | Default | Notes |
|---|---|---|
| `--project <path>` | `$PWD` | Project root. CLI auto-detects engine (Unity, Godot, Unreal, GameMaker, Bevy, web). |
| `--platform <name>` | — required — | `ps5`, `xbox`, `switch`, or `all` (or a comma-separated list). |
| `--format <md\|json\|both>` | `md` | Markdown to stdout by default. |
| `--out <path>` | — | Write report to a file. With `--format=both` the CLI writes `<out>.md` and `<out>.json`. |
| `--engine <name>` | auto-detect | Force engine selection. |
| `--strict` | off | Exit non-zero on FAIL_P1 as well as FAIL_P0 (default: P0 only). |

### Exit codes

| Code | Meaning |
|---|---|
| `0` | No FAIL_P0 (and no FAIL_P1 with `--strict`). |
| `1` | FAIL_P0 present (or FAIL_P1 with `--strict`) — fail the CI run. |
| `2` | Invalid args or unreadable project. |
| `127` | `bun` not installed. |

## How it works

For each platform's category, the CLI:

1. **Reads the project's scripts** (engine-aware: `.cs` for Unity, `.gd` + `.cs` for Godot, `.cpp` + `.h` for Unreal, etc.).
2. **Matches code patterns** for the category — e.g., `OnApplicationPause` for sleep/resume, `File.Replace` for atomic save.
3. **Looks for config markers** — e.g., `docs/cert/ps5-trc-v*.md`, `Assets/Locale/`.
4. **Checks playtest run history** in `playtest/playtest-*/` for recent scenario runs.
5. **Assigns a verdict:**

| Verdict | Meaning |
|---|---|
| `PASS` | Code present AND recent playtest scenario run within 30 days. |
| `PASS_CODE_ONLY` | Code present; no recent live test run. Surface as "run scenario X before submit". |
| `NEEDS_LIVE_TEST` | Categories that can only be verdict'd by live test (memory, region pricing, etc.). |
| `FAIL_P0` | Critical gap — submission blocker. |
| `FAIL_P1` | Strongly recommended fix. |
| `NOT_APPLICABLE` | Game doesn't use this feature (e.g., HDR off). |

## Categories audited

The category lists mirror `skills/cert-readiness/SKILL.md`. Adjustments to either should land in both places.

### PS5

Memory · PSN · Trophy · DualSense · Sleep/resume · Controller disconnect · Save integrity · Cross-region pricing

### Xbox

Achievements · Profile switching · Quick Resume · Cloud saves · Accessibility (strictest of the three) · Game Bar/Capture · HDR · Sign-in/out

### Switch

Controller modes · Sleep/resume (lotcheck's most-failed item) · Parental controls · Suspend during write · Memory ceiling · Boot time · Localization · Age rating consistency

## What it does NOT do (vs. the `/cert-readiness` skill)

- **Doesn't read the NDA-protected checklist.** That always lives on the platform portal; the CLI surfaces a reminder.
- **Doesn't decide if a "100% complete" notion implies a platinum trophy.** The skill makes that judgment after reading the game's design doc; the CLI just notes the cert expectation.
- **Doesn't manage submission flow.** The `/publish` skill handles upload and version bumps; this CLI's job is the readiness check.
- **Doesn't execute playtest scenarios.** It checks for recent runs in `playtest/playtest-*/` directories. To actually run cert scenarios use `/playtest`.

## Example CI usage

```yaml
# .github/workflows/cert-readiness.yml
jobs:
  cert-readiness:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: gamestack-cert-checklist --platform all --format json --out cert.json --strict
      - if: always()
        uses: actions/upload-artifact@v4
        with:
          name: cert-readiness
          path: cert.json
```

## JSON shape

```json
{
  "generatedAt": "2026-06-04",
  "projectRoot": "/abs/path",
  "engine": "unity",
  "platforms": [
    {
      "platform": "ps5",
      "displayName": "PS5",
      "checklistVersionOnFile": "ps5-trc-v9.2.md",
      "buildRev": "abc123",
      "results": [
        {
          "category": { "id": "save-integrity", "name": "Save data integrity", ... },
          "verdict": "PASS_CODE_ONLY",
          "detail": "Code present; run 05-cert-save-fuzz.json to confirm",
          "evidence": { "codeMatches": ["Assets/Scripts/Save/AtomicSave.cs"], ... }
        }
      ],
      "counts": { "PASS": 0, "PASS_CODE_ONLY": 5, "FAIL_P0": 0, ... },
      "submissionReadiness": "NEEDS_WORK",
      "readinessReason": "3 P1 issues, 2 live tests required"
    }
  ],
  "actionList": {
    "p0": [],
    "p1": [{ "platform": "PS5", "category": "Trophy implementation", ... }],
    "needsLiveTest": [{ "platform": "PS5", "category": "Memory management", ... }]
  },
  "reminder": "This audit covers public-knowledge high-failure-rate categories only..."
}
```

## Related

- `/cert-readiness` skill — interactive Platform Cert Officer; cross-references the latest TRC/TCR/lotcheck PDF.
- `/playtest` skill — runs the cert-class scenarios (`04-cert-controller-disconnect.json`, `05-cert-save-fuzz.json`, …).
- `/publish` skill — submission flow once cert passes.
- `/code-review-gamestack` — checks the platform-affecting code paths surfaced by this CLI.
