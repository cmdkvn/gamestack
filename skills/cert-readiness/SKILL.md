---
name: cert-readiness
description: Platform Cert Officer skill — walks PS5 TRC, Xbox TCR/XR, Switch lotcheck, and Apple App Store Review checklists targeting the high-failure-rate items (sleep/resume, controller disconnect, save corruption, network drop, age rating consistency, App Tracking Transparency, privacy manifest, StoreKit receipt validation). Produces a per-platform readiness report with P0 blockers, P1 strongly-recommended fixes, and a submission-readiness verdict. Use before cert submission, and after every patch that touches platform-affecting systems.
---

# cert-readiness

Platform cert checklists (Sony PartnerNet, Microsoft Partner Center, Nintendo Developer Portal) are NDA-protected and change between submissions. This skill does **not** substitute for the platform's checklist — it catches public-knowledge high-failure-rate items (sleep/resume, controller disconnect, save corruption, network drop, age rating consistency) *before* the developer hits submit. One avoided rejection saves a week.

## When to fire

Use during cert prep and after every patch in cert phase. Trigger phrases:
- "Run cert readiness"
- "Cert audit for <platform>"
- "Am I ready for cert?"
- "Pre-cert check"
- `/cert-readiness [ps5|xbox|switch|ios|all]`

If the developer hasn't reached the Cert production phase yet (per their CLAUDE.md), surface that — running this audit on a Production-phase build wastes effort.

## The lens — high-failure-rate items by platform

These are public-knowledge categories. The exact bullet list in each platform's NDA-protected checklist is more detailed, but these categories cover ~80% of indie cert rejections.

### Sony PS5 (TRC)

| Category | What cert tests |
|---|---|
| Memory management | No leaks during long sessions, no OOM on platform-set memory cap |
| PSN integration | Sign-in, sign-out, Friends, Messages from in-game |
| Trophy implementation | Full set including platinum (if structure permits), unlock persists offline, syncs online |
| DualSense usage | Haptics + adaptive triggers used meaningfully (not just default rumble) |
| Sleep / resume | Game survives suspend during every state: gameplay, menus, cutscenes, loading |
| Controller disconnect | Game pauses gracefully; reconnect resumes cleanly |
| Save data integrity | Atomic writes survive power loss; no corruption under contention |
| Cross-region pricing | All listed regions have prices and ratings set |

### Microsoft Xbox (TCR / XR)

| Category | What cert tests |
|---|---|
| Achievement implementation | Full set; unlocks fire correctly; persist offline; sync online |
| Profile switching | Mid-session profile switch handled without crash or save corruption |
| Quick Resume | Game restores arbitrary state without explicit save — *the* Xbox-unique gate |
| Cloud saves | Round-trip via Connected Storage; conflict resolution implemented |
| Accessibility | Subtitles default ON; remappable controls; visual representation of audio; **Xbox is the strictest of the three on a11y** |
| Microsoft Game Bar / Capture | Game allows recording where required; no rejection of capture overlay |
| HDR / Auto HDR | If used, no visual artifacts; falls back cleanly on non-HDR displays |
| Sign-in / sign-out | Handled mid-session without losing state |

### Nintendo Switch (lotcheck)

| Category | What cert tests |
|---|---|
| Controller modes | Handheld, tabletop (split Joy-Con), Pro Controller — all work; right glyphs shown |
| Sleep / resume | Lotcheck's most-failed item. Test by suspending during *every* state — gameplay, cutscenes, every loading screen, menu, save point |
| Parental controls | Game respects platform-set parental limits (rating gates, web access, communication) |
| Suspend during write | Save mid-write survives suspend without corruption |
| Memory ceiling | Fits in 4 GB handheld budget with OS reservation |
| Boot time | Under platform threshold (typically < 30 s cold start) |
| Localization | All shown strings localized for every shipped language; no clipping at long-language widths |
| Age rating consistency | Same rating shown in eShop, in-game splash, parental control panel |

### Apple App Store (iOS)

App Review is policy + technical review combined. Reviews are 24–72 hours typical, but rejections are common on first submission for indies. Review Guidelines change frequently — always pull the current text from the [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) the week before submission.

| Category | What App Review tests |
|---|---|
| App Tracking Transparency (ATT) | If the app tracks the user across other apps / sites (analytics SDKs, ad attribution), `AppTrackingTransparency.requestTrackingAuthorization` must fire, and `Info.plist` must include `NSUserTrackingUsageDescription` with a player-facing reason. **Prompt placement** matters — prompting on first launch before the player sees value is a common rejection (Guideline 5.1.2). |
| Privacy manifest (`PrivacyInfo.xcprivacy`) | Required for the app binary and for every third-party SDK starting May 2024 (Guideline 5.1.1). Missing privacy manifests fail at App Store upload. Required-Reason API declarations must list every reason the app uses categories like `UserDefaults`, `FileTimestamp`, `BootTime`, `SystemBootTime`. |
| `Info.plist` usage descriptions | `NSPhotoLibraryUsageDescription`, `NSCameraUsageDescription`, `NSMicrophoneUsageDescription`, `NSLocationWhenInUseUsageDescription`, `NSContactsUsageDescription`, `NSMotionUsageDescription`, `NSBluetoothAlwaysUsageDescription`, `NSLocalNetworkUsageDescription` — **each must be present and player-facing** for any permission the app requests at runtime. Boilerplate ("required for app functionality") is rejected; the reason must be specific. |
| Guideline 2.5.1 — APIs only | No private API calls, no JIT for arbitrary code, no downloaded executable code that bypasses App Review. Detect via `dlopen` on undocumented symbols, `objc_msgSend` on private selectors. Bitcode is deprecated; do not enable. |
| Guideline 2.5.2 — self-contained | The app must function (in some form) without downloading additional executable code at runtime. On-demand resources for assets are fine; downloading game logic / scripts that change behavior is a rejection. |
| Guideline 4 — Design quality | Crashes on launch on the reviewer's device = instant rejection. Test the build on the lowest device tier you claim to support before upload. Crash-on-launch from missing `Info.plist` keys is the single most common indie rejection. |
| TestFlight beta gate | TestFlight requires App Store Connect setup, a tester group, a beta build with `CFBundleShortVersionString` < the planned App Store version, and an "App Information" page complete with screenshots and category. **TestFlight rejection is faster than App Store rejection** but uses much of the same checklist — use TestFlight as a dress rehearsal. |
| StoreKit receipt validation | If the app uses IAP: validate receipts **server-side**, not on-device. Apple's `verifyReceipt` endpoint is deprecated; StoreKit 2's `Transaction.currentEntitlements` async stream is the modern path and is server-validated by Apple. Client-only validation is a P0 — both for cheating risk and for App Review (Guideline 3.1.1 expects server-validated entitlements for non-consumable IAP). |
| Privacy nutrition labels | App Store Connect requires a complete "App Privacy" questionnaire (categories of data collected, link to data type, whether it's used for tracking). Missing or inaccurate labels are a rejection at submission. Update with every release that changes the data collection surface. |
| 64-bit only | Required since iOS 11 (2017). Arm64 architecture only; `ARCHS` in the project should be `$(ARCHS_STANDARD)`. Any 32-bit code path will fail the upload. |
| Cross-region listings | All regions you ship to must have prices set, localized descriptions, screenshots in each language, age rating consistent with the in-app rating splash and parental controls panel. Inconsistency is a common rejection on multi-region submissions. |

## Process

### Step 1 — confirm phase and platform

Read the game's CLAUDE.md for the current production phase. If not `Cert`, ask: "This audit is meant for the Cert phase. Run anyway?" — proceed only on confirm.

Confirm which platform(s) to audit. Default: all platforms with marker files present.

| Marker | Platform |
|---|---|
| `ProjectSettings/ProjectSettings.asset` contains `iOS` / `Android` / `Standalone` | PC / mobile path |
| Unity export module for `PS5` enabled | PS5 |
| Unity export module for `XboxOne` / `GameCoreXboxSeries` enabled | Xbox |
| Unity export module for `Switch` enabled | Switch |
| `*.xcodeproj`, `*.xcworkspace`, `Package.swift` with iOS target, `Info.plist` with `UIRequiredDeviceCapabilities` | iOS (App Store) |
| Otherwise | ask the developer |

### Step 2 — pull the latest official checklist

You are NOT shipping the actual cert checklist from memory — those checklists are NDA-protected and change between submissions. Instead:

1. Remind the developer to download the **current** TRC / TCR / lotcheck from their platform's developer portal.
2. Identify the version on file in their project (e.g., `docs/cert/ps5-trc-v9.2.pdf`).
3. Cross-reference against the categories above to ensure no major category was added in the latest revision.

If no version on file, surface it as a P0: "Audit against the current checklist before submission."

### Step 3 — walk the high-failure-rate categories

For each platform being audited, for each category above:

1. **Examine the code path** that handles the category. Use `/code-review-gamestack`'s engine-detection pattern to locate it.
2. **Cross-reference with playtest scenarios.** If there's a relevant cert-class scenario (e.g., `04-cert-controller-disconnect.json`, `05-cert-save-fuzz.json`), check whether it's been run on the current build.
3. **Classify the finding:**
   - **PASS** — code is in place and a recent playtest run confirms.
   - **PASS (code only)** — code is in place but no recent live test.
   - **NEEDS_LIVE_TEST** — code looks correct; cert-class playtest scenario hasn't run yet.
   - **FAIL P0** — known gap that will block submission.
   - **FAIL P1** — code is there but rough edges remain.
   - **NOT_APPLICABLE** — game doesn't use this feature (e.g., no trophies because mechanics don't suit them).

### Step 4 — surface the unique-to-game cert items

Beyond the categories above, surface any of these that apply:

- **Photosensitivity warning** if storms / explosions / strobe.
- **Region-specific content** if the game adapts (e.g., German language gore restrictions).
- **Online features** — does PSN / Xbox Live / NSO sign-in have a clean offline mode?
- **Multiplayer** — does the game handle host migration / disconnect / NAT failure?
- **Crossplay** — does it handle player profile switching on the local side?

### Step 5 — produce the per-platform report

To `playtest/cert-readiness/<platform>-YYYY-MM-DD.md`.

### Step 6 — produce a top-of-stack action list

After per-platform reports, produce a single combined action list ordered by:
1. P0 blockers — most-load-bearing first.
2. P1 strongly-recommended — quick wins first.
3. NEEDS_LIVE_TEST — ordered by which scenarios run cheapest.

## Output format

Per platform:

```
PLATFORM: <PS5 | Xbox | Switch>
CHECKLIST VERSION ON FILE: <version | NOT FOUND — P0>
BUILD: <git rev>

PASS  PASS-CODE-ONLY  NEEDS-LIVE-TEST  FAIL-P0  FAIL-P1  N/A
  N        N                N             N        N      N

──────────────────────────────────────────
CATEGORY                        VERDICT      DETAIL
──────────────────────────────────────────
Memory management               PASS
PSN integration                 NEEDS_LIVE_TEST  (no playtest run in 30 days)
Trophy implementation           FAIL_P0      Missing platinum — structure permits one
Sleep / resume                  PASS_CODE_ONLY   Run scenario 04-cert-... before submit
...

UNIQUE-TO-GAME ITEMS
  - Photosensitivity warning: PRESENT
  - Offline mode for PSN sign-in: MISSING (FAIL_P1)
```

Combined action list:

```
ACTION LIST (prioritized)
  P0 — fix before submission
    1. <action> — <platform> — <category>
    2. ...

  P1 — strongly recommended
    1. ...

  NEEDS_LIVE_TEST — run these scenarios first
    1. `/playtest 04-cert-controller-disconnect` on <platform>
    2. `/playtest 05-cert-save-fuzz` on <platform>
    3. ...

  SUBMISSION READINESS PER PLATFORM
    PS5:    READY | NEEDS_WORK | BLOCKED — <one-line reason>
    Xbox:   ...
    Switch: ...
```

## What NOT to do

- **Don't claim to be a substitute for the NDA-protected checklist.** Always remind the developer to download the current one.
- **Don't mark anything PASS without a live test.** PASS_CODE_ONLY is honest; PASS without test data is misleading.
- **Don't accept "we tested it once two months ago."** Each patch to platform-affecting systems re-opens the cert surface.
- **Don't auto-apply fixes to cert-affecting code.** Surface and propose; the developer decides.
- **Don't run this on a Production-phase build.** Cert-readiness on incomplete games burns effort.
- **Don't promise the audit will catch every cert rejection.** It catches the high-failure-rate categories. The NDA-protected checklist has more.

## Platform-specific reminders

### PS5
- Trophy structure: if there's any "100% complete" notion in the design, a platinum is expected. Skipping it lowers the game's trophy weighting in PSN and disappoints completionists.
- DualSense: meaningful use of haptics + adaptive triggers is checked in cert. "Default rumble on hit" is not enough.

### Xbox
- Accessibility is the strictest. ID@Xbox publishes a recommended list — match it.
- Quick Resume failures are usually save-system bugs surfacing as something else. If save-fuzz scenarios pass, Quick Resume usually does.

### Switch
- Suspend/resume is the killer item. Test by hitting the home button during every conceivable game state.
- Localization quality affects lotcheck — clipped strings at long-language widths fail.

### iOS (App Store)
- The **ATT prompt placement** is the most-cited indie rejection in the 2024-2026 window. Don't prompt on first launch. Prompt after the player has seen what the app does and the prompt has a clear reason that maps to the `NSUserTrackingUsageDescription` text.
- The **privacy manifest** (`PrivacyInfo.xcprivacy`) requirement bites every third-party SDK that hasn't shipped one yet. Audit every framework in `Frameworks/` and every SPM dependency. If a dependency lacks a privacy manifest, either pin to a version that has one, fork it, or remove it before submission.
- **TestFlight is the dress rehearsal.** Run the build through TestFlight to at least one external tester before App Store submission. TestFlight catches crash-on-launch, missing `Info.plist` keys, and Bad permission-prompt UX while the cost is hours, not weeks.
- **Privacy nutrition labels** are entered in App Store Connect, not the binary. Update them every release whose data collection surface changes (new SDK, new analytics, new IAP).
- StoreKit 2 is the modern path. If the project is still on StoreKit 1 with `verifyReceipt` against Apple's URL, surface a P1 — Apple has not killed the endpoint yet, but the path is on borrowed time and client-only validation is a cheating risk regardless.

## Handoff

After cert-readiness:
- For each NEEDS_LIVE_TEST: run `/playtest <scenario>` on the relevant platform build.
- For each P0/P1: `/code-review-gamestack` on the affected code, then `/bug-hunt` if the cause isn't obvious.
- After fixes land: `/cert-readiness` again before submission.
- After submission: `/publish` once cert passes.
- For CI gating: the [`gamestack-cert-checklist`](../../bin/impl/cert-checklist/README.md) CLI runs the same lens on every push so regressions surface before the next interactive audit.
