---
name: publish
description: Release Engineer skill — verifies pre-publish gates, bumps version (semver), builds per target (Unity / Godot), runs the last-mile cert checklist, uploads to the target distribution platform (Steam / itch / console partner portal), opens a patch-notes PR, and updates ROADMAP.md with the launch entry. Use when the game has passed cert (if applicable) and is ready to ship.
---

# publish

This skill enforces the pre-publish gates, drives the deterministic parts of release, and surfaces the human-judgment items that nobody else thought to check. The contrast it operates from: launches go smoothly when the publish process is rehearsed, and badly when somebody pushes at 5pm on a Friday.

## When to fire

Use when the developer says they're ready to ship a release. Trigger phrases:
- "Publish"
- "Ship the build"
- "Release v1.0.0"
- "Push to Steam"
- "Submit to TestFlight"
- "Push to App Store"
- `/publish [target=steam|itch|app-store|testflight|console] [version]`

Don't fire on uncert'd console builds, on builds with known P0 bugs, or on Friday afternoons (the skill should warn).

## Pre-publish gates (all must pass)

| Gate | Check |
|---|---|
| **Cert (if applicable)** | `/cert-readiness` last run is GREEN for the target platform |
| **No P0 bugs** | `playtest/regression/` has no failing scenarios |
| **Tests pass** | Engine play-mode tests + CI |
| **Version not already shipped** | Tag does not already exist in `git tag` |
| **Branch is clean** | Working tree has no uncommitted changes |
| **Build matches commit** | Build was made from a tagged commit, not local edits |
| **No "Friday afternoon" smell** | If the day is Friday after 14:00 local time, the skill warns and requires `--confirm-friday` |
| **Documents current** | README, accessibility report, patch notes are not stale |

Any gate failure halts the publish. Report what failed and exit.

## Process

### Step 1 — confirm target + version

Ask the developer (or extract from arguments):
- **Target**: `steam`, `itch`, `ps5`, `xbox`, `switch`, `app-store`, `play-store`. Multi-target releases publish to each sequentially.
- **Version**: semver. Default proposal is bump-patch from the latest git tag. Confirm:
  - `MAJOR` for breaking changes / new major content.
  - `MINOR` for new features, no breakage.
  - `PATCH` for bug fixes.

### Step 2 — run pre-publish gates

Walk each gate. For each:
- **PASS** — proceed.
- **WARN** — surface; require developer confirmation.
- **FAIL** — halt the publish.

State the gates explicitly. Don't bury them.

### Step 3 — bump version

Update version across:
- Engine project (Unity `ProjectSettings.asset` `bundleVersion`, Godot `project.godot` `config/version`).
- `package.json` (if web) or platform-specific manifest.
- `CHANGELOG.md` — propose entry with the next semver and date.
- Game's `CLAUDE.md` if it references a version.

Commit the version bump on its own atomic commit: `chore(<slug>): bump to vX.Y.Z`.

### Step 4 — last-mile cert checklist (re-run condensed)

Even if `/cert-readiness` passed yesterday, re-run the highest-failure-rate items now:

- Sleep / resume on the build going out (PS5, Switch).
- Quick Resume cold-start test (Xbox).
- `playtest/regression/` smoke pass.
- Accessibility settings verified ON.
- Build size under platform cap.
- Localization strings not truncated (visual spot check at long-language widths).

If any fail, halt and report.

### Step 5 — build per target

Build commands are project-specific. Use what the developer has set up:

- **Unity:** typically `unity -batchmode -quit -projectPath . -buildTarget <Target> -executeMethod BuildScript.Build` or whatever wrapper the project provides.
- **Godot:** `godot --headless --export-release "<preset name>" <output path>`.
- **Web:** `npm run build` or `pnpm build`.
- **iOS native:** `xcodebuild -scheme <Scheme> -configuration Release -archivePath build/<Game>.xcarchive archive`, then `xcodebuild -exportArchive -archivePath build/<Game>.xcarchive -exportPath build/ipa -exportOptionsPlist <path>/ExportOptions.plist`. The result is an `.ipa` ready to upload via Transporter / `altool` / `xcrun notarytool` (for mac apps; iOS uses `altool` or Xcode's Organizer).

Verify the build is on disk and within size budget. Surface its path.

### Step 6 — upload to the target

| Target | Tool / path |
|---|---|
| **Steam** | `steamcmd +login <user> +run_app_build <path-to-vdf> +quit` |
| **itch.io** | `butler push <build-path> <user>/<game>:<channel>` |
| **PS5 / Xbox / Switch** | Platform-specific partner portal (manual upload OR platform CLI if the developer has one set up) |
| **App Store / TestFlight** | `xcrun altool --upload-app --type ios --file <path-to-ipa> --apiKey <key> --apiIssuer <issuer>` (or Transporter.app GUI for first release). **gamestack does NOT auto-upload** — surface the command and the manual checklist. |
| **Play Store** | `gcloud beta builds submit` or the Play Console |
| **Custom** | Use whatever upload script the developer has documented |

For console / mobile partner portals (including App Store / Play Store), the skill **does not auto-upload** — surface the build path and the manual upload checklist. Some platforms require human-eyes review of binary metadata; never bypass that.

#### iOS / App Store / TestFlight publication path

When `target=app-store` or `target=testflight`, run this manual-upload checklist instead of attempting an upload:

```
APP STORE / TESTFLIGHT MANUAL UPLOAD CHECKLIST
  1. Confirm App Store Connect record exists for the bundle ID:
     <com.example.game>. If missing: create at https://appstoreconnect.apple.com.
  2. Confirm Distribution signing certificate + provisioning profile are valid.
     Check via Xcode → Settings → Accounts → Manage Certificates.
  3. Confirm `Info.plist` has all required usage descriptions for the runtime
     permission set:
       - NSUserTrackingUsageDescription (if ATT used)
       - NSCameraUsageDescription / NSPhotoLibraryUsageDescription / NSMicrophoneUsageDescription
       - NSLocationWhenInUseUsageDescription (if used)
  4. Confirm PrivacyInfo.xcprivacy is present in the binary AND in every
     third-party SDK shipped.
  5. Confirm App Store Connect "App Privacy" nutrition label questionnaire
     is current.
  6. Build the archive:
     xcodebuild -scheme <Scheme> -configuration Release \
       -archivePath build/<Game>.xcarchive archive
  7. Export the .ipa:
     xcodebuild -exportArchive -archivePath build/<Game>.xcarchive \
       -exportPath build/ipa -exportOptionsPlist ExportOptions.plist
  8. Upload via altool (CI-friendly):
     xcrun altool --upload-app --type ios \
       --file build/ipa/<Game>.ipa \
       --apiKey <key> --apiIssuer <issuer>
     Or open Transporter.app and drag the .ipa in (first-release path).
  9. Wait for processing in App Store Connect (10-60 min typically).
 10. For TestFlight: enable external testing group, attach the build,
     submit for Beta App Review (24-48 h turnaround).
 11. For App Store: from App Store Connect, attach the build to the planned
     release, fill the "What's New" notes, submit for App Review (24-72 h).

gamestack does NOT push to App Store Connect. This is by design — the
metadata, screenshots, and review-info pages require human eyes.
```

### Step 7 — tag, branch, and open the patch-notes PR

- `git tag -a vX.Y.Z -m "release vX.Y.Z"`
- `git push origin vX.Y.Z`
- Open the patch-notes PR via the studio's repo (`gh pr create` if the developer has GitHub CLI configured).

The patch-notes PR body proposal:
- Player-facing changelog (from `CHANGELOG.md`'s next entry).
- Dev-facing changelog (commits since last release).
- Link to the build artifact.
- Cert / submission status.

### Step 8 — update ROADMAP.md

Add an entry to the studio's `ROADMAP.md` under **Shipped**:

```
| <Game Name> | <Platforms> | <YYYY-MM-DD> | <Store link> |
```

Move the game from "In production" to "Shipped" if it was a first launch.

### Step 9 — update game-level CLAUDE.md

In `games/<slug>/CLAUDE.md`:
- Bump production phase to `Launched` (or `Live-Ops` if post-launch content is planned).
- Note the version shipped + date.

Commit: `chore(<slug>): release vX.Y.Z`.

### Step 10 — schedule the post-launch monitor

Surface the recommendation to enable `/post-launch-monitor` daily for the first 30 days.

## Output format

```
PUBLISH RUN — <game> vX.Y.Z to <target>

PRE-PUBLISH GATES
  ✓ Cert (PS5/Xbox/Switch as applicable)
  ✓ No P0 bugs
  ✓ Tests passed
  ✓ Version unique
  ✓ Branch clean
  ✓ Build = commit
  ✓ Not Friday-after-2 (or --confirm-friday)
  ✓ Documents current

VERSION BUMP
  vX.Y.(Z-1) → vX.Y.Z
  Files updated: <list>
  Commit: <hash>

LAST-MILE CERT CHECK
  ✓ Sleep/resume (Switch)
  ✓ Quick Resume (Xbox)
  ✓ playtest/regression smoke pass
  ✓ Accessibility verified
  ✓ Build size under cap
  ✓ Localization spot check

BUILD
  Target: <…>
  Output: <path>
  Size:   <MB>

UPLOAD
  <auto-uploaded to ... | MANUAL: upload <build-path> via <portal>>

TAG & PR
  Tag: vX.Y.Z (pushed)
  PR:  <url or status>

ROADMAP
  Updated — moved to Shipped: <YYYY-MM-DD>

GAME CLAUDE.md
  Phase: <Launched | Live-Ops>

NEXT
  - Enable /post-launch-monitor daily for the first 30 days.
  - Plan first patch window (usually T+7 unless P0 surfaces).
```

## What NOT to do

- **Don't auto-upload to console partner portals.** Those uploads require human eyes on metadata. Surface the build path; the developer uploads.
- **Don't publish on Friday afternoons** without an explicit `--confirm-friday`. The cost of a launch-weekend rollback is real.
- **Don't skip the version bump commit.** A release that doesn't have its own atomic version-bump commit is harder to revert.
- **Don't mass-update CHANGELOG retroactively.** Each release writes its own entry; previous entries are immutable history.
- **Don't push without a tag.** Untagged releases can't be reproduced from git.
- **Don't bypass cert-readiness.** Even a "tiny patch" can break cert if it touches save data or memory.

## Friday rule

If the local time is Friday after 14:00:
- The skill surfaces a warning.
- Requires the developer to pass `--confirm-friday`.
- Reminds: "Players are most likely to find bugs over the weekend, when nobody is at the studio. Are you sure you want to ship now?"

Override is fine — but it has to be explicit.

## Handoff

After publish:
- `/post-launch-monitor` runs daily for the first 30 days.
- `/patch-notes` (M4) — generate the player-facing changelog from the PR body.
- `/cert-readiness` resets for the next release cycle.
- `/playtest` regressions remain the smoke pass for future patches.
