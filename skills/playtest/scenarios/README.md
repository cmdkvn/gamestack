# gamestack playtest scenarios

Scenarios are JSON files the `/playtest` skill consumes. Each one is a sequence of steps that drives a running Unity / Godot build via the gamestack engine SDK and asserts the resulting state.

## Schema

```jsonc
{
  "name": "human-readable-name",
  "phase": "prototype | vertical-slice | production | polish | cert | launched",
  "description": "one paragraph: what this scenario proves",
  "endpoint": "http://localhost:7331",        // optional; default 7331 (Unity), 7332 (Godot post-M3)
  "continue_on_failure": false,                // optional; default false — first failed assert halts
  "max_duration_seconds": 120,                 // optional; total wallclock budget
  "setup": [ /* steps */ ],
  "steps": [ /* steps */ ],
  "teardown": [ /* steps */ ],
  "assertions_summary": [                       // human-readable; not executed; for the report
    "Time from start to first verb < 10 seconds"
  ]
}
```

`setup` and `teardown` run before / after `steps`. They're optional; useful for `snapshot` + `restore` bracketing so the scenario leaves the world as it found it.

## Step types

| Type | Required fields | Effect |
|---|---|---|
| `wait` | `seconds` | Sleep N seconds. |
| `wait_for_state` | `tagged_key`, `expected_value`, `timeout_seconds` | Poll `GET /state` until `tagged.<tagged_key>` equals `expected_value` (or until timeout). |
| `input` | `events` (array of `InputEvent`) | POST a batch to `/input`. |
| `screenshot` | `filename` | POST `/screenshot`; write to `playtest/playtest-<run>/<filename>`. |
| `snapshot` | `id` (optional) | POST `/snapshot`; capture returned id. |
| `restore` | `id` | POST `/restore` with `{ "id": "..." }`. |
| `breakpoint` | `action`, `tag` (when relevant) | POST a `BreakpointRequest` to `/breakpoint`. |
| `assert_state` | `tagged_key`, `expected_value` (or `expected_range`) | Read `/state` and fail if the tagged value doesn't match. |
| `assert_recent_breakpoint` | `tag` | Read `/breakpoint` status and fail if `recentHits` doesn't include the tag. |

### `InputEvent` fields

| Field | Type | Notes |
|---|---|---|
| `device` | string | "Keyboard" / "Mouse" / "Gamepad" / "Touch" / "Custom" |
| `action` | string | "Press" / "Release" / "Value" / "Move" / "Custom" |
| `control` | string | Symbolic control name ("Space", "MouseLeft", "DPadUp") |
| `value` | number | For axis / trigger inputs (-1..1 or 0..1) |
| `x`, `y` | number | For positional inputs |
| `durationSeconds` | number | Repeat duration; 0 = single tick |
| `custom` | string | Free-form metadata for custom events |

## Step result shape (what gets recorded)

For every executed step, the runner records:

```jsonc
{
  "step": "step name from scenario",
  "type": "wait | wait_for_state | input | ...",
  "status": "ok | fail | timeout | skipped",
  "elapsed_ms": 42,
  "details": { /* type-specific */ },
  "screenshot": "path if applicable",
  "state_after": { /* compact /state snapshot */ }
}
```

The aggregated results feed the playtest report at `playtest/playtest-<phase>-<date>.md`.

## Patterns

### Bracket with snapshot + restore

```jsonc
"setup":    [ { "type": "snapshot", "id": "pre-scenario" } ],
"teardown": [ { "type": "restore",  "id": "pre-scenario" } ]
```

Keeps successive scenario runs from drifting state.

### Wait for game-ready before sending input

```jsonc
{ "type": "wait_for_state", "tagged_key": "default.gameReady", "expected_value": true, "timeout_seconds": 10 }
```

Don't synthesize input before the game has finished its loading screens.

### Combine breakpoint + screenshot for visual capture at a known checkpoint

```jsonc
{ "type": "breakpoint", "action": "add-pause", "tag": "after-boss-spawn" },
{ "type": "wait_for_state", "tagged_key": "default.bossActive", "expected_value": true, "timeout_seconds": 20 },
{ "type": "screenshot", "filename": "boss-spawned.png" },
{ "type": "breakpoint", "action": "resume" }
```

### Save fuzz

```jsonc
{ "type": "snapshot", "id": "before-fuzz" },
{ "type": "input", "events": [ /* random sequence */ ] },
{ "type": "wait", "seconds": 2 },
{ "type": "restore", "id": "before-fuzz" },
{ "type": "assert_state", "tagged_key": "player.hp", "expected_value": 100 }
```

If the restored state diverges from the snapshot, your save / restore code has a bug.

## Reference scenarios

The five scenarios shipped with the skill:

| File | Phase | What it proves |
|---|---|---|
| [`00-sdk-smoke.json`](00-sdk-smoke.json) | any | The SDK is up and the contract works (every endpoint responds 200). |
| [`01-prototype-first-minute.json`](01-prototype-first-minute.json) | Prototype | Time-to-first-verb / first-reward / first-failure are within target. |
| [`02-vertical-slice-friction.json`](02-vertical-slice-friction.json) | Vertical Slice | Player can complete the slice without soft-locking; pauses at known friction points for inspection. |
| [`03-polish-game-feel.json`](03-polish-game-feel.json) | Polish | Hit-pause and screen-shake fire at the right moments and not at the wrong ones. |
| [`04-cert-controller-disconnect.json`](04-cert-controller-disconnect.json) | Cert | Game survives controller disconnect and reconnect without state corruption. |
| [`05-cert-save-fuzz.json`](05-cert-save-fuzz.json) | Cert | Save / restore round-trip preserves all tagged player state across many cycles. |

## Promoting scenarios

When a scenario is game-specific, keep it next to the game (e.g. `playtest/scenarios/` inside the project). When it's reusable across multiple games — for a studio sharing scenarios across projects — promote it to a shared location (e.g. `studio/playbooks/playtest/`) and reference it from each game.

## What scenarios don't do

- They don't replace human playtesting. They replace **repeated** human playtesting — the smoke pass that confirms nothing regressed.
- They don't validate art, audio, or narrative quality. Those need a human ear / eye.
- They don't (yet) work in builds where the SDK is omitted. Cert builds typically disable the SDK; run scenarios against dev builds.
