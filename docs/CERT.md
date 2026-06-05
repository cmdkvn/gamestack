# Platform certification reference

Cert is a one-shot submission test. You upload a build, the platform's QA queue picks it up, runs their checklist, and either passes you or sends back a list of failures. A rejection is not a code review — it's a week, sometimes two, depending on the queue. The next slot is whenever the queue says so, not whenever you're ready.

The actual checklists — Sony's TRC, Microsoft's TCR/XR, Nintendo's lotcheck — live behind NDA on the developer portals. They change between submissions. They are more detailed than anything published, and you should treat them as the source of truth in the days before you hit submit. **gamestack does not replace them and does not pretend to.** What gamestack does is catch the ~80% of cert rejections that fall into well-known public-knowledge categories — sleep/resume, controller disconnect, save corruption, accessibility gates, localization clipping — before the build goes anywhere near the queue.

That coverage splits across three layers. The interactive skill [`/cert-readiness`](../skills/cert-readiness/SKILL.md) walks the platforms with you when you're a month out from cert and want a senior-engineer pass. The CLI [`gamestack-cert-checklist`](../bin/impl/cert-checklist/README.md) runs the same lens in CI so you get a regression signal on every push. The power tool [`/cert-freeze`](../skills/cert-freeze/SKILL.md) locks the build / cert paths so a typo in a script touched at the wrong moment doesn't reset the queue. None of the three reads the NDA checklist. You do, on the portal, in the week before submit.

Every finding lands in one of six verdicts:

- **`PASS`** — code is present and a cert-class playtest run in the last 30 days confirms.
- **`PASS_CODE_ONLY`** — code is present but no recent live test. Honest, not reassuring.
- **`NEEDS_LIVE_TEST`** — the category can only be verdict'd live (memory soak, region pricing, age rating consistency).
- **`FAIL_P0`** — submission blocker. Fix before upload.
- **`FAIL_P1`** — strongly recommended. Won't auto-reject every time but the queue will pick it up.
- **`NOT_APPLICABLE`** — the game doesn't use the feature (no HDR, no trophies, etc.).

The rest of this doc walks each platform's category list, explains the two cert-class playtest scenarios, draws the skill / CLI / NDA boundary clearly, and ends with a recommended cert flow you can lift from.

## The three platforms at a glance

| | PS5 (TRC) | Xbox (TCR / XR) | Switch (lotcheck) |
|---|---|---|---|
| Cert authority | Sony PartnerNet | Microsoft Partner Center | Nintendo Developer Portal |
| Typical indie lead time | 2–3 weeks | 2–3 weeks | 4–6 weeks |
| Hardest single category | DualSense use beyond default rumble | Quick Resume (a save-system gate in disguise) | Sleep / resume (suspend during every state) |
| Strictest a11y gate | Moderate | **Strictest of the three** — match ID@Xbox | Moderate |
| Most-failed item | Trophy completeness + sleep/resume | Quick Resume + accessibility | Sleep / resume (single most-failed item in lotcheck) |

These are tendencies, not promises. Queues vary, reviewers vary, and a single P0 failure in any category bounces you regardless of how clean the rest is.

## PS5 TRC

The Sony TRC tests eight categories worth pre-flighting before submit. The full list on PartnerNet is larger; these are the public-knowledge ones that account for the bulk of indie rejections.

**Memory management.** No leaks during long sessions, no OOM on the platform-set memory cap. This one is always `NEEDS_LIVE_TEST` regardless of how clean the code reads — static analysis cannot prove a 4-hour soak. Plan for a soak run on the dev kit in the week before submit. If you have an asset-heavy game, run [`/perf-benchmark`](../skills/perf-benchmark/SKILL.md) first so peak memory has a baseline.

**PSN integration.** Sign-in, sign-out, Friends, Messages from in-game. Cert checks that mid-session sign-out doesn't lose state and that offline launch falls back cleanly. The CLI looks for `PsnSignIn`, `Sce*UserService`, and similar markers in the scripts. If the game uses PSN at all, expect `FAIL_P1` if no offline fallback exists.

**Trophy implementation.** Full trophy set including a platinum if the game's structure permits one. Skipping platinum lowers PSN weighting and disappoints completionists, and Sony's reviewers will flag the omission. Unlocks must persist offline and sync online when the platform reconnects. The skill makes the platinum judgment from your design doc; the CLI just notes the cert expectation.

**DualSense usage.** Meaningful haptics + adaptive triggers. Default rumble on hit is not enough — cert tests for differentiated trigger resistance per action and varied haptic envelopes. This category catches more indie devs by surprise than any other PS5 item. The CLI searches for `DualSense`, `AdaptiveTrigger`, `SetTriggerEffect` patterns; the skill reads the design doc to judge whether the use is meaningful or perfunctory.

**Sleep / resume.** Game survives suspend during every state: gameplay, menus, cutscenes, every loading screen, save point. This is where `OnApplicationPause`, `Application.focusChanged`, and platform-equivalent hooks earn their place. The cert-class scenario [`04-cert-controller-disconnect.json`](../skills/playtest/scenarios/04-cert-controller-disconnect.json) and the save-fuzz scenario [`05-cert-save-fuzz.json`](../skills/playtest/scenarios/05-cert-save-fuzz.json) together exercise this category.

**Controller disconnect.** Game pauses (or handles gracefully) immediately on disconnect; reconnect resumes cleanly without losing state. The PS5 cert reviewer pulls the controller mid-gameplay; if the game crashes, the submission ends there. The cert-class scenario [`04-cert-controller-disconnect.json`](../skills/playtest/scenarios/04-cert-controller-disconnect.json) drives this via the engine SDK.

**Save data integrity.** Atomic writes survive power loss; no corruption under contention. The Iron Rule is temp-file write, fsync, atomic rename. Anything else is a save corruption waiting for the reviewer to find. The CLI matches on `File.Replace`, `.tmp`, `AtomicWrite` patterns. The cert-class save-fuzz scenario [`05-cert-save-fuzz.json`](../skills/playtest/scenarios/05-cert-save-fuzz.json) snapshots → injects inputs → restores → asserts state matches across three cycles.

**Cross-region pricing.** All listed regions have prices and ratings set. This is a PartnerNet configuration item, not a code one. The CLI flags it as `NEEDS_LIVE_TEST` because no amount of static analysis catches a missing price tier. Verify in PartnerNet, region by region, in the week before submit.

## Xbox TCR / XR

The Xbox TCR (and its XR companion for newer requirements) tests eight categories that overlap with PS5 in shape but diverge in two important places: Quick Resume is unique to Xbox, and the accessibility gate is the strictest of the three platforms.

**Achievement implementation.** Full set; unlocks fire correctly; persist offline; sync online when the device reconnects. The category overlaps PS5 trophies in intent but with no platinum-equivalent expectation. The CLI matches on `Achievement`, `XboxLive`, `XblAchievement` patterns.

**Profile switching.** Mid-session profile switch handled without crash or save corruption. Xbox families share consoles; the reviewer will switch profiles in the middle of your tutorial to see what happens. Save state must be associated with the active profile, not the device. The CLI matches on `onSignInChanged`, `XUserChanged`, `ProfileSwitch`.

**Quick Resume.** The Xbox-unique gate. Quick Resume restores arbitrary game state without an explicit save — the system snapshots the entire process and resumes it later, possibly days later, possibly after another game has been suspended in between. The game has to come back to life as if nothing happened. **Quick Resume failures are almost always save-system bugs in disguise.** If your save-fuzz scenario passes, Quick Resume usually does. The CLI shares the atomic-save patterns with PS5 save integrity, plus `QuickResume`, `OnSuspending`, `OnResuming`. The default verdict is `FAIL_P0` if nothing is found — there is no shipping on Xbox without Quick Resume support.

**Cloud saves.** Round-trip via Connected Storage; conflict resolution implemented (two devices, both played offline, both want to upload). If the conflict resolver always picks "most recent timestamp" without telling the player, that's a `FAIL_P1`. The CLI matches on `ConnectedStorage`, `CloudSave`, `XblCloud`.

**Accessibility — strictest of the three.** Subtitles default ON, remappable controls, visual representation of audio cues, no color-only information conveyance. ID@Xbox publishes a recommended list; match it. The default verdict for this category is `FAIL_P0`. Run [`/a11y-audit`](../skills/a11y-audit/SKILL.md) before approaching Xbox cert — the top-4 (remapping, text scale ≥1.5×, colorblind presets, subtitles + captions with speaker labels) all need to ship. The CLI matches on subtitle + remapping patterns; the skill produces both a developer TODO and a public-facing report.

**Microsoft Game Bar / Capture.** Game allows recording where required; no rejection of the capture overlay. If the game disables system overlays for "performance reasons" without making it a setting, the reviewer will flag it. Mostly a `NEEDS_LIVE_TEST` category — the live test is "press the Game Bar button during gameplay and confirm it works."

**HDR / Auto HDR.** If HDR is enabled, no visual artifacts; falls back cleanly on non-HDR displays. If HDR is off, the category is `NOT_APPLICABLE`. The CLI flips it to `NOT_APPLICABLE` by default and only runs the checks if HDR markers are found.

**Sign-in / sign-out.** Handled mid-session without losing state. Closely related to profile switching but distinct: this is about the platform sign-in flow, not the active-profile flow. Mid-session sign-out should pause the game or surface a polite "please sign in to continue" rather than crashing.

## Switch lotcheck

Nintendo's lotcheck is the most disciplined of the three indie cert paths. The queue is longer, the rejection bar is precise, and the platform's constraints (4 GB handheld memory, multi-mode controllers, suspend-during-anything) make the category list distinct. Eight public-knowledge categories drive most rejections.

**Controller modes.** Handheld, tabletop (split Joy-Con), Pro Controller — all work; right glyphs shown for each mode. The reviewer will dock the console mid-tutorial, undock it during a boss, split the Joy-Con on a menu screen. The CLI matches on `JoyCon`, `HandheldMode`, `ProController`, `npad`, `SplitMode`. Glyph swapping (showing the right button prompt for the active controller) is part of the category, not separate from it.

**Sleep / resume — lotcheck's most-failed item.** The reviewer hits the home button during every game state: gameplay, every cutscene, every loading screen, every menu, mid-save. The game has to come back from suspend regardless of when it went. This is the most-failed item in lotcheck across all indie submissions. The CLI shares sleep/resume patterns with PS5; the cert-class playtest scenarios cover the exercise. **If you only run one cert-class scenario on Switch, run [`05-cert-save-fuzz.json`](../skills/playtest/scenarios/05-cert-save-fuzz.json) — suspend-during-save is the most common failure path.**

**Parental controls.** Game respects platform-set parental limits (rating gates, web access restrictions, communication restrictions). The CLI matches on `ParentalControl`, `nn::oe::Restrict`. If the game has any online or communication feature, this category gates submission.

**Suspend during write.** Save mid-write survives suspend without corruption. Distinct from general sleep/resume because the failure mode is specific: the save file is in an inconsistent state when the OS snapshots the process. Atomic writes (temp-file + rename) are non-negotiable here. Default verdict is `FAIL_P0` if no atomic-write patterns are found.

**Memory ceiling.** Fits in the 4 GB handheld budget with OS reservation (effective ceiling closer to 3.2 GB for the game). Always `NEEDS_LIVE_TEST` — static analysis cannot prove a peak memory number. Pair with [`/asset-audit`](../skills/asset-audit/SKILL.md) for texture/audio/mesh budget violations and [`/perf-benchmark`](../skills/perf-benchmark/SKILL.md) for peak measurements on the dev kit.

**Boot time.** Under platform threshold (typically < 30 s cold start). The reviewer cold-boots the cartridge or download and times it with a stopwatch. If the splash + first menu takes 40 s, the submission gets bounced. Always `NEEDS_LIVE_TEST`.

**Localization.** All shown strings localized for every shipped language; no clipping at long-language widths. German overflows menu buttons, Japanese needs different fonts, Russian needs Cyrillic. The CLI checks for `Assets/Locale`, `Assets/i18n`, `locale`, `i18n`, `Localization` markers. The live test is dropdown each language in turn and walk the UI. The interactive skill flags clipping when it finds it; the CLI flags missing localization at all.

**Age rating consistency.** Same rating shown in eShop listing, in-game splash, parental control panel. Three places, one number. The cert reviewer cross-checks. Always `NEEDS_LIVE_TEST` because the verification is across surfaces the CLI can't see.

## The cert-class playtest scenarios

Two scenarios in [`skills/playtest/scenarios/`](../skills/playtest/scenarios/) elevate cert categories from `NEEDS_LIVE_TEST` to `PASS`. They run via the gamestack engine SDK at `localhost:7331` against a running build — Unity, Godot, or equivalent. They snapshot state, inject inputs, restore, and assert. They are the only thing that flips a `PASS_CODE_ONLY` verdict to a real `PASS`.

**[`04-cert-controller-disconnect.json`](../skills/playtest/scenarios/04-cert-controller-disconnect.json)** simulates controller disconnect mid-gameplay and asserts the game pauses gracefully, the saved state is intact during the disconnected window, and reconnect resumes cleanly without crash or progress loss. It requires the build to expose a `simulate-controller-disconnect` custom input (typically a tagged-key-driven hook in the input controller). The scenario takes a snapshot before disconnect, drives a horizontal-input action, fires the disconnect, asserts `default.paused == true` and `default.playerControllerConnected == false`, fires the reconnect, asserts the controller is back, then asserts `default.gameCrashed == false` at the end. A clean run flips the **Controller disconnect** category to `PASS` on PS5 and contributes to the Switch sleep/resume + controller-mode categories. It runs in about 2 minutes.

**[`05-cert-save-fuzz.json`](../skills/playtest/scenarios/05-cert-save-fuzz.json)** is the broader scenario and the one to prioritize if you only run one. It snapshots player state, takes random inputs (primary action, secondary action, directional moves), restores the snapshot, and asserts that `player.hp`, `player.score`, and tagged inventory state match exactly. It repeats across three cycles to catch drift that single-shot tests miss. The scenario is configured `continue_on_failure: false` — a save corruption is a P0 by definition and there's no point continuing. A clean run elevates **Save data integrity** to `PASS` on PS5, **Quick Resume** + **Cloud saves** to `PASS` on Xbox, and **Sleep / resume** + **Suspend during write** to `PASS` on Switch. One scenario, six cert categories across three platforms.

Run both on the actual platform build, not the editor build. The editor build's save path is different from the platform build's save path on every console, and that's exactly where the bug hides.

## The skill / CLI / NDA-checklist split

Three layers, each with its own job. The boundaries matter — confusing them is how submissions go out without the actual checklist having been read.

| Layer | What it covers | What it does NOT do |
|---|---|---|
| [`/cert-readiness`](../skills/cert-readiness/SKILL.md) skill (interactive) | Walks each platform's high-failure categories with you. Reads design docs to make judgments (platinum-worthy structure, meaningful DualSense use). Cross-references playtest history. Produces per-platform reports + a combined action list. Reminds you which TRC/TCR/lotcheck version is on file. | Doesn't read the NDA checklist itself. Doesn't auto-apply fixes to cert-affecting code. Doesn't upload anything. |
| [`gamestack-cert-checklist`](../bin/impl/cert-checklist/README.md) CLI (CI) | Same lens, runs on every push. Detects engine, matches code patterns, checks for recent playtest runs, assigns verdicts. Emits Markdown to stdout or JSON to file. Exits non-zero on `FAIL_P0` (or `FAIL_P1` with `--strict`). | Doesn't make design-doc-aware judgments (no platinum-implies-100% check). Doesn't execute playtest scenarios — it checks for past runs. |
| NDA-protected checklist (developer portal) | The actual cert criteria you are graded against. Always more detailed. Changes between submissions. Region-specific in places. | Lives on the platform portal, not in your repo. |

Both gamestack layers emit the same reminder at the top of every report: **download the current TRC / TCR / lotcheck from the developer portal before submission.** If the version on file is older than 90 days, that's a `FAIL_P0` on its own — the checklist has probably moved.

## Recommended cert flow

The discipline below assumes you're a month from cert and the game is otherwise content-complete. Adjust the timeline if you're further out, but don't compress it — each step exists because skipping it has historically meant a resubmission.

1. **30 days out — set production phase to Cert.** Edit the game's `CLAUDE.md` to declare the Cert phase. This calibrates every skill in the catalog: [`/code-review-gamestack`](../skills/code-review-gamestack/SKILL.md) gets stricter, [`/playtest`](../skills/playtest/SKILL.md) picks cert-class scenarios, [`/perf-benchmark`](../skills/perf-benchmark/SKILL.md) gates regressions tighter.

2. **30 days out — download the current NDA checklist.** From PartnerNet / Partner Center / Developer Portal. Save it to `docs/cert/<platform>-<version>.pdf`. The gamestack layers reference its presence; without it the audit verdict is `FAIL_P0` on the "checklist version on file" line.

3. **28 days out — first interactive audit.** Run [`/cert-readiness all`](../skills/cert-readiness/SKILL.md). Expect a long action list. Don't panic at the count — most of it will be `PASS_CODE_ONLY` waiting for live tests. The P0 and P1 items are the work to do.

4. **21 days out — fix P0 then P1.** Use [`/code-review-gamestack`](../skills/code-review-gamestack/SKILL.md) for the affected code paths, [`/bug-hunt`](../skills/bug-hunt/SKILL.md) when the cause isn't obvious, [`/a11y-audit`](../skills/a11y-audit/SKILL.md) for the Xbox accessibility gate. Resist the urge to refactor — cert phase is for cert-affecting fixes, not improvements.

5. **14 days out — run cert-class scenarios on the platform build.** [`/playtest 04-cert-controller-disconnect`](../skills/playtest/scenarios/04-cert-controller-disconnect.json) and [`/playtest 05-cert-save-fuzz`](../skills/playtest/scenarios/05-cert-save-fuzz.json) on the actual dev kit / target hardware. Convert `PASS_CODE_ONLY` to `PASS`. Run on every platform you're submitting to.

6. **10 days out — soak test + asset audit.** Long-session memory soak (4+ hours) on PS5 and Switch dev kits to feed the `NEEDS_LIVE_TEST` memory categories. [`/asset-audit`](../skills/asset-audit/SKILL.md) against the Switch 4 GB budget if Switch is in scope. [`/perf-benchmark`](../skills/perf-benchmark/SKILL.md) for boot time on Switch.

7. **7 days out — second interactive audit.** Run [`/cert-readiness all`](../skills/cert-readiness/SKILL.md) again. The action list should be short. If it isn't, the timeline slipped — push submission rather than ship with `FAIL_P1` items.

8. **5 days out — enter [`/cert-freeze`](../skills/cert-freeze/SKILL.md).** This locks the build / cert paths. From here, no edits land outside `build/`, `docs/cert/`, `playtest/cert-readiness/`. A typo in a gameplay script at this point resets the queue.

9. **3 days out — CI green.** [`gamestack-cert-checklist`](../bin/impl/cert-checklist/README.md) exits 0 with `--strict`. [`gamestack-playtest-daemon`](../bin/impl/playtest-daemon/README.md) reports clean on the cert-class scenarios. The build is reproducible from a tagged commit.

10. **Day of submission — verify against the NDA checklist line by line.** This is the step gamestack does not replace. Open the PDF you downloaded 30 days ago (or a fresher copy if the portal has updated it), check each line against your build, sign off.

11. **Submit via [`/publish`](../skills/publish/SKILL.md) once cert passes.** Not before. `/publish` has its own pre-publish gates and will refuse to upload an uncert'd console build.

12. **After cert returns — invoke `/cert-pass` or accept rejection.** On pass: `/cert-pass` drops the freeze and routes to publish. On rejection: read the failure list, fix the items, increment the checklist version on file if a new one shipped, restart at step 4.

## Pre-submission checklist

- [ ] Production phase set to Cert in the game's `CLAUDE.md`.
- [ ] Current NDA-protected TRC / TCR / lotcheck downloaded to `docs/cert/`.
- [ ] [`/cert-readiness`](../skills/cert-readiness/SKILL.md) shows zero `FAIL_P0` and zero `FAIL_P1` for the target platforms.
- [ ] [`/playtest 04-cert-controller-disconnect`](../skills/playtest/scenarios/04-cert-controller-disconnect.json) passed on every target platform within the last 30 days.
- [ ] [`/playtest 05-cert-save-fuzz`](../skills/playtest/scenarios/05-cert-save-fuzz.json) passed on every target platform within the last 30 days.
- [ ] Memory soak (4+ hours) clean on PS5 and Switch dev kits.
- [ ] [`/a11y-audit`](../skills/a11y-audit/SKILL.md) top-4 (remapping, text scale, colorblind, subtitles) all PASS — especially for Xbox.
- [ ] [`gamestack-cert-checklist --strict`](../bin/impl/cert-checklist/README.md) exits 0 in CI.
- [ ] [`/cert-freeze`](../skills/cert-freeze/SKILL.md) active; no non-cert edits in the last 5 days.
- [ ] Build reproducible from a tagged commit.
- [ ] NDA checklist verified line-by-line against the build.
- [ ] [`/publish`](../skills/publish/SKILL.md) gates all green.

The list catches most of what gets indie devs bounced. The NDA-protected checklist on the developer portal catches the rest. Read both. Cert is a one-shot test, and a week is a lot.
