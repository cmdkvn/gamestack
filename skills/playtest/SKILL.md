---
name: playtest
description: QA Lead skill — drives a real Unity / Godot build via the gamestack engine SDK. Phase-aware (Prototype / Vertical Slice / Production / Polish / Cert / Launched). Reads game state via GET /state, injects input via POST /input, captures screenshots via POST /screenshot, save-fuzzes via POST /snapshot + /restore, and pauses at semantic checkpoints via POST /breakpoint. Files atomic bug fixes with regression scenarios. Degrades gracefully to offline static-analysis when the SDK is not installed. Use whenever you have a build that needs to be exercised end-to-end.
---

# playtest

This skill drives a running build the way a human playtester would, but tirelessly and with perfect memory of every input and state delta. It picks the right scenario for the current production phase, executes it via the gamestack engine SDK, captures findings, fixes what it can, and produces a regression scenario for every bug found.

## When to fire

Use when there's a build to exercise. Trigger phrases:
- "Playtest this build"
- "Run a playtest"
- "Drive the game"
- "Test scenario X"
- `/playtest [scenario | phase | --offline]`

If there's no build (just a prototype, just code), the right skill is `/critique --lens=fun` or `/code-review-gamestack`.

## Three modes

`/playtest` runs in one of three modes. Pick the cheapest one that fits the question you're asking.

| Mode | Trigger | Requires | Capability |
|---|---|---|---|
| **SDK live** | `/playtest` (default if SDK reachable) | Unity SDK / Godot SDK installed + build running with the SDK active | Full: input injection, state inspection, snapshot/restore, breakpoints, screenshots. |
| **Zero-SDK screenshot-diff** | `/playtest --mode=screenshot-diff` | A running build the developer manually drives + a screenshots directory the developer populates (engine screenshot hotkey, OBS, `screencapture` on macOS, etc.) | Visual regression only. Compares new screenshots to a baseline, flags diffs over a threshold. No input injection, no state inspection. |
| **Offline static** | `/playtest --offline` | The source code | Static analysis. Reads scripts, scenes, save format; tells you what the live modes would have caught. |

**Default to zero-SDK** for solo devs who haven't installed the engine SDK yet. The SDK upgrade is opt-in — see [`docs/ENGINES.md`](../../docs/ENGINES.md). The zero-SDK mode is documented in detail at [`docs/ZERO-SDK-PLAYTEST.md`](../../docs/ZERO-SDK-PLAYTEST.md).

## The phase decides everything

`/playtest` behaves differently based on the game's current production phase. Read the phase from the game's `CLAUDE.md` line `## Current production phase` if the project uses that convention. If absent, ask the developer.

| Phase | What `/playtest` is hunting | Default scenarios |
|---|---|---|
| **Prototype** | Is the fun here? Is the verb readable? | `01-prototype-first-minute.json` |
| **Vertical Slice** | Friction. Where does the player stop being engaged? | `02-vertical-slice-friction.json` |
| **Production** | Friction at scale + content gaps surfaced | (custom; see "writing a scenario") |
| **Polish** | Does the juice land? Is feedback in proportion to stakes? | `03-polish-game-feel.json` |
| **Cert** | TRC / TCR / lotcheck high-failure items | `04-cert-controller-disconnect.json`, `05-cert-save-fuzz.json` |
| **Launched** | Post-launch monitor; daily scenario re-runs | (the most-recent scenario per regression) |
| **Live-Ops** | (Outside v1 scope) | n/a |

If the phase doesn't match a default, ask the developer to point at a scenario file or describe one.

## Process

### Step 1 — probe the SDK (or pick the mode)

If the developer explicitly passed `--mode=screenshot-diff` or `--offline`, skip the probe and use the chosen mode.

Otherwise, probe the SDK at the default port (Unity: 7331, Godot: 7332):

```bash
curl -sf -m 2 http://localhost:7331/health
```

| Outcome | Mode |
|---|---|
| HTTP 200 with `ok: true` | **SDK live mode.** Drive scenarios end-to-end. |
| Connection refused / timeout, and the developer has a build running | Offer **zero-SDK screenshot-diff mode** as the next-best option. Don't silently downgrade to static analysis if there's a running build. |
| Connection refused / timeout, no running build | **Offline static mode.** Surface what live mode would have caught. |
| HTTP error with `ok: false` | Report and ask the developer to check the in-Unity status (Tools > gamestack > Open Status Window). |

### Step 2 — load or select scenarios

If the developer named a specific scenario, load that file from `skills/playtest/scenarios/<name>.json`. Otherwise, pick the default for the detected phase.

Scenarios are JSON files conforming to the schema in `skills/playtest/scenarios/README.md`. The schema is intentionally small — five primitives compose every scenario:

| Step type | Effect |
|---|---|
| `wait` | Sleep N seconds |
| `wait_for_state` | Poll `/state` until a tagged field matches a value (with timeout) |
| `input` | POST one or more `InputEvent`s to `/input` |
| `screenshot` | POST `/screenshot`, save to `playtest/playtest-<run>/<step>.png` |
| `snapshot` / `restore` | Capture and later restore via `/snapshot` + `/restore` |
| `breakpoint` | POST a `BreakpointRequest` to `/breakpoint` |
| `assert` | Check a tagged-field value or recent breakpoint hit against an expected value |

### Step 3 — execute scenarios (live mode)

For each step:

1. **Resolve placeholders** (e.g. `${endpoint}` → the detected SDK base URL).
2. **Execute** via `curl` against the SDK. Use loopback URLs only — refuse to send traffic to non-localhost endpoints.
3. **Record** every step's input, response status, and elapsed time.
4. **Halt** the scenario on the first failing `assert` unless the scenario declares `continue_on_failure: true`.

After each scenario, capture a final `/state` snapshot.

### Step 4 — collect findings

For each failed assertion, near-miss, or unexpected state delta, build a finding:

```
FINDING <N>
  Scenario step:   <name>
  Expected:        <…>
  Actual:          <…>
  State delta:     <key diffs from prior /state>
  Screenshot:      <path if captured>
  Severity:        P0 (crash / cert blocker) | P1 (clear bug) | P2 (smell)
```

P0 examples:
- Crash during scenario (server stops responding).
- Save data corruption after `/restore`.
- Game cannot recover from `/breakpoint pause-now → resume`.

P1 examples:
- Action button registers but no game-state change.
- `tagged.player.hp` decreases when it should not.
- `tagged.player.position` not within expected range after movement input.

P2 examples:
- Frame rate dipped during scenario.
- Screenshot looks visually off (over-juiced, missing UI element).

### Step 5 — propose fixes

For each P0 / P1 finding:
- Locate the candidate code via `/code-review-gamestack`'s engine-detection pattern.
- Propose a fix (apply `[AUTO]` only when unambiguous; otherwise surface for the developer's call).
- Commit each fix atomically with a Conventional Commit message scoped to the game slug.

### Step 6 — generate a regression scenario

For every confirmed P0 / P1 bug, generate a regression scenario by copying the failing scenario into `playtest/regression/<slug>-YYYY-MM-DD.json` and trimming it to the minimum that reproduces the bug. The regression scenario becomes part of the smoke suite re-run after every change.

### Step 7 — write the report

To `playtest/playtest-<phase>-<date>.md`:

```
# Playtest YYYY-MM-DD — <phase>

**Build:**         <git rev>
**Scenarios run:** <list>
**Engine SDK:**    <Unity v0.2.0 | Godot vX | OFFLINE>
**Duration:**      <total>

## Summary
- Scenarios passed: <N>
- Findings P0 / P1 / P2: <X / Y / Z>
- Auto-fixed: <K>
- Awaiting your call: <M>

## Findings
<one block per finding, as above>

## Auto-fixes applied
<list with commit hashes>

## Regression scenarios added
<list with paths>

## Recommended next playtest
<scenario(s) to run after fixes land>
```

### Step 8 — zero-SDK screenshot-diff mode (when there's a running build but no SDK)

This is the default fallback for solo devs who haven't installed the engine SDK. It captures visual regressions, which is most of what early-prototype playtests need.

Setup the developer has done before invoking `/playtest --mode=screenshot-diff`:
1. The game is running, on screen.
2. They have a way to drop a screenshot at a known path on each meaningful moment — common options: in-engine screenshot hotkey wired to `playtest/screenshots/`, macOS `screencapture -i`, OBS scene-bound hotkey, or any system screenshot tool.
3. A baseline directory at `playtest/baseline/<scenario>/` (skipped if this is the first run — that run becomes the baseline).

The skill orchestrates the run:
1. Picks the scenario (phase-driven, same as live mode).
2. For each step that has a `screenshot` primitive, prints a clear "do this now" line to the developer: *"Press your screenshot hotkey when the title screen finishes fading in."*
3. Waits for a new file to land in `playtest/screenshots/` (the [`gamestack-playtest-daemon`](../../bin/impl/playtest-daemon/README.md) `--mode=screenshot-diff` flag watches the directory).
4. Diffs the new screenshot against the baseline at the same step name using a perceptual-hash threshold (default 5% pixel-delta). Anything over threshold is a finding.
5. Skips `input`, `wait_for_state`, `snapshot`, `restore`, and `breakpoint` primitives — they require the SDK. Reports each skipped step under "Coverage gap — zero-SDK mode".

Findings in this mode are tagged `VISUAL-REGRESSION`. They're useful for:
- Catching unintended UI changes after a refactor.
- Detecting art-direction drift across a content branch.
- Spot-checking that the trailer-able moments still look like themselves.

What zero-SDK mode **doesn't** catch:
- Anything that requires reading game state (`tagged.player.hp`).
- Any non-visual regression (audio, controller rumble, frame budget).
- Anything that requires saving / restoring / fuzzing save data.

When the developer wants those, the SDK upgrade is one install: [`engines/unity/README.md`](../../engines/unity/README.md) or [`engines/godot/README.md`](../../engines/godot/README.md).

### Step 9 — offline static mode (no build, no SDK)

If neither the SDK is reachable nor a build is running, fall back to static analysis:
1. **Read the scenarios anyway** — they describe what the live test WOULD have done. Surface in the report under "Coverage gap — live mode unavailable".
2. **Static-analyze** the relevant code paths for each scenario step. For example: a scenario step that asserts `tagged.player.hp` decreases after a hit becomes a static check that the damage path actually mutates the tagged field.
3. **Recommend installing the SDK** — point at [`docs/ENGINES.md`](../../docs/ENGINES.md).
4. **File the offline findings** with severity tagged `OFFLINE-MAYBE` (the dev should confirm in live mode).

Offline static mode is a last-resort fallback. The screenshot-diff mode is almost always available and almost always more useful.

## Output format (in-chat summary)

After running, surface a tight summary:

```
PLAYTEST RUN — <phase>
  Scenarios:     <list>
  Mode:          <live | offline>
  P0 / P1 / P2:  <X / Y / Z>
  Auto-fixed:    <K commits>
  Awaiting:      <M decisions>

KEY FINDINGS (top 3)
  1. <finding> — <action>
  2. ...

REPORT: <path>
REGRESSIONS ADDED: <list>
NEXT: <recommended next playtest scenario>
```

The developer should be able to decide next moves in 60 seconds from the summary.

## What NOT to do

- **Don't skip the SDK probe** when the developer didn't pass `--offline`. Silently running offline produces stale data.
- **Don't fabricate scenario outcomes.** If a step times out, report a timeout. Don't synthesize "expected" values.
- **Don't bind to non-loopback URLs.** The SDK is loopback-only by design; the skill enforces that on the client side too.
- **Don't auto-fix P0 cert bugs without confirmation.** Cert-affecting changes belong to the developer.
- **Don't run more than 5 scenarios in one invocation.** If many need running, batch them via the developer's CI using [`gamestack-playtest-daemon`](../../bin/impl/playtest-daemon/README.md) — it accepts one scenario per invocation and is meant to be called from CI in a sweep.
- **Don't keep screenshots forever.** Drop per-step screenshots into `playtest/playtest-<run>/`. The developer can prune the directory between runs.
- **Don't conflate offline mode and a passing live run.** Offline mode is never a "pass" for cert-class scenarios.

## Writing a scenario

Scenarios live at `skills/playtest/scenarios/<name>.json`. See the [scenario format spec](scenarios/README.md) for the schema and patterns.

When a default scenario for a phase doesn't fit, the developer can:
1. Copy the closest existing scenario.
2. Rename and trim.
3. Add steps using the five primitives above.
4. Add assertions that match the game's tagged state.
5. Reference it via `/playtest <scenario-name>`.

If a scenario is reusable across games, promote it: copy to the studio's `studio/playbooks/playtest/` directory. If it's game-specific, keep it under `games/<name>/playtest/scenarios/`.

## Handoff

After playtest:
- `/code-review-gamestack` — for the fixes proposed but not auto-applied.
- `/bug-hunt` — for any finding that didn't have a clear root cause.
- `/critique --lens=feel` — for any P2 finding tagged "feels off."
- `/critique --lens=perf` — if any scenario surfaced perf regression.
- `/cert-readiness` (M3) — when running cert-class scenarios.
- `/playtest` again after fixes — every fix gets re-run against its regression scenario.
