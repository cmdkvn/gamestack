<!--
artifact: cert-readiness
authored_by: cert-readiness
schema_version: 1
when_written: "Before cert submission; after every patch touching platform-affecting systems."
-->

# cert-readiness report schema

One file per platform, written to `playtest/cert-readiness/<platform>-YYYY-MM-DD.md`.
After all per-platform files are written, the skill produces a single combined action list.

---

## Per-platform report

```
PLATFORM: <PS5 | Xbox | Switch | iOS>
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

### Verdict values

| Verdict | Meaning |
|---|---|
| PASS | Code is in place and a recent playtest run confirms. |
| PASS_CODE_ONLY | Code is in place but no recent live test. |
| NEEDS_LIVE_TEST | Code looks correct; cert-class playtest scenario hasn't run yet. |
| FAIL_P0 | Known gap that will block submission. |
| FAIL_P1 | Code is there but rough edges remain. |
| NOT_APPLICABLE | Game doesn't use this feature (e.g., no trophies because mechanics don't suit them). |

---

## Sony PS5 (TRC) — high-failure-rate categories

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

---

## Microsoft Xbox (TCR / XR) — high-failure-rate categories

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

---

## Nintendo Switch (lotcheck) — high-failure-rate categories

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

---

## Apple App Store (iOS) — high-failure-rate categories

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

---

## Combined action list

Written after all per-platform reports.

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
    Xbox:   READY | NEEDS_WORK | BLOCKED — <one-line reason>
    Switch: READY | NEEDS_WORK | BLOCKED — <one-line reason>
    iOS:    READY | NEEDS_WORK | BLOCKED — <one-line reason>
```
