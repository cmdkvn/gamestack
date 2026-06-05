# How to walk a tiny indie through Switch lotcheck without losing a week

The promise of gamestack at cert phase is *catching the rejection before you hit submit.* Lotcheck rejections cost a calendar week each, and indie cert failures cluster in the same five categories every time. This walkthrough takes a solo dev from "I think the game is done" through a real submission window — the audit, the freeze, the cert-class playtests, and the manual upload.

The example game is **Pip's Garden** — the single-screen weather-garden game from [the first-hour walkthrough](howto-first-game-in-an-hour.md). Eighteen months in. Eight weather events, one slow-growth campaign, Switch as the lead platform. The dev (one person) is two weeks from lotcheck submission and has never been through cert before.

Don't take the timeline literally. The point is the *shape* of the two weeks.

## Day -14: honest audit (`/cert-readiness`)

The dev has flipped the game's `CLAUDE.md` to declare:

```
## Current production phase
Cert
```

That single line is load-bearing. Every cert-aware skill reads it and calibrates. Without it, `/cert-readiness` asks the obvious question and refuses to proceed.

Open Claude Code in the game directory. Type:

```
/cert-readiness switch
```

The Platform Cert Officer reads the phase, finds the Switch export module enabled in `ProjectSettings/`, and walks the high-failure-rate categories. The first thing it does is *not* run the audit:

```
CHECKLIST VERSION ON FILE
  docs/cert/switch-lotcheck-*.pdf      NOT FOUND
  → FAIL_P0. Download the current lotcheck from Nintendo Developer Portal
    before running this audit. The version on the portal supersedes anything
    this skill knows.
```

That's not a bug. The NDA-protected checklist lives on the portal and changes between submissions; this skill never claims to be a substitute. The dev downloads `switch-lotcheck-v15.3.pdf`, drops it in `docs/cert/`, and re-runs.

```
PLATFORM: Switch
CHECKLIST VERSION ON FILE: switch-lotcheck-v15.3.pdf
BUILD: 7a91c4e

PASS  PASS-CODE-ONLY  NEEDS-LIVE-TEST  FAIL-P0  FAIL-P1  N/A
  1        3                2             1        2      0

──────────────────────────────────────────
CATEGORY                      VERDICT          DETAIL
──────────────────────────────────────────
Controller modes              PASS_CODE_ONLY   Joy-Con + Pro paths exist;
                                               no recent playtest run.
Sleep / resume                 FAIL_P0          No OnApplicationPause handler in
                                               GardenController.cs. Lotcheck's
                                               most-failed item.
Parental controls              PASS
Suspend during write           FAIL_P1          AtomicSave.cs uses File.Replace
                                               but doesn't flush before swap.
Memory ceiling                 NEEDS_LIVE_TEST  Static check passes; needs a
                                               4 GB handheld run.
Boot time                      PASS_CODE_ONLY   Last measured 18s on dev kit;
                                               re-measure on retail kit.
Localization                   FAIL_P1          German strings clip in 3 menus.
                                               See playtest/loc-clip-de.png.
Age rating consistency         NEEDS_LIVE_TEST  In-game splash shows PEGI 3.
                                               Confirm eShop matches.

UNIQUE-TO-GAME ITEMS
  - Photosensitivity warning: PRESENT (frost-strobe event)
  - Offline mode for NSO sign-in: PRESENT
```

The verdict at the bottom:

```
SUBMISSION READINESS — Switch: BLOCKED
  1 P0 (sleep/resume), 2 P1 (save flush, German clip), 2 live tests required.
  Estimated work: 5-7 days. Re-run cert-readiness after fixes.
```

This is the moment most indies discover what cert actually costs. Five to seven days for what the Platform Cert Officer can see; the NDA checklist will have more.

The report lands at `playtest/cert-readiness/switch-2026-06-05.md`. The dev reads it twice and commits.

## Day -13: lock the cert window (`/cert-freeze`)

```
/cert-freeze
```

The skill confirms the project's phase is `Cert`, then locks the edit zone:

```
CERT-FREEZE — restricted to:
  - Builds/
  - docs/cert/
  - playtest/cert-readiness/
  - playtest/playtest-*/

CAREFUL is on. Destructive ops require confirmation.

Cert window reminders:
  Platform:        Switch
  Checklist:       docs/cert/switch-lotcheck-v15.3.pdf
  Last audit:      playtest/cert-readiness/switch-2026-06-05.md
                   → BLOCKED. 1 P0, 2 P1, 2 NEEDS_LIVE_TEST.
```

What this gets you: the dev cannot accidentally edit `GardenController.cs` from inside Claude Code while doing cert work. Gameplay code, scripts, prefabs, materials, scenes — all refused. Edits to the build directory, the cert docs, and the playtest reports — allowed.

The dev's instinct is to immediately fix the sleep/resume P0. But that's a gameplay-code change, and it falls outside the freeze. The path is explicit:

```
You: edit Assets/Scripts/Garden/GardenController.cs
gamestack: That file is outside the /cert-freeze zone. Editing it
  invalidates the current build and resets the cert window.

  If this fix is cert-blocking and intentional:
    1. /unfreeze
    2. Make the change
    3. /cert-freeze
    4. Re-run /cert-readiness

  Cost of accepting: rebuild + resubmission + ~1 week to re-enter queue
  if you've already submitted. (You haven't submitted.)

  Proceed? (yes / no)
```

The dev confirms — this is exactly the kind of explicit acceptance the freeze is designed to force. `/unfreeze`, make the change, `/cert-freeze` again. The cost is real, and the cost is named.

## Day -12 through -10: kill the P0 and the P1s

The sleep/resume fix takes most of day -12. The pattern is Unity-standard: implement `OnApplicationPause(bool pause)`, persist the play state on pause, restore on resume, and add a `default.paused` tagged-state field so the playtest scenario can verify.

Day -11, the save flush fix. `AtomicSave.cs` was writing to a temp file and swapping with `File.Replace`, which is the right pattern, but it never called `Flush()` or `FlushFileBuffers` before the swap. On Switch, a power loss in the wrong 50 ms window leaves the temp file half-written but the swap committed. The fix is two lines.

Day -10, the German localization clips. The fix is in `Assets/Locale/de.json` and three TMP_Text components that have hard pixel widths. Not gameplay code; the freeze allows it because the dev `/unfreeze`d once at the start of the day, did all the loc work in one block, and `/cert-freeze`d back.

End of day -10, re-run:

```
/cert-readiness switch
```

```
PLATFORM: Switch
CHECKLIST VERSION ON FILE: switch-lotcheck-v15.3.pdf
BUILD: f02d811

PASS  PASS-CODE-ONLY  NEEDS-LIVE-TEST  FAIL-P0  FAIL-P1  N/A
  1        5                2             0        0      0

SUBMISSION READINESS — Switch: NEEDS_WORK
  0 P0, 0 P1. 2 live tests still required.
  Estimated work: 1-2 days of cert-class playtest runs.
```

The blockers are gone. What's left is what was always left: the live tests that can only be verdict'd by running the cert-class scenarios against a real build.

## Day -9: drive the cert scenarios (`/playtest`)

The Switch dev kit is on, the build is loaded, and the gamestack engine SDK is reachable at `http://localhost:7331`.

```
/playtest 04-cert-controller-disconnect
```

The QA Lead probes the SDK, loads the scenario, and executes:

```
SCENARIO: cert-controller-disconnect
  ✓ wait_for_state default.inPlay=true        OK   1.2s
  ✓ input Gamepad Horizontal=1.0              OK
  ✓ wait 1s                                   OK
  ✓ screenshot 01-gameplay-active.png         OK   18 KB
  ✓ snapshot pre-disconnect                   OK   id=snap-3
  ✓ input simulate-controller-disconnect      OK
  ✓ wait_for_state default.paused=true        OK   0.4s
  ✓ screenshot 02-disconnected.png            OK   16 KB
  ✓ assert_state default.playerControllerConnected=false   PASS
  ✓ assert_state default.savedDataIntact=true              PASS
  ✓ input simulate-controller-reconnect       OK
  ✗ wait_for_state default.playerControllerConnected=true  TIMEOUT after 10s

  FINDING 1
    Scenario step:  reconnect wait
    Expected:       playerControllerConnected=true within 10s
    Actual:         still false at timeout
    State delta:    no change after reconnect input
    Severity:       P0 (cert blocker — game does not recover from reconnect)
```

This is exactly what cert is meant to surface. The disconnect path was implemented; the *reconnect* path was assumed. On a Switch dev kit, the assumption breaks because the controller reconnect event arrives through a different platform callback than the dev's PC test had used.

The dev `/unfreeze`s, traces the reconnect handler in `InputManager.cs`, finds that the handler subscribes to the wrong event, fixes it, `/cert-freeze`s back, and re-runs:

```
/playtest 04-cert-controller-disconnect
```

```
SCENARIO: cert-controller-disconnect
  ✓ ... (all 14 steps)
  PASS  duration 22.4s

REGRESSION SCENARIO ADDED: playtest/regression/pips-garden-reconnect-2026-06-09.json
```

The regression scenario is the load-bearing artifact. It joins the smoke suite so the bug cannot silently come back during a future patch.

Now the save fuzz:

```
/playtest 05-cert-save-fuzz
```

```
SCENARIO: cert-save-fuzz
  ✓ wait_for_state default.inPlay=true        OK
  ✓ snapshot fuzz-cycle-1                     OK
  ✓ input PrimaryAction + Right               OK
  ✓ wait 2s                                   OK
  ✓ restore fuzz-cycle-1                      OK
  ✓ assert_state player.hp=100                PASS
  ✓ assert_state player.score=0               PASS
  ✓ snapshot fuzz-cycle-2                     OK
  ✓ input Up + SecondaryAction                OK
  ✓ wait 2s                                   OK
  ✓ restore fuzz-cycle-2                      OK
  ✓ assert_state player.hp=100                PASS
  ✓ assert_state player.score=0               PASS
  ✓ snapshot fuzz-cycle-3                     OK
  ✓ input PrimaryAction + Right (held)        OK
  ✓ wait 3s                                   OK
  ✓ restore fuzz-cycle-3                      OK
  ✓ assert_state player.hp=100                PASS
  ✓ assert_state player.score=0               PASS

  PASS  duration 14.1s
```

Clean run. The save flush fix from day -11 held. The dev sleeps well for the first time in a week.

## Day -7: the in-CI sweep (`gamestack-cert-checklist`)

Cert-class playtests should not depend on the dev remembering to run them. The dev wires the CLI into GitHub Actions so every push to the cert branch surfaces a fresh checklist:

```yaml
jobs:
  cert-readiness:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: gamestack-cert-checklist --project . --platform switch --format both --out cert --strict
      - if: always()
        uses: actions/upload-artifact@v4
        with: { name: cert-readiness, path: cert.* }
```

`--strict` makes the CI fail on P1 as well as P0. With seven days to lotcheck, P1 issues are blockers in spirit even if the platform would technically pass them.

The CI run lands clean. Two artifacts get uploaded: `cert.md` (human-readable) and `cert.json` (for the dashboard). The dev pins the run to the cert tracking issue.

In parallel, the dev wires `gamestack-playtest-daemon` to run the same two cert scenarios against a headless build:

```yaml
      - name: Launch headless build
        run: ./scripts/launch-headless-build &
      - name: Wait for SDK health
        run: timeout 30 bash -c 'until curl -fs http://localhost:7331/health; do sleep 1; done'
      - name: cert-controller-disconnect
        run: gamestack-playtest-daemon --scenario skills/playtest/scenarios/04-cert-controller-disconnect.json --format json --out disconnect.json
      - name: cert-save-fuzz
        run: gamestack-playtest-daemon --scenario skills/playtest/scenarios/05-cert-save-fuzz.json --format json --out save-fuzz.json
```

Now any regression in the next seven days will surface within the hour, not at the moment of submission.

## Day -4: final audit and the human-only items

Run the audit one more time. Everything that the lens can see is green:

```
PLATFORM: Switch
CHECKLIST VERSION ON FILE: switch-lotcheck-v15.3.pdf
BUILD: 3c19a2f

PASS  PASS-CODE-ONLY  NEEDS-LIVE-TEST  FAIL-P0  FAIL-P1  N/A
  6        2                0             0        0      0

SUBMISSION READINESS — Switch: READY
  0 P0, 0 P1, all live tests recent.
  Caveat: this lens covers public-knowledge high-failure-rate
  categories only. The NDA-protected lotcheck has more.
```

The caveat is the most important sentence in the report.

The skill surfaces a short list of items it cannot verdict on its own — they live in the NDA checklist and require human eyes on the developer portal:

```
ITEMS THIS AUDIT CANNOT VERIFY (NDA-protected, check the portal)
  - Current lotcheck SKU naming conventions and submission metadata.
  - Marketing materials approval workflow.
  - Title screen / age rating splash exact dwell time.
  - Network feature certification (if any new ones added since v15.3).
  - Per-region store metadata (regional descriptions, screenshots).
```

The dev opens the portal, walks each item, and checks them off in `docs/cert/submission-checklist-2026-06-10.md` by hand.

## Day -2: prep the build (`/publish` — pre-flight only)

```
/publish --target switch --dry-run
```

Important: gamestack does not auto-upload to console partner portals. That's an explicit boundary. `/publish --dry-run` performs the pre-flight: version bump, last-mile cert checklist re-run, build artifact verification, patch-notes draft. Then it surfaces the build path and a manual upload checklist.

```
PUBLISH — DRY RUN
  Target:          Switch (lotcheck)
  Version:         1.0.0 → 1.0.0 (no bump; first submission)
  Build artifact:  Builds/Switch/PipsGarden-1.0.0.nsp
  Build size:      217 MB
  Last cert check: 2026-06-10 (today). READY.
  Patch notes:     drafted at docs/release/v1.0.0-notes.md (review before upload)

MANUAL UPLOAD CHECKLIST
  1. Log into Nintendo Developer Portal.
  2. Navigate to Pip's Garden → Submissions → New Submission.
  3. Upload Builds/Switch/PipsGarden-1.0.0.nsp.
  4. Attach docs/release/v1.0.0-notes.md as submission notes.
  5. Confirm SKU + region + age rating match docs/cert/switch-lotcheck-v15.3.pdf.
  6. Submit.

gamestack does NOT upload to the portal. This is by design.
```

The dev reads the checklist, opens the portal, and walks the upload step by step. The submission goes in at 4:12 PM on day -2.

## Day 0: submitted, waiting

The build is in the lotcheck queue. There is nothing for gamestack to do, and that's also by design. `/cert-freeze` stays active so the dev cannot accidentally edit a gameplay file while waiting.

The CI keeps running the same cert checks against the cert branch. If a hotfix becomes necessary mid-lotcheck, the dev will know within an hour whether the fix re-opens a category that was previously PASS.

Five days later, lotcheck comes back PASS. The dev runs `/cert-pass`, which lifts the freeze and surfaces the launch-day handoff.

## What just happened

In two weeks you went from "I think the game is done" to:

- A real audit against the public-knowledge high-failure-rate categories (`playtest/cert-readiness/switch-2026-06-05.md`).
- One P0 fix (sleep/resume), two P1 fixes (save flush, German clip), each scoped and committed.
- Two cert-class scenarios run on the dev kit (`04-cert-controller-disconnect`, `05-cert-save-fuzz`).
- One regression scenario for the reconnect bug that lotcheck would otherwise have caught (`playtest/regression/pips-garden-reconnect-2026-06-09.json`).
- CI wired to run both scenarios and the cert checklist on every push.
- A hand-walked checklist of the NDA-protected items the lens cannot verify.
- A clean manual submission via the developer portal — no auto-upload, by design.
- One lotcheck pass on the first attempt.

Without gamestack, the same two weeks usually produce a guess at what cert wants, a build submitted on hope, and a rejection that reads "controller does not recover from disconnect" — a category the dev had never thought to test because it never failed on PC.

The skills don't ship the game. They surface the questions cert is going to ask, force the dev to answer them in writing, and persist the answers so the next patch doesn't silently regress.

## What comes next

- **Launch day.** [`/launch-day`](../../skills/launch-day/SKILL.md) — Steam page goes live, build flips to public on the eShop, post-launch monitor kicks on.
- **First 30 days.** [`/post-launch-monitor`](../../skills/post-launch-monitor/SKILL.md) daily — Steam reviews, crash rate, refund trend, top community complaints.
- **First patch.** Anything that touches platform-affecting code re-opens the cert surface. Re-run [`/cert-readiness`](../../skills/cert-readiness/SKILL.md) before submitting the patch.
- **Second platform.** Same shape, swap `switch` for `ps5` or `xbox`. Xbox accessibility cert is the strictest of the three; budget extra time.

## Related

- [`/cert-readiness`](../../skills/cert-readiness/SKILL.md) — Platform Cert Officer; the audit walked through here.
- [`/cert-freeze`](../../skills/cert-freeze/SKILL.md) — locks the build during the submission window.
- [`/playtest`](../../skills/playtest/SKILL.md) — drives the cert-class scenarios end-to-end.
- [`gamestack-cert-checklist`](../../bin/impl/cert-checklist/README.md) — the same lens, CI-friendly, exits non-zero on P0.
- [`gamestack-playtest-daemon`](../../bin/impl/playtest-daemon/README.md) — runs scenario JSON against a headless build in CI.
- [`/publish`](../../skills/publish/SKILL.md) — pre-flight + manual upload checklist; never auto-uploads to console portals.
- [`/code-review-gamestack`](../../skills/code-review-gamestack/SKILL.md) — for the fixes surfaced by the audit.
- [`/bug-hunt`](../../skills/bug-hunt/SKILL.md) — when a cert finding doesn't have an obvious root cause.
- The previous tutorial: [howto-first-game-in-an-hour](howto-first-game-in-an-hour.md).
