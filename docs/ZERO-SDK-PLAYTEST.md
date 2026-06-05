# Zero-SDK playtest mode

The engine SDK (Unity UPM package or Godot addon) gives `/playtest` full power: input injection, state inspection, snapshot/restore, breakpoints. The install is a few minutes once you've done it. The first time, it can be a yak-shaving session you didn't plan for.

Zero-SDK mode exists so the first useful `/playtest` run can happen **before** you install anything. You drive the game manually; gamestack watches your screenshots, diffs them against a baseline, and flags visual regressions.

This is the default fallback when:
- The SDK isn't installed.
- The SDK is installed but doesn't load (a common state mid-Unity-upgrade).
- The developer just wants a fast visual check without bringing up the SDK.

The SDK upgrade is opt-in. See [`docs/ENGINES.md`](ENGINES.md) when you're ready.

## What you give up

| Capability | SDK live | Zero-SDK |
|---|---|---|
| Visual regression vs. baseline | ✓ | ✓ |
| Input injection (synthetic button presses) | ✓ | — (you press the buttons) |
| Reading `tagged.*` fields from the game | ✓ | — |
| `snapshot` / `restore` save fuzzing | ✓ | — |
| Pausing at a `breakpoint` for inspection | ✓ | — |
| Cert-class scenarios (controller disconnect, save fuzz) | ✓ | — |

Roughly: zero-SDK is **half** of what live-SDK does. The half it doesn't cover is the half that matters most for cert and save-data work. The half it does cover (visual regression) is what most early-prototype playtests are actually about.

## Setup

```
your-game/
  playtest/
    screenshots/        ← drop new screenshots here during a run
    baseline/
      <scenario>/       ← gamestack reads these as the reference frames
```

You need a way to drop a PNG into `playtest/screenshots/` at the moment a step calls for it. Any of these works:

- **Engine hotkey.** Wire a `Capture` action in your input map to `Application.CaptureScreenshot()` (Unity) or `get_viewport().get_texture().get_image().save_png()` (Godot) into the screenshots dir. Two minutes to set up.
- **OS screenshot.** macOS: `screencapture -i playtest/screenshots/$(date +%s).png`. Windows: Snip & Sketch with file save. Linux: `gnome-screenshot -f`.
- **OBS / streaming tool.** Bind a hotkey to "take screenshot" and aim its output at `playtest/screenshots/`.

Filename doesn't matter — the daemon sorts by creation time and matches files to scenario steps by order.

## Running a session

From a Claude Code session:

```
/playtest --mode=screenshot-diff
```

`/playtest` picks the phase-appropriate scenario, then prints one step at a time:

```
Step 1 of 4 — title screen
  When you see the title screen has finished fading in, hit your screenshot hotkey.
  Waiting for playtest/screenshots/*.png ...
```

When the daemon detects a new file, it diffs against the matching baseline frame (`playtest/baseline/<scenario>/01-title-screen.png`) and reports:

```
✓ Step 1 — title screen — 0.2% pixel-delta (threshold: 5%) — PASS
```

or:

```
✗ Step 4 — boss-room HUD — 9.4% pixel-delta — FAIL
  diff image: playtest/last-run/04-boss-room-hud-diff.png
```

The daemon writes the run report to `playtest/last-run/run.md`.

## Baselines

The first time you run a scenario in zero-SDK mode, there's no baseline. The daemon prompts:

```
No baseline at playtest/baseline/02-vertical-slice-friction/.
Treat this run as the new baseline? [y/N]
```

If you say yes, the captures are copied into the baseline directory. Subsequent runs diff against them. Rebaseline manually any time the visuals change intentionally:

```bash
cp playtest/last-run/*.png playtest/baseline/<scenario>/
```

## Threshold tuning

Default threshold: 5% pixel-delta. Tighter (1%) catches HUD value changes. Looser (15%) tolerates GPU non-determinism. Set per scenario in the scenario JSON:

```json
{
  "name": "vertical-slice-friction",
  "screenshot_diff_threshold": 0.03
}
```

Or per-invocation:

```bash
/playtest --mode=screenshot-diff --threshold=0.03
```

## When to upgrade to the SDK

You'll know. The signals:

- You start writing scenarios with `assert tagged.player.hp == 100` and the daemon keeps skipping them.
- You want to fuzz save files for cert.
- You want a clean CI gate that doesn't require a human at the keyboard.

Once you're ready: [`docs/ENGINES.md`](ENGINES.md) walks the install. The SDK and zero-SDK modes use the same scenario format, so your existing scenarios keep working.

## Why this exists

The first version of `/playtest` required the SDK. Real-user data showed most solo devs bounced at the install step. Zero-SDK mode is the cheaper on-ramp — useful immediately, no install friction, no decision to commit to the SDK before you've felt the value.

The "feedback that drove this change" lives in `.gamestack/skill-feedback.jsonl` for any project that uses the [`/skill-feedback`](../skills/skill-feedback/SKILL.md) skill. If you want the SDK install to feel like an obvious upgrade rather than an obstacle, that's the loop that gets us there.
